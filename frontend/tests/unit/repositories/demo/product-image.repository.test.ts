
import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest'

import indexedDatabase from '../../../../app/providers/demo/database/indexed-db'

import demoProductImageRepository from '../../../../app/providers/demo/repositories/product-image.repository'

import type {
  ProductImage,
} from '../../../../app/repositories/contracts/product-image.repository'

describe('DemoProductImageRepository', () => {
  const productId = 'test-product-1'
  const businessId = 'test-business-1'
  const otherBusinessId = 'other-business-1'

  function createImage(
    overrides: Partial<ProductImage> = {},
  ): ProductImage {
    return {
      productId,
      businessId,
      blob: new Blob(
        ['test image'],
        {
          type: 'image/png',
        },
      ),
      mimeType: 'image/png',
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  beforeEach(async () => {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction(
      ['products', 'product-images'],
      'readwrite',
    )

    await transaction
      .objectStore('product-images')
      .clear()

    await transaction
      .objectStore('products')
      .put({
        id: productId,
        businessId,
      } as never)

    await transaction.done
  })

  describe('save()', () => {
    it('should save an image for an existing product', async () => {
      const image = createImage()

      await demoProductImageRepository.save(image)

      const savedImage =
        await demoProductImageRepository.findByProductId(
          productId,
          businessId,
        )

      expect(savedImage).not.toBeNull()
      expect(savedImage?.productId).toBe(productId)
      expect(savedImage?.businessId).toBe(businessId)
      expect(savedImage?.mimeType).toBe('image/png')

      // fake-indexeddb may not preserve Blob instances exactly
      // like a real browser IndexedDB implementation.
      expect(savedImage?.blob).toBeDefined()
      expect(savedImage?.blob.type).toBe('image/png')
    })

    it('should reject saving an image for a non-existing product', async () => {
      const image = createImage({
        productId: 'missing-product',
      })

      await expect(
        demoProductImageRepository.save(image),
      ).rejects.toThrow(
        'Product not found or does not belong to this business.',
      )
    })

    it('should reject saving an image for another business', async () => {
      const image = createImage({
        businessId: otherBusinessId,
      })

      await expect(
        demoProductImageRepository.save(image),
      ).rejects.toThrow(
        'Product not found or does not belong to this business.',
      )
    })

    it('should replace an existing image for the same product', async () => {
      const firstImage = createImage({
        updatedAt: '2026-01-01T00:00:00.000Z',
        blob: new Blob(
          ['first image'],
          {
            type: 'image/png',
          },
        ),
      })

      const secondImage = createImage({
        updatedAt: '2026-02-01T00:00:00.000Z',
        blob: new Blob(
          ['second image'],
          {
            type: 'image/png',
          },
        ),
      })

      await demoProductImageRepository.save(firstImage)
      await demoProductImageRepository.save(secondImage)

      const savedImage =
        await demoProductImageRepository.findByProductId(
          productId,
          businessId,
        )

      expect(savedImage).not.toBeNull()
      expect(savedImage?.updatedAt).toBe(
        '2026-02-01T00:00:00.000Z',
      )
      expect(savedImage?.blob).toBeDefined()
    })
  })

  describe('findByProductId()', () => {
    it('should return an image belonging to the requested business', async () => {
      await demoProductImageRepository.save(
        createImage(),
      )

      const result =
        await demoProductImageRepository.findByProductId(
          productId,
          businessId,
        )

      expect(result).not.toBeNull()
      expect(result?.productId).toBe(productId)
      expect(result?.businessId).toBe(businessId)
    })

    it('should return null when the image does not exist', async () => {
      const result =
        await demoProductImageRepository.findByProductId(
          'missing-product',
          businessId,
        )

      expect(result).toBeNull()
    })

    it('should return null when the business ID does not match', async () => {
      await demoProductImageRepository.save(
        createImage(),
      )

      const result =
        await demoProductImageRepository.findByProductId(
          productId,
          otherBusinessId,
        )

      expect(result).toBeNull()
    })
  })

  describe('delete()', () => {
    it('should delete an image belonging to the requested business', async () => {
      await demoProductImageRepository.save(
        createImage(),
      )

      await demoProductImageRepository.delete(
        productId,
        businessId,
      )

      const result =
        await demoProductImageRepository.findByProductId(
          productId,
          businessId,
        )

      expect(result).toBeNull()
    })

    it('should not delete an image belonging to another business', async () => {
      await demoProductImageRepository.save(
        createImage(),
      )

      await demoProductImageRepository.delete(
        productId,
        otherBusinessId,
      )

      const result =
        await demoProductImageRepository.findByProductId(
          productId,
          businessId,
        )

      expect(result).not.toBeNull()
    })

    it('should not throw when deleting a non-existing image', async () => {
      await expect(
        demoProductImageRepository.delete(
          'missing-product',
          businessId,
        ),
      ).resolves.toBeUndefined()
    })
  })
})
