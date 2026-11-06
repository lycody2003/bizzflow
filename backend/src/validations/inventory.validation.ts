import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID");

const adjustmentSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema.optional(),
  type: z.enum(["adjustment_in", "adjustment_out"]),
  quantity: z.number().int().min(1),
  reason: z.string().trim().min(1).max(500),
  idempotencyKey: z.string().trim().min(8).max(128),
}).strict();

class InventoryValidation {
  readonly adjust = z.object({
    body: adjustmentSchema,
  });

  readonly getAll = z.object({
    query: z.object({
      productId: objectIdSchema.optional(),
      variantId: objectIdSchema.optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  });

  readonly getMovements = z.object({
    query: z.object({
      productId: objectIdSchema.optional(),
      variantId: objectIdSchema.optional(),
      type: z.enum(["opening", "adjustment_in", "adjustment_out"]).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  });
}

export default new InventoryValidation();
