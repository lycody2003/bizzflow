
import type { Response } from 'express'
import type { ApiResponse } from '@shared-types/response.type'

class ResponseHelper {
  success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200,
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      ...(data !== undefined && { data }),
    }

    return res.status(statusCode).json(response)
  }

  error(
    res: Response,
    message: string,
    statusCode = 400,
    errors?: unknown,
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors !== undefined && { errors }),
    }

    return res.status(statusCode).json(response)
  }
}

export default new ResponseHelper()
