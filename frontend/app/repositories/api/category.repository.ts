import type { ApiResponse } from '@app-types/auth'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@app-types/category'
import type {
  CategoryRepository,
} from '@repositories/contracts/category.repository'

interface BackendCategory {
  _id: string
  businessId: string
  name: string
  icon?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function mapCategory(data: BackendCategory): Category {
  return {
    id: data._id,
    businessId: String(data.businessId),
    name: data.name,
    icon: data.icon ?? null,
    isActive: data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export default function createCategoryApiRepository(): CategoryRepository {
  const { request } = useApi()

  async function findAll(
    businessId: string,
    status: 'all' | 'active' | 'inactive' = 'active',
  ): Promise<Category[]> {
    const response = await request<BackendCategory[]>('/categories', {
      method: 'GET',
      query: { status },
      requiresAuth: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to load categories.')
    }

    return response.data
      .map(mapCategory)
      .filter(category => category.businessId === businessId)
  }

  async function findById(
    id: string,
    businessId: string,
  ): Promise<Category | null> {
    const categories = await findAll(businessId)

    return categories.find(category => category.id === id) ?? null
  }

  async function create(data: CreateCategoryInput): Promise<Category> {
    const response = await request<BackendCategory>('/categories', {
      method: 'POST',
      body: data,
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to create category.')
    }

    return mapCategory(response.data)
  }

  async function update(
    id: string,
    businessId: string,
    data: UpdateCategoryInput,
  ): Promise<Category> {
    const response = await request<BackendCategory>(`/categories/${id}`, {
      method: 'PATCH',
      body: data,
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Unable to update category.')
    }

    const category = mapCategory(response.data)

    if (category.businessId !== businessId) {
      throw new Error('Category does not belong to the selected business.')
    }

    return category
  }

  async function remove(
    id: string,
    businessId: string,
  ): Promise<void> {
    const category = await findById(id, businessId)

    if (!category) {
      throw new Error('Category not found.')
    }

    const response = await request<BackendCategory>(`/categories/${id}`, {
      method: 'DELETE',
      requiresAuth: true,
      requiresCsrf: true,
    })

    if (!response.success) {
      throw new Error(response.message || 'Unable to deactivate category.')
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
