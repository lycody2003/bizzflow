import { z } from "zod";

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Category name must be at least 2 characters")
  .max(100, "Category name cannot exceed 100 characters");

const categoryIconSchema = z
  .string()
  .trim()
  .min(1, "Icon name cannot be empty")
  .max(100, "Icon name is too long")
  .nullable();

const categorySchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid category ID");

const categoryStatusSchema = z
  .enum(["all", "active", "inactive"])
  .default("active");

class CategoryValidation {
  readonly getAll = z.object({
    query: z.object({
      status: categoryStatusSchema,
    }),
  });

  readonly create = z.object({
    body: z.object({
      name: categoryNameSchema,
      icon: categoryIconSchema.optional(),
    }),
  });

  readonly update = z.object({
    params: z.object({
      id: categorySchema,
    }),
    body: z
      .object({
        name: categoryNameSchema.optional(),
        icon: categoryIconSchema.optional(),
        isActive: z.boolean().optional(),
      })
      .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update",
      ),
  });

  readonly getById = z.object({
    params: z.object({
      id: categorySchema,
    }),
  });
}

export default new CategoryValidation();
