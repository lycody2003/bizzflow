import type {
  InventoryBalance,
  InventoryFilters,
  PaginatedInventory,
  StockMovement,
  StockMovementFilters,
  CreateStockAdjustmentInput,
} from '@app-types/inventory'

import type {
  InventoryRepository,
} from '@repositories/contracts/inventory.repository'

export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
  ) {}

  async getInventory(
    businessId: string,
    filters: InventoryFilters = {},
  ): Promise<PaginatedInventory<InventoryBalance>> {
    this.validateBusinessId(businessId)
    this.validateFilters(filters)

    return this.repository.findAll(filters)
  }

  async adjustStock(
    businessId: string,
    data: CreateStockAdjustmentInput,
  ): Promise<StockMovement> {
    this.validateBusinessId(businessId)
    this.validateAdjustment(data)

    return this.repository.adjust(data)
  }

  async getMovements(
    businessId: string,
    filters: StockMovementFilters = {},
  ): Promise<PaginatedInventory<StockMovement>> {
    this.validateBusinessId(businessId)
    this.validateFilters(filters)

    return this.repository.findMovements(filters)
  }

  private validateBusinessId(businessId: string): void {
    if (!businessId?.trim()) {
      throw new Error('Business ID is required.')
    }
  }

  private validateFilters(
    filters: InventoryFilters | StockMovementFilters,
  ): void {
    if (filters.productId !== undefined) {
      this.validateId(filters.productId, 'Product ID')
    }

    if (filters.variantId !== undefined) {
      this.validateId(filters.variantId, 'Variant ID')
    }

    if (
      filters.page !== undefined &&
      (!Number.isInteger(filters.page) || filters.page < 1)
    ) {
      throw new Error('Page must be a positive integer.')
    }

    if (
      filters.limit !== undefined &&
      (!Number.isInteger(filters.limit) ||
        filters.limit < 1 ||
        filters.limit > 100)
    ) {
      throw new Error('Limit must be between 1 and 100.')
    }

    if (
      'type' in filters &&
      filters.type !== undefined &&
      !['opening', 'adjustment_in', 'adjustment_out'].includes(filters.type)
    ) {
      throw new Error('Invalid stock movement type.')
    }
  }

  private validateAdjustment(
    data: CreateStockAdjustmentInput,
  ): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Stock adjustment data is required.')
    }

    this.validateId(data.productId, 'Product ID')

    if (data.variantId !== undefined) {
      this.validateId(data.variantId, 'Variant ID')
    }

    if (
      data.type !== 'adjustment_in' &&
      data.type !== 'adjustment_out'
    ) {
      throw new Error('Invalid stock adjustment type.')
    }

    if (!Number.isInteger(data.quantity) || data.quantity < 1) {
      throw new Error('Adjustment quantity must be a positive integer.')
    }

    if (!data.reason?.trim() || data.reason.trim().length > 500) {
      throw new Error('Reason is required and must not exceed 500 characters.')
    }

    if (
      !data.idempotencyKey?.trim() ||
      data.idempotencyKey.trim().length < 8 ||
      data.idempotencyKey.trim().length > 128
    ) {
      throw new Error('Invalid idempotency key.')
    }

    data.reason = data.reason.trim()
    data.idempotencyKey = data.idempotencyKey.trim()
  }

  private validateId(id: string, field: string): void {
    if (!id?.trim()) {
      throw new Error(`${field} is required.`)
    }
  }
}
