
import type {
  ApiResponse,
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../types/auth'

export default function useAuthService() {
  const {
    accessToken,
    request,
    clearCsrfToken,
    refreshAccessToken,
  } = useApi()

  const register = async (
    input: RegisterInput,
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      requiresCsrf: true,
    })

    if (response.data?.accessToken) {
      accessToken.value = response.data.accessToken
    }

    return response
  }

  const login = async (
    input: LoginInput,
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      requiresCsrf: true,
    })

    if (response.data?.accessToken) {
      accessToken.value = response.data.accessToken
    }

    return response
  }

  const refresh = async (): Promise<string | null> => {
    return refreshAccessToken()
  }

  const logout = async (): Promise<ApiResponse<unknown>> => {
    try {
      return await request<unknown>('/auth/logout', {
        method: 'POST',
        requiresCsrf: true,
        retryOnUnauthorized: false,
      })
    } finally {
      accessToken.value = null
      clearCsrfToken()
    }
  }

  const getCurrentUser = async (): Promise<ApiResponse<AuthUser>> => {
    return request<AuthUser>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    })
  }

  return {
    accessToken,
    register,
    login,
    refresh,
    logout,
    getCurrentUser,
  }
}
