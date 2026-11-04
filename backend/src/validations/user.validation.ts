import { z } from "zod";

class UserValidation {
  readonly updateProfile = z.object({
    body: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
    }),
  });

  readonly changePassword = z.object({
    body: z.object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z.string().min(8).max(72),
    }),
  });
}

export default new UserValidation();