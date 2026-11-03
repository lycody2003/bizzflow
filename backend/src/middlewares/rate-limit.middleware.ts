
import { rateLimit } from 'express-rate-limit'

class RateLimitMiddleware {
  readonly login = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many login attempts. Please try again later.',
    },
  })

  readonly register = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many registration attempts. Please try again later.',
    },
  })

  readonly refresh = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many token refresh requests. Please try again later.',
    },
  })

  readonly csrfToken = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many CSRF token requests. Please try again later.',
    },
  })
}

export default new RateLimitMiddleware()
