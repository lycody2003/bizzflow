
export type DashboardCurrency = "USD" | "KHR";

export interface DashboardBusiness {
  id: string;
  name: string;
  logoUrl: string | null;
  role: string;
}

export interface DashboardStat {
  id: string;
  title: string;
  value: number;
  valueType: "number" | "currency";
  currency?: DashboardCurrency;
  change: number;
  description: string;
  icon: string;
  variant: "blue" | "green" | "orange" | "purple";
}

export type SalesPeriod = "7days" | "30days" | "12months";

export interface SalesChartData {
  label: string;
  sales: number;
}

export type TransactionType = "Sale" | "Purchase" | "Expense" | "Refund";

export type FinancialDirection = "inflow" | "outflow";

export type TransactionStatus = "Completed" | "Pending" | "Cancelled";

export interface DashboardTransaction {
  id: string;
  businessId: string;
  reference: string;
  type: TransactionType;
  direction: FinancialDirection;
  contact: string;
  date: string;
  amount: number;
  currency: DashboardCurrency;
  status: TransactionStatus;
}

export interface DashboardTopProduct {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  currency: DashboardCurrency;
  color: string;
  initials: string;
}

export interface DashboardLowStockProduct {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
}

export interface DashboardSalesResponse {
  currency: DashboardCurrency;
  data: SalesChartData[];
}

export interface DashboardCurrencyValues {
  USD: number;
  KHR: number;
}

export interface DashboardOverview {
  totalProducts: number;
  activeProducts: number;
  totalVariants: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryCostValue: DashboardCurrencyValues;
  potentialSalesValue: DashboardCurrencyValues;
}
