
<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

const {
  toggleSidebar,
  toggleMobileSidebar,
} = useSidebar()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/inventory': 'Inventory',
    '/sales': 'Sales',
    '/purchases': 'Purchases',
    '/customers': 'Customers',
    '/reports': 'Reports',
    '/settings': 'Settings',
  }

  return titles[route.path] || 'BizzFlow'
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button
        type="button"
        class="sidebar-toggle desktop-toggle"
        aria-label="Toggle sidebar"
        @click="toggleSidebar"
      >
        <span class="toggle-icon">☰</span>
      </button>

      <button
        type="button"
        class="sidebar-toggle mobile-toggle"
        aria-label="Open navigation"
        @click="toggleMobileSidebar"
      >
        <span class="toggle-icon">☰</span>
      </button>

      <div class="page-heading">
        <h1>{{ pageTitle }}</h1>
        <p>Welcome back to BizzFlow</p>
      </div>
    </div>

    <div class="header-right">
      <button
        type="button"
        class="header-action search-button"
        aria-label="Search"
        title="Search"
      >
        <span>⌕</span>
      </button>

      <button
        type="button"
        class="header-action notification-button"
        aria-label="Notifications"
        title="Notifications"
      >
        <span>♧</span>
        <span class="notification-dot" />
      </button>

      <div class="header-divider" />

      <LayoutAppUserMenu />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;

  width: 100%;
  height: 76px;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #e9edf2;

  gap: 20px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  gap: 20px;
  min-width: 0;
}

.header-right {
  gap: 18px;
}

.sidebar-toggle,
.header-action {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.sidebar-toggle {
  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;
  color: #526071;
  font-size: 20px;

  &:hover {
    background: #f3f5f8;
  }
}

.toggle-icon {
  line-height: 1;
}

.mobile-toggle {
  display: none;
}

.page-heading {
  min-width: 0;

  h1 {
    margin: 0;
    color: #172033;
    font-size: 20px;
    font-weight: 700;
  }

  p {
    margin: 4px 0 0;
    color: #8993a3;
    font-size: 12px;
  }
}

.header-action {
  position: relative;

  width: 38px;
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 9px;
  color: #647084;
  font-size: 23px;

  &:hover {
    background: #f3f5f8;
  }
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 9px;

  width: 7px;
  height: 7px;

  border-radius: 50%;
  background: #ef5350;
  border: 1px solid #ffffff;
}

.header-divider {
  width: 1px;
  height: 34px;
  background: #e9edf2;
}

@media (max-width: 768px) {
  .app-header {
    height: 68px;
    padding: 0 16px;
  }

  .desktop-toggle {
    display: none;
  }

  .mobile-toggle {
    display: flex;
  }

  .header-left {
    gap: 10px;
  }

  .page-heading {
    h1 {
      font-size: 17px;
    }

    p {
      display: none;
    }
  }

  .header-right {
    gap: 8px;
  }

  .header-divider,
  .search-button {
    display: none;
  }
}
</style>
