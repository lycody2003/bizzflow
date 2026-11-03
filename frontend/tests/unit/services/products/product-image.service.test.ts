
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest'

import {
  ProductImageService,
} from '../../../../app/services/products/product-image.service'

import type {
  ProductImage,
  ProductImageRepository,
} from '../../../../app/repositories/contracts/product-image.repository'

describe('ProductImageService', () => {
  let repository: ProductImageRepository
  let service: ProductImageService

  const productId = 'product-1'
  const businessId = 'business-1'

  function createImage(
    overrides: Partial<ProductImage> = {},
  ): ProductImage {
    return {
      productId,
      businessId,
      blob: new Blob(['image data'], {
        type: 'image/png',
      }),
      mimeType: 'image/png',
      updatedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  function createValidPngFile(): File {
    const pngSignature = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47,
      0x0D, 0x0A, 0x1A, 0x0A,
    ])

    return new File(
      [pngSignature],
      'product.png',
      {
        type: 'image/png',
      },
    )
  }

  beforeEach(() => {
    repository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByProductId: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    service = new ProductImageService(repository)
  })

  describe('upload()', () => {
    it('should upload a valid PNG image', async () => {
      const file = createValidPngFile()

      await service.upload(
        productId,
        businessId,
        file,
      )

      expect(repository.save).toHaveBeenCalledOnce()

      const savedImage = vi.mocked(repository.save).mock.calls[0][0]

      expect(savedImage.productId).toBe(productId)
      expect(savedImage.businessId).toBe(businessId)
      expect(savedImage.mimeType).toBe('image/png')
      expect(savedImage.blob).toBeInstanceOf(Blob)
    })

    it('should reject unsupported MIME types', async () => {
      const file = new File(
        ['test'],
        'product.gif',
        {
          type: 'image/gif',
        },
      )

      await expect(
        service.upload(productId, businessId, file),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should reject an empty file', async () => {
      const file = new File(
        [],
        'empty.png',
        {
          type: 'image/png',
        },
      )

      await expect(
        service.upload(productId, businessId, file),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should reject files larger than 5MB', async () => {
      const file = new File(
        [new Uint8Array(5 * 1024 * 1024 + 1)],
        'large.png',
        {
          type: 'image/png',
        },
      )

      await expect(
        service.upload(productId, businessId, file),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should reject an invalid image signature', async () => {
      const file = new File(
        ['this is not a PNG image'],
        'invalid.png',
        {
          type: 'image/png',
        },
      )

      await expect(
        service.upload(productId, businessId, file),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should reject an empty product ID', async () => {
      await expect(
        service.upload('', businessId, createValidPngFile()),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })

    it('should reject an empty business ID', async () => {
      await expect(
        service.upload(productId, '', createValidPngFile()),
      ).rejects.toThrow()

      expect(repository.save).not.toHaveBeenCalled()
    })
  })

  describe('getImage()', () => {
    it('should return an existing product image', async () => {
      const image = createImage()

      vi.mocked(repository.findByProductId)
        .mockResolvedValue(image)

      const result = await service.getImage(
        productId,
        businessId,
      )

      expect(result).toBe(image)

      expect(repository.findByProductId).toHaveBeenCalledWith(
        productId,
        businessId,
      )
    })

    it('should return null when an image does not exist', async () => {
      vi.mocked(repository.findByProductId)
        .mockResolvedValue(null)

      const result = await service.getImage(
        productId,
        businessId,
      )

      expect(result).toBeNull()
    })

    it('should reject an empty product ID', async () => {
      await expect(
        service.getImage('', businessId),
      ).rejects.toThrow()

      expect(repository.findByProductId).not.toHaveBeenCalled()
    })

    it('should reject an empty business ID', async () => {
      await expect(
        service.getImage(productId, ''),
      ).rejects.toThrow()

      expect(repository.findByProductId).not.toHaveBeenCalled()
    })
  })

  describe('delete()', () => {
    it('should delete a product image', async () => {
      await service.delete(
        productId,
        businessId,
      )

      expect(repository.delete).toHaveBeenCalledOnce()

      expect(repository.delete).toHaveBeenCalledWith(
        productId,
        businessId,
      )
    })

    it('should reject an empty product ID', async () => {
      await expect(
        service.delete('', businessId),
      ).rejects.toThrow()

      expect(repository.delete).not.toHaveBeenCalled()
    })

    it('should reject an empty business ID', async () => {
      await expect(
        service.delete(productId, ''),
      ).rejects.toThrow()

      expect(repository.delete).not.toHaveBeenCalled()
    })
  })
})
