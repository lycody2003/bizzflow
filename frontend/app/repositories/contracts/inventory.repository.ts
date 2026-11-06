import type {
  InventoryBalance,
  InventoryFilters,
  PaginatedInventory,
  StockMovement,
  StockMovementFilters,
  CreateStockAdjustmentInput,
} from '@app-types/inventory'

export interface InventoryRepository {
  findAll(
    filters?: InventoryFilters,
  ): Promise<PaginatedInventory<InventoryBalance>>

  adjust(
    data: CreateStockAdjustmentInput,
  ): Promise<StockMovement>

  findMovements(
    filters?: StockMovementFilters,
  ): Promise<PaginatedInventory<StockMovement>>
}
