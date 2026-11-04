import type {
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
  PaginatedUnits,
  UnitListFilters,
} from '@app-types/unit'
import type {
  UnitRepository,
} from '@repositories/contracts/unit.repository'

interface BackendUnit {
  _id: string
  businessId: string
  name: string
  symbol: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BackendPaginatedUnits {
  items: BackendUnit[]
  pagination: PaginatedUnits['pagination']
}

function mapUnit(data: BackendUnit): Unit {
  return {
    id: data._id,
    businessId: String(data.businessId),
    name: data.name,
    symbol: data.symbol,
    isActive: data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export default function createUnitApiRepository(): UnitRepository {
  const { request } = useApi()

  async function findAll(
    businessId: string,
    filters: UnitListFilters = {},
  ): Promise<PaginatedUnits> {
    const response = await request<BackendPaginatedUnits>('/units', {
      method: 'GET',
      query: {
        status: filters.status ?? 'active',
        search: filters.search ?? '',
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      },
      requiresAuth: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to load units.')
    }

    const items = response.data.items.map(mapUnit)

    if (items.some(unit => unit.businessId !== businessId)) {
      throw new Error('Unit does not belong to the selected business.')
    }

    return {
      items,
      pagination: response.data.pagination,
    }
  }

  async function findById(
    id: string,
    businessId: string,
  ): Promise<Unit | null> {
    const result = await findAll(businessId, {
      status: 'all',
      page: 1,
      limit: 100,
    })

    return result.items.find(unit => unit.id === id) ?? null
  }

  async function create(data: CreateUnitInput): Promise<Unit> {
    const response = await request<BackendUnit>('/units', {
      method: 'POST',
      body: data,
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to create unit.')
    }

    return mapUnit(response.data)
  }

  async function update(
    id: string,
    businessId: string,
    data: UpdateUnitInput,
  ): Promise<Unit> {
    const response = await request<BackendUnit>(`/units/${id}`, {
      method: 'PATCH',
      body: data,
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update unit.')
    }

    const unit = mapUnit(response.data)

    if (unit.businessId !== businessId) {
      throw new Error('Unit does not belong to the selected business.')
    }

    return unit
  }

  async function remove(
    id: string,
    businessId: string,
  ): Promise<void> {
    const unit = await findById(id, businessId)

    if (!unit) {
      throw new Error('Unit not found.')
    }

    const response = await request<BackendUnit>(`/units/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success) {
      throw new Error(response.message || 'Unable to deactivate unit.')
    }
  }

  return {
    findAll,
    findById,
    create,
    update,
    delete: remove,
  }
}
