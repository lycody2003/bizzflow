<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import type {
  Product,
  ProductVariant,
} from '@app-types/product'

import type {
  CreateStockAdjustmentInput,
} from '@app-types/inventory'

const props = defineProps<{
  businessId: string
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [data: CreateStockAdjustmentInput]
}>()

const {
  $productService,
  $productVariantService,
} = useNuxtApp()

const products = ref<Product[]>([])
const variants = ref<ProductVariant[]>([])

const selectedProductId = ref('')
const selectedVariantId = ref('')
const adjustmentType = ref<'adjustment_in' | 'adjustment_out'>('adjustment_in')
const quantity = ref(1)
const reason = ref('')

const loadingProducts = ref(false)
const loadingVariants = ref(false)
const error = ref<string | null>(null)

let productRequestId = 0
let variantRequestId = 0

const selectedProduct = computed(() =>
  products.value.find(product => product.id === selectedProductId.value) ?? null,
)

const isVariantProduct = computed(() =>
  selectedProduct.value?.type === 'variant',
)

const canSubmit = computed(() => {
  return Boolean(
    props.businessId &&
    selectedProduct.value &&
    (!isVariantProduct.value || selectedVariantId.value) &&
    Number.isInteger(quantity.value) &&
    quantity.value >= 1 &&
    reason.value.trim() &&
    !props.submitting &&
    !loadingVariants.value,
  )
})

async function loadProducts() {
  const currentRequestId = ++productRequestId
  loadingProducts.value = true
  error.value = null

  try {
    const result = await $productService.getProducts(props.businessId)

    if (
      currentRequestId !== productRequestId ||
      !props.businessId
    ) {
      return
    }

    products.value = result.filter(product => product.status === 'active')
  } catch (err) {
    if (currentRequestId !== productRequestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load products.'
  } finally {
    if (currentRequestId === productRequestId) {
      loadingProducts.value = false
    }
  }
}

async function loadVariants(productId: string) {
  const currentRequestId = ++variantRequestId

  variants.value = []
  selectedVariantId.value = ''

  if (!productId || !isVariantProduct.value) return

  loadingVariants.value = true
  error.value = null

  try {
    const result = await $productVariantService.getVariants(
      productId,
      props.businessId,
    )

    if (
      currentRequestId !== variantRequestId ||
      selectedProductId.value !== productId
    ) {
      return
    }

    variants.value = result.filter(variant => variant.status === 'active')
  } catch (err) {
    if (currentRequestId !== variantRequestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load product variants.'
  } finally {
    if (currentRequestId === variantRequestId) {
      loadingVariants.value = false
    }
  }
}

watch(selectedProductId, productId => {
  void loadVariants(productId)
})

watch(
  () => props.businessId,
  () => {
    productRequestId++
    variantRequestId++

    products.value = []
    variants.value = []
    selectedProductId.value = ''
    selectedVariantId.value = ''

    if (props.businessId) {
      void loadProducts()
    }
  },
)

function handleSubmit() {
  if (!canSubmit.value || !selectedProduct.value) return

  const payload: CreateStockAdjustmentInput = {
    productId: selectedProduct.value.id,
    ...(isVariantProduct.value
      ? { variantId: selectedVariantId.value }
      : {}),
    type: adjustmentType.value,
    quantity: quantity.value,
    reason: reason.value.trim(),
    idempotencyKey: crypto.randomUUID(),
  }

  emit('submit', payload)
}

onMounted(() => {
  if (props.businessId) {
    void loadProducts()
  }
})
</script>

<template>
  <form class="adjustment-form" @submit.prevent="handleSubmit">
    <div v-if="error" class="form-error">
      <Icon name="lucide:alert-circle" />
      {{ error }}
    </div>

    <div class="form-field">
      <label for="adjustment-product">Product</label>

      <select
        id="adjustment-product"
        v-model="selectedProductId"
        required
        :disabled="loadingProducts || submitting"
      >
        <option value="" disabled>
          {{ loadingProducts ? 'Loading products...' : 'Select product' }}
        </option>

        <option
          v-for="product in products"
          :key="product.id"
          :value="product.id"
        >
          {{ product.name }}
          {{ product.type === 'variant' ? '(Variants)' : '' }}
        </option>
      </select>
    </div>

    <div v-if="isVariantProduct" class="form-field">
      <label for="adjustment-variant">Product Variant</label>

      <select
        id="adjustment-variant"
        v-model="selectedVariantId"
        required
        :disabled="loadingVariants || submitting"
      >
        <option value="" disabled>
          {{ loadingVariants ? 'Loading variants...' : 'Select variant' }}
        </option>

        <option
          v-for="variant in variants"
          :key="variant.id"
          :value="variant.id"
        >
          {{ variant.sku }} —
          {{ variant.attributes.map(attribute => `${attribute.name}: ${attribute.value}`).join(', ') }}
        </option>
      </select>

      <p v-if="!loadingVariants && variants.length === 0 && selectedProductId" class="field-hint">
        No active variants available for this product.
      </p>
    </div>

    <div class="form-field">
      <label>Adjustment Type</label>

      <div class="adjustment-types">
        <button
          type="button"
          :class="{ active: adjustmentType === 'adjustment_in' }"
          :disabled="submitting"
          @click="adjustmentType = 'adjustment_in'"
        >
          <Icon name="lucide:plus-circle" />
          Adjustment In
        </button>

        <button
          type="button"
          :class="{ active: adjustmentType === 'adjustment_out' }"
          :disabled="submitting"
          @click="adjustmentType = 'adjustment_out'"
        >
          <Icon name="lucide:minus-circle" />
          Adjustment Out
        </button>
      </div>
    </div>

    <div class="form-field">
      <label for="adjustment-quantity">Quantity</label>

      <input
        id="adjustment-quantity"
        v-model.number="quantity"
        type="number"
        min="1"
        step="1"
        required
        :disabled="submitting"
      />
    </div>

    <div class="form-field">
      <label for="adjustment-reason">Reason</label>

      <textarea
        id="adjustment-reason"
        v-model="reason"
        rows="4"
        maxlength="500"
        required
        placeholder="Enter the reason for this stock adjustment..."
        :disabled="submitting"
      />

      <p class="field-hint">
        {{ reason.length }}/500 characters
      </p>
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="submit-button"
        :disabled="!canSubmit"
      >
        <Icon v-if="submitting" name="lucide:loader-circle" />
        <Icon v-else name="lucide:check" />
        {{ submitting ? 'Saving...' : 'Save Adjustment' }}
      </button>
    </div>
  </form>
</template>

<style scoped lang="scss">
.adjustment-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 680px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    color: #334155;
    font-size: 13px;
    font-weight: 600;
  }

  select,
  input,
  textarea {
    width: 100%;
    min-height: 42px;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    background: #fff;
    color: #334155;
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px #2563eb18;
    }

    &:disabled {
      background: #f8fafc;
      cursor: not-allowed;
    }
  }

  textarea {
    resize: vertical;
  }
}

.adjustment-types {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #2563eb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.field-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px;
  border-radius: 7px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 10px 16px;
  border: 0;
  border-radius: 7px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@media (max-width: 600px) {
  .adjustment-form {
    padding: 16px;
  }

  .adjustment-types {
    grid-template-columns: 1fr;
  }
}
</style>
