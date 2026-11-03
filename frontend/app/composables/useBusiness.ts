
import useBusinessService from '@services/business/business.service'

import type { Business } from '@repositories/contracts/business.repository'

export default function useBusiness() {
  const businessService = useBusinessService()

  const business = useState<Business | null>(
    'business-profile',
    () => null,
  )

  const loading = ref(false)
  const saving = ref(false)
  const uploadingLogo = ref(false)
  const removingLogo = ref(false)

  async function loadBusiness() {
    loading.value = true

    try {
      business.value = await businessService.getMyBusiness()
      return business.value
    } finally {
      loading.value = false
    }
  }

  async function updateBusiness(name: string) {
    saving.value = true

    try {
      business.value = await businessService.updateMyBusiness({ name })
      return business.value
    } finally {
      saving.value = false
    }
  }

  async function uploadLogo(file: File) {
    uploadingLogo.value = true

    try {
      const result = await businessService.uploadLogo(file)

      if (business.value) {
        business.value = {
          ...business.value,
          logoUrl: result.logoUrl,
        }
      }

      return result
    } finally {
      uploadingLogo.value = false
    }
  }

  async function removeLogo() {
    removingLogo.value = true

    try {
      const result = await businessService.removeLogo()

      if (business.value) {
        business.value = {
          ...business.value,
          logoUrl: null,
        }
      }

      return result
    } finally {
      removingLogo.value = false
    }
  }

  return {
    business,
    loading,
    saving,
    uploadingLogo,
    removingLogo,
    loadBusiness,
    updateBusiness,
    uploadLogo,
    removeLogo,
  }
}
