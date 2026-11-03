
import type { Request, Response, NextFunction } from 'express'

import AppError from '@shared-errors/app.error'
import csrfService from '@services/auth/csrf.service'

class CsrfMiddleware {
  readonly protect = (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    try {
      const cookieToken = req.cookies?.csrfToken
      const headerToken = req.headers['x-csrf-token']

      if (
        typeof cookieToken !== 'string' ||
        typeof headerToken !== 'string' ||
        cookieToken !== headerToken ||
        !csrfService.verifyToken(cookieToken)
      ) {
        throw new AppError('Invalid CSRF token', 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default new CsrfMiddleware()
