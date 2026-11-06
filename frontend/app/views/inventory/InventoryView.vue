<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import useBusiness from '@composables/useBusiness'
import BaseDataTable from '@components/data-table/BaseDataTable.vue'
import BasePagination from '@components/data-table/BasePagination.vue'
import StockAdjustmentForm from '@components/inventory/StockAdjustmentForm.vue'

import type {
  InventoryBalance,
  PaginatedInventory,
  CreateStockAdjustmentInput,
  StockMovement,
  StockMovementType,
} from '@app-types/inventory'

type InventoryTab = 'overview' | 'list' | 'adjust' | 'history'

const { business, loadBusiness } = useBusiness()
const { $inventoryService } = useNuxtApp()

const businessId = computed(() => business.value?.id ?? '')

const activeTab = ref<InventoryTab>('overview')
const inventory = ref<InventoryBalance[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
})

const loading = ref(false)
const initialized = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const submittingAdjustment = ref(false)

const movements = ref<StockMovement[]>([])
const movementLoading = ref(false)
const movementError = ref<string | null>(null)
const movementPagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
})
const movementTypeFilter = ref<StockMovementType | ''>('')

let movementRequestId = 0
let requestId = 0

const lowStockItems = computed(() =>
  inventory.value.filter(item => {
    const minimumStock = item.variant?.minimumStock ??
      item.product?.minimumStock ?? 0

    return item.quantityOnHand > 0 &&
      item.quantityOnHand <= minimumStock
  }),
)

const outOfStockItems = computed(() =>
  inventory.value.filter(item => item.quantityOnHand === 0),
)

const stockSummary = computed(() => [
  {
    label: 'Tracked Items',
    value: pagination.value.total,
    description: 'Total inventory records',
    icon: 'lucide:package',
  },
  {
    label: 'Low Stock',
    value: lowStockItems.value.length,
    description: 'On the current page',
    icon: 'lucide:alert-triangle',
  },
  {
    label: 'Out of Stock',
    value: outOfStockItems.value.length,
    description: 'On the current page',
    icon: 'lucide:package-x',
  },
])

async function loadInventory() {
  const currentRequestId = ++requestId
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    inventory.value = []
    pagination.value.total = 0
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const result: PaginatedInventory<InventoryBalance> =
      await $inventoryService.getInventory(currentBusinessId, {
        page: pagination.value.page,
        limit: pagination.value.limit,
      })

    if (
      currentRequestId !== requestId ||
      businessId.value !== currentBusinessId
    ) {
      return
    }

    inventory.value = result.items
    pagination.value = result.pagination
  } catch (err) {
    if (currentRequestId !== requestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load inventory.'

    inventory.value = []
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

async function initializeInventory() {
  try {
    await loadBusiness()
    initialized.value = true

    if (!businessId.value) {
      error.value = 'Unable to load business information.'
      return
    }

    await loadInventory()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to initialize inventory.'
  }
}

async function handleAdjustment(data: CreateStockAdjustmentInput) {
  if (submittingAdjustment.value || !businessId.value) return

  submittingAdjustment.value = true
  error.value = null
  successMessage.value = null

  try {
    await $inventoryService.adjustStock(businessId.value, data)

    successMessage.value = 'Stock adjustment completed successfully.'

    pagination.value.page = 1
    await loadInventory()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to complete stock adjustment.'
  } finally {
    submittingAdjustment.value = false
  }
}

async function loadMovements() {
  const currentRequestId = ++movementRequestId
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    movements.value = []
    movementPagination.value.total = 0
    movementLoading.value = false
    return
  }

  movementLoading.value = true
  movementError.value = null

  try {
    const result = await $inventoryService.getMovements(
      currentBusinessId,
      {
        page: movementPagination.value.page,
        limit: movementPagination.value.limit,
        ...(movementTypeFilter.value
          ? { type: movementTypeFilter.value }
          : {}),
      },
    )

    if (
      currentRequestId !== movementRequestId ||
      businessId.value !== currentBusinessId
    ) {
      return
    }

    movements.value = result.items
    movementPagination.value = result.pagination
  } catch (err) {
    if (currentRequestId !== movementRequestId) return

    movementError.value = err instanceof Error
      ? err.message
      : 'Unable to load stock movement history.'

    movements.value = []
  } finally {
    if (currentRequestId === movementRequestId) {
      movementLoading.value = false
    }
  }
}

function changeMovementPage(page: number) {
  movementPagination.value.page = page
}

function changeMovementPageSize(limit: number) {
  movementPagination.value.limit = limit
  movementPagination.value.page = 1
}

function getMovementProductName(item: StockMovement) {
  return item.product?.name ?? 'Unknown Product'
}

function getMovementVariantName(item: StockMovement) {
  if (!item.variant) return 'Standard Product'

  const attributes = item.variant.attributes
    ?.map(attribute => `${attribute.name}: ${attribute.value}`)
    .join(', ')

  return attributes || item.variant.sku || 'Product Variant'
}

function getMovementTypeLabel(type: StockMovementType) {
  const labels: Record<StockMovementType, string> = {
    opening: 'Opening',
    adjustment_in: 'Adjustment In',
    adjustment_out: 'Adjustment Out',
  }

  return labels[type]
}

function formatMovementDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getPerformedBy(item: StockMovement) {
  if (!item.performedBy) return 'Unknown User'

  const name = [
    item.performedBy.firstName,
    item.performedBy.lastName,
  ].filter(Boolean).join(' ')

  return name || item.performedBy.email || 'Unknown User'
}

function changePage(page: number) {
  pagination.value.page = page
}

function changePageSize(limit: number) {
  pagination.value.limit = limit
  pagination.value.page = 1
}

function getStockStatus(item: InventoryBalance) {
  const minimumStock = item.variant?.minimumStock ??
    item.product?.minimumStock ?? 0

  if (item.quantityOnHand === 0) return 'Out of Stock'
  if (item.quantityOnHand <= minimumStock) return 'Low Stock'

  return 'In Stock'
}

function getProductName(item: InventoryBalance) {
  return item.product?.name ?? 'Unknown Product'
}

function getVariantName(item: InventoryBalance) {
  if (!item.variant) return 'Standard Product'

  const attributes = item.variant.attributes
    ?.map(attribute => `${attribute.name}: ${attribute.value}`)
    .join(', ')

  return attributes || item.variant.sku || 'Product Variant'
}

watch(
  [
    () => pagination.value.page,
    () => pagination.value.limit,
  ],
  () => {
    if (initialized.value) {
      void loadInventory()
    }
  },
)

watch(businessId, (newBusinessId, oldBusinessId) => {
  if (!initialized.value || newBusinessId === oldBusinessId) return

  pagination.value.page = 1
  void loadInventory()

  if (activeTab.value === 'history') {
    movementPagination.value.page = 1
    void loadMovements()
  }
})

watch(activeTab, tab => {
  if (tab === 'history' && initialized.value) {
    void loadMovements()
  }
})

watch(
  [
    () => movementPagination.value.page,
    () => movementPagination.value.limit,
    movementTypeFilter,
  ],
  () => {
    if (initialized.value && activeTab.value === 'history') {
      void loadMovements()
    }
  },
)

onMounted(initializeInventory)
</script>

<template>
  <div class="inventory-view">
    <header class="page-header">
      <div>
        <h1>Inventory</h1>
        <p>Monitor stock levels and manage inventory movements.</p>
      </div>
    </header>

    <div v-if="error" class="error-message">
      <Icon name="lucide:alert-circle" />
      <span>{{ error }}</span>

      <button type="button" @click="loadInventory">
        Retry
      </button>
    </div>

    <nav class="inventory-tabs" aria-label="Inventory sections">
      <button
        v-for="tab in [
          { id: 'overview', label: 'Overview', icon: 'lucide:layout-dashboard' },
          { id: 'list', label: 'Inventory List', icon: 'lucide:package' },
          { id: 'adjust', label: 'Adjust Stock', icon: 'lucide:arrow-left-right' },
          { id: 'history', label: 'Movement History', icon: 'lucide:history' },
        ]"
        :key="tab.id"
        type="button"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id as InventoryTab"
      >
        <Icon :name="tab.icon" />
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'overview'" class="tab-content">
      <div class="section-heading">
        <div>
          <h2>Stock Overview</h2>
          <p>Inventory summary and stock status.</p>
        </div>

        <button
          type="button"
          class="secondary-button"
          @click="loadInventory"
          :disabled="loading"
        >
          <Icon name="lucide:refresh-cw" />
          Refresh
        </button>
      </div>

      <div class="summary-grid">
        <article
          v-for="item in stockSummary"
          :key="item.label"
          class="summary-card"
        >
          <div class="summary-icon">
            <Icon :name="item.icon" />
          </div>

          <div>
            <p>{{ item.label }}</p>
            <strong>{{ item.value }}</strong>
            <span>{{ item.description }}</span>
          </div>
        </article>
      </div>

      <div class="section-heading low-stock-heading">
        <div>
          <h2>Low Stock Items</h2>
          <p>Items requiring attention on the current page.</p>
        </div>

        <button
          type="button"
          class="text-button"
          @click="activeTab = 'list'"
        >
          View Inventory
          <Icon name="lucide:arrow-right" />
        </button>
      </div>

      <BaseDataTable
        :loading="loading"
        :empty="lowStockItems.length === 0"
        empty-title="No low stock items"
        empty-message="No low stock records were found on the current page."
        min-width="650px"
      >
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Current Stock</th>
            <th>Minimum Stock</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in lowStockItems" :key="item.id">
            <td>{{ getProductName(item) }}</td>
            <td>{{ getVariantName(item) }}</td>
            <td>{{ item.quantityOnHand }}</td>
            <td>
              {{ item.variant?.minimumStock ??
                item.product?.minimumStock ?? 0 }}
            </td>
            <td>
              <span class="status-badge low-stock">
                Low Stock
              </span>
            </td>
          </tr>
        </tbody>
      </BaseDataTable>
    </section>

    <section v-else-if="activeTab === 'list'" class="tab-content">
      <div class="section-heading">
        <div>
          <h2>Inventory List</h2>
          <p>Current stock balances for products and variants.</p>
        </div>

        <button
          type="button"
          class="secondary-button"
          @click="loadInventory"
          :disabled="loading"
        >
          <Icon name="lucide:refresh-cw" />
          Refresh
        </button>
      </div>

      <BaseDataTable
        :loading="loading"
        :empty="inventory.length === 0"
        empty-title="No inventory records"
        empty-message="Inventory balances will appear here when products are created."
        min-width="750px"
      >
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>SKU</th>
            <th>Quantity On Hand</th>
            <th>Minimum Stock</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in inventory" :key="item.id">
            <td>{{ getProductName(item) }}</td>
            <td>{{ getVariantName(item) }}</td>
            <td>{{ item.variant?.sku ?? item.product?.sku ?? '—' }}</td>
            <td class="quantity-cell">
              {{ item.quantityOnHand }}
            </td>
            <td>
              {{ item.variant?.minimumStock ??
                item.product?.minimumStock ?? 0 }}
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  getStockStatus(item).toLowerCase().replaceAll(' ', '-'),
                ]"
              >
                {{ getStockStatus(item) }}
              </span>
            </td>
          </tr>
        </tbody>
      </BaseDataTable>

      <BasePagination
        :page="pagination.page"
        :page-size="pagination.limit"
        :total-items="pagination.total"
        @update:page="changePage"
        @update:page-size="changePageSize"
      />
    </section>

    <section v-else-if="activeTab === 'adjust'" class="tab-content">
      <div class="section-heading">
        <div>
          <h2>Adjust Stock</h2>
          <p>Record stock additions and removals.</p>
        </div>
      </div>

      <div v-if="successMessage" class="success-message">
        <Icon name="lucide:check-circle" />
        <span>{{ successMessage }}</span>
      </div>

      <StockAdjustmentForm
        :business-id="businessId"
        :submitting="submittingAdjustment"
        @submit="handleAdjustment"
      />
    </section>

    <section v-else class="tab-content">
      <div class="section-heading movement-heading">
        <div>
          <h2>Movement History</h2>
          <p>Review stock changes and audit records.</p>
        </div>

        <div class="movement-actions">
          <select
            v-model="movementTypeFilter"
            aria-label="Filter movement type"
            class="movement-filter"
          >
            <option value="">All Movement Types</option>
            <option value="opening">Opening</option>
            <option value="adjustment_in">Adjustment In</option>
            <option value="adjustment_out">Adjustment Out</option>
          </select>

          <button
            type="button"
            class="secondary-button"
            :disabled="movementLoading"
            @click="loadMovements"
          >
            <Icon name="lucide:refresh-cw" />
            Refresh
          </button>
        </div>
      </div>

      <div v-if="movementError" class="error-message">
        <Icon name="lucide:alert-circle" />
        <span>{{ movementError }}</span>
        <button type="button" @click="loadMovements">Retry</button>
      </div>

      <BaseDataTable
        :loading="movementLoading"
        :empty="movements.length === 0"
        empty-title="No stock movements found"
        empty-message="Stock movement records will appear here."
        min-width="1250px"
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Variant</th>
            <th>Movement Type</th>
            <th>Quantity</th>
            <th>Before</th>
            <th>After</th>
            <th>Reason</th>
            <th>Performed By</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in movements" :key="item.id">
            <td>{{ formatMovementDate(item.createdAt) }}</td>
            <td>{{ getMovementProductName(item) }}</td>
            <td>{{ getMovementVariantName(item) }}</td>
            <td>
              <span
                :class="[
                  'movement-badge',
                  item.type.replaceAll('_', '-'),
                ]"
              >
                {{ getMovementTypeLabel(item.type) }}
              </span>
            </td>
            <td
              :class="[
                'quantity-cell',
                item.type === 'adjustment_out'
                  ? 'quantity-out'
                  : 'quantity-in',
              ]"
            >
              {{ item.type === 'adjustment_out' ? '-' : '+' }}{{ item.quantity }}
            </td>
            <td>{{ item.quantityBefore }}</td>
            <td>{{ item.quantityAfter }}</td>
            <td class="reason-cell">{{ item.reason }}</td>
            <td>{{ getPerformedBy(item) }}</td>
          </tr>
        </tbody>
      </BaseDataTable>

      <BasePagination
        :page="movementPagination.page"
        :page-size="movementPagination.limit"
        :total-items="movementPagination.total"
        @update:page="changeMovementPage"
        @update:page-size="changeMovementPageSize"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.inventory-view {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 0 32px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    color: #111827;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    margin: 7px 0 0;
    color: #737373;
    font-size: 13px;
  }
}

.inventory-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
  padding-bottom: 2px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 12px 14px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: #2563eb;
  }

  &.active {
    border-bottom-color: #2563eb;
    color: #2563eb;
    font-weight: 600;
  }
}

.tab-content {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 650;
  }

  p {
    margin: 5px 0 0;
    color: #737373;
    font-size: 12px;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;

  p {
    margin: 0 0 6px;
    color: #64748b;
    font-size: 12px;
  }

  strong {
    display: block;
    color: #111827;
    font-size: 25px;
    font-weight: 700;
  }

  span {
    display: block;
    margin-top: 5px;
    color: #94a3b8;
    font-size: 11px;
  }
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 21px;
}

.low-stock-heading {
  margin-top: 8px;
}

.secondary-button,
.text-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.secondary-button {
  padding: 9px 12px;
}

.text-button {
  padding: 8px 10px;
  border: 0;
  color: #2563eb;
}

.status-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;

  &.in-stock {
    background: #ecfdf5;
    color: #047857;
  }

  &.low-stock {
    background: #fff7ed;
    color: #c2410c;
  }

  &.out-of-stock {
    background: #fef2f2;
    color: #b91c1c;
  }
}

.quantity-cell {
  font-weight: 650;
  color: #111827;
}

.movement-heading {
  align-items: center;
}

.movement-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.movement-filter {
  min-height: 36px;
  padding: 8px 30px 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #475569;
  font-size: 12px;
}

.movement-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;

  &.opening {
    background: #eff6ff;
    color: #1d4ed8;
  }

  &.adjustment-in {
    background: #ecfdf5;
    color: #047857;
  }

  &.adjustment-out {
    background: #fff7ed;
    color: #c2410c;
  }
}

.quantity-in {
  color: #047857 !important;
}

.quantity-out {
  color: #c2410c !important;
}

.reason-cell {
  max-width: 220px;
  white-space: normal;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 13px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: #b91c1c;
    font-weight: 600;
    cursor: pointer;
  }
}

.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: 30px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #fff;
  text-align: center;

  > :deep(svg),
  > :deep(.iconify) {
    color: #94a3b8;
    font-size: 30px;
  }

  h3 {
    margin: 14px 0 6px;
    color: #334155;
    font-size: 15px;
  }

  p {
    max-width: 400px;
    margin: 0;
    color: #737373;
    font-size: 12px;
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .section-heading {
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 21px;
  }
}
</style>
