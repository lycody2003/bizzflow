
import type { Request, Response, NextFunction } from 'express'
import AppError from '@shared-errors/app.error'
import configEnv from '@configs/env'

class ErrorMiddleware {
  handle(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (res.headersSent) return

    const isAppError = error instanceof AppError

    const statusCode = isAppError ? error.statusCode : 500

    const message = isAppError
      ? error.message
      : 'Internal server error'

    if (!isAppError || !error.isOperational) {
      console.error('[Application Error]:', error)
    }

    res.status(statusCode).json({
      success: false,
      message,
      ...(configEnv.IS_DEVELOPMENT && error instanceof Error
        ? { stack: error.stack }
        : {}),
    })
  }
}

export default new ErrorMiddleware()
