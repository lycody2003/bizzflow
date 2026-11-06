import mongoose from "mongoose";
import database from "../../src/configs/database";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const execute = args.includes("--execute");
const testDatabase = args.includes("--test");

const validArgs = new Set(["--dry-run", "--execute", "--test"]);

if (
  dryRun === execute ||
  args.some((arg) => !validArgs.has(arg)) ||
  args.length !== new Set(args).size
) {
  console.error(
    "Usage: npx tsx scripts/migrations/migrate-inventory-indexes.ts -- [--test] --dry-run | --execute",
  );
  process.exit(1);
}

interface IndexDefinition {
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
  partialFilterExpression?: Record<string, unknown>;
}

const inventoryIndexes: IndexDefinition[] = [
  {
    name: "business_product_variant_unique",
    key: { businessId: 1, productId: 1, variantId: 1 },
    unique: true,
  },
  {
    name: "business_updatedAt",
    key: { businessId: 1, updatedAt: -1 },
  },
];

const movementIndexes: IndexDefinition[] = [
  {
    name: "business_idempotency_unique",
    key: { businessId: 1, idempotencyKey: 1 },
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" },
    },
  },
  {
    name: "business_createdAt",
    key: { businessId: 1, createdAt: -1 },
  },
  {
    name: "business_product_createdAt",
    key: { businessId: 1, productId: 1, createdAt: -1 },
  },
  {
    name: "business_variant_createdAt",
    key: { businessId: 1, variantId: 1, createdAt: -1 },
  },
];

function sameObject(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function collectionExists(
  db: mongoose.mongo.Db,
  name: string,
): Promise<boolean> {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

async function findDuplicates(
  db: mongoose.mongo.Db,
  collectionName: string,
  groupFields: string[],
  match: Record<string, unknown>,
): Promise<string[]> {
  const collection = db.collection(collectionName);

  const groupId = Object.fromEntries(
    groupFields.map((field) => [field, `$${field}`]),
  );

  const duplicates = await collection
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  return duplicates.map((item) => JSON.stringify(item));
}

async function ensureIndexes(
  db: mongoose.mongo.Db,
  collectionName: string,
  definitions: IndexDefinition[],
): Promise<void> {
  const collection = db.collection(collectionName);
  const existingIndexes = await collection.listIndexes().toArray();

  for (const definition of definitions) {
    const existing = existingIndexes.find(
      (index) => index.name === definition.name,
    );

    if (existing) {
      const matches =
        sameObject(existing.key, definition.key) &&
        Boolean(existing.unique) === Boolean(definition.unique) &&
        sameObject(
          existing.partialFilterExpression ?? {},
          definition.partialFilterExpression ?? {},
        );

      if (!matches) {
        throw new Error(
          `Index "${definition.name}" exists with different options. Manual review required.`,
        );
      }

      console.log(`Already exists: ${collectionName}.${definition.name}`);
      continue;
    }

    const equivalent = existingIndexes.find(
      (index) =>
        sameObject(index.key, definition.key) &&
        Boolean(index.unique) === Boolean(definition.unique) &&
        sameObject(
          index.partialFilterExpression ?? {},
          definition.partialFilterExpression ?? {},
        ),
    );

    if (equivalent) {
      console.log(
        `Equivalent index already exists: ${collectionName}.${equivalent.name}`,
      );
      continue;
    }

    if (dryRun) {
      console.log(`Would create: ${collectionName}.${definition.name}`);
      continue;
    }

    await collection.createIndex(definition.key, {
      name: definition.name,
      ...(definition.unique ? { unique: true } : {}),
      ...(definition.partialFilterExpression
        ? { partialFilterExpression: definition.partialFilterExpression }
        : {}),
    });

    console.log(`Created: ${collectionName}.${definition.name}`);
  }
}

async function main(): Promise<void> {
  await database.connect({ test: testDatabase });

  const db = database.getDatabase().db;

  if (!db) {
    throw new Error("MongoDB database is unavailable.");
  }

  console.log("\n=== Inventory Index Migration ===");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log(`Database: ${db.databaseName}`);

  const balanceExists = await collectionExists(db, "inventorybalances");
  const movementExists = await collectionExists(db, "stockmovements");

  console.log(`InventoryBalance collection exists: ${balanceExists}`);
  console.log(`StockMovement collection exists: ${movementExists}`);

  const problems: string[] = [];

  if (balanceExists) {
    const standardDuplicates = await findDuplicates(
      db,
      "inventorybalances",
      ["businessId", "productId"],
      {
        $or: [
          { variantId: { $exists: false } },
          { variantId: null },
        ],
      },
    );

    const variantDuplicates = await findDuplicates(
      db,
      "inventorybalances",
      ["businessId", "productId", "variantId"],
      { variantId: { $type: "objectId" } },
    );

    const nullVariantIds = await db
      .collection("inventorybalances")
      .countDocuments({ variantId: { $type: 10 } });

    problems.push(
      ...standardDuplicates.map(
        (item) => `Duplicate standard balance: ${item}`,
      ),
      ...variantDuplicates.map(
        (item) => `Duplicate variant balance: ${item}`,
      ),
    );

    if (nullVariantIds > 0) {
      problems.push(
        `Found ${nullVariantIds} balance records with explicit variantId: null. Normalize these records before creating the unique index.`,
      );
    }
  }

  if (movementExists) {
    const idempotencyDuplicates = await findDuplicates(
      db,
      "stockmovements",
      ["businessId", "idempotencyKey"],
      { idempotencyKey: { $type: "string" } },
    );

    problems.push(
      ...idempotencyDuplicates.map(
        (item) => `Duplicate idempotency key: ${item}`,
      ),
    );
  }

  if (problems.length > 0) {
    console.error("\nMigration blocked. Resolve these conflicts first:");

    for (const problem of problems) {
      console.error(`- ${problem}`);
    }

    throw new Error("Duplicate records detected. No indexes were created.");
  }

  console.log("\nNo duplicate records found.");

  if (dryRun) {
    console.log("\n=== Planned Inventory Indexes ===");

    if (balanceExists) {
      await ensureIndexes(db, "inventorybalances", inventoryIndexes);
    } else {
      console.log("Would create collection: inventorybalances");
      for (const index of inventoryIndexes) {
        console.log(`Would create: inventorybalances.${index.name}`);
      }
    }

    if (movementExists) {
      await ensureIndexes(db, "stockmovements", movementIndexes);
    } else {
      console.log("Would create collection: stockmovements");
      for (const index of movementIndexes) {
        console.log(`Would create: stockmovements.${index.name}`);
      }
    }

    console.log("\nDry run only. No database changes were made.");
  } else {
    if (!balanceExists) {
      await db.createCollection("inventorybalances");
      console.log("Created inventorybalances collection.");
    }

    if (!movementExists) {
      await db.createCollection("stockmovements");
      console.log("Created stockmovements collection.");
    }

    await ensureIndexes(db, "inventorybalances", inventoryIndexes);
    await ensureIndexes(db, "stockmovements", movementIndexes);

    console.log("\nInventory indexes are ready.");
  }
}

main()
  .catch((error: unknown) => {
    console.error("\nMigration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.disconnect();
  });
