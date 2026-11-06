<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import useAuthStore from '@stores/auth.store'

const authStore = useAuthStore()

const user = computed(() => authStore.user.value)

const fullName = computed(() => {
  if (!user.value) return 'Unknown User'

  return `${user.value.firstName} ${user.value.lastName}`
})

const route = useRoute()

const {
  isCollapsed,
  isMobileOpen,
  toggleSidebar,
  closeMobileSidebar,
} = useSidebar()

interface NavigationItem {
  label: string
  path: string
  icon: string
}

const mainNavigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'layout-dashboard' },
  { label: 'Products', path: '/products', icon: 'package' },
  { label: 'Categories', path: '/categories', icon: 'tags' },
  { label: 'Inventory', path: '/inventory', icon: 'warehouse' },
  { label: 'Sales', path: '/sales', icon: 'shopping-cart' },
  { label: 'Purchases', path: '/purchases', icon: 'shopping-bag' },
  { label: 'Customers', path: '/customers', icon: 'users' },
  { label: 'Reports', path: '/reports', icon: 'chart-no-axes-combined' },
]

const settingsChildren: NavigationItem[] = [
  { label: 'User Account', path: '/settings/users', icon: 'users' },
  { label: 'Business Account', path: '/settings/business', icon: 'building-2' },
  { label: 'Units Setup', path: '/settings/units', icon: 'ruler' },
  { label: 'Roles', path: '/settings/roles', icon: 'shield-check' },
  { label: 'Permissions', path: '/settings/permissions', icon: 'lock-keyhole' },
]

const isSettingsRoute = computed(() => route.path.startsWith('/settings'))

const isSettingsExpanded = ref(isSettingsRoute.value)

watch(isSettingsRoute, (active) => {
  if (active) {
    isSettingsExpanded.value = true
  }
})

const toggleSettings = () => {
  if (isCollapsed.value && !isMobileOpen.value) {
    return
  }

  isSettingsExpanded.value = !isSettingsExpanded.value
}

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}

const sidebarClasses = computed(() => ({
  'is-collapsed': isCollapsed.value,
  'is-mobile-open': isMobileOpen.value,
}))

const handleNavigation = () => {
  closeMobileSidebar()
}

const handleToggle = () => {
  if (window.innerWidth <= 768) {
    closeMobileSidebar()
    return
  }

  toggleSidebar()
}
</script>

<template>
  <aside class="app-sidebar" :class="sidebarClasses">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <NuxtLink to="/" class="brand" @click="handleNavigation">
        <img src="/bizzflow-icon.png" alt="BizzFlow Logo" class="brand-icon" />

        <span v-if="!isCollapsed || isMobileOpen" class="brand-name">
          BizzFlow
        </span>
      </NuxtLink>

      <button type="button" class="collapse-button" aria-label="Toggle sidebar" @click="handleToggle">
        {{ isCollapsed ? '→' : '←' }}
      </button>
    </div>

    <!-- Sidebar Content -->
    <div class="sidebar-content">
      <!-- Main Navigation -->
      <div class="navigation-section">
        <p v-if="!isCollapsed || isMobileOpen" class="section-label">
          WORKSPACE
        </p>

        <nav class="navigation-list">
          <NuxtLink v-for="item in mainNavigation" :key="item.path" :to="item.path" class="navigation-item"
            :class="{ active: isActive(item.path) }" :title="isCollapsed && !isMobileOpen ? item.label : undefined"
            :aria-label="item.label" @click="handleNavigation">
            <Icon :name="`lucide:${item.icon}`" class="navigation-icon" />
            <span v-if="!isCollapsed || isMobileOpen" class="navigation-label">
              {{ item.label }}
            </span>
          </NuxtLink>

          <button type="button" class="navigation-item settings-toggle" :class="{ active: isSettingsRoute }"
            :title="isCollapsed && !isMobileOpen ? 'Settings' : undefined" :aria-expanded="isSettingsExpanded"
            aria-controls="settings-submenu" @click="toggleSettings">
            <Icon name="lucide:settings" class="navigation-icon" />
            <span v-if="!isCollapsed || isMobileOpen" class="navigation-label">
              Settings
            </span>
            <Icon v-if="!isCollapsed || isMobileOpen"
              :name="isSettingsExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="submenu-chevron" />
          </button>

          <div v-if="isSettingsExpanded && (!isCollapsed || isMobileOpen)" id="settings-submenu"
            class="settings-submenu">
            <NuxtLink v-for="item in settingsChildren" :key="item.path" :to="item.path"
              class="navigation-item submenu-item" :class="{ active: isActive(item.path) }" @click="handleNavigation">
              <Icon :name="`lucide:${item.icon}`" class="navigation-icon" />
              <span class="navigation-label">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </nav>
      </div>

      <!-- Bottom Navigation and User Profile -->
      <div class="sidebar-bottom">
        <!-- User Profile -->
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">
            <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="User avatar" />

            <Icon v-else name="lucide:user-round" size="20" />
          </div>

          <div v-if="!isCollapsed || isMobileOpen" class="sidebar-user-info">
            <strong>{{ fullName }}</strong>
            <span>{{ user?.email || 'Account information unavailable' }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #dce5f5;
  background: #182951;
  transition: width 0.25s ease, transform 0.25s ease;
}

.app-sidebar.is-collapsed {
  width: 76px;

  .sidebar-header {
    padding: 0 14px;
  }

  .brand {
    justify-content: center;
  }

  .collapse-button {
    position: absolute;
    top: 50%;
    right: 5px;
    width: 24px;
    height: 24px;
    transform: translateY(-50%);
    opacity: 0;
  }

  .sidebar-header:hover .collapse-button,
  .collapse-button:focus-visible {
    opacity: 1;
  }

  .navigation-item {
    justify-content: center;
    padding: 0;
  }

  .sidebar-user {
    justify-content: center;
    padding-right: 0;
    padding-left: 0;
  }
}

.sidebar-header {
  position: relative;
  height: 76px;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid rgb(255 255 255 / 9%);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #fff;
  text-decoration: none;
}

.brand-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 10px;
}

.brand-name {
  font-size: 17px;
  font-weight: 750;
  white-space: nowrap;
}

.collapse-button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 6px;
  color: #c4d1e8;
  background: transparent;
  font-size: 17px;
  cursor: pointer;

  &:hover {
    color: #fff;
    background: rgb(255 255 255 / 10%);
  }
}

.settings-toggle {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.submenu-chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  flex-shrink: 0;
  color: #aebdd5;
}

.settings-submenu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 2px 0 6px 20px;
  padding-left: 8px;
  border-left: 1px solid rgb(255 255 255 / 18%);
}

.navigation-item.submenu-item {
  min-height: 38px;
  gap: 10px;
  padding: 0 10px;
  font-size: 12px;
}

.navigation-item.submenu-item .navigation-icon {
  width: 17px;
  height: 17px;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  overflow-y: auto;
  padding: 25px 10px 12px;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  margin: 0 10px 12px;
  color: #8fa2c4;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
}

.navigation-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.navigation-item {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 0 15px;
  border-radius: 8px;
  color: #d0daec;
  font-size: 13px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;

  &:hover {
    color: #fff;
    background: rgb(255 255 255 / 8%);
  }

  &.active {
    color: #fff;
    background: #354c85;
    font-weight: 600;
  }
}

.navigation-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: currentColor;
  stroke-width: 1.8;
}

.navigation-label {
  white-space: nowrap;
}

.bottom-section {
  padding-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 9%);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 14px 8px 6px;
  border-top: 1px solid rgb(255 255 255 / 9%);
}

.sidebar-user-avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: #354c85;
  color: #fff;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    box-shadow: 0 0 0 1px #d9e1ef;
    border: 2px solid #ffffff;
    background: #e8efff;
  }
}

.sidebar-user-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #fff;
    font-size: 12px;
  }

  span {
    color: #aebdd5;
    font-size: 10px;
  }
}

@media (max-width: 768px) {

  .app-sidebar,
  .app-sidebar.is-collapsed {
    width: 260px;
    transform: translateX(-100%);

    .sidebar-header {
      padding: 0 18px;
    }

    .brand {
      justify-content: flex-start;
    }

    .collapse-button {
      position: static;
      width: 28px;
      height: 28px;
      transform: none;
      opacity: 1;
    }

    .navigation-item {
      justify-content: flex-start;
      padding: 0 15px;
    }

    .sidebar-user {
      justify-content: flex-start;
      padding-right: 8px;
      padding-left: 8px;
    }
  }

  .app-sidebar.is-mobile-open,
  .app-sidebar.is-collapsed.is-mobile-open {
    transform: translateX(0);
  }
}
</style>
