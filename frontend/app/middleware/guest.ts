import useAuthStore from '../stores/auth.store'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  await authStore.initialize()

  if (authStore.isAuthenticated.value) {
    return navigateTo('/')
  }
})