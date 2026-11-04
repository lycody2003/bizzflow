<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UnitsManagement from '@components/settings/UnitsManagement.vue'
import useBusiness from '@composables/useBusiness'

const { business, loading, loadBusiness } = useBusiness()

const initializing = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    if (!business.value) {
      await loadBusiness()
    }
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'Failed to load business information.'
  } finally {
    initializing.value = false
  }
})
</script>

<template>
  <div class="units-view">
    <header class="page-header">
      <div>
        <h1>Units Management</h1>
        <p>Manage measurement units used by your products.</p>
      </div>
    </header>

    <div v-if="initializing || loading" class="page-state">
      Loading business information...
    </div>

    <div v-else-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </div>

    <section v-else-if="business" class="settings-card">
      <div class="section-content">
        <UnitsManagement />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.units-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  h1 {
    margin: 0;
    color: #182951;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    margin: 8px 0 0;
    color: #718096;
    font-size: 14px;
  }
}

.settings-card {
  padding: 24px;
  border: 1px solid #e5eaf2;
  border-radius: 12px;
  background: #fff;
}

.section-content {
  width: 100%;
}

.page-state {
  padding: 32px;
  color: #718096;
  text-align: center;
}

.alert-error {
  padding: 12px 16px;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  background: #fff5f5;
  color: #c53030;
}
</style>
