
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import useAuthStore from '../../stores/auth.store'

const authStore = useAuthStore()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const userName = computed(() => {
  const user = authStore.user.value

  if (!user) return 'User'

  return `${user.firstName} ${user.lastName}`
})

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

const userEmail = computed(() => {
  return authStore.user.value?.email || ''
})

const closeMenu = (): void => {
  isOpen.value = false
}

const toggleMenu = (): void => {
  isOpen.value = !isOpen.value
}

const handleOutsideClick = (event: MouseEvent): void => {
  if (!menuRef.value?.contains(event.target as Node)) {
    closeMenu()
  }
}

const handleEscapeKey = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

const handleLogout = async (): Promise<void> => {
  if (authStore.isLoading.value) return

  closeMenu()

  await authStore.logout()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleEscapeKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<template>
  <div
    ref="menuRef"
    class="user-menu"
  >
    <button
      type="button"
      class="profile-button"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      aria-label="Open user menu"
      @click="toggleMenu"
    >
      <div class="profile-avatar">
        {{ userInitial }}
      </div>

      <div class="profile-info">
        <span class="profile-name">
          {{ userName }}
        </span>

        <span class="profile-role">
          Account
        </span>
      </div>

      <span class="profile-chevron">
        {{ isOpen ? '⌃' : '⌄' }}
      </span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="dropdown-menu"
      >
        <div class="dropdown-user">
          <div class="profile-avatar">
            {{ userInitial }}
          </div>

          <div class="dropdown-user-info">
            <strong>{{ userName }}</strong>
            <span>{{ userEmail }}</span>
          </div>
        </div>

        <div class="dropdown-divider" />

        <NuxtLink
          to="/settings"
          class="dropdown-item"
          @click="closeMenu"
        >
          <span class="dropdown-icon">⚙</span>
          Account Settings
        </NuxtLink>

        <div class="dropdown-divider" />

        <button
          type="button"
          class="dropdown-item logout-item"
          :disabled="authStore.isLoading.value"
          @click="handleLogout"
        >
          <span class="dropdown-icon">↪</span>

          {{ authStore.isLoading.value ? 'Signing out...' : 'Sign out' }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.user-menu {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f5f7fb;
  }
}

.profile-avatar {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #e8efff;
  color: #4169d8;
  font-size: 14px;
  font-weight: 700;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .profile-name {
    max-width: 150px;
    overflow: hidden;
    color: #273247;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-role {
    color: #929baa;
    font-size: 11px;
  }
}

.profile-chevron {
  color: #8993a3;
  font-size: 16px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  z-index: 100;
  width: 260px;
  padding: 8px;
  border: 1px solid #e9edf2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 35px rgb(15 23 42 / 12%);
}

.dropdown-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.dropdown-user-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;

  strong {
    overflow: hidden;
    color: #273247;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    overflow: hidden;
    color: #929baa;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dropdown-divider {
  height: 1px;
  margin: 6px 0;
  background: #edf0f4;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 10px;
  border: 0;
  border-radius: 7px;
  color: #475467;
  background: transparent;
  font-size: 13px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.dropdown-icon {
  width: 18px;
  text-align: center;
  font-size: 16px;
}

.logout-item {
  color: #dc3545;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 768px) {
  .profile-info,
  .profile-chevron {
    display: none;
  }
}
</style>
