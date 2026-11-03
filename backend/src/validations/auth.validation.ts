
import { z } from 'zod'

class AuthValidation {
  readonly register = z.object({
    body: z.object({
      firstName: z
        .string()
        .trim()
        .min(1)
        .max(100),

      lastName: z
        .string()
        .trim()
        .min(1)
        .max(100),

      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),

      password: z
        .string()
        .min(8)
        .max(72),
    }),
  })

  readonly login = z.object({
    body: z.object({
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),

      password: z
        .string()
        .min(1)
        .max(72),
    }),
  })

  readonly refresh = z.object({
    body: z.object({
      refreshToken: z
        .string()
        .min(1),
    }),
  })

  readonly logout = z.object({
    body: z.object({
      refreshToken: z
        .string()
        .min(1),
    }),
  })
}

export default new AuthValidation()
