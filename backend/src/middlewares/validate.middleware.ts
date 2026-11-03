
import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'

class ValidateMiddleware {
  validate(schema: ZodType) {
    return (
      req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      if (!result.success) {
        res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        })

        return
      }

      res.locals.validated = result.data

      next()
    }
  }
}

export default new ValidateMiddleware()
