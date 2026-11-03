
import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest'

import indexedDatabase from '../../../app/providers/demo/database/indexed-db'

import demoProductImageRepository from '../../../app/providers/demo/repositories/product-image.repository'

import {
  ProductImageService,
} from '../../../app/services/products/product-image.service'

describe('Product Image Integration', () => {
  const productId = 'integration-product-1'
  const businessId = 'integration-business-1'
  const anotherBusinessId = 'another-business-1'

  const service = new ProductImageService(
    demoProductImageRepository,
  )

  function createPngFile(
    content = 'first image',
  ): File {
    const pngSignature = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47,
      0x0D, 0x0A, 0x1A, 0x0A,
    ])

    return new File(
      [
        pngSignature,
        new TextEncoder().encode(content),
      ],
      'product.png',
      {
        type: 'image/png',
      },
    )
  }

  beforeEach(async () => {
    await indexedDatabase.initialize()

    const database = await indexedDatabase.getDatabase()

    const transaction = database.transaction(
      ['products', 'product-images'],
      'readwrite',
    )

    await transaction.objectStore('product-images').clear()

    await transaction.objectStore('products').put({
      id: productId,
      businessId,
      name: 'Integration Test Product',
    } as never)

    await transaction.done
  })

  it('should upload and retrieve a product image', async () => {
    const file = createPngFile()

    await service.upload(productId, businessId, file)

    const image = await service.getImage(
      productId,
      businessId,
    )

    expect(image).not.toBeNull()
    expect(image?.productId).toBe(productId)
    expect(image?.businessId).toBe(businessId)
    expect(image?.mimeType).toBe('image/png')
    expect(image?.blob).toBeDefined()
    expect(image?.blob.size).toBe(file.size)
  })

  it('should retrieve the saved image again', async () => {
    await service.upload(
      productId,
      businessId,
      createPngFile(),
    )

    const firstResult = await service.getImage(
      productId,
      businessId,
    )

    const secondResult = await service.getImage(
      productId,
      businessId,
    )

    expect(firstResult).not.toBeNull()
    expect(secondResult).not.toBeNull()

    expect(secondResult?.blob.size).toBe(
      firstResult?.blob.size,
    )
  })

  it('should replace an existing product image', async () => {
    const firstFile = createPngFile('first image')

    const replacementFile = createPngFile(
      'replacement image',
    )

    await service.upload(
      productId,
      businessId,
      firstFile,
    )

    const firstImage = await service.getImage(
      productId,
      businessId,
    )

    await service.upload(
      productId,
      businessId,
      replacementFile,
    )

    const replacedImage = await service.getImage(
      productId,
      businessId,
    )

    expect(firstImage).not.toBeNull()
    expect(replacedImage).not.toBeNull()

    expect(replacedImage?.blob.size).toBe(
      replacementFile.size,
    )

    expect(replacedImage?.blob.size).not.toBe(
      firstImage?.blob.size,
    )
  })

  it('should remove an existing product image', async () => {
    await service.upload(
      productId,
      businessId,
      createPngFile(),
    )

    await service.delete(
      productId,
      businessId,
    )

    const image = await service.getImage(
      productId,
      businessId,
    )

    expect(image).toBeNull()
  })

  it('should not allow another business to retrieve the image', async () => {
    await service.upload(
      productId,
      businessId,
      createPngFile(),
    )

    const image = await service.getImage(
      productId,
      anotherBusinessId,
    )

    expect(image).toBeNull()
  })

  it('should reject uploading an image for a product owned by another business', async () => {
    await expect(
      service.upload(
        productId,
        anotherBusinessId,
        createPngFile(),
      ),
    ).rejects.toThrow(
      'Product not found or does not belong to this business.',
    )
  })
})
