
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import BaseDataTable from '@components/data-table/BaseDataTable.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'

import type { ProductVariant, ProductStatus } from '@app-types/product'

const props = defineProps<{
  productId: string
  businessId: string
}>()

const emit = defineEmits<{
  create: []
  edit: [variant: ProductVariant]
}>()

const { $productVariantService } = useNuxtApp()

const variants = ref<ProductVariant[]>([])
const filterStatus = ref<'all' | ProductStatus>('all')

const loading = ref(false)
const saving = ref(false)

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const showConfirmation = ref(false)
const selectedVariant = ref<ProductVariant | null>(null)

const filteredVariants = computed(() => {
  if (filterStatus.value === 'all') {
    return variants.value
  }

  return variants.value.filter(
    variant => variant.status === filterStatus.value,
  )
})

type VariantAction = 'deactivate' | 'restore'

const confirmationAction = ref<VariantAction>('deactivate')

const confirmationTitle = computed(() =>
  confirmationAction.value === 'restore'
    ? 'Restore Variant?'
    : 'Deactivate Variant?',
)

const confirmationMessage = computed(() =>
  confirmationAction.value === 'restore'
    ? 'This variant will become active again.'
    : 'This variant will become inactive. Its SKU will remain reserved.',
)

const confirmationText = computed(() =>
  confirmationAction.value === 'restore'
    ? 'Restore'
    : 'Deactivate',
)

const confirmationVariant = computed(() =>
  confirmationAction.value === 'restore'
    ? 'success'
    : 'danger',
)

async function loadVariants() {
  if (!props.productId || !props.businessId) {
    variants.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    variants.value = await $productVariantService.getVariants(
      props.productId,
      props.businessId,
    )
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to load product variants.'
  } finally {
    loading.value = false
  }
}

function openDeactivateConfirmation(variant: ProductVariant) {
  selectedVariant.value = variant
  confirmationAction.value = 'deactivate'
  showConfirmation.value = true
}

function openRestoreConfirmation(variant: ProductVariant) {
  selectedVariant.value = variant
  confirmationAction.value = 'restore'
  showConfirmation.value = true
}

async function handleDeactivate() {
  const variant = selectedVariant.value

  if (!variant) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    await $productVariantService.deleteVariant(
      props.productId,
      variant.id,
      props.businessId,
    )

    successMessage.value = `Variant ${variant.sku} deactivated successfully.`

    showConfirmation.value = false
    selectedVariant.value = null

    await loadVariants()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to deactivate variant.'
  } finally {
    saving.value = false
  }
}

async function handleRestore() {
  const variant = selectedVariant.value

  if (!variant) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    await $productVariantService.restoreVariant(
      props.productId,
      variant.id,
      props.businessId,
    )

    successMessage.value =
      `Variant ${variant.sku} restored successfully.`

    showConfirmation.value = false
    selectedVariant.value = null

    await loadVariants()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to restore variant.'
  } finally {
    saving.value = false
  }
}

function handleConfirmation() {
  if (confirmationAction.value === 'restore') {
    void handleRestore()
    return
  }

  void handleDeactivate()
}

watch(
  () => [props.productId, props.businessId],
  () => {
    void loadVariants()
  },
)

onMounted(() => {
  void loadVariants()
})
</script>

<template>
  <section class="variant-section">
    <div class="section-header">
      <div>
        <h2>Product Variants</h2>
        <p>Manage SKU, attributes, pricing and stock.</p>
      </div>

      <button
        type="button"
        class="create-button"
        @click="emit('create')"
      >
        <Icon name="lucide:plus" />
        Add Variant
      </button>
    </div>

    <div v-if="successMessage" class="success-message">
      <Icon name="lucide:check-circle" />
      {{ successMessage }}

      <button type="button" @click="successMessage = null">
        ×
      </button>
    </div>

    <div v-if="error" class="error-message">
      <Icon name="lucide:alert-circle" />
      {{ error }}

      <button type="button" @click="error = null">
        ×
      </button>
    </div>

    <div class="variant-toolbar">
      <span class="variant-count">
        {{ filteredVariants.length }} variants
      </span>

      <select v-model="filterStatus" aria-label="Filter variants by status">
        <option value="all">All Variants</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        type="button"
        class="refresh-button"
        :disabled="loading || saving"
        @click="loadVariants"
      >
        <Icon name="lucide:refresh-cw" />
        Refresh
      </button>
    </div>

    <BaseDataTable
      min-width="1100px"
      :loading="loading"
      :empty="filteredVariants.length === 0"
      empty-title="No variants found"
      empty-message="Create a variant or change your status filter."
    >
      <thead>
        <tr>
          <th>SKU</th>
          <th>Attributes</th>
          <th>Cost Price</th>
          <th>Selling Price</th>
          <th>Stock</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="variant in filteredVariants"
          :key="variant.id"
        >
          <td>
            <span class="sku">
              {{ variant.sku }}
            </span>
          </td>

          <td>
            <div class="attributes">
              <span
                v-for="attribute in variant.attributes"
                :key="attribute.name"
                class="attribute-badge"
              >
                {{ attribute.name }}: {{ attribute.value }}
              </span>
            </div>
          </td>

          <td>
            {{ variant.currency }}
            {{ variant.costPrice.toLocaleString() }}
          </td>

          <td class="selling-price">
            {{ variant.currency }}
            {{ variant.sellingPrice.toLocaleString() }}
          </td>

          <td>
            <div class="stock-cell">
              <strong>{{ variant.stockQuantity }}</strong>

              <span
                :class="[
                  'stock-status',
                  variant.stockQuantity <= 0
                    ? 'out-of-stock'
                    : variant.stockQuantity <= variant.minimumStock
                      ? 'low-stock'
                      : 'in-stock',
                ]"
              >
                {{
                  variant.stockQuantity <= 0
                    ? 'Out of Stock'
                    : variant.stockQuantity <= variant.minimumStock
                      ? 'Low Stock'
                      : 'In Stock'
                }}
              </span>
            </div>
          </td>

          <td>
            <span :class="['status', variant.status]">
              <span class="status-dot" />
              {{ variant.status }}
            </span>
          </td>

          <td>
            <div class="row-actions">
              <template v-if="variant.status === 'active'">
                <button
                  type="button"
                  class="icon-action edit-action"
                  title="Edit variant"
                  aria-label="Edit variant"
                  :disabled="saving"
                  @click="emit('edit', variant)"
                >
                  <Icon name="lucide:pencil" />
                </button>

                <button
                  type="button"
                  class="icon-action archive-action"
                  title="Deactivate variant"
                  aria-label="Deactivate variant"
                  :disabled="saving"
                  @click="openDeactivateConfirmation(variant)"
                >
                  <Icon name="lucide:archive" />
                </button>
              </template>

              <button
                v-else
                type="button"
                class="icon-action restore-action"
                title="Restore variant"
                aria-label="Restore variant"
                :disabled="saving"
                @click="openRestoreConfirmation(variant)"
              >
                <Icon name="lucide:archive-restore" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </BaseDataTable>

    <ConfirmationDialog
      v-model="showConfirmation"
      :title="confirmationTitle"
      :message="confirmationMessage"
      :item-name="selectedVariant?.sku ?? ''"
      :confirm-text="confirmationText"
      :variant="confirmationVariant"
      :loading="saving"
      @confirm="handleConfirmation"
    />
  </section>
</template>

<style lang="scss" scoped>
.variant-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 12px;
  }
}

.create-button,
.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.create-button {
  background: #2563eb;
  color: white;
}

.refresh-button {
  background: white;
  color: #475569;
}

.variant-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;

  select {
    min-height: 36px;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    color: #475569;
    font-size: 12px;
  }
}

.variant-count {
  margin-right: auto;
  color: #64748b;
  font-size: 12px;
}

.sku {
  color: #64748b;
  font-family: monospace;
  font-size: 12px;
}

.attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.attribute-badge {
  padding: 4px 7px;
  border-radius: 5px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
}

.selling-price {
  color: #059669;
  font-weight: 600;
}

.stock-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stock-status {
  font-size: 11px;
}

.in-stock { color: #059669; }
.low-stock { color: #d97706; }
.out-of-stock { color: #dc2626; }

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status.active { color: #059669; }
.status.inactive { color: #94a3b8; }

.row-actions {
  display: flex;
  gap: 7px;
}

.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: white;
  cursor: pointer;
}

.icon-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-action { color: #2563eb; }
.archive-action { color: #dc2626; }
.restore-action { color: #15803d; }

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;

  button {
    margin-left: auto;
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
  }
}

.success-message {
  background: #f0fdf4;
  color: #15803d;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
}

@media (max-width: 640px) {
  .section-header {
    align-items: flex-start;
  }

  .variant-toolbar {
    flex-wrap: wrap;
  }
}
</style>
