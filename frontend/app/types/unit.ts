export interface Unit {
  id: string
  businessId: string
  name: string
  symbol: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUnitInput {
  name: string
  symbol: string
}

export interface UpdateUnitInput {
  name?: string
  symbol?: string
  isActive?: boolean
}

export interface UnitPagination {
  currentPage: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface PaginatedUnits {
  items: Unit[]
  pagination: UnitPagination
}

export interface UnitListFilters {
  status?: 'all' | 'active' | 'inactive'
  search?: string
  page?: number
  limit?: number
}
