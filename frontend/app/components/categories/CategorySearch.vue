<script setup lang="ts">
import { computed } from 'vue'

export type CategoryStatusFilter = 'all' | 'active' | 'inactive'

export type CategorySortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'

const props = withDefaults(defineProps<{
  search: string
  status: CategoryStatusFilter
  sort: CategorySortOption
}>(), {
  search: '',
  status: 'active',
  sort: 'newest',
})

const emit = defineEmits<{
  'update:search': [value: string]
  'update:status': [value: CategoryStatusFilter]
  'update:sort': [value: CategorySortOption]
  clear: []
}>()

const hasActiveFilters = computed(() =>
  Boolean(
    props.search ||
    props.status !== 'active' ||
    props.sort !== 'newest',
  ),
)

function updateSearch(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:search', target.value)
}

function updateStatus(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:status', target.value as CategoryStatusFilter)
}

function updateSort(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:sort', target.value as CategorySortOption)
}
</script>

<template>
  <section class="category-search">
    <div class="search-field">
      <Icon name="lucide:search" />

      <input
        :value="search"
        type="search"
        placeholder="Search category name..."
        aria-label="Search categories"
        @input="updateSearch"
      />

      <button
        v-if="search"
        type="button"
        class="clear-search-button"
        aria-label="Clear search"
        @click="emit('update:search', '')"
      >
        <Icon name="lucide:x" />
      </button>
    </div>

    <div class="filter-grid">
      <select
        :value="status"
        aria-label="Filter by status"
        @change="updateStatus"
      >
        <option value="active">Active Categories</option>
        <option value="inactive">Inactive Categories</option>
        <option value="all">All Status</option>
      </select>

      <select
        :value="sort"
        aria-label="Sort categories"
        @change="updateSort"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name-asc">Name A–Z</option>
        <option value="name-desc">Name Z–A</option>
      </select>
    </div>

    <button
      type="button"
      class="clear-filters-button"
      :disabled="!hasActiveFilters"
      @click="emit('clear')"
    >
      <Icon name="lucide:rotate-ccw" />
      Clear Filters
    </button>
  </section>
</template>

<style lang="scss" scoped>
.category-search {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1 1 260px;
  min-width: 220px;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #737373;

  &:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgb(37 99 235 / 8%);
  }

  input {
    flex: 1;
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #111827;
    font: inherit;
    font-size: 13px;

    &::placeholder {
      color: #9ca3af;
    }
  }
}

.clear-search-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #737373;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  select {
    min-height: 40px;
    min-width: 155px;
    padding: 8px 30px 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: #93c5fd;
    }
  }
}

.clear-filters-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 7px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

@media (max-width: 640px) {
  .category-search {
    align-items: stretch;
  }

  .search-field,
  .filter-grid {
    flex: 1 1 100%;
  }

  .filter-grid select {
    flex: 1;
    min-width: 0;
  }

  .clear-filters-button {
    align-self: flex-start;
  }
}
</style>
