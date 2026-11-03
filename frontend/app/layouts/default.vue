
<script setup lang="ts">
const {
  isCollapsed,
  isMobileOpen,
  closeMobileSidebar,
} = useSidebar()
</script>

<template>
  <div class="app-layout">
    <LayoutAppSidebar />

    <div
      class="app-main"
      :class="{ 'sidebar-collapsed': isCollapsed }"
    >
      <LayoutAppHeader />

      <main class="app-content">
        <slot />
      </main>
    </div>

    <Transition name="overlay">
      <button
        v-if="isMobileOpen"
        type="button"
        class="mobile-overlay"
        aria-label="Close navigation"
        @click="closeMobileSidebar"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f7fb;
}

.app-main {
  min-height: 100vh;
  margin-left: 260px;
  transition: margin-left 0.25s ease;
}

.app-main.sidebar-collapsed {
  margin-left: 76px;
}

.app-content {
  min-height: calc(100vh - 76px);
  padding: 28px 32px;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  .app-main,
  .app-main.sidebar-collapsed {
    margin-left: 0;
  }

  .app-content {
    min-height: calc(100vh - 68px);
    padding: 20px 16px;
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgb(15 23 42 / 45%);
    cursor: pointer;
  }
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
