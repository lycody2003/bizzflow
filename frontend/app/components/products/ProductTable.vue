<script setup lang="ts">
import { computed } from 'vue'

import BaseDataTable from '@components/data-table/BaseDataTable.vue'
import ProductBarcode from '@components/products/ProductBarcode.vue'
import type { Product } from '@app-types/product'
import type { Category } from '@app-types/category'

const props = defineProps<{
  products: Product[]
  categories?: Category[]
  loading?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  view: [product: Product]
  edit: [product: Product]
  archive: [product: Product]
  restore: [product: Product]
  select: [productId: string]
  'select-all': []
}>()

const selectedProductIds = defineModel<string[]>('selectedIds', {
  default: () => [],
})

const categoryNames = computed<Record<string, string>>(() => {
  const names: Record<string, string> = {}

  for (const category of props.categories ?? []) {
    names[category.id] = category.name
  }

  return names
})

function getCategoryName(product: Product): string {
  if (!product.category) {
    return 'Uncategorized'
  }

  return categoryNames.value[product.category] ?? 'Category unavailable'
}

const imageUrls = computed<Record<string, string>>(() => {
  const urls: Record<string, string> = {}

  for (const product of props.products) {
    if (product.imageUrl) {
      urls[product.id] = product.imageUrl
    }
  }

  return urls
})

const allVisibleSelected = computed(() =>
  props.products.length > 0 &&
  props.products.every(product =>
    selectedProductIds.value.includes(product.id),
  ),
)

const someVisibleSelected = computed(() =>
  props.products.some(product =>
    selectedProductIds.value.includes(product.id),
  ),
)

function toggleSelection(productId: string) {
  if (selectedProductIds.value.includes(productId)) {
    selectedProductIds.value = selectedProductIds.value.filter(
      id => id !== productId,
    )
  } else {
    selectedProductIds.value = [
      ...selectedProductIds.value,
      productId,
    ]
  }

  emit('select', productId)
}

function toggleSelectAll() {
  if (allVisibleSelected.value) {
    const visibleIds = props.products.map(product => product.id)

    selectedProductIds.value = selectedProductIds.value.filter(
      id => !visibleIds.includes(id),
    )
  } else {
    selectedProductIds.value = [
      ...new Set([
        ...selectedProductIds.value,
        ...props.products.map(product => product.id),
      ]),
    ]
  }

  emit('select-all')
}

function getStockStatus(product: Product): string {
  if (product.currentStock <= 0) {
    return 'Out of Stock'
  }

  if (product.currentStock <= product.minimumStock) {
    return 'Low Stock'
  }

  return 'In Stock'
}

function getStockClass(product: Product): string {
  if (product.currentStock <= 0) {
    return 'out-of-stock'
  }

  if (product.currentStock <= product.minimumStock) {
    return 'low-stock'
  }

  return 'in-stock'
}
</script>

<template>
  <BaseDataTable min-width="1350px" :loading="loading" :empty="products.length === 0" empty-title="No products found"
    empty-message="Try changing your search or filters.">
    <thead>
      <tr>
        <th class="checkbox-column">
          <input type="checkbox" :checked="allVisibleSelected"
            :indeterminate="someVisibleSelected && !allVisibleSelected" aria-label="Select all visible products"
            @change="toggleSelectAll" />
        </th>

        <th class="product-column">Product</th>
        <th class="sku-column">SKU</th>
        <th class="barcode-column">Barcode</th>
        <th class="price-column">Cost Price</th>
        <th class="price-column">Selling Price</th>
        <th class="stock-column">Stock</th>
        <th class="status-column">Status</th>
        <th class="actions-column">Actions</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="product in products" :key="product.id">
        <td class="checkbox-column">
          <input type="checkbox" :checked="selectedProductIds.includes(product.id)"
            :aria-label="`Select ${product.name || 'product'}`" @change="toggleSelection(product.id)" />
        </td>

        <td class="product-column">
          <div class="product-cell">
            <div class="product-image">
              <img v-if="imageUrls[product.id]" :src="imageUrls[product.id]" :alt="product.name || 'Product image'"
                loading="lazy" />

              <Icon v-else name="lucide:package" class="product-placeholder-icon" />
            </div>

            <div class="product-info">
              <span class="product-name">
                {{ product.name || 'Name unavailable' }}
              </span>

              <small class="product-category">
                category : {{ getCategoryName(product) }}
              </small>
            </div>
          </div>
        </td>

        <td class="sku-column">
          <span class="sku">
            {{ product.sku || '—' }}
          </span>
        </td>

        <td class="barcode-column">
          <div class="barcode-cell">
            <ProductBarcode v-if="product.barcode && product.barcodeType" :value="product.barcode"
              :type="product.barcodeType" />

            <span v-else class="empty-value">
              —
            </span>
          </div>
        </td>

        <td class="price-column">
          <span class="price-value">
            {{ product.costPrice.toLocaleString() }}
            <small>{{ product.currency }}</small>
          </span>
        </td>

        <td class="price-column">
          <span class="price-value selling-price">
            {{ product.sellingPrice.toLocaleString() }}
            <small>{{ product.currency }}</small>
          </span>
        </td>

        <td class="stock-column">
          <div class="stock-cell">
            <strong>
              {{ product.currentStock }}
              <small>{{ product.unit.symbol }}</small>
            </strong>

            <span :class="[
              'stock-status',
              getStockClass(product),
            ]">
              {{ getStockStatus(product) }}
            </span>
          </div>
        </td>

        <td class="status-column">
          <span :class="['status', product.status]">
            <span class="status-dot" />
            {{ product.status }}
          </span>
        </td>

        <td class="actions-column">
          <div class="row-actions">
            <button type="button" class="icon-action view-action" title="View product" aria-label="View product"
              :disabled="saving" @click="emit('view', product)">
              <Icon name="lucide:eye" />
            </button>

            <template v-if="product.status === 'active'">
              <button type="button" class="icon-action edit-action" title="Edit product" aria-label="Edit product"
                :disabled="saving" @click="emit('edit', product)">
                <Icon name="lucide:pencil" />
              </button>

              <button type="button" class="icon-action archive-action" title="Archive product"
                aria-label="Archive product" :disabled="saving" @click="emit('archive', product)">
                <Icon name="lucide:archive" />
              </button>
            </template>

            <button v-else type="button" class="icon-action restore-action" title="Restore product"
              aria-label="Restore product" :disabled="saving" @click="emit('restore', product)">
              <Icon name="lucide:archive-restore" />
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </BaseDataTable>
</template>

<style lang="scss" scoped>
.checkbox-column {
  width: 44px;
  min-width: 44px;
  text-align: center !important;
}

.checkbox-column input {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: #2563eb;
}

.product-column {
  width: 260px;
  min-width: 260px;
}

.sku-column {
  width: 125px;
  min-width: 125px;
}

.barcode-column {
  width: 190px;
  min-width: 190px;
}

.price-column {
  width: 125px;
  min-width: 125px;
}

.stock-column {
  width: 130px;
  min-width: 130px;
}

.status-column {
  width: 105px;
  min-width: 105px;
}

.actions-column {
  width: 135px;
  min-width: 135px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.product-image {
  display: flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.product-placeholder-icon {
  color: #94a3b8;
  font-size: 20px;
}

.product-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.product-name {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
}

.product-category {
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  text-overflow: ellipsis;
  text-transform: capitalize;
}

.sku {
  color: #64748b;
  font-family: monospace;
  font-size: 12px;
}

.barcode-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
}

.empty-value {
  color: #cbd5e1;
}

.price-value {
  color: #334155;
  font-size: 13px;
  font-weight: 500;

  small {
    margin-left: 3px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 400;
  }
}

.selling-price {
  color: #0f172a;
  font-weight: 600;
}

.stock-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;

  strong {
    color: #334155;
    font-size: 13px;
    font-weight: 600;

    small {
      color: #94a3b8;
      font-size: 11px;
      font-weight: 400;
    }
  }
}

.status,
.stock-status {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
}

.status {
  gap: 6px;
  text-transform: capitalize;

  &.active {
    color: #15803d;
    background: #dcfce7;
  }

  &.inactive {
    color: #64748b;
    background: #f1f5f9;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.stock-status {
  &.in-stock {
    color: #15803d;
    background: #dcfce7;
  }

  &.low-stock {
    color: #a16207;
    background: #fef9c3;
  }

  &.out-of-stock {
    color: #b91c1c;
    background: #fee2e2;
  }
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #f8fafc;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.view-action:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.edit-action:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.archive-action:hover {
  border-color: #fecaca;
  color: #b91c1c;
}

.restore-action:hover {
  border-color: #bbf7d0;
  color: #15803d;
}
</style>
