
import createBusinessRepository from '@repositories/api/business.repository'

import type {
  Business,
  BusinessLogoResponse,
  UpdateBusinessInput,
} from '@repositories/contracts/business.repository'

export default function useBusinessService() {
  const businessRepository = createBusinessRepository()

  const getMyBusiness = (): Promise<Business> => {
    return businessRepository.getMyBusiness()
  }

  const updateMyBusiness = (
    input: UpdateBusinessInput,
  ): Promise<Business> => {
    const name = input.name.trim()

    if (name.length < 2 || name.length > 150) {
      throw new Error('Business name must be between 2 and 150 characters.')
    }

    return businessRepository.updateMyBusiness({ name })
  }

  const uploadLogo = (file: File): Promise<BusinessLogoResponse> => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WebP images are allowed.')
    }

    if (file.size === 0) {
      throw new Error('Please select a valid image.')
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Logo must not exceed 2MB.')
    }

    return businessRepository.uploadLogo(file)
  }

  const removeLogo = (): Promise<BusinessLogoResponse> => {
    return businessRepository.removeLogo()
  }

  return {
    getMyBusiness,
    updateMyBusiness,
    uploadLogo,
    removeLogo,
  }
}
