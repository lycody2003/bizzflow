import type { ApiResponse } from '@app-types/auth'
import type {
  InventoryBalance,
  InventoryFilters,
  PaginatedInventory,
  StockMovement,
  StockMovementFilters,
  CreateStockAdjustmentInput,
  InventoryProductSummary,
  InventoryVariantSummary,
  InventoryUserSummary,
} from '@app-types/inventory'
import type { InventoryRepository } from '@repositories/contracts/inventory.repository'

interface BackendInventoryBalance {
  _id: string
  businessId: string
  productId: string | InventoryProductSummary
  variantId?: string | InventoryVariantSummary | null
  quantityOnHand: number
  createdAt: string
  updatedAt: string
}

interface BackendStockMovement {
  _id: string
  businessId: string
  productId: string | InventoryProductSummary
  variantId?: string | InventoryVariantSummary | null
  type: StockMovement['type']
  quantity: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  performedBy: string | InventoryUserSummary
  idempotencyKey?: string
  createdAt: string
}

function mapReference<T extends { _id: string }>(
  value: string | T | null | undefined,
): { id: string; data: T | null } {
  if (!value) {
    return { id: '', data: null }
  }

  if (typeof value === 'string') {
    return { id: value, data: null }
  }

  return {
    id: value._id,
    data: value,
  }
}

function mapBalance(data: BackendInventoryBalance): InventoryBalance {
  const product = mapReference<InventoryProductSummary>(
    data.productId,
  )

  const variant = mapReference<InventoryVariantSummary>(
    data.variantId,
  )

  return {
    id: data._id,
    businessId: String(data.businessId),
    productId: product.id,
    product: product.data,
    variantId: variant.id || null,
    variant: variant.data,
    quantityOnHand: data.quantityOnHand,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function mapMovement(data: BackendStockMovement): StockMovement {
  const product = mapReference<InventoryProductSummary>(
    data.productId,
  )

  const variant = mapReference<InventoryVariantSummary>(
    data.variantId,
  )

  const performedBy = mapReference<InventoryUserSummary>(
    data.performedBy,
  )

  return {
    id: data._id,
    businessId: String(data.businessId),
    productId: product.id,
    product: product.data,
    variantId: variant.id || null,
    variant: variant.data,
    type: data.type,
    quantity: data.quantity,
    quantityBefore: data.quantityBefore,
    quantityAfter: data.quantityAfter,
    reason: data.reason,
    performedBy: performedBy.data,
    idempotencyKey: data.idempotencyKey,
    createdAt: data.createdAt,
  }
}

function mapPagination<T, U>(
  data: PaginatedInventory<T>,
  mapper: (item: T) => U,
): PaginatedInventory<U> {
  return {
    items: data.items.map(mapper),
    pagination: data.pagination,
  }
}

function buildQuery(
  filters: InventoryFilters | StockMovementFilters,
) {
  return {
    productId: filters.productId,
    variantId: filters.variantId,
    page: filters.page,
    limit: filters.limit,
    ...('type' in filters ? { type: filters.type } : {}),
  }
}

export default function createInventoryApiRepository(): InventoryRepository {
  const { request } = useApi()

  async function findAll(
    filters: InventoryFilters = {},
  ): Promise<PaginatedInventory<InventoryBalance>> {
    const response = await request<PaginatedInventory<BackendInventoryBalance>>(
      '/inventory/',
      {
        method: 'GET',
        query: buildQuery(filters),
        requiresAuth: true,
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to load inventory.')
    }

    return mapPagination(response.data, mapBalance)
  }

  async function adjust(
    data: CreateStockAdjustmentInput,
  ): Promise<StockMovement> {
    const response = await request<BackendStockMovement>(
      '/inventory/adjustments',
      {
        method: 'POST',
        body: data,
        requiresAuth: true,
        requiresCsrf: true,
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to adjust stock.')
    }

    return mapMovement(response.data)
  }

  async function findMovements(
    filters: StockMovementFilters = {},
  ): Promise<PaginatedInventory<StockMovement>> {
    const response = await request<PaginatedInventory<BackendStockMovement>>(
      '/inventory/movements',
      {
        method: 'GET',
        query: buildQuery(filters),
        requiresAuth: true,
      },
    )

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to load stock movements.')
    }

    return mapPagination(response.data, mapMovement)
  }

  return {
    findAll,
    adjust,
    findMovements,
  }
}
