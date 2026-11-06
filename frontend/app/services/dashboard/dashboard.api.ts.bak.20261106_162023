import type {
  DashboardBusiness,
  DashboardOverview,
} from '../../types/dashboard'

export default class DashboardApi {
  private readonly api = useApi()

  async getBusinesses(): Promise<DashboardBusiness[]> {
    const response = await this.api.request<{
      id: string;
      name: string;
    }>('/businesses/me', {
      requiresAuth: true,
    })

    if (!response.data) {
      throw new Error(response.message || 'Unable to load business.')
    }

    return [{
      id: response.data.id,
      name: response.data.name,
      role: 'owner',
    }]
  }

  async getOverview(): Promise<DashboardOverview> {
    const response = await this.api.request<DashboardOverview>(
      '/dashboard/overview',
      {
        requiresAuth: true,
      },
    )

    if (!response.data) {
      throw new Error(
        response.message || 'Unable to load dashboard overview.',
      )
    }

    return response.data
  }
}
