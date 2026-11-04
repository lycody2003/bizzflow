import { z } from "zod";

const productStatusSchema = z.enum(["active", "inactive"]);
const productTypeSchema = z.enum(["standard", "variant"]);
const barcodeTypeSchema = z.enum(["EAN13", "UPC", "EAN8", "CODE128", "QR"]);
const currencySchema = z.enum(["USD", "KHR"]);

const productFields = {
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  sku: z
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
    ),

  barcode: z.string().trim().max(100).nullable().optional(),
  barcodeType: barcodeTypeSchema.nullable().optional(),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),

  category: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid category ID"),

  type: productTypeSchema.optional(),
  unit: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid unit ID"),

  costPrice: z.number().finite().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().finite().min(0, "Selling price cannot be negative"),

  currency: currencySchema.optional(),

  stockQuantity: z
    .number()
    .int("Stock quantity must be an integer")
    .min(0, "Stock quantity cannot be negative")
    .optional(),

  minimumStock: z
    .number()
    .int("Minimum stock must be an integer")
    .min(0, "Minimum stock cannot be negative")
    .optional(),

  status: productStatusSchema,
};

class ProductValidation {
  readonly create = z.object({
    body: z.object({
      name: productFields.name,
      sku: productFields.sku,
      barcode: productFields.barcode,
      barcodeType: productFields.barcodeType,
      description: productFields.description,
      category: productFields.category,
      type: productFields.type,
      unit: productFields.unit,
      costPrice: productFields.costPrice,
      sellingPrice: productFields.sellingPrice,
      currency: productFields.currency,
      stockQuantity: productFields.stockQuantity,
      minimumStock: productFields.minimumStock,
      status: productFields.status.optional(),
    }),
  });

  readonly update = z.object({
    params: z.object({
      id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID"),
    }),

    body: z
      .object({
        name: productFields.name.optional(),
        sku: productFields.sku.optional(),
        barcode: productFields.barcode,
        barcodeType: productFields.barcodeType,
        description: productFields.description,
        category: productFields.category.optional(),
        type: productFields.type,
        unit: productFields.unit.optional(),
        costPrice: productFields.costPrice.optional(),
        sellingPrice: productFields.sellingPrice.optional(),
        currency: productFields.currency,
        stockQuantity: productFields.stockQuantity,
        minimumStock: productFields.minimumStock,
        status: productFields.status.optional(),
      })
      .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update",
      ),
  });

  readonly getById = z.object({
    params: z.object({
      id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID"),
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
