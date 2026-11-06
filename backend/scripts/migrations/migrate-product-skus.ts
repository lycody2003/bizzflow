import mongoose from "mongoose";
import database from "../../src/configs/database";

interface ProductRecord {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  sku: string;
}

interface RegistryRecord {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  sku: string;
  referenceType: string;
  referenceId: mongoose.Types.ObjectId;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const execute = args.includes("--execute");
const testDatabase = args.includes("--test");

const validArgs = new Set(["--dry-run", "--execute", "--test"]);
const hasInvalidArgs = args.some((arg) => !validArgs.has(arg));

if (dryRun === execute || hasInvalidArgs || args.length !== new Set(args).size) {
  console.error(
    "Usage: npm run migrate:product-skus -- [--test] --dry-run | --execute",
  );
  process.exit(1);
}

const normalizeSku = (sku: string) => sku.trim().toUpperCase();

async function ensureRegistryCollection(
  db: mongoose.mongo.Db,
): Promise<void> {
  const collectionExists = await db
    .listCollections(
      { name: "skuregistries" },
      { nameOnly: true },
    )
    .hasNext();

  if (!collectionExists) {
    try {
      await db.createCollection("skuregistries");
      console.log("Created skuregistries collection.");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code !== 48
      ) {
        throw error;
      }
    }
  }

  const collection = db.collection("skuregistries");

  await collection.createIndex(
    { businessId: 1, sku: 1 },
    { unique: true },
  );

  await collection.createIndex(
    { businessId: 1, referenceType: 1, referenceId: 1 },
    { unique: true },
  );

  console.log("SKU Registry indexes are ready.");
}


async function main() {
  await database.connect({ test: testDatabase });

  const db = database.getDatabase().db;

  if (!db) {
    throw new Error("MongoDB database is unavailable.");
  }

  const productsCollection = db.collection<ProductRecord>("products");
  const registryCollection = db.collection<RegistryRecord>("skuregistries");

  const products = await productsCollection
    .find(
      { type: { $ne: "variant" } },
      {
        projection: {
          _id: 1,
          businessId: 1,
          sku: 1,
        },
      },
    )
    .toArray();

  const registryRecords = await registryCollection
    .find({})
    .toArray();

  const problems: string[] = [];
  const seen = new Map<string, ProductRecord>();
  const missing: Array<{
    businessId: mongoose.Types.ObjectId;
    sku: string;
    referenceType: "product";
    referenceId: mongoose.Types.ObjectId;
  }> = [];

  for (const product of products) {
    if (
      typeof product.sku !== "string" ||
      !product.sku.trim() ||
      !product.businessId
    ) {
      problems.push(
        `Product ${product._id.toString()} has an invalid SKU or businessId.`,
      );
      continue;
    }

    const sku = normalizeSku(product.sku);
    const key = `${product.businessId.toString()}:${sku}`;

    const previous = seen.get(key);

    if (previous) {
      problems.push(
        `Duplicate SKU "${sku}" in business ${product.businessId.toString()}: ` +
        `${previous._id.toString()} and ${product._id.toString()}`,
      );
      continue;
    }

    seen.set(key, product);

    const existing = registryRecords.find(
      (record) =>
        record.businessId.toString() === product.businessId.toString() &&
        record.sku === sku,
    );

    if (existing) {
      const matches =
        existing.referenceType === "product" &&
        existing.referenceId.toString() === product._id.toString();

      if (!matches) {
        problems.push(
          `SKU "${sku}" is already registered to another reference.`,
        );
      }

      continue;
    }

    missing.push({
      businessId: product.businessId,
      sku,
      referenceType: "product",
      referenceId: product._id,
    });
  }

  console.log("\n=== Product SKU Migration Report ===");
  console.log(`Products inspected: ${products.length}`);
  console.log(`Existing registry records: ${registryRecords.length}`);
  console.log(`Missing registry records: ${missing.length}`);
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

  await ensureRegistryCollection(db);

  await db.collection("products").createIndex(
    { businessId: 1, sku: 1 },
    {
      unique: true,
      partialFilterExpression: {
        sku: { $type: "string" },
      },
    },
  );

  console.log("Product SKU index is ready.");

  if (missing.length === 0) {
    console.log("\nAll Product SKUs are already registered.");
    return;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await registryCollection.insertMany(
        missing.map((record) => ({
          ...record,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        {
          session,
          ordered: true,
        },
      );
    });
  } finally {
    await session.endSession();
  }

  console.log(`\nSuccessfully registered ${missing.length} Product SKUs.`);
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
