import { ref, computed } from 'vue'

import dashboardService from '../services/dashboard/dashboard.service'

import type {
  DashboardBusiness,
  DashboardOverview,
} from '../types/dashboard'

const emptyOverview = (): DashboardOverview => ({
  totalProducts: 0,
  activeProducts: 0,
  totalVariants: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  inventoryCostValue: { USD: 0, KHR: 0 },
  potentialSalesValue: { USD: 0, KHR: 0 },
})

class DashboardComposable {
  private businesses = ref<DashboardBusiness[]>([])
  private selectedBusinessId = ref('')
  private overview = ref<DashboardOverview>(emptyOverview())
  private loading = ref(false)
  private error = ref<string | null>(null)

  private getProvider() {
    return dashboardService.getProvider()
  }

  get businessesValue() {
    return computed(() => this.businesses.value)
  }

  get selectedBusinessIdValue() {
    return this.selectedBusinessId
  }

  get selectedBusiness() {
    return computed(() => {
      return this.businesses.value.find(
        business => business.id === this.selectedBusinessId.value,
      ) ?? null
    })
  }

  get overviewValue() {
    return computed(() => this.overview.value)
  }

  get loadingValue() {
    return computed(() => this.loading.value)
  }

  get errorValue() {
    return computed(() => this.error.value)
  }

  async loadDashboard() {
    this.loading.value = true
    this.error.value = null

    try {
      const provider = this.getProvider()
      const businesses = await provider.getBusinesses()

      this.businesses.value = businesses

      const currentBusinessExists = businesses.some(
        business => business.id === this.selectedBusinessId.value,
      )

      if (!currentBusinessExists) {
        this.selectedBusinessId.value = businesses[0]?.id ?? ''
      }

      if (!this.selectedBusinessId.value) {
        this.clearBusinessData()
        return
      }

      await this.loadBusinessData()
    } catch (error) {
      this.error.value = this.getErrorMessage(error)
      this.clearBusinessData()
    } finally {
      this.loading.value = false
    }
  }

  async selectBusiness(businessId: string) {
    if (this.selectedBusinessId.value === businessId) {
      return
    }

    const businessExists = this.businesses.value.some(
      business => business.id === businessId,
    )

    if (!businessExists) {
      return
    }

    this.selectedBusinessId.value = businessId
    await this.loadBusinessData()
  }

  async refreshDashboard() {
    await this.loadDashboard()
  }

  private async loadBusinessData() {
    if (!this.selectedBusinessId.value) {
      this.clearBusinessData()
      return
    }

    this.loading.value = true
    this.error.value = null

    try {
      const provider = this.getProvider()
      this.overview.value = await provider.getOverview()
    } catch (error) {
      this.error.value = this.getErrorMessage(error)
      this.clearBusinessData()
    } finally {
      this.loading.value = false
    }
  }

  private clearBusinessData() {
    this.overview.value = emptyOverview()
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    return 'Unable to load dashboard data.'
  }
}

export default new DashboardComposable()
