import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

const skuSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9_-]*$/));

const barcodeTypeSchema = z.enum([
  "EAN13",
  "UPC",
  "EAN8",
  "CODE128",
  "QR",
]);

const barcodeSchema = z
  .string()
  .trim()
  .max(100)
  .nullable()
  .optional()
  .transform((value) => value === "" ? null : value);

const currencySchema = z.enum(["USD", "KHR"]);
const statusSchema = z.enum(["active", "inactive"]);

const attributesSchema = z.array(
  z.object({
    name: z.string().trim().min(1).max(50),
    value: z.string().trim().min(1).max(100),
  }).strict(),
).min(1).max(20);

const createBodySchema = z.object({
  sku: skuSchema,
  barcode: barcodeSchema,
  barcodeType: barcodeTypeSchema.nullable().optional(),
  attributes: attributesSchema,
  costPrice: z.number().finite().min(0),
  sellingPrice: z.number().finite().min(0),
  currency: currencySchema.optional(),
  stockQuantity: z.number().int().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  status: statusSchema.optional(),
}).strict();

const bulkCreateBodySchema = z.object({
  variants: z.array(createBodySchema).min(1).max(100),
}).strict();

const updateBodySchema = z.object({
  sku: skuSchema.optional(),
  barcode: barcodeSchema,
  barcodeType: barcodeTypeSchema.nullable().optional(),
  attributes: attributesSchema.optional(),
  costPrice: z.number().finite().min(0).optional(),
  sellingPrice: z.number().finite().min(0).optional(),
  currency: currencySchema.optional(),
  minimumStock: z.number().int().min(0).optional(),
  status: statusSchema.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field is required for update",
);

class ProductVariantValidation {
  readonly create = z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: createBodySchema,
  });

  readonly bulkCreate = z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    body: bulkCreateBodySchema,
  });

  readonly getAll = z.object({
    params: z.object({
      id: objectIdSchema,
    }),
    query: z.object({
      status: statusSchema.optional(),
    }),
  });

  readonly getById = z.object({
    params: z.object({
      id: objectIdSchema,
      variantId: objectIdSchema,
    }),
  });

  readonly update = z.object({
    params: z.object({
      id: objectIdSchema,
      variantId: objectIdSchema,
    }),
    body: updateBodySchema,
  });
}

export default new ProductVariantValidation();
