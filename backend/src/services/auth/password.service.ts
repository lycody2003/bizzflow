
import bcrypt from 'bcryptjs'
import AppError from '@shared-errors/app.error'

class PasswordService {
  private readonly saltRounds = 12

  async hashPassword(password: string): Promise<string> {
    if (!password) {
      throw new AppError('Password is required', 400)
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new AppError('Password must not exceed 72 bytes', 400)
    }

    return bcrypt.hash(password, this.saltRounds)
  }

  async comparePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    if (!password || !passwordHash) {
      return false
    }

    if (Buffer.byteLength(password, 'utf8') > 72) {
      return false
    }

    return bcrypt.compare(password, passwordHash)
  }
}

export default new PasswordService()
