
export interface ProductImage {
  productId: string
  businessId: string
  blob: Blob
  mimeType: string
  updatedAt: string
}

export interface ProductImageRepository {
  save(image: ProductImage): Promise<void>

  findByProductId(
    productId: string,
    businessId: string,
  ): Promise<ProductImage | null>

  delete(
    productId: string,
    businessId: string,
  ): Promise<void>
}
