
import app from '@app'
import database from '@configs/database'
import configEnv from '@configs/env'

class Server {
  private server: ReturnType<typeof app.listen> | null = null
  private isShuttingDown = false

  async start(): Promise<void> {
    try {
      await database.connect()

      this.server = app.listen(configEnv.PORT)

      this.server.on('listening', () => {
        console.log('--------------------------------')
        console.log(`${configEnv.APP_NAME} Backend Started`)
        console.log(`Version: ${configEnv.APP_VERSION}`)
        console.log(`Environment: ${configEnv.NODE_ENV}`)
        console.log(`Port: ${configEnv.PORT}`)
        console.log(`API: ${configEnv.API_BASE_PATH}`)
        console.log('--------------------------------')
      })

      this.server.on('error', (error) => {
        console.error('[HTTP Server Error]:', error)
        process.exitCode = 1
        void this.shutdown()
      })

      process.once('SIGINT', () => {
        void this.shutdown()
      })

      process.once('SIGTERM', () => {
        void this.shutdown()
      })
    } catch (error) {
      console.error('Failed to start application:', error)

      await database.disconnect()
      process.exitCode = 1
    }
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true

    console.log(`Shutting down ${configEnv.APP_NAME}...`)

    try {
      if (this.server?.listening) {
        await new Promise<void>((resolve, reject) => {
          this.server!.close((error) => {
            if (error) reject(error)
            else resolve()
          })
        })
      }

      await database.disconnect()

      console.log(`${configEnv.APP_NAME} shutdown completed.`)
      process.exit(0)
    } catch (error) {
      console.error('Shutdown failed:', error)
      process.exit(1)
    }
  }
}

const server = new Server()

void server.start()
