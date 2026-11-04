import type {
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
  PaginatedUnits,
  UnitListFilters,
} from '../../types/unit'

import type {
  UnitRepository,
} from '../../repositories/contracts/unit.repository'

export class UnitService {
  constructor(
    private readonly repository: UnitRepository,
  ) {}

  async getUnits(
    businessId: string,
    filters: UnitListFilters = {},
  ): Promise<PaginatedUnits> {
    this.validateBusinessId(businessId)

    return this.repository.findAll(businessId, filters)
  }

  async getUnit(
    id: string,
    businessId: string,
  ): Promise<Unit | null> {
    this.validateBusinessId(businessId)
    this.validateId(id)

    return this.repository.findById(id, businessId)
  }

  async createUnit(
    data: CreateUnitInput,
  ): Promise<Unit> {
    this.validateUnitName(data.name)
    this.validateUnitSymbol(data.symbol)

    const normalizedData: CreateUnitInput = {
      name: data.name.trim(),
      symbol: data.symbol.trim(),
    }

    return this.repository.create(normalizedData)
  }

  async updateUnit(
    id: string,
    businessId: string,
    data: UpdateUnitInput,
  ): Promise<Unit> {
    this.validateBusinessId(businessId)
    this.validateId(id)

    if (data.name !== undefined) {
      this.validateUnitName(data.name)
    }

    if (data.symbol !== undefined) {
      this.validateUnitSymbol(data.symbol)
    }

    const normalizedData: UpdateUnitInput = {
      ...(data.name !== undefined
        ? { name: data.name.trim() }
        : {}),
      ...(data.symbol !== undefined
        ? { symbol: data.symbol.trim() }
        : {}),
      ...(data.isActive !== undefined
        ? { isActive: data.isActive }
        : {}),
    }

    return this.repository.update(
      id,
      businessId,
      normalizedData,
    )
  }

  async deleteUnit(
    id: string,
    businessId: string,
  ): Promise<void> {
    this.validateBusinessId(businessId)
    this.validateId(id)

    await this.repository.delete(id, businessId)
  }

  private validateBusinessId(businessId: string): void {
    if (!businessId?.trim()) {
      throw new Error('Business ID is required.')
    }
  }

  private validateId(id: string): void {
    if (!id?.trim()) {
      throw new Error('Unit ID is required.')
    }
  }

  private validateUnitName(name: string): void {
    const normalizedName = name?.trim()

    if (!normalizedName) {
      throw new Error('Unit name is required.')
    }

    if (normalizedName.length > 100) {
      throw new Error(
        'Unit name cannot exceed 100 characters.',
      )
    }
  }

  private validateUnitSymbol(symbol: string): void {
    const normalizedSymbol = symbol?.trim()

    if (!normalizedSymbol) {
      throw new Error('Unit symbol is required.')
    }

    if (normalizedSymbol.length > 20) {
      throw new Error(
        'Unit symbol cannot exceed 20 characters.',
      )
    }
  }
}
