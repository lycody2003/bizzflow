

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  BarcodeType,
} from '../../types/product'

import type {
  ProductRepository,
} from '../../repositories/contracts/product.repository'

export class ProductService {
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

    const common = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      category: data.category.trim(),
      unit: data.unit.trim(),
    }

    if (data.type === 'variant') {
      const definitions = data.attributeDefinitions.map(attribute => ({
        name: attribute.name.trim(),
        values: attribute.values.map(value => value.trim()),
      }))

      if (
        definitions.length === 0 ||
        definitions.some(attribute =>
          !attribute.name || attribute.values.length === 0 ||
          attribute.values.some(value => !value),
        )
      ) {
        throw new Error('Variant products require valid attribute definitions.')
      }

      return this.repository.create({
        ...common,
        type: 'variant',
        attributeDefinitions: definitions,
      })
    }

    const barcode = data.barcode?.trim() || null
    const barcodeType = barcode ? data.barcodeType ?? null : null

    this.validateBarcode(barcode, barcodeType)

    return this.repository.create({
      ...common,
      type: 'standard',
      sku: data.sku.trim().toUpperCase(),
      barcode,
      barcodeType,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      currency: data.currency,
      minimumStock: data.minimumStock,
    })
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

    // Variant Parent and Standard Product have different fields.
    if (existingProduct.type === 'variant') {
      const standardOnlyFields = [
        'sku',
        'barcode',
        'barcodeType',
        'costPrice',
        'sellingPrice',
        'minimumStock',
      ] as const

      for (const field of standardOnlyFields) {
        if (data[field] !== undefined) {
          throw new Error(
            `Cannot update ${field} on a variant parent product.`,
          )
        }
      }
    } else if (data.attributeDefinitions !== undefined) {
      throw new Error(
        'Attribute definitions can only be updated on variant products.',
      )
    }

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

      ...(data.category !== undefined
        ? { category: data.category.trim() }
        : {}),

      ...(data.unit !== undefined
        ? { unit: data.unit.trim() }
        : {}),

      ...(data.attributeDefinitions !== undefined
        ? {
            attributeDefinitions: this.normalizeAttributeDefinitions(
              data.attributeDefinitions,
            ),
          }
        : {}),
    }

    // Barcode validation only applies to Standard Products.
    if (existingProduct.type === 'standard') {
      const nextBarcode = data.barcode === undefined
        ? existingProduct.barcode
        : data.barcode?.trim() || null

      const nextBarcodeType = data.barcodeType === undefined
        ? existingProduct.barcodeType
        : data.barcodeType

      if (
        data.barcode !== undefined ||
        data.barcodeType !== undefined
      ) {
        normalizedData.barcode = nextBarcode
        normalizedData.barcodeType = nextBarcode
          ? nextBarcodeType
          : null
      }

      this.validateBarcode(
        nextBarcode,
        nextBarcode ? nextBarcodeType : null,
      )
    }

    return this.repository.update(
      id,
      businessId,
      normalizedData,
    )
  }

  private normalizeAttributeDefinitions(
    definitions: UpdateProductInput['attributeDefinitions'],
  ) {
    if (!definitions) {
      return undefined
    }

    if (definitions.length === 0 || definitions.length > 20) {
      throw new Error(
        'Variant products require between 1 and 20 attribute definitions.',
      )
    }

    const normalized = definitions.map(attribute => ({
      name: attribute.name.trim(),
      values: attribute.values.map(value => value.trim()),
    }))

    for (const attribute of normalized) {
      if (
        !attribute.name ||
        attribute.name.length > 50 ||
        attribute.values.length === 0 ||
        attribute.values.length > 100 ||
        attribute.values.some(
          value => !value || value.length > 100,
        )
      ) {
        throw new Error(
          'Invalid variant attribute definition.',
        )
      }
    }

    return normalized
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

    if ('category' in data && data.category !== undefined) {
      if (!data.category.trim()) {
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

