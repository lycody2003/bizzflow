
<script setup lang="ts">
withDefaults(defineProps<{
  minWidth?: string
  loading?: boolean
  empty?: boolean
  emptyTitle?: string
  emptyMessage?: string
}>(), {
  minWidth: '800px',
  loading: false,
  empty: false,
  emptyTitle: 'No data found',
  emptyMessage: 'There are no records to display.',
})
</script>

<template>
  <div class="base-table-container">
    <div v-if="loading" class="table-state">
      <Icon name="lucide:loader-circle" class="loading-icon" />
      <span>Loading data...</span>
    </div>

    <div v-else-if="empty" class="table-state empty-state">
      <Icon name="lucide:inbox" class="empty-icon" />
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="table-scroll">
      <table :style="{ minWidth }">
        <slot />
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base-table-container {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  white-space: nowrap;

  :deep(th),
  :deep(td) {
    padding: 13px 16px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(th) {
    height: 48px;
    background: #f8fafc;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  :deep(td) {
    height: 72px;
    background: #fff;
    color: #334155;
    font-size: 13px;
  }

  :deep(tbody tr) {
    transition: background 0.15s ease;
  }

  :deep(tbody tr:hover td) {
    background: #f8fafc;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: none;
  }
}

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 30px 20px;
  color: #737373;
  font-size: 13px;
  text-align: center;
}

.empty-state {
  h3 {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #737373;
    font-size: 13px;
  }
}

.empty-icon {
  color: #9ca3af;
  font-size: 32px;
}

.loading-icon {
  color: #2563eb;
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
