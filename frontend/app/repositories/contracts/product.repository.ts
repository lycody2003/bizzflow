
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../../types/product'

export interface ProductRepository {
  findAll(businessId: string): Promise<Product[]>

  findById(
    id: string,
    businessId: string,
  ): Promise<Product | null>

  create(data: CreateProductInput): Promise<Product>

  update(
    id: string,
    businessId: string,
    data: UpdateProductInput,
  ): Promise<Product>

  delete(id: string, businessId: string): Promise<void>
}
