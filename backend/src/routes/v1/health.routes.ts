
import { Router } from 'express'
import healthController from '@controllers/v1/health.controller'

class HealthRoutes {
  public readonly router = Router()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    this.router.get('/', healthController.getHealth)
  }
}

export default new HealthRoutes().router
