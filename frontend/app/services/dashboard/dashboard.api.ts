
import { $fetch } from 'ofetch'

import type {
  DashboardBusiness,
  DashboardStat,
  DashboardTransaction,
  DashboardTopProduct,
  DashboardLowStockProduct,
  SalesPeriod,
} from '../../types/dashboard'

import type {
  DashboardSalesResponse,
} from './dashboard.demo'

class DashboardApi {
  constructor(private readonly apiBase: string) {}

  async getBusinesses(): Promise<DashboardBusiness[]> {
    return $fetch<DashboardBusiness[]>('/businesses', {
      baseURL: this.apiBase,
    })
  }

  async getStats(businessId: string): Promise<DashboardStat[]> {
    return $fetch<DashboardStat[]>('/dashboard/stats', {
      baseURL: this.apiBase,
      query: { businessId },
    })
  }

  async getSales(
    businessId: string,
    period: SalesPeriod,
  ): Promise<DashboardSalesResponse> {
    return $fetch<DashboardSalesResponse>('/dashboard/sales', {
      baseURL: this.apiBase,
      query: {
        businessId,
        period,
      },
    })
  }

  async getTransactions(
    businessId: string,
  ): Promise<DashboardTransaction[]> {
    return $fetch<DashboardTransaction[]>('/dashboard/transactions', {
      baseURL: this.apiBase,
      query: { businessId },
    })
  }

  async getTopProducts(
    businessId: string,
  ): Promise<DashboardTopProduct[]> {
    return $fetch<DashboardTopProduct[]>('/dashboard/top-products', {
      baseURL: this.apiBase,
      query: { businessId },
    })
  }

  async getLowStockProducts(
    businessId: string,
  ): Promise<DashboardLowStockProduct[]> {
    return $fetch<DashboardLowStockProduct[]>('/dashboard/low-stock', {
      baseURL: this.apiBase,
      query: { businessId },
    })
  }
}

export default DashboardApi
