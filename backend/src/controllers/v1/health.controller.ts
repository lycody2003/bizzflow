
import type { Request, Response } from 'express'
import healthService from '@services/health.service'
import responseHelper from '@shared-helpers/response.helper'

class HealthController {
  getHealth = (_req: Request, res: Response): Response => {
    const health = healthService.getHealthStatus()

    return responseHelper.success(
      res,
      'Application is healthy',
      health,
    )
  }
}

export default new HealthController()
