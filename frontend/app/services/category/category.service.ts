import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../types/category'

import type {
  CategoryRepository,
} from '../../repositories/contracts/category.repository'

export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository,
  ) {}

  async getCategories(
    businessId: string,
    status: 'all' | 'active' | 'inactive' = 'active',
  ): Promise<Category[]> {
    this.validateBusinessId(businessId)

    return this.repository.findAll(businessId, status)
  }

  async getCategory(
    id: string,
    businessId: string,
  ): Promise<Category | null> {
    this.validateBusinessId(businessId)
    this.validateId(id)

    return this.repository.findById(id, businessId)
  }

  async createCategory(
    data: CreateCategoryInput,
  ): Promise<Category> {
    this.validateCategoryName(data.name)

    const normalizedData: CreateCategoryInput = {
      name: data.name.trim(),
      icon: data.icon?.trim() || null,
    }

    return this.repository.create(normalizedData)
  }

  async updateCategory(
    id: string,
    businessId: string,
    data: UpdateCategoryInput,
  ): Promise<Category> {
    this.validateBusinessId(businessId)
    this.validateId(id)

    if (data.name !== undefined) {
      this.validateCategoryName(data.name)
    }

    const normalizedData: UpdateCategoryInput = {
      ...(data.name !== undefined
        ? { name: data.name.trim() }
        : {}),
      ...(data.icon !== undefined
        ? { icon: data.icon?.trim() || null }
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

  async deleteCategory(
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
      throw new Error('Category ID is required.')
    }
  }

  private validateCategoryName(name: string): void {
    const normalizedName = name?.trim()

    if (!normalizedName) {
      throw new Error('Category name is required.')
    }

    if (normalizedName.length < 2) {
      throw new Error(
        'Category name must be at least 2 characters.',
      )
    }

    if (normalizedName.length > 100) {
      throw new Error(
        'Category name cannot exceed 100 characters.',
      )
    }
  }
}
