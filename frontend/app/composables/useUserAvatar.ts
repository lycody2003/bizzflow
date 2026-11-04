
import useUserAvatarService from '@services/user/user-avatar.service'
import useAuthStore from '@stores/auth.store'

export default function useUserAvatar() {
  const avatarService = useUserAvatarService()
  const authStore = useAuthStore()

  const uploading = ref(false)
  const removing = ref(false)

  async function uploadAvatar(file: File) {
    uploading.value = true

    try {
      const result = await avatarService.uploadAvatar(file)

      if (authStore.user.value) {
        authStore.user.value = {
          ...authStore.user.value,
          avatarUrl: result.avatarUrl,
        }
      }

      return result
    } finally {
      uploading.value = false
    }
  }

  async function removeAvatar() {
    removing.value = true

    try {
      const result = await avatarService.removeAvatar()

      if (authStore.user.value) {
        authStore.user.value = {
          ...authStore.user.value,
          avatarUrl: null,
        }
      }

      return result
    } finally {
      removing.value = false
    }
  }

  return {
    uploading,
    removing,
    uploadAvatar,
    removeAvatar,
  }
}
