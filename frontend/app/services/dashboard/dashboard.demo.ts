
import {
  dashboardBusinesses,
  dashboardStats,
  dashboardTransactions,
  dashboardTopProducts,
  dashboardLowStockProducts,
  salesChartData,
  salesChartCurrencies,
} from '../../data/dashboard.data'

import type {
  DashboardBusiness,
  DashboardStat,
  DashboardTransaction,
  DashboardTopProduct,
  DashboardLowStockProduct,
  DashboardCurrency,
  SalesPeriod,
  SalesChartData,
} from '../../types/dashboard'

export interface DashboardSalesResponse {
  currency: DashboardCurrency
  data: SalesChartData[]
}

class DashboardDemo {
  async getBusinesses(): Promise<DashboardBusiness[]> {
    return dashboardBusinesses
  }

  async getStats(businessId: string): Promise<DashboardStat[]> {
    return dashboardStats[businessId] ?? []
  }

  async getSales(
    businessId: string,
    period: SalesPeriod,
  ): Promise<DashboardSalesResponse> {
    return {
      currency: salesChartCurrencies[businessId] ?? 'USD',
      data: salesChartData[businessId]?.[period] ?? [],
    }
  }

  async getTransactions(
    businessId: string,
  ): Promise<DashboardTransaction[]> {
    return dashboardTransactions.filter(
      transaction => transaction.businessId === businessId,
    )
  }

  async getTopProducts(
    businessId: string,
  ): Promise<DashboardTopProduct[]> {
    return dashboardTopProducts.filter(
      product => product.businessId === businessId,
    )
  }

  async getLowStockProducts(
    businessId: string,
  ): Promise<DashboardLowStockProduct[]> {
    return dashboardLowStockProducts.filter(
      product => product.businessId === businessId,
    )
  }
}

export default new DashboardDemo()
