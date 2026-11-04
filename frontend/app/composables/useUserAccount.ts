import useUserAccountService from '@services/user/user-account.service'
import useAuthStore from '@stores/auth.store'

interface UpdateProfileInput {
  firstName: string
  lastName: string
}

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export default function useUserAccount() {
  const accountService = useUserAccountService()
  const authStore = useAuthStore()

  const updatingProfile = ref(false)
  const changingPassword = ref(false)

  async function updateProfile(input: UpdateProfileInput) {
    updatingProfile.value = true

    try {
      const response = await accountService.updateProfile(input)

      if (!response.data) {
        throw new Error(response.message || 'Unable to update profile')
      }

      if (authStore.user.value) {
        authStore.user.value = {
          ...authStore.user.value,
          ...response.data,
        }
      }

      return response.data
    } finally {
      updatingProfile.value = false
    }
  }

  async function changePassword(input: ChangePasswordInput) {
    changingPassword.value = true

    try {
      const response = await accountService.changePassword(input)

      if (!response.success) {
        throw new Error(response.message || 'Unable to change password')
      }

      return response
    } finally {
      changingPassword.value = false
    }
  }

  return {
    updatingProfile,
    changingPassword,
    updateProfile,
    changePassword,
  }
}