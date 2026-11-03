import { z } from "zod";

class BusinessValidation {
  readonly update = z.object({
    body: z.object({
      name: z
        .string()
        .trim()
        .min(2, "Business name must be at least 2 characters")
        .max(150, "Business name cannot exceed 150 characters"),
    }),
  });
}

export default new BusinessValidation();