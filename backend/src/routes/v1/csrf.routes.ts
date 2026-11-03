
import { Router } from 'express'

import csrfController from '@controllers/v1/csrf.controller'
import rateLimitMiddleware from '@middlewares/rate-limit.middleware'

class CsrfRoutes {
  public readonly router = Router()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    this.router.get(
      '/token',
      rateLimitMiddleware.csrfToken,
      csrfController.getToken,
    )
  }
}

export default new CsrfRoutes().router
