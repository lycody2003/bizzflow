
import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

import type { Product } from '../../../types/product'
import type { ProductImage } from '../../../repositories/contracts/product-image.repository'

import { initialProducts } from '../../../data/demo/products.data'

interface DemoSetting {
  key: string
  value: boolean | string | number
}

interface BizzFlowDemoDB extends DBSchema {
  products: {
    key: string
    value: Product
    indexes: {
      'by-business-id': string
    }
  }

  settings: {
    key: string
    value: DemoSetting
  }

  'product-images': {
    key: string
    value: ProductImage
    indexes: {
      'by-business-id': string
    }
  }
}

class IndexedDatabase {
  private readonly databaseName = 'bizzflow-demo-db'
  private readonly databaseVersion = 2

  private databasePromise: Promise<
    IDBPDatabase<BizzFlowDemoDB>
  > | null = null

  async getDatabase(): Promise<IDBPDatabase<BizzFlowDemoDB>> {
    if (typeof indexedDB === 'undefined') {
      throw new Error(
        'IndexedDB is only available in the browser.',
      )
    }

    if (!this.databasePromise) {
      this.databasePromise = openDB<BizzFlowDemoDB>(
        this.databaseName,
        this.databaseVersion,
        {
          upgrade(database) {
            if (!database.objectStoreNames.contains('products')) {
              const productStore = database.createObjectStore(
                'products',
                {
                  keyPath: 'id',
                },
              )

              productStore.createIndex(
                'by-business-id',
                'businessId',
              )
            }

            if (!database.objectStoreNames.contains('settings')) {
              database.createObjectStore(
                'settings',
                {
                  keyPath: 'key',
                },
              )
            }

            if (!database.objectStoreNames.contains('product-images')) {
              const imageStore = database.createObjectStore(
                'product-images',
                {
                  keyPath: 'productId',
                },
              )

              imageStore.createIndex(
                'by-business-id',
                'businessId',
              )
            }
          },
        },
      ).catch((error: unknown) => {
        this.databasePromise = null
        throw error
      })
    }

    return this.databasePromise
  }

  async initialize(): Promise<void> {
    const database = await this.getDatabase()

    await this.seedInitialProducts(database)
    await this.migrateProductBarcodeType(database)
    await this.migrateExistingBarcodeTypes(database)
  }

  private async seedInitialProducts(
    database: IDBPDatabase<BizzFlowDemoDB>,
  ): Promise<void> {
    const seedKey = 'products-seeded-v1'

    const existingSeed = await database.get(
      'settings',
      seedKey,
    )

    if (existingSeed) return

    const transaction = database.transaction(
      ['products', 'settings'],
      'readwrite',
    )

    const productStore = transaction.objectStore('products')

    for (const product of initialProducts) {
      const existingProduct = await productStore.get(
        product.id,
      )

      if (!existingProduct) {
        await productStore.add(product)
      }
    }

    await transaction.objectStore('settings').put({
      key: seedKey,
      value: true,
    })

    await transaction.done
  }

  private async migrateProductBarcodeType(
    database: IDBPDatabase<BizzFlowDemoDB>,
  ): Promise<void> {
    const migrationKey = 'products-barcode-type-v2'

    const completedMigration = await database.get(
      'settings',
      migrationKey,
    )

    if (completedMigration) return

    const transaction = database.transaction(
      ['products', 'settings'],
      'readwrite',
    )

    const productStore = transaction.objectStore('products')

    const products = await productStore.getAll()

    for (const product of products) {
      if (product.barcodeType === undefined) {
        await productStore.put({
          ...product,
          barcodeType: null,
        })
      }
    }

    await transaction.objectStore('settings').put({
      key: migrationKey,
      value: true,
    })

    await transaction.done
  }

  private async migrateExistingBarcodeTypes(
    database: IDBPDatabase<BizzFlowDemoDB>,
  ): Promise<void> {
    const migrationKey = 'products-barcode-type-v3'

    const completedMigration = await database.get(
      'settings',
      migrationKey,
    )

    if (completedMigration) return

    const transaction = database.transaction(
      ['products', 'settings'],
      'readwrite',
    )

    const productStore = transaction.objectStore('products')

    const products = await productStore.getAll()

    for (const product of products) {
      if (product.barcode && !product.barcodeType) {
        await productStore.put({
          ...product,
          barcodeType: 'CODE128',
        })
      }
    }

    await transaction.objectStore('settings').put({
      key: migrationKey,
      value: true,
    })

    await transaction.done
  }
}

export default new IndexedDatabase()
