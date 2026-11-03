
import demoProductRepository from '../../providers/demo/repositories/product.repository'

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  BarcodeType,
} from '../../types/product'

import type {
  ProductRepository,
} from '../../repositories/contracts/product.repository'

class ProductService {
  constructor(
    private readonly repository: ProductRepository,
  ) {}

  async getProducts(businessId: string): Promise<Product[]> {
    this.validateBusinessId(businessId)

    return this.repository.findAll(businessId)
  }

  async getProduct(
    id: string,
    businessId: string,
  ): Promise<Product | null> {
    this.validateBusinessId(businessId)
    this.validateId(id, 'Product ID')

    return this.repository.findById(id, businessId)
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    this.validateBusinessId(data.businessId)
    this.validateProductData(data)

    const barcode = data.barcode?.trim() || null
    const barcodeType = barcode ? data.barcodeType ?? null : null

    this.validateBarcode(barcode, barcodeType)

    const normalizedData: CreateProductInput = {
      ...data,
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      barcode,
      barcodeType,
      description: data.description?.trim() ?? '',
      categoryId: data.categoryId.trim(),
      unit: data.unit.trim(),
    }

    return this.repository.create(normalizedData)
  }

  async updateProduct(
    id: string,
    businessId: string,
    data: UpdateProductInput,
  ): Promise<Product> {
    this.validateBusinessId(businessId)
    this.validateId(id, 'Product ID')
    this.validateProductData(data)

    const existingProduct = await this.repository.findById(
      id,
      businessId,
    )

    if (!existingProduct) {
      throw new Error('Product not found.')
    }

    const nextBarcode = data.barcode === undefined
      ? existingProduct.barcode
      : data.barcode?.trim() || null

    const nextBarcodeType = data.barcodeType === undefined
      ? existingProduct.barcodeType
      : data.barcodeType

    const normalizedData: UpdateProductInput = {
      ...data,

      ...(data.name !== undefined
        ? { name: data.name.trim() }
        : {}),

      ...(data.sku !== undefined
        ? { sku: data.sku.trim().toUpperCase() }
        : {}),

      ...(data.description !== undefined
        ? { description: data.description.trim() }
        : {}),

      ...(data.categoryId !== undefined
        ? { categoryId: data.categoryId.trim() }
        : {}),

      ...(data.unit !== undefined
        ? { unit: data.unit.trim() }
        : {}),

      ...(data.barcode !== undefined || data.barcodeType !== undefined
        ? {
            barcode: nextBarcode,
            barcodeType: nextBarcode ? nextBarcodeType : null,
          }
        : {}),
    }

    this.validateBarcode(
      nextBarcode,
      nextBarcode ? nextBarcodeType : null,
    )

    return this.repository.update(
      id,
      businessId,
      normalizedData,
    )
  }

  async deleteProduct(
    id: string,
    businessId: string,
  ): Promise<void> {
    this.validateBusinessId(businessId)
    this.validateId(id, 'Product ID')

    await this.repository.delete(id, businessId)
  }

  private validateBusinessId(businessId: string): void {
    if (!businessId?.trim()) {
      throw new Error('Business ID is required.')
    }
  }

  private validateId(id: string, field: string): void {
    if (!id?.trim()) {
      throw new Error(`${field} is required.`)
    }
  }

  private validateBarcode(
    barcode: string | null,
    barcodeType: BarcodeType | null,
  ): void {
    if (barcode && !barcodeType) {
      throw new Error(
        'Barcode type is required when a barcode is provided.',
      )
    }

    if (!barcode && barcodeType) {
      throw new Error(
        'Barcode type must be empty when barcode is empty.',
      )
    }
  }

  private validateProductData(
    data: CreateProductInput | UpdateProductInput,
  ): void {
    if ('name' in data && data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Product name is required.')
      }
    }

    if ('sku' in data && data.sku !== undefined) {
      if (!data.sku.trim()) {
        throw new Error('Product SKU is required.')
      }
    }

    if ('categoryId' in data && data.categoryId !== undefined) {
      if (!data.categoryId.trim()) {
        throw new Error('Product category is required.')
      }
    }

    if ('unit' in data && data.unit !== undefined) {
      if (!data.unit.trim()) {
        throw new Error('Product unit is required.')
      }
    }

    if ('costPrice' in data && data.costPrice !== undefined) {
      if (!Number.isFinite(data.costPrice) || data.costPrice < 0) {
        throw new Error(
          'Cost price must be a valid non-negative number.',
        )
      }
    }

    if ('sellingPrice' in data && data.sellingPrice !== undefined) {
      if (!Number.isFinite(data.sellingPrice) || data.sellingPrice < 0) {
        throw new Error(
          'Selling price must be a valid non-negative number.',
        )
      }
    }

    if ('minimumStock' in data && data.minimumStock !== undefined) {
      if (!Number.isFinite(data.minimumStock) || data.minimumStock < 0) {
        throw new Error(
          'Minimum stock must be a valid non-negative number.',
        )
      }
    }
  }
}

export default new ProductService(demoProductRepository)
