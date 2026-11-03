
import indexedDatabase from '../database/indexed-db'

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../../../types/product'

import type {
  ProductRepository,
} from '../../../repositories/contracts/product.repository'

class DemoProductRepository implements ProductRepository {
  async findAll(businessId: string): Promise<Product[]> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    return database.getAllFromIndex(
      'products',
      'by-business-id',
      businessId,
    )
  }

  async findById(
    id: string,
    businessId: string,
  ): Promise<Product | null> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()
    const product = await database.get('products', id)

    if (!product || product.businessId !== businessId) {
      return null
    }

    return {
      ...product,
      name: product.name ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? null,
      barcodeType: product.barcodeType ?? null,
    }
  }

  async create(data: CreateProductInput): Promise<Product> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction('products', 'readwrite')
    const store = transaction.objectStore('products')

    const existingProducts = await store.index('by-business-id').getAll(
      data.businessId,
    )

    const duplicateSku = existingProducts.some(
      product =>
        product.sku &&
        product.sku.toLowerCase() === data.sku.toLowerCase(),
    )

    if (duplicateSku) {
      throw new Error('A product with this SKU already exists.')
    }

    const barcode = data.barcode?.trim() || null

    const duplicateBarcode = barcode
      ? existingProducts.some(
          product => product.barcode?.trim() === barcode,
        )
      : false

    if (duplicateBarcode) {
      throw new Error('A product with this barcode already exists.')
    }

    const now = new Date().toISOString()

    const product: Product = {
      ...data,
      id: crypto.randomUUID(),
      barcode,
      barcodeType: barcode ? data.barcodeType ?? null : null,
      description: data.description ?? '',
      currentStock: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }

    await store.add(product)
    await transaction.done

    return product
  }

  async update(
    id: string,
    businessId: string,
    data: UpdateProductInput,
  ): Promise<Product> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction('products', 'readwrite')
    const store = transaction.objectStore('products')

    const existingProduct = await store.get(id)

    if (!existingProduct || existingProduct.businessId !== businessId) {
      throw new Error('Product not found.')
    }

    const existingProducts = await store.index('by-business-id').getAll(
      businessId,
    )

    const nextSku = (
      data.sku ?? existingProduct.sku ?? ''
    ).trim().toUpperCase()

    const nextBarcode = data.barcode === undefined
      ? existingProduct.barcode ?? null
      : data.barcode?.trim() || null

    const duplicateSku = Boolean(nextSku) && existingProducts.some(
      product =>
        product.id !== id &&
        Boolean(product.sku) &&
        product.sku.toLowerCase() === nextSku.toLowerCase(),
    )

    if (duplicateSku) {
      throw new Error('A product with this SKU already exists.')
    }

    const duplicateBarcode = nextBarcode
      ? existingProducts.some(
          product =>
            product.id !== id &&
            product.barcode?.trim() === nextBarcode,
        )
      : false

    if (duplicateBarcode) {
      throw new Error('A product with this barcode already exists.')
    }

    const nextBarcodeType = nextBarcode
      ? data.barcodeType ?? existingProduct.barcodeType ?? null
      : null

    const updatedProduct: Product = {
      ...existingProduct,
      ...data,
      id: existingProduct.id,
      businessId: existingProduct.businessId,
      name: data.name ?? existingProduct.name ?? '',
      sku: nextSku,
      barcode: nextBarcode,
      barcodeType: nextBarcodeType,
      description: data.description ?? existingProduct.description ?? '',
      categoryId: data.categoryId ?? existingProduct.categoryId,
      type: data.type ?? existingProduct.type,
      unit: data.unit ?? existingProduct.unit,
      costPrice: data.costPrice ?? existingProduct.costPrice,
      sellingPrice: data.sellingPrice ?? existingProduct.sellingPrice,
      currency: data.currency ?? existingProduct.currency,
      currentStock: existingProduct.currentStock ?? 0,
      minimumStock: data.minimumStock ?? existingProduct.minimumStock,
      status: data.status ?? existingProduct.status,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await store.put(updatedProduct)
    await transaction.done

    return updatedProduct
  }

  async delete(id: string, businessId: string): Promise<void> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction('products', 'readwrite')
    const store = transaction.objectStore('products')

    const product = await store.get(id)

    if (!product || product.businessId !== businessId) {
      throw new Error('Product not found.')
    }

    await store.delete(id)
    await transaction.done
  }
}

export default new DemoProductRepository()
