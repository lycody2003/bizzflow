
import database from '@configs/database'
import configEnv from '@configs/env'

class HealthService {
  getHealthStatus() {
    return {
      application: configEnv.APP_NAME,
      version: configEnv.APP_VERSION,
      status: 'ok',
      database: database.getStatus(),
      environment: configEnv.NODE_ENV,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }
}

export default new HealthService()
