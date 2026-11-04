import { z } from "zod";

const unitIdSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid unit ID."),
});

export const getUnitsSchema = z.object({
  query: z.object({
    status: z.enum(["all", "active", "inactive"]).default("active"),
    search: z.string().trim().max(100).default(""),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export const createUnitSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    symbol: z.string().trim().min(1).max(20),
  }),
});

export const updateUnitSchema = z.object({
  params: unitIdSchema,
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    symbol: z.string().trim().min(1).max(20).optional(),
    isActive: z.boolean().optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  ),
});

export const unitIdParamSchema = z.object({
  params: unitIdSchema,
});

export type GetUnitsQuery = z.infer<typeof getUnitsSchema>["query"];
export type CreateUnitBody = z.infer<typeof createUnitSchema>["body"];
export type UpdateUnitBody = z.infer<typeof updateUnitSchema>["body"];
