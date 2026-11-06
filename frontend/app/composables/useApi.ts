
import type { ApiResponse } from '../types/auth'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: object | FormData
  query?: Record<string, string | number | boolean | undefined>
  requiresCsrf?: boolean
  requiresAuth?: boolean
  retryOnUnauthorized?: boolean
}

let refreshPromise: Promise<string | null> | null = null
let csrfPromise: Promise<string> | null = null

export default function useApi() {
  const config = useRuntimeConfig()

  const accessToken = useState<string | null>(
    'auth-access-token',
    () => null,
  )

  const csrfToken = useState<string | null>(
    'auth-csrf-token',
    () => null,
  )

  const csrfTokenFetchedAt = useState<number>(
    'auth-csrf-token-fetched-at',
    () => 0,
  )

  const isRefreshing = useState<boolean>(
    'auth-is-refreshing',
    () => false,
  )

  const getCsrfToken = async (
    forceRefresh = false,
  ): Promise<string> => {
    if (import.meta.server) {
      throw new Error('CSRF token requests must run in the browser')
    }

    const tokenAge = Date.now() - csrfTokenFetchedAt.value

    const isTokenValid =
      !!csrfToken.value &&
      tokenAge < 55 * 60 * 1000

    if (!forceRefresh && isTokenValid) {
      return csrfToken.value!
    }

    if (csrfPromise) {
      return csrfPromise
    }

    csrfPromise = (async () => {
      try {
        const response = await $fetch<
          ApiResponse<{ csrfToken: string }>
        >(
          `${config.public.apiBase}/csrf/token`,
          {
            method: 'GET',
            credentials: 'include',
          },
        )

        if (!response.data?.csrfToken) {
          throw new Error('Unable to retrieve CSRF token')
        }

        csrfToken.value = response.data.csrfToken
        csrfTokenFetchedAt.value = Date.now()

        return response.data.csrfToken
      } finally {
        csrfPromise = null
      }
    })()

    return csrfPromise
  }

  const clearCsrfToken = (): void => {
    csrfToken.value = null
    csrfTokenFetchedAt.value = 0
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    if (import.meta.server) return null

    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      isRefreshing.value = true

      try {
        const token = await getCsrfToken()

        const response = await $fetch<
          ApiResponse<{ accessToken: string }>
        >(
          `${config.public.apiBase}/auth/refresh`,
          {
            method: 'POST',
            headers: {
              'X-CSRF-Token': token,
            },
            credentials: 'include',
          },
        )

        if (!response.data?.accessToken) {
          throw new Error('Unable to refresh access token')
        }

        accessToken.value = response.data.accessToken

        return response.data.accessToken
      } catch {
        accessToken.value = null
        return null
      } finally {
        isRefreshing.value = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  const request = async <T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> => {
    const {
      method = 'GET',
      body,
      query,
      requiresCsrf = false,
      requiresAuth = false,
      retryOnUnauthorized = true,
    } = options

    const originalAccessToken = accessToken.value

    const headers: Record<string, string> = {}

    if (requiresAuth && originalAccessToken) {
      headers.Authorization = `Bearer ${originalAccessToken}`
    }

    if (requiresCsrf) {
      headers['X-CSRF-Token'] = await getCsrfToken()
    }

    try {
      return await $fetch<ApiResponse<T>>(
        `${config.public.apiBase}${endpoint}`,
        {
          method,
          body,
          query,
          headers,
          credentials: 'include',
        },
      )
    } catch (error: unknown) {
      const requestError = error as {
        response?: {
          status?: number
          _data?: { message?: string }
        }
        data?: { message?: string }
      }

      const status = requestError.response?.status
      const errorMessage =
        requestError.data?.message ??
        requestError.response?._data?.message

      // Retry only the specific CSRF validation error, once.
      if (
        status === 403 &&
        requiresCsrf &&
        errorMessage === 'Invalid CSRF token'
      ) {
        clearCsrfToken()

        const freshToken = await getCsrfToken(true)

        return $fetch<ApiResponse<T>>(
          `${config.public.apiBase}${endpoint}`,
          {
            method,
            body,
            query,
            headers: {
              ...headers,
              'X-CSRF-Token': freshToken,
            },
            credentials: 'include',
          },
        )
      }

      if (
        status !== 401 ||
        !requiresAuth ||
        !retryOnUnauthorized
      ) {
        throw error
      }

      let newAccessToken: string | null = null

      const currentAccessToken = accessToken.value

      if (
        originalAccessToken &&
        currentAccessToken &&
        currentAccessToken !== originalAccessToken
      ) {
        newAccessToken = currentAccessToken
      } else {
        newAccessToken = await refreshAccessToken()
      }

      if (!newAccessToken) {
        throw error
      }

      return $fetch<ApiResponse<T>>(
        `${config.public.apiBase}${endpoint}`,
        {
          method,
          body,
          query,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
          credentials: 'include',
        },
      )
    }
  }

  return {
    accessToken,
    request,
    getCsrfToken,
    clearCsrfToken,
    refreshAccessToken,
    isRefreshing,
  }
}
