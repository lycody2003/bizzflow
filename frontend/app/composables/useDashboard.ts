
import { ref, computed } from 'vue'

import dashboardService from '../services/dashboard/dashboard.service'

import type {
  DashboardBusiness,
  DashboardStat,
  DashboardTransaction,
  DashboardTopProduct,
  DashboardLowStockProduct,
  SalesPeriod,
} from '../types/dashboard'

import type {
  DashboardSalesResponse,
} from '../services/dashboard/dashboard.demo'

class DashboardComposable {
  private businesses = ref<DashboardBusiness[]>([])
  private selectedBusinessId = ref('')
  private stats = ref<DashboardStat[]>([])
  private transactions = ref<DashboardTransaction[]>([])
  private topProducts = ref<DashboardTopProduct[]>([])
  private lowStockProducts = ref<DashboardLowStockProduct[]>([])
  private sales = ref<DashboardSalesResponse>({
    currency: 'USD',
    data: [],
  })

  private selectedPeriod = ref<SalesPeriod>('7days')
  private loading = ref(false)
  private error = ref<string | null>(null)

  private getProvider() {
    const config = useRuntimeConfig()

    return dashboardService.getProvider(
      String(config.public.appMode),
      String(config.public.apiBase),
    )
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

  get statsValue() {
    return computed(() => this.stats.value)
  }

  get transactionsValue() {
    return computed(() => this.transactions.value)
  }

  get topProductsValue() {
    return computed(() => this.topProducts.value)
  }

  get lowStockProductsValue() {
    return computed(() => this.lowStockProducts.value)
  }

  get salesValue() {
    return computed(() => this.sales.value)
  }

  get selectedPeriodValue() {
    return this.selectedPeriod
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

  async changePeriod(period: SalesPeriod) {
    this.selectedPeriod.value = period
    await this.loadSales()
  }

  async refreshDashboard() {
    await this.loadDashboard()
  }

  private async loadBusinessData() {
    const businessId = this.selectedBusinessId.value

    if (!businessId) {
      this.clearBusinessData()
      return
    }

    this.loading.value = true
    this.error.value = null

    try {
      const provider = this.getProvider()

      const [
        stats,
        transactions,
        topProducts,
        lowStockProducts,
        sales,
      ] = await Promise.all([
        provider.getStats(businessId),
        provider.getTransactions(businessId),
        provider.getTopProducts(businessId),
        provider.getLowStockProducts(businessId),
        provider.getSales(businessId, this.selectedPeriod.value),
      ])

      this.stats.value = stats
      this.transactions.value = transactions
      this.topProducts.value = topProducts
      this.lowStockProducts.value = lowStockProducts
      this.sales.value = sales
    } catch (error) {
      this.error.value = this.getErrorMessage(error)
      this.clearBusinessData()
    } finally {
      this.loading.value = false
    }
  }

  private async loadSales() {
    const businessId = this.selectedBusinessId.value

    if (!businessId) {
      return
    }

    try {
      const provider = this.getProvider()

      this.sales.value = await provider.getSales(
        businessId,
        this.selectedPeriod.value,
      )
    } catch (error) {
      this.error.value = this.getErrorMessage(error)
    }
  }

  private clearBusinessData() {
    this.stats.value = []
    this.transactions.value = []
    this.topProducts.value = []
    this.lowStockProducts.value = []
    this.sales.value = {
      currency: 'USD',
      data: [],
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    return 'Unable to load dashboard data.'
  }
}

export default new DashboardComposable()
