import createProductImageApiRepository from '../../repositories/api/product-image.repository'

import type {
  ProductImage,
  ProductImageRepository,
} from '../../repositories/contracts/product-image.repository'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number]

export class ProductImageService {
  constructor(
    private readonly repository: ProductImageRepository,
  ) {}

  async upload(
    productId: string,
    businessId: string,
    file: File,
  ): Promise<void> {
    this.validateId(productId, 'Product ID')
    this.validateId(businessId, 'Business ID')
    await this.validateImage(file)

    const image: ProductImage = {
      productId,
      businessId,
      blob: file,
      imageUrl: null,
      mimeType: file.type,
      updatedAt: new Date().toISOString(),
    }

    await this.repository.save(image)
  }

  async getImage(
    productId: string,
    businessId: string,
  ): Promise<ProductImage | null> {
    this.validateId(productId, 'Product ID')
    this.validateId(businessId, 'Business ID')

    return this.repository.findByProductId(productId, businessId)
  }

  async delete(
    productId: string,
    businessId: string,
  ): Promise<void> {
    this.validateId(productId, 'Product ID')
    this.validateId(businessId, 'Business ID')

    await this.repository.delete(productId, businessId)
  }

  private validateId(id: string, field: string): void {
    if (!id?.trim()) {
      throw new Error(`${field} is required.`)
    }
  }

  private async validateImage(file: File): Promise<void> {
    if (
      !file ||
      typeof file.size !== 'number' ||
      typeof file.slice !== 'function'
    ) {
      throw new Error('A valid image file is required.')
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
      throw new Error('Only JPG, PNG, and WebP images are allowed.')
    }

    if (file.size === 0) {
      throw new Error('Image file cannot be empty.')
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image size must not exceed 5 MB.')
    }

    await this.validateImageSignature(file)
  }

  private async validateImageSignature(file: File): Promise<void> {
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff

    const isPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a

    const isWebp =
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50

    const isValidSignature =
      (file.type === 'image/jpeg' && isJpeg) ||
      (file.type === 'image/png' && isPng) ||
      (file.type === 'image/webp' && isWebp)

    if (!isValidSignature) {
      throw new Error(
        'Invalid image content. Please upload a valid JPG, PNG, or WebP image.',
      )
    }
  }
}

export default function useProductImageService() {
  const repository = createProductImageApiRepository()
  return new ProductImageService(repository)
}
