
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type {
  VariantProduct,
  ProductVariant,
  ProductVariantAttribute,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  BarcodeType,
  ProductCurrency,
} from '@app-types/product'

const props = defineProps<{
  product: VariantProduct
  variant?: ProductVariant | null
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateProductVariantInput | UpdateProductVariantInput]
  cancel: []
}>()

const error = ref<string | null>(null)

const isEditMode = computed(() => Boolean(props.variant))

const form = reactive({
  sku: '',
  barcode: '',
  barcodeType: 'CODE128' as BarcodeType,
  costPrice: 0,
  sellingPrice: 0,
  currency: 'USD' as ProductCurrency,
  stockQuantity: 0,
  minimumStock: 0,
  status: 'active' as 'active' | 'inactive',
})

const selectedAttributes = reactive<Record<string, string>>({})

const attributeDefinitions = computed(
  () => props.product.attributeDefinitions,
)

function initializeForm() {
  const variant = props.variant

  form.sku = variant?.sku ?? ''
  form.barcode = variant?.barcode ?? ''
  form.barcodeType = variant?.barcodeType ?? 'CODE128'
  form.costPrice = variant?.costPrice ?? 0
  form.sellingPrice = variant?.sellingPrice ?? 0
  form.currency = variant?.currency ?? 'USD'
  form.stockQuantity = variant?.stockQuantity ?? 0
  form.minimumStock = variant?.minimumStock ?? 0
  form.status = variant?.status ?? 'active'

  for (const key of Object.keys(selectedAttributes)) {
    delete selectedAttributes[key]
  }

  for (const definition of attributeDefinitions.value) {
    const existingAttribute = variant?.attributes.find(
      attribute => attribute.name === definition.name,
    )

    selectedAttributes[definition.name] =
      existingAttribute?.value ?? ''
  }

  error.value = null
}

watch(
  () => [props.variant, props.product],
  initializeForm,
  { immediate: true },
)

const attributes = computed<ProductVariantAttribute[]>(() =>
  attributeDefinitions.value.map(definition => ({
    name: definition.name,
    value: selectedAttributes[definition.name] ?? '',
  })),
)

function validateForm(): string | null {
  if (!form.sku.trim()) {
    return 'SKU is required.'
  }

  if (form.sku.trim().length > 50) {
    return 'SKU cannot exceed 50 characters.'
  }

  if (!/^[A-Z0-9][A-Z0-9_-]*$/i.test(form.sku.trim())) {
    return 'SKU can only contain letters, numbers, underscores and hyphens.'
  }

  if (!attributeDefinitions.value.length) {
    return 'Parent product has no attribute definitions.'
  }

  for (const definition of attributeDefinitions.value) {
    const value = selectedAttributes[definition.name]

    if (!value) {
      return `Please select ${definition.name}.`
    }

    if (!definition.values.includes(value)) {
      return `Invalid value for ${definition.name}.`
    }
  }

  if (!Number.isFinite(form.costPrice) || form.costPrice < 0) {
    return 'Cost price must be a valid non-negative number.'
  }

  if (!Number.isFinite(form.sellingPrice) || form.sellingPrice < 0) {
    return 'Selling price must be a valid non-negative number.'
  }

  if (
    !isEditMode.value &&
    (!Number.isInteger(form.stockQuantity) || form.stockQuantity < 0)
  ) {
    return 'Opening stock must be a non-negative integer.'
  }

  if (!Number.isInteger(form.minimumStock) || form.minimumStock < 0) {
    return 'Minimum stock must be a non-negative integer.'
  }

  if (form.barcode.trim() && !form.barcodeType) {
    return 'Barcode type is required when a barcode is provided.'
  }

  return null
}

function handleSubmit() {
  if (props.submitting) return

  error.value = validateForm()

  if (error.value) return

  const common = {
    sku: form.sku.trim().toUpperCase(),
    barcode: form.barcode.trim() || null,
    barcodeType: form.barcode.trim() ? form.barcodeType : null,
    attributes: attributes.value,
    costPrice: Number(form.costPrice),
    sellingPrice: Number(form.sellingPrice),
    currency: form.currency,
    minimumStock: Number(form.minimumStock),
  }

  if (isEditMode.value) {
    const data: UpdateProductVariantInput = {
      ...common,
      status: form.status,
    }

    emit('submit', data)
    return
  }

  const data: CreateProductVariantInput = {
    ...common,
    stockQuantity: Number(form.stockQuantity),
  }

  emit('submit', data)
}
</script>

<template>
  <div class="variant-form-overlay">
    <section class="variant-form">
      <header class="form-header">
        <div>
          <h2>
            {{ isEditMode ? 'Edit Variant' : 'Create Variant' }}
          </h2>
          <p>
            {{ product.name }} — Manage variant information.
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          :disabled="submitting"
          aria-label="Close form"
          @click="emit('cancel')"
        >
          ×
        </button>
      </header>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="form-error">
          {{ error }}
        </div>

        <section class="form-section">
          <h3>Basic Information</h3>

          <div class="form-grid">
            <div class="field full-width">
              <label for="variant-sku">SKU *</label>
              <input
                id="variant-sku"
                v-model="form.sku"
                type="text"
                maxlength="50"
                placeholder="e.g. SHIRT-RED-M"
                required
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="variant-barcode">Barcode</label>
              <input
                id="variant-barcode"
                v-model="form.barcode"
                type="text"
                placeholder="Enter barcode"
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="variant-barcode-type">Barcode Type</label>
              <select
                id="variant-barcode-type"
                v-model="form.barcodeType"
                :disabled="submitting || !form.barcode.trim()"
              >
                <option value="CODE128">CODE128</option>
                <option value="EAN13">EAN13</option>
                <option value="UPC">UPC</option>
                <option value="EAN8">EAN8</option>
                <option value="QR">QR</option>
              </select>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Variant Attributes</h3>

          <p class="section-description">
            Select values defined by the parent product.
          </p>

          <div class="form-grid">
            <div
              v-for="definition in attributeDefinitions"
              :key="definition.name"
              class="field"
            >
              <label :for="`variant-attribute-${definition.name}`">
                {{ definition.name }} *
              </label>

              <select
                :id="`variant-attribute-${definition.name}`"
                v-model="selectedAttributes[definition.name]"
                required
                :disabled="submitting"
              >
                <option value="" disabled>
                  Select {{ definition.name }}
                </option>

                <option
                  v-for="value in definition.values"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3>Pricing & Inventory</h3>

          <div class="form-grid">
            <div class="field">
              <label for="variant-cost-price">Cost Price *</label>
              <input
                id="variant-cost-price"
                v-model.number="form.costPrice"
                type="number"
                min="0"
                step="any"
                required
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="variant-selling-price">Selling Price *</label>
              <input
                id="variant-selling-price"
                v-model.number="form.sellingPrice"
                type="number"
                min="0"
                step="any"
                required
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="variant-currency">Currency *</label>
              <select
                id="variant-currency"
                v-model="form.currency"
                :disabled="submitting"
              >
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>

            <div v-if="!isEditMode" class="field">
              <label for="variant-stock">Opening Stock *</label>
              <input
                id="variant-stock"
                v-model.number="form.stockQuantity"
                type="number"
                min="0"
                step="1"
                required
                :disabled="submitting"
              />
            </div>

            <div class="field">
              <label for="variant-minimum-stock">Minimum Stock *</label>
              <input
                id="variant-minimum-stock"
                v-model.number="form.minimumStock"
                type="number"
                min="0"
                step="1"
                required
                :disabled="submitting"
              />
            </div>

            <div v-if="isEditMode" class="field">
              <label for="variant-status">Status</label>
              <select
                id="variant-status"
                v-model="form.status"
                :disabled="submitting"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <footer class="form-actions">
          <button
            type="button"
            class="cancel-button"
            :disabled="submitting"
            @click="emit('cancel')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="submit-button"
            :disabled="submitting"
          >
            {{ submitting ? 'Saving...' : isEditMode ? 'Update Variant' : 'Create Variant' }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.variant-form-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgb(15 23 42 / 50%);
  backdrop-filter: blur(2px);
}

.variant-form {
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  box-shadow: 0 20px 60px rgb(0 0 0 / 18%);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 22px 26px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 19px;
  }

  p {
    margin: 6px 0 0;
    color: #94a3b8;
    font-size: 12px;
  }
}

.close-button {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 25px;
  cursor: pointer;
}

form {
  padding: 0 26px 24px;
}

.form-section {
  padding-top: 22px;

  h3 {
    margin: 0 0 14px;
    color: #334155;
    font-size: 14px;
    font-weight: 600;
  }
}

.section-description {
  margin: -5px 0 14px;
  color: #94a3b8;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;

  label {
    color: #475569;
    font-size: 12px;
    font-weight: 500;
  }

  input,
  select {
    width: 100%;
    min-height: 39px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #334155;
    font-size: 13px;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #2563eb;
  }

  input:disabled,
  select:disabled {
    background: #f8fafc;
    cursor: not-allowed;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.form-error {
  margin-top: 18px;
  padding: 11px 13px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 24px;

  button {
    min-height: 40px;
    padding: 9px 16px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }
}

.cancel-button {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.submit-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: white;
}

@media (max-width: 600px) {
  .variant-form-overlay {
    padding: 10px;
  }

  .variant-form {
    max-height: 95vh;
  }

  .form-header {
    padding: 18px;
  }

  form {
    padding: 0 18px 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>
