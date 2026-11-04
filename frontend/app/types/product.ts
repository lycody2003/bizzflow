
export type ProductStatus = 'active' | 'inactive'

export type ProductType = 'standard' | 'variant'

export type BarcodeType =
  | 'EAN13'
  | 'UPC'
  | 'EAN8'
  | 'CODE128'
  | 'QR'

export type ProductCurrency = 'USD' | 'KHR'

export interface ProductUnit {
  id: string
  name: string
  symbol: string
  isActive?: boolean
}

export interface Product {
  id: string
  businessId: string
  name: string
  sku: string
  barcode: string | null
  barcodeType: BarcodeType | null
  description: string
  category: string
  categoryName?: string
  type: ProductType
  unit: ProductUnit
  costPrice: number
  sellingPrice: number
  currency: ProductCurrency
  currentStock: number
  minimumStock: number
  status: ProductStatus

  // Product image
  imageUrl?: string | null

  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  businessId: string
  name: string
  sku: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  description?: string
  category: string
  type: ProductType
  unit: string
  costPrice: number
  sellingPrice: number
  currency: ProductCurrency
  minimumStock: number

  // Optional product image
  imageUrl?: string | null
}

export interface UpdateProductInput {
  name?: string
  sku?: string
  barcode?: string | null
  barcodeType?: BarcodeType | null
  description?: string
  category?: string
  type?: ProductType
  unit?: string
  costPrice?: number
  sellingPrice?: number
  currency?: ProductCurrency
  minimumStock?: number
  status?: ProductStatus

  // Optional product image
  imageUrl?: string | null
}
