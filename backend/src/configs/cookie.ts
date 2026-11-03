
import type { CookieOptions } from 'express'

import configEnv from '@configs/env'

class CookieConfig {
  get refreshToken(): CookieOptions {
    return {
      httpOnly: true,
      secure: configEnv.IS_PRODUCTION,
      sameSite: 'lax',
      path: '/api/v1/auth',
      ...(configEnv.IS_PRODUCTION && {
        domain: '.bizzflow.com',
      }),
    }
  }
}

export default new CookieConfig()
