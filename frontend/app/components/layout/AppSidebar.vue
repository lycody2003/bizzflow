<script setup lang="ts">
import { computed } from 'vue'

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
  { label: 'Dashboard', path: '/', icon: 'D' },
  { label: 'Products', path: '/products', icon: 'P' },
  { label: 'Inventory', path: '/inventory', icon: 'I' },
  { label: 'Sales', path: '/sales', icon: 'S' },
  { label: 'Purchases', path: '/purchases', icon: 'P' },
  { label: 'Customers', path: '/customers', icon: 'C' },
  { label: 'Reports', path: '/reports', icon: 'R' },
]

const bottomNavigation: NavigationItem[] = [
  { label: 'Settings', path: '/settings', icon: 'S' },
]

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
    <div class="sidebar-header">
      <NuxtLink to="/" class="brand" @click="handleNavigation">
        <span class="brand-icon">B</span>

        <span v-if="!isCollapsed || isMobileOpen" class="brand-name">
          BizzFlow
        </span>
      </NuxtLink>

      <button type="button" class="collapse-button" aria-label="Toggle sidebar" @click="handleToggle">
        {{ isCollapsed ? '→' : '←' }}
      </button>
    </div>

    <div class="sidebar-content">
      <div class="navigation-section">
        <p v-if="!isCollapsed || isMobileOpen" class="section-label">
          WORKSPACE
        </p>

        <nav class="navigation-list">
          <NuxtLink v-for="item in mainNavigation" :key="item.path" :to="item.path" class="navigation-item"
            :class="{ active: isActive(item.path) }" :title="isCollapsed && !isMobileOpen ? item.label : undefined"
            @click="handleNavigation">
            <span class="navigation-icon">{{ item.icon }}</span>

            <span v-if="!isCollapsed || isMobileOpen" class="navigation-label">
              {{ item.label }}
            </span>
          </NuxtLink>
        </nav>
      </div>

      <div class="navigation-section bottom-section">
        <nav class="navigation-list">
          <NuxtLink v-for="item in bottomNavigation" :key="item.path" :to="item.path" class="navigation-item"
            :class="{ active: isActive(item.path) }" :title="isCollapsed && !isMobileOpen ? item.label : undefined"
            @click="handleNavigation">
            <span class="navigation-icon">{{ item.icon }}</span>

            <span v-if="!isCollapsed || isMobileOpen" class="navigation-label">
              {{ item.label }}
            </span>
          </NuxtLink>
        </nav>
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
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  color: #fff;
  background: #6578f5;
  font-size: 19px;
  font-weight: 800;
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

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  padding: 25px 10px 12px;
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
  min-height: 39px;
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
  width: 14px;
  flex-shrink: 0;
  text-align: center;
  font-size: 12px;
  font-weight: 750;
}

.navigation-label {
  white-space: nowrap;
}

.bottom-section {
  padding-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 9%);
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
  }

  .app-sidebar.is-mobile-open,
  .app-sidebar.is-collapsed.is-mobile-open {
    transform: translateX(0);
  }
}
</style>
