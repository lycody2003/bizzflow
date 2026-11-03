
import indexedDatabase from '../database/indexed-db'

import type {
  ProductImage,
  ProductImageRepository,
} from '../../../repositories/contracts/product-image.repository'

class DemoProductImageRepository implements ProductImageRepository {
  async save(image: ProductImage): Promise<void> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction(
      ['products', 'product-images'],
      'readwrite',
    )

    // Attach a rejection handler immediately to avoid unhandled rejections.
    const transactionDone = transaction.done

    try {
      const product = await transaction
        .objectStore('products')
        .get(image.productId)

      if (!product || product.businessId !== image.businessId) {
        throw new Error(
          'Product not found or does not belong to this business.',
        )
      }

      await transaction
        .objectStore('product-images')
        .put(image)

      await transactionDone
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // Transaction may already be completed.
      }

      // Handle the rejected transaction promise.
      await transactionDone.catch(() => undefined)

      throw error
    }
  }

  async findByProductId(
    productId: string,
    businessId: string,
  ): Promise<ProductImage | null> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const image = await database.get(
      'product-images',
      productId,
    )

    if (!image || image.businessId !== businessId) {
      return null
    }

    return image
  }

  async delete(
    productId: string,
    businessId: string,
  ): Promise<void> {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction(
      'product-images',
      'readwrite',
    )

    const transactionDone = transaction.done

    try {
      const image = await transaction
        .objectStore('product-images')
        .get(productId)

      if (!image || image.businessId !== businessId) {
        await transactionDone
        return
      }

      await transaction
        .objectStore('product-images')
        .delete(productId)

      await transactionDone
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // Transaction may already be completed.
      }

      await transactionDone.catch(() => undefined)

      throw error
    }
  }
}

export default new DemoProductImageRepository()
