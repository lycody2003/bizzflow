
export interface AuthUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: unknown
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}
