import type {
  ProductVariant,
  ProductStatus,
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from '@app-types/product'

export interface ProductVariantRepository {
  findAll(
    productId: string,
    businessId: string,
    status?: ProductStatus,
  ): Promise<ProductVariant[]>

  findById(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant | null>

  create(
    productId: string,
    data: CreateProductVariantInput,
  ): Promise<ProductVariant>

  bulkCreate(
    productId: string,
    variants: CreateProductVariantInput[],
  ): Promise<ProductVariant[]>

  update(
    productId: string,
    variantId: string,
    businessId: string,
    data: UpdateProductVariantInput,
  ): Promise<ProductVariant>

  delete(
    productId: string,
    variantId: string,
    businessId: string,
  ): Promise<ProductVariant>
}
