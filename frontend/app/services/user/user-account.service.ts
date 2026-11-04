import type { ApiResponse, AuthUser } from '../../types/auth'

interface UpdateProfileInput {
  firstName: string
  lastName: string
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export default function useUserAccountService() {
  const { request } = useApi()

  const updateProfile = async (
    input: UpdateProfileInput,
  ): Promise<ApiResponse<AuthUser>> => {
    return request<AuthUser>('/users/me/profile', {
      method: 'PATCH',
      body: input,
      requiresAuth: true,
      requiresCsrf: true,
    })
  }

  const changePassword = async (
    input: ChangePasswordInput,
  ): Promise<ApiResponse<unknown>> => {
    return request<unknown>('/users/me/password', {
      method: 'PATCH',
      body: input,
      requiresAuth: true,
      requiresCsrf: true,
    })
  }

  return {
    updateProfile,
    changePassword,
  }
}