export type StockAdjustmentType = 'adjustment_in' | 'adjustment_out'

export type StockMovementType =
  | 'opening'
  | 'adjustment_in'
  | 'adjustment_out'

export interface InventoryProductSummary {
  _id: string
  name: string
  sku?: string | null
  type?: 'standard' | 'variant'
  currency?: 'USD' | 'KHR'
  minimumStock?: number
}

export interface InventoryVariantSummary {
  _id: string
  sku: string
  attributes?: {
    name: string
    value: string
  }[]
  currency?: 'USD' | 'KHR'
  minimumStock?: number
}

export interface InventoryUserSummary {
  _id: string
  firstName?: string
  lastName?: string
  email?: string
}

export interface InventoryBalance {
  id: string
  businessId: string
  productId: string
  product: InventoryProductSummary | null
  variantId: string | null
  variant: InventoryVariantSummary | null
  quantityOnHand: number
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  businessId: string
  productId: string
  product: InventoryProductSummary | null
  variantId: string | null
  variant: InventoryVariantSummary | null
  type: StockMovementType
  quantity: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  performedBy: InventoryUserSummary | null
  idempotencyKey?: string
  createdAt: string
}

export interface InventoryPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedInventory<T> {
  items: T[]
  pagination: InventoryPagination
}

export interface InventoryFilters {
  productId?: string
  variantId?: string
  page?: number
  limit?: number
}

export interface StockMovementFilters extends InventoryFilters {
  type?: StockMovementType
}

export interface CreateStockAdjustmentInput {
  productId: string
  variantId?: string
  type: StockAdjustmentType
  quantity: number
  reason: string
  idempotencyKey: string
}
