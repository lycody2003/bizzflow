
import type { Request, Response, NextFunction } from 'express'
import AppError from '@shared-errors/app.error'

class NotFoundMiddleware {
  handle(_req: Request, _res: Response, next: NextFunction): void {
    next(new AppError('API endpoint not found', 404))
  }
}

export default new NotFoundMiddleware()
