
import { Router } from 'express'

import authController from '@controllers/v1/auth.controller'
import authMiddleware from '@middlewares/auth.middleware'
import csrfMiddleware from '@middlewares/csrf.middleware'
import validateMiddleware from '@middlewares/validate.middleware'
import rateLimitMiddleware from '@middlewares/rate-limit.middleware'
import authValidation from '@validations/auth.validation'

class AuthRoutes {
  public readonly router = Router()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    this.router.post(
      '/register',
      rateLimitMiddleware.register,
      csrfMiddleware.protect,
      validateMiddleware.validate(authValidation.register),
      authController.register,
    )

    this.router.post(
      '/login',
      rateLimitMiddleware.login,
      csrfMiddleware.protect,
      validateMiddleware.validate(authValidation.login),
      authController.login,
    )

    this.router.post(
      '/refresh',
      rateLimitMiddleware.refresh,
      csrfMiddleware.protect,
      authController.refresh,
    )

    this.router.post(
      '/logout',
      csrfMiddleware.protect,
      authController.logout,
    )

    this.router.get(
      '/me',
      authMiddleware.authenticate,
      authController.getCurrentUser,
    )
  }
}

export default new AuthRoutes().router
