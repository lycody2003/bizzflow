export type ProductStatus = 'active' | 'inactive'
export type ProductType = 'standard' | 'variant'
export type BarcodeType = 'EAN13' | 'UPC' | 'EAN8' | 'CODE128' | 'QR'
export type ProductCurrency = 'USD' | 'KHR'

export interface ProductUnit {
  id: string
  name: string
  symbol: string
  isActive?: boolean
}

export interface ProductAttributeDefinition {
  name: string
  values: string[]
}

export interface ProductVariantAttribute {
  name: string
  value: string
}

export interface BaseProduct {
  id: string
  businessId: string
  name: string
  description: string
  category: string
  categoryName?: string
  type: ProductType
  unit: ProductUnit
  status: ProductStatus
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface StandardProduct extends BaseProduct {
  type: 'standard'
  sku: string
  barcode: string | null
  barcodeType: BarcodeType | null
  costPrice: number
  sellingPrice: number
  currency: ProductCurrency
  currentStock: number
  minimumStock: number
}

export interface VariantProduct extends BaseProduct {
  type: 'variant'
  sku: null
  barcode: null
  barcodeType: null
  costPrice: null
  sellingPrice: null
  currency: ProductCurrency
  currentStock: null
  minimumStock: null
  attributeDefinitions: ProductAttributeDefinition[]
}

export type Product = StandardProduct | VariantProduct

export interface BaseCreateProductInput {
  businessId: string
  name: string
  description?: string
  category: string
  unit: string
  imageUrl?: string | null
}

export interface CreateStandardProductInput extends BaseCreateProductInput {
  type: 'standard'
  sku: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  costPrice: number
  sellingPrice: number
  currency: ProductCurrency
  minimumStock: number
}

export interface CreateVariantProductInput extends BaseCreateProductInput {
  type: 'variant'
  attributeDefinitions: ProductAttributeDefinition[]
}

export type CreateProductInput =
  | CreateStandardProductInput
  | CreateVariantProductInput

export interface UpdateProductInput {
  name?: string
  sku?: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  description?: string
  category?: string
  unit?: string
  costPrice?: number
  sellingPrice?: number
  currency?: ProductCurrency
  minimumStock?: number
  status?: ProductStatus
  attributeDefinitions?: ProductAttributeDefinition[]
  imageUrl?: string | null
}

export interface ProductVariant {
  id: string
  productId: string
  businessId: string
  sku: string
  barcode: string | null
  barcodeType: BarcodeType | null
  attributes: ProductVariantAttribute[]
  costPrice: number
  sellingPrice: number
  currency: ProductCurrency
  stockQuantity: number
  minimumStock: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProductVariantInput {
  sku: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  attributes: ProductVariantAttribute[]
  costPrice: number
  sellingPrice: number
  currency?: ProductCurrency
  stockQuantity?: number
  minimumStock?: number
  status?: ProductStatus
}

export interface UpdateProductVariantInput {
  sku?: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  attributes?: ProductVariantAttribute[]
  costPrice?: number
  sellingPrice?: number
  currency?: ProductCurrency
  minimumStock?: number
  status?: ProductStatus
}
