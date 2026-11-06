import { z } from "zod";

const productStatusSchema = z.enum(["active", "inactive"]);
const productTypeSchema = z.enum(["standard", "variant"]);
const barcodeTypeSchema = z.enum(["EAN13", "UPC", "EAN8", "CODE128", "QR"]);
const currencySchema = z.enum(["USD", "KHR"]);

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

const skuSchema = z
  .string()
  .trim()
  .min(1, "SKU is required")
  .max(50, "SKU cannot exceed 50 characters")
  .transform((value) => value.toUpperCase())
  .pipe(
    z.string().regex(
      /^[A-Z0-9][A-Z0-9_-]*$/,
      "SKU can only contain letters, numbers, hyphens, and underscores",
    ),
  );

const attributeDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  values: z
    .array(z.string().trim().min(1).max(100))
    .min(1)
    .max(100),
});

const baseProductFields = {
  name: z.string().trim().min(2).max(150),
  barcode: z.string().trim().max(100).nullable().optional(),
  barcodeType: barcodeTypeSchema.nullable().optional(),
  description: z.string().trim().max(2000).optional(),
  category: objectIdSchema,
  type: productTypeSchema.default("standard"),
  unit: objectIdSchema,
  currency: currencySchema.optional(),
  status: productStatusSchema.optional(),
};

const standardProductSchema = z.object({
  ...baseProductFields,
  type: z.literal("standard"),
  sku: skuSchema,
  costPrice: z.number().finite().min(0),
  sellingPrice: z.number().finite().min(0),
  stockQuantity: z.number().int().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  attributeDefinitions: z.array(attributeDefinitionSchema).max(20).optional(),
});

const variantProductSchema = z.object({
  ...baseProductFields,
  type: z.literal("variant"),
  attributeDefinitions: z.array(attributeDefinitionSchema).min(1).max(20),
}).strict();

const createProductBodySchema = z.discriminatedUnion("type", [
  standardProductSchema,
  variantProductSchema,
]).or(
  standardProductSchema.extend({
    type: z.undefined().optional(),
  }),
);

const updateProductBodySchema = z.object({
  name: baseProductFields.name.optional(),
  barcode: baseProductFields.barcode,
  barcodeType: baseProductFields.barcodeType,
  description: baseProductFields.description,
  category: objectIdSchema.optional(),
  unit: objectIdSchema.optional(),
  currency: currencySchema.optional(),
  status: productStatusSchema.optional(),
  attributeDefinitions: z.array(attributeDefinitionSchema).max(20).optional(),
  sku: skuSchema.optional(),
  costPrice: z.number().finite().min(0).optional(),
  sellingPrice: z.number().finite().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required for update",
);

class ProductValidation {
  readonly create = z.object({
    body: createProductBodySchema,
  });

  readonly update = z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: updateProductBodySchema,
  });

  readonly getById = z.object({
    params: z.object({
      id: objectIdSchema,
    }),
  });

  readonly getAll = z.object({
    query: z.object({
      search: z.string().trim().max(100).optional(),
      status: productStatusSchema.optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  });
}

export default new ProductValidation();
