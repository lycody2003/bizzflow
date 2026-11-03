
<script setup lang="ts">
import { computed } from 'vue'

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

type SortOption =
  | 'newest'
  | 'oldest'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'stock-asc'
  | 'stock-desc'

interface Category {
  id: string
  name: string
}

const props = withDefaults(defineProps<{
  search: string
  category: string
  status: string
  stock: StockFilter
  sort: SortOption
  categories: Category[]
}>(), {
  search: '',
  category: 'all',
  status: 'active',
  stock: 'all',
  sort: 'newest',
  categories: () => [],
})

const emit = defineEmits<{
  'update:search': [value: string]
  'update:category': [value: string]
  'update:status': [value: string]
  'update:stock': [value: StockFilter]
  'update:sort': [value: SortOption]
  clear: []
}>()

const hasActiveFilters = computed(() =>
  Boolean(
    props.search ||
    props.category !== 'all' ||
    props.status !== 'active' ||
    props.stock !== 'all' ||
    props.sort !== 'newest'
  )
)

function updateSearch(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:search', target.value)
}

function updateCategory(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:category', target.value)
}

function updateStatus(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:status', target.value)
}

function updateStock(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:stock', target.value as StockFilter)
}

function updateSort(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:sort', target.value as SortOption)
}

function clearFilters() {
  emit('clear')
}
</script>

<template>
  <section class="product-search">
    <div class="search-field">
      <Icon name="lucide:search" />

      <input
        :value="search"
        type="search"
        placeholder="Search name, SKU, or barcode..."
        aria-label="Search products"
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
        :value="category"
        aria-label="Filter by category"
        @change="updateCategory"
      >
        <option value="all">All Categories</option>

        <option
          v-for="item in categories"
          :key="item.id"
          :value="item.id"
        >
          {{ item.name }}
        </option>
      </select>

      <select
        :value="status"
        aria-label="Filter by status"
        @change="updateStatus"
      >
        <option value="active">Active Products</option>
        <option value="inactive">Inactive Products</option>
        <option value="all">All Status</option>
      </select>

      <select
        :value="stock"
        aria-label="Filter by stock"
        @change="updateStock"
      >
        <option value="all">All Stock</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>

      <select
        :value="sort"
        aria-label="Sort products"
        @change="updateSort"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name-asc">Name A–Z</option>
        <option value="name-desc">Name Z–A</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="stock-asc">Stock: Low to High</option>
        <option value="stock-desc">Stock: High to Low</option>
      </select>
    </div>

    <button
      type="button"
      class="clear-filters-button"
      :disabled="!hasActiveFilters"
      @click="clearFilters"
    >
      <Icon name="lucide:rotate-ccw" />
      Clear Filters
    </button>
  </section>
</template>

<style lang="scss" scoped>
.product-search {
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
  gap: 8px;

  select {
    min-height: 40px;
    max-width: 170px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #374151;
    font-size: 12px;
    cursor: pointer;

    &:focus {
      border-color: #93c5fd;
      outline: none;
    }
  }
}

.clear-filters-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 8px 11px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

@media (max-width: 700px) {
  .product-search {
    align-items: stretch;
    flex-direction: column;
  }

  .search-field {
    flex: auto;
    width: 100%;
    min-width: 0;
  }

  .filter-grid {
    width: 100%;

    select {
      flex: 1 1 140px;
      max-width: none;
    }
  }

  .clear-filters-button {
    width: 100%;
  }
}
</style>
