
import type { ApiResponse } from '@app-types/auth'

import type {
  Business,
  BusinessLogoResponse,
  BusinessRepository,
  UpdateBusinessInput,
} from '@repositories/contracts/business.repository'

export default function createBusinessRepository(): BusinessRepository {
  const { request } = useApi()

  async function getMyBusiness(): Promise<Business> {
    const response = await request<Business>('/businesses/me', {
      method: 'GET',
      requiresAuth: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to load business profile.')
    }

    return response.data
  }

  async function updateMyBusiness(
    input: UpdateBusinessInput,
  ): Promise<Business> {
    const response = await request<Business>('/businesses/me', {
      method: 'PATCH',
      body: input,
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update business profile.')
    }

    return response.data
  }

  async function uploadLogo(file: File): Promise<BusinessLogoResponse> {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await request<BusinessLogoResponse>(
      '/businesses/me/logo',
      {
        method: 'PUT',
        body: formData,
        requiresAuth: true,
        requiresCsrf: true,
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to upload business logo.')
    }

    return response.data
  }

  async function removeLogo(): Promise<BusinessLogoResponse> {
    const response = await request<BusinessLogoResponse>(
      '/businesses/me/logo',
      {
        method: 'DELETE',
        requiresAuth: true,
        requiresCsrf: true,
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to remove business logo.')
    }

    return response.data
  }

  return {
    getMyBusiness,
    updateMyBusiness,
    uploadLogo,
    removeLogo,
  }
}
