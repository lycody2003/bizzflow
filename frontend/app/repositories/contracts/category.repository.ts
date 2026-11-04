import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../types/category'

export interface CategoryRepository {
  findAll(
    businessId: string,
    status?: 'all' | 'active' | 'inactive',
  ): Promise<Category[]>

  findById(
    id: string,
    businessId: string,
  ): Promise<Category | null>

  create(data: CreateCategoryInput): Promise<Category>

  update(
    id: string,
    businessId: string,
    data: UpdateCategoryInput,
  ): Promise<Category>

  delete(id: string, businessId: string): Promise<void>
}
