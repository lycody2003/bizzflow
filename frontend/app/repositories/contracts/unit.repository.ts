import type {
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
  PaginatedUnits,
  UnitListFilters,
} from '@app-types/unit'

export interface UnitRepository {
  findAll(
    businessId: string,
    filters?: UnitListFilters,
  ): Promise<PaginatedUnits>

  findById(
    id: string,
    businessId: string,
  ): Promise<Unit | null>

  create(data: CreateUnitInput): Promise<Unit>

  update(
    id: string,
    businessId: string,
    data: UpdateUnitInput,
  ): Promise<Unit>

  delete(id: string, businessId: string): Promise<void>
}
