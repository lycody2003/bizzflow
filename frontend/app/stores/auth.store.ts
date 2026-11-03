
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../types/auth'

import useAuthService from '../services/auth.service'

let initializationPromise: Promise<void> | null = null

export default function useAuthStore() {
  const authService = useAuthService()

  const user = useState<AuthUser | null>(
    'auth-user',
    () => null,
  )

  const isAuthenticated = computed(() => !!user.value)

  const isLoading = useState<boolean>(
    'auth-loading',
    () => false,
  )

  const isInitialized = useState<boolean>(
    'auth-initialized',
    () => false,
  )

  const login = async (input: LoginInput): Promise<AuthUser> => {
    isLoading.value = true

    try {
      const response = await authService.login(input)

      if (!response.data) {
        throw new Error(response.message || 'Login failed')
      }

      user.value = response.data.user
      isInitialized.value = true

      return response.data.user
    } finally {
      isLoading.value = false
    }
  }

  const register = async (
    input: RegisterInput,
  ): Promise<AuthUser> => {
    isLoading.value = true

    try {
      const response = await authService.register(input)

      if (!response.data) {
        throw new Error(response.message || 'Registration failed')
      }

      user.value = response.data.user
      isInitialized.value = true

      return response.data.user
    } finally {
      isLoading.value = false
    }
  }

  const fetchCurrentUser = async (): Promise<AuthUser | null> => {
    if (!authService.accessToken.value) {
      user.value = null
      return null
    }

    const response = await authService.getCurrentUser()

    if (!response.data) {
      authService.accessToken.value = null
      user.value = null
      return null
    }

    user.value = response.data

    return response.data
  }

  const initialize = (): Promise<void> => {
    if (import.meta.server || isInitialized.value) {
      return Promise.resolve()
    }

    if (initializationPromise) {
      return initializationPromise
    }

    initializationPromise = (async () => {
      isLoading.value = true

      try {
        const token = await authService.refresh()

        if (token) {
          await fetchCurrentUser()
        } else {
          user.value = null
        }
      } catch {
        authService.accessToken.value = null
        user.value = null
      } finally {
        isInitialized.value = true
        isLoading.value = false
        initializationPromise = null
      }
    })()

    return initializationPromise
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true

    try {
      await authService.logout()
    } finally {
      user.value = null
      authService.accessToken.value = null
      isInitialized.value = true
      isLoading.value = false
      await navigateTo('/auth/login')
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    register,
    fetchCurrentUser,
    initialize,
    logout,
  }
}
