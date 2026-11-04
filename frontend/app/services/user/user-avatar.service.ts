
interface UserAvatarResponse {
  avatarUrl: string | null
}

export default function useUserAvatarService() {
  const { request } = useApi()

  const uploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await request<UserAvatarResponse>(
      '/users/me/avatar',
      {
        method: 'PUT',
        body: formData,
        requiresAuth: true,
        requiresCsrf: true,
      },
    )

    if (!response.data) {
      throw new Error(response.message || 'Avatar upload failed')
    }

    return response.data
  }

  const removeAvatar = async () => {
    const response = await request<UserAvatarResponse>(
      '/users/me/avatar',
      {
        method: 'DELETE',
        requiresAuth: true,
        requiresCsrf: true,
      },
    )

    if (!response.data) {
      throw new Error(response.message || 'Avatar removal failed')
    }

    return response.data
  }

  return {
    uploadAvatar,
    removeAvatar,
  }
}
