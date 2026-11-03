
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  pageSize: number
  totalItems: number
  pageSizeOptions?: number[]
}>(), {
  pageSizeOptions: () => [10, 25, 50, 100],
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
}>()

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / props.pageSize)),
)

const startItem = computed(() =>
  props.totalItems === 0
    ? 0
    : (props.page - 1) * props.pageSize + 1,
)

const endItem = computed(() =>
  Math.min(props.page * props.pageSize, props.totalItems),
)

const pageNumbers = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(totalPages.value, props.page + 2)

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
})

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return

  emit('update:page', page)
}

function changePageSize(event: Event) {
  const target = event.target as HTMLSelectElement
  const newPageSize = Number(target.value)

  if (!Number.isInteger(newPageSize) || newPageSize <= 0) return

  emit('update:pageSize', newPageSize)
  emit('update:page', 1)
}
</script>

<template>
  <footer class="base-pagination">
    <div class="pagination-info">
      Showing
      <strong>{{ startItem }}–{{ endItem }}</strong>
      of
      <strong>{{ totalItems }}</strong>
      items
    </div>

    <div class="pagination-controls">
      <label for="pagination-page-size">
        Rows per page
      </label>

      <select
        id="pagination-page-size"
        :value="pageSize"
        @change="changePageSize"
      >
        <option
          v-for="size in pageSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>

      <button
        type="button"
        class="page-button"
        aria-label="First page"
        title="First page"
        :disabled="page <= 1"
        @click="goToPage(1)"
      >
        <Icon name="lucide:chevrons-left" />
      </button>

      <button
        type="button"
        class="page-button"
        aria-label="Previous page"
        title="Previous page"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        <Icon name="lucide:chevron-left" />
      </button>

      <button
        v-for="pageNumber in pageNumbers"
        :key="pageNumber"
        type="button"
        :class="['page-button', { active: page === pageNumber }]"
        :aria-label="`Page ${pageNumber}`"
        :aria-current="page === pageNumber ? 'page' : undefined"
        @click="goToPage(pageNumber)"
      >
        {{ pageNumber }}
      </button>

      <button
        type="button"
        class="page-button"
        aria-label="Next page"
        title="Next page"
        :disabled="page >= totalPages"
        @click="goToPage(page + 1)"
      >
        <Icon name="lucide:chevron-right" />
      </button>

      <button
        type="button"
        class="page-button"
        aria-label="Last page"
        title="Last page"
        :disabled="page >= totalPages"
        @click="goToPage(totalPages)"
      >
        <Icon name="lucide:chevrons-right" />
      </button>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.base-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  width: 100%;
  margin-top: 16px;
  padding: 14px 0;
}

.pagination-info {
  color: #737373;
  font-size: 12px;

  strong {
    color: #374151;
    font-weight: 600;
  }
}

.pagination-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  label {
    margin-right: 4px;
    color: #737373;
    font-size: 12px;
  }

  select {
    min-height: 32px;
    padding: 5px 7px;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    background: #fff;
    color: #374151;
    font-size: 12px;
  }
}

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled):not(.active) {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &.active {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

@media (max-width: 600px) {
  .base-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-controls {
    width: 100%;
  }
}
</style>
