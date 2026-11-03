
import mongoose from 'mongoose'
import configEnv from '@configs/env'

interface DatabaseOptions {
  test?: boolean
}

class Database {
  async connect(options: DatabaseOptions = {}) {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection
    }

    const dbName = options.test
      ? configEnv.MONGODB_TEST_DATABASE
      : configEnv.MONGODB_DATABASE

    await mongoose.connect(configEnv.MONGODB_URI, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    })

    console.log(`[MongoDB] Connected to database: ${dbName}`)

    return mongoose.connection
  }

  getDatabase() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error(
        'MongoDB is not connected. Call database.connect() first.',
      )
    }

    return mongoose.connection
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) return

    await mongoose.disconnect()
    console.log('[MongoDB] Disconnected')
  }

  getStatus(): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }

    return states[mongoose.connection.readyState] ?? 'unknown'
  }
}

export default new Database()
