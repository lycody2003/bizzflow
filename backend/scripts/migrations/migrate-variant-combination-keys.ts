import mongoose from "mongoose";
import database from "../../src/configs/database";

interface VariantRecord {
  _id: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  sku?: string;
  barcode?: string | null;
  attributes?: Array<{
    name?: string;
    value?: string;
  }>;
  combinationKey?: string;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const execute = args.includes("--execute");
const testDatabase = args.includes("--test");

const validArgs = new Set(["--dry-run", "--execute", "--test"]);
const hasInvalidArgs = args.some((arg) => !validArgs.has(arg));

if (dryRun === execute || hasInvalidArgs || args.length !== new Set(args).size) {
  console.error(
    "Usage: npm run migrate:variant-combination-keys -- [--test] --dry-run | --execute",
  );
  process.exit(1);
}

function generateCombinationKey(
  attributes: NonNullable<VariantRecord["attributes"]>,
): string {
  return attributes
    .map((attribute) => ({
      name: attribute.name!.trim().toLowerCase(),
      value: attribute.value!.trim().toLowerCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (attribute) =>
        `${encodeURIComponent(attribute.name)}:${encodeURIComponent(attribute.value)}`,
    )
    .join("|");
}

async function ensureCollection(
  db: mongoose.mongo.Db,
): Promise<void> {
  const exists = await db
    .listCollections(
      { name: "productvariants" },
      { nameOnly: true },
    )
    .hasNext();

  if (exists) return;

  try {
    await db.createCollection("productvariants");
    console.log("Created productvariants collection.");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 48
    ) {
      return;
    }

    throw error;
  }
}

async function ensureIndexes(
  collection: mongoose.mongo.Collection<VariantRecord>,
): Promise<void> {
  await collection.createIndex(
    { businessId: 1, productId: 1 },
  );

  await collection.createIndex(
    { businessId: 1, sku: 1 },
    { unique: true },
  );

  await collection.createIndex(
    { businessId: 1, productId: 1, combinationKey: 1 },
    {
      unique: true,
      partialFilterExpression: {
        combinationKey: { $type: "string" },
      },
    },
  );

  await collection.createIndex(
    { businessId: 1, barcode: 1 },
    {
      unique: true,
      partialFilterExpression: {
        barcode: { $type: "string" },
      },
    },
  );

  console.log("All ProductVariant indexes are ready.");
}

async function main() {
  await database.connect({ test: testDatabase });

  const db = database.getDatabase().db;

  if (!db) {
    throw new Error("MongoDB database is unavailable.");
  }

  const collection = db.collection<VariantRecord>("productvariants");

  const variants = await collection.find({}).toArray();

  const problems: string[] = [];

  const seenCombinations = new Map<string, VariantRecord>();
  const seenSkus = new Map<string, VariantRecord>();
  const seenBarcodes = new Map<string, VariantRecord>();

  const updates: Array<{
    id: mongoose.Types.ObjectId;
    combinationKey: string;
  }> = [];

  for (const variant of variants) {
    if (
      !variant.businessId ||
      !variant.productId ||
      typeof variant.sku !== "string" ||
      !variant.sku.trim() ||
      !Array.isArray(variant.attributes) ||
      variant.attributes.length === 0
    ) {
      problems.push(
        `Variant ${variant._id.toString()} has invalid required fields.`,
      );
      continue;
    }

    const sku = variant.sku.trim().toUpperCase();
    const skuKey = `${variant.businessId.toString()}:${sku}`;

    const previousSku = seenSkus.get(skuKey);

    if (previousSku) {
      problems.push(
        `Duplicate SKU "${sku}" in business ${variant.businessId.toString()}: ` +
        `${previousSku._id.toString()} and ${variant._id.toString()}`,
      );
    } else {
      seenSkus.set(skuKey, variant);
    }

    if (typeof variant.barcode === "string") {
      const barcode = variant.barcode.trim();
      const barcodeKey =
        `${variant.businessId.toString()}:${barcode}`;

      const previousBarcode = seenBarcodes.get(barcodeKey);

      if (previousBarcode) {
        problems.push(
          `Duplicate barcode "${barcode}" in business ${variant.businessId.toString()}: ` +
          `${previousBarcode._id.toString()} and ${variant._id.toString()}`,
        );
      } else {
        seenBarcodes.set(barcodeKey, variant);
      }
    }

    const validAttributes = variant.attributes.every(
      (attribute) =>
        typeof attribute.name === "string" &&
        !!attribute.name.trim() &&
        typeof attribute.value === "string" &&
        !!attribute.value.trim(),
    );

    if (!validAttributes) {
      problems.push(
        `Variant ${variant._id.toString()} has invalid attributes.`,
      );
      continue;
    }

    const normalizedNames = variant.attributes.map(
      (attribute) => attribute.name!.trim().toLowerCase(),
    );

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      problems.push(
        `Variant ${variant._id.toString()} has duplicate attribute names.`,
      );
      continue;
    }

    const combinationKey = generateCombinationKey(variant.attributes);

    const duplicateKey =
      `${variant.businessId.toString()}:` +
      `${variant.productId.toString()}:` +
      combinationKey;

    const previousCombination = seenCombinations.get(duplicateKey);

    if (previousCombination) {
      problems.push(
        `Duplicate combination "${combinationKey}" in product ` +
        `${variant.productId.toString()}: ` +
        `${previousCombination._id.toString()} and ${variant._id.toString()}`,
      );
    } else {
      seenCombinations.set(duplicateKey, variant);
    }

    if (variant.combinationKey !== combinationKey) {
      updates.push({
        id: variant._id,
        combinationKey,
      });
    }
  }

  console.log("\n=== ProductVariant Migration Report ===");
  console.log(`Variants inspected: ${variants.length}`);
  console.log(`Combination keys to create/update: ${updates.length}`);
  console.log(`Problems found: ${problems.length}`);

  if (problems.length > 0) {
    console.error("\nMigration blocked:");

    for (const problem of problems) {
      console.error(`- ${problem}`);
    }

    throw new Error("Resolve the reported problems before migration.");
  }

  if (dryRun) {
    console.log("\nDRY RUN completed. No database changes were made.");
    return;
  }

  await ensureCollection(db);

  for (const update of updates) {
    await collection.updateOne(
      { _id: update.id },
      {
        $set: {
          combinationKey: update.combinationKey,
        },
      },
    );
  }

  await ensureIndexes(collection);

  const finalCount = await collection.countDocuments({
    combinationKey: { $type: "string" },
  });

  console.log(`\nUpdated ${updates.length} combination keys.`);
  console.log(`Variants with combination keys: ${finalCount}`);
  console.log("Migration completed.");
}

main()
  .catch((error: unknown) => {
    console.error("\nMigration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.disconnect();
  });
