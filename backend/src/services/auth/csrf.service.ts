
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import configEnv from '@configs/env'

class CsrfService {
  private createSignature(token: string): string {
    return createHmac('sha256', configEnv.CSRF_SECRET)
      .update(token)
      .digest('hex')
  }

  generateToken(): string {
    const token = randomBytes(32).toString('hex')
    const signature = this.createSignature(token)

    return `${token}.${signature}`
  }

  verifyToken(token: string): boolean {
    const parts = token.split('.')

    if (parts.length !== 2) {
      return false
    }

    const [value, signature] = parts

    if (
      !/^[a-f0-9]{64}$/.test(value) ||
      !/^[a-f0-9]{64}$/.test(signature)
    ) {
      return false
    }

    const expectedSignature = this.createSignature(value)

    const receivedBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    return timingSafeEqual(receivedBuffer, expectedBuffer)
  }
}

export default new CsrfService()
