<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  WandSparkles,
  Keyboard,
  Ban,
  CheckCircle2,
  Info,
  ImagePlus,
  Upload,
  Trash2,
} from 'lucide-vue-next'

import type {
  BarcodeType,
  CreateProductInput,
  ProductCurrency,
  ProductType,
  Product,
  ProductAttributeDefinition,
} from '@app-types/product'

import type { Category } from '@app-types/category'
import type { Unit } from '@app-types/unit'

type BarcodeMode = 'auto' | 'manual' | 'none'

interface ProductFormSubmitPayload {
  data: CreateProductInput
  imageFile: File | null
  removeImage: boolean
}

const props = defineProps<{
  businessId: string
  submitting: boolean
  initialProduct?: Product | null
  initialImageUrl?: string | null
  categories?: Category[]
  units: Unit[]
  hasExistingVariants?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: ProductFormSubmitPayload]
  cancel: []
}>()

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const error = ref<string | null>(null)

const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const removeImage = ref(false)
const localPreviewUrl = ref<string | null>(null)

const previewImageUrl = computed(() => {
  if (localPreviewUrl.value) {
    return localPreviewUrl.value
  }

  if (removeImage.value) {
    return null
  }

  return props.initialImageUrl ?? null
})

const barcodeMode = ref<BarcodeMode>(
  !props.initialProduct?.barcode
    ? 'none'
    : props.initialProduct.barcode.startsWith('BF')
      ? 'auto'
      : 'manual',
)

const availableCategories = computed(() => {
  const activeCategories = props.categories?.filter(
    category => category.isActive,
  ) ?? []

  const currentcategory = props.initialProduct?.category

  if (!currentcategory) {
    return activeCategories
  }

  const currentCategory = props.categories?.find(
    category => category.id === currentcategory,
  )

  if (currentCategory && !currentCategory.isActive) {
    return [...activeCategories, currentCategory]
  }

  return activeCategories
})


const availableUnits = computed(() => {
  const activeUnits = props.units.filter(unit => unit.isActive)
  const currentUnit = props.initialProduct?.unit

  if (
    currentUnit &&
    !activeUnits.some(unit => unit.id === currentUnit.id)
  ) {
    return [
      ...activeUnits,
      {
        id: currentUnit.id,
        name: currentUnit.name,
        symbol: currentUnit.symbol,
        isActive: false,
      },
    ]
  }

  return activeUnits
})

function generateInternalBarcode(): string {
  return `BF${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
}

const form = reactive({
  name: props.initialProduct?.name ?? '',
  sku: props.initialProduct?.type === 'standard' ? props.initialProduct.sku : '',
  barcode: props.initialProduct?.type === 'standard'
    ? props.initialProduct.barcode ?? ''
    : generateInternalBarcode(),
  barcodeType: (props.initialProduct?.type === 'standard'
    ? props.initialProduct.barcodeType ?? 'CODE128'
    : 'CODE128') as BarcodeType,
  description: props.initialProduct?.description ?? '',
  category: props.initialProduct?.category ?? '',
  type: (props.initialProduct?.type ?? 'standard') as ProductType,
  unit: props.initialProduct?.unit.id ?? props.units.find(unit => unit.isActive)?.id ?? '',
  costPrice: props.initialProduct?.type === 'standard' ? props.initialProduct.costPrice : 0,
  sellingPrice: props.initialProduct?.type === 'standard' ? props.initialProduct.sellingPrice : 0,
  currency: (props.initialProduct?.currency ?? 'USD') as ProductCurrency,
  minimumStock: props.initialProduct?.type === 'standard' ? props.initialProduct.minimumStock : 0,
})

const attributeDefinitions = reactive(
  (props.initialProduct?.type === 'variant'
    ? props.initialProduct.attributeDefinitions
    : [{ name: '', values: [] }])
    .map(attribute => ({
      name: attribute.name,
      valuesText: attribute.values.join(', '),
    })),
)

function addAttributeDefinition() {
  if (attributeDefinitions.length >= 20) return
  attributeDefinitions.push({ name: '', valuesText: '' })
}

function removeAttributeDefinition(index: number) {
  if (attributeDefinitions.length <= 1) return
  attributeDefinitions.splice(index, 1)
}

function getAttributeDefinitions(): ProductAttributeDefinition[] {
  return attributeDefinitions.map(attribute => ({
    name: attribute.name.trim(),
    values: attribute.valuesText
      .split(',')
      .map(value => value.trim())
      .filter(Boolean),
  }))
}

watch(
  () => props.categories,
  (categories) => {
    if (props.initialProduct || form.category) return

    const firstActiveCategory = categories?.find(
      category => category.isActive,
    )

    if (firstActiveCategory) {
      form.category = firstActiveCategory.id
    }
  },
  { immediate: true },
)

watch(
  () => props.units,
  (units) => {
    if (props.initialProduct || form.unit) return

    const firstActiveUnit = units.find(unit => unit.isActive)

    if (firstActiveUnit) {
      form.unit = firstActiveUnit.id
    }
  },
  { immediate: true },
)

function openImagePicker() {
  if (props.submitting) return

  imageInput.value?.click()
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    error.value = 'Only JPG, PNG, and WebP images are allowed.'
    input.value = ''
    return
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    error.value = 'Image size must be greater than 0 and not exceed 5 MB.'
    input.value = ''
    return
  }

  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }

  imageFile.value = file
  removeImage.value = false
  localPreviewUrl.value = URL.createObjectURL(file)

  error.value = null
}

function handleRemoveImage() {
  if (props.submitting) return

  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }

  imageFile.value = null
  removeImage.value = Boolean(props.initialImageUrl)

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function handleBarcodeModeChange(mode: BarcodeMode) {
  barcodeMode.value = mode

  if (mode === 'auto') {
    form.barcode = generateInternalBarcode()
    form.barcodeType = 'CODE128'
  }

  if (mode === 'manual') {
    form.barcode = ''
    form.barcodeType = 'CODE128'
  }

  if (mode === 'none') {
    form.barcode = ''
    form.barcodeType = 'CODE128'
  }

  error.value = null
}

function validateBarcode(): string | null {
  if (barcodeMode.value === 'none') {
    return null
  }

  if (!form.barcode.trim()) {
    return 'Barcode is required.'
  }

  const barcode = form.barcode.trim()

  if (form.barcodeType === 'EAN13' && !/^\d{13}$/.test(barcode)) {
    return 'EAN13 barcode must contain exactly 13 digits.'
  }

  if (form.barcodeType === 'UPC' && !/^\d{12}$/.test(barcode)) {
    return 'UPC barcode must contain exactly 12 digits.'
  }

  if (form.barcodeType === 'EAN8' && !/^\d{8}$/.test(barcode)) {
    return 'EAN8 barcode must contain exactly 8 digits.'
  }

  return null
}

function validateForm(): string | null {
  if (!form.name.trim()) {
    return 'Product name is required.'
  }

  if (form.type === 'standard' && !form.sku.trim()) {
    return 'Product SKU is required.'
  }

  if (!form.category) {
    return 'Please select a category.'
  }

  if (!form.unit) {
    return 'Please select a product unit.'
  }

  const selectedUnit = availableUnits.value.find(
    unit => unit.id === form.unit,
  )

  if (!selectedUnit) {
    return 'Please select a valid product unit.'
  }

  if (
    !selectedUnit.isActive &&
    selectedUnit.id !== props.initialProduct?.unit.id
  ) {
    return 'Please select an active product unit.'
  }

  if (form.type === 'variant') {
    const definitions = getAttributeDefinitions()

    if (!definitions.length || definitions.length > 20) {
      return 'Variant products require between 1 and 20 attributes.'
    }

    if (definitions.some(attribute =>
      !attribute.name || !attribute.values.length,
    )) {
      return 'Each attribute needs a name and at least one value.'
    }

    if (definitions.some(attribute =>
      attribute.values.length > 100 ||
      attribute.values.some(value => value.length > 100),
    )) {
      return 'Each attribute can contain up to 100 values, each up to 100 characters.'
    }

    const names = definitions.map(attribute => attribute.name.toLowerCase())
    if (new Set(names).size !== names.length) {
      return 'Attribute names must be unique.'
    }

    return null
  }

  if (!Number.isFinite(form.costPrice) || form.costPrice < 0) {
    return 'Cost price must be a valid non-negative number.'
  }

  if (!Number.isFinite(form.sellingPrice) || form.sellingPrice < 0) {
    return 'Selling price must be a valid non-negative number.'
  }

  if (!Number.isFinite(form.minimumStock) || form.minimumStock < 0) {
    return 'Minimum stock must be a valid non-negative number.'
  }

  return validateBarcode()
}

function handleSubmit() {
  if (props.submitting) return

  error.value = validateForm()

  if (error.value) return

  if (!props.businessId) {
    error.value = 'Business information is not available.'
    return
  }

  const common = {
    businessId: props.businessId,
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    unit: form.unit,
  }

  const data: CreateProductInput = form.type === 'variant'
    ? {
      ...common,
      type: 'variant',
      attributeDefinitions: getAttributeDefinitions(),
    }
    : {
      ...common,
      type: 'standard',
      sku: form.sku.trim().toUpperCase(),
      barcode: barcodeMode.value === 'none' ? null : form.barcode.trim(),
      barcodeType: barcodeMode.value === 'none' ? null : form.barcodeType,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      currency: form.currency,
      minimumStock: Number(form.minimumStock),
    }

  emit('submit', {
    data,
    imageFile: imageFile.value,
    removeImage: removeImage.value,
  })
}

const isAttributeDefinitionsReadOnly = computed(() =>
  props.initialProduct?.type === 'variant' &&
  props.hasExistingVariants === true,
)

onBeforeUnmount(() => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
})
</script>

<template>
  <div class="product-form-overlay">
    <section class="product-form">
      <header class="form-header">
        <div>
          <h2>{{ props.initialProduct ? 'Edit Product' : 'Create Product' }}</h2>
          <p>
            {{
              props.initialProduct
                ? 'Update the information of this product.'
                : 'Add a new product to your business.'
            }}
          </p>
        </div>

        <button type="button" class="close-button" aria-label="Close form" :disabled="props.submitting"
          @click="emit('cancel')">
          ×
        </button>
      </header>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="form-error">
          {{ error }}
        </div>

        <!-- Product Image -->
        <section class="form-section">
          <h3>Product Image</h3>

          <div class="image-upload-area">
            <input ref="imageInput" type="file" accept="image/jpeg,image/png,image/webp" hidden
              :disabled="props.submitting" @change="handleImageChange" />

            <div v-if="previewImageUrl" class="image-preview">
              <img :src="previewImageUrl" alt="Product preview" />

              <span class="image-preview-label">
                Product Image
              </span>
            </div>

            <div v-else class="image-placeholder">
              <ImagePlus :size="32" :stroke-width="1.5" />
              <strong>No product image</strong>
              <span>upload an image for this product</span>
            </div>

            <div class="image-upload-actions">
              <button type="button" class="upload-image-button" :disabled="props.submitting" @click="openImagePicker">
                <Upload :size="16" />

                {{ previewImageUrl ? 'Change Image' : 'Upload Image' }}
              </button>

              <button v-if="previewImageUrl || imageFile" type="button" class="remove-image-button"
                :disabled="props.submitting" @click="handleRemoveImage">
                <Trash2 :size="16" />
                Remove
              </button>
            </div>

            <small class="image-upload-hint">
              Supported formats: JPG, PNG, WebP. Maximum size: 5 MB.
            </small>
          </div>
        </section>

        <!-- Basic Information -->
        <section class="form-section">
          <h3>Basic Information</h3>

          <div class="form-grid">
            <div class="field full-width">
              <label for="product-name">Product Name *</label>
              <input id="product-name" v-model="form.name" type="text" placeholder="Enter product name" required
                :disabled="props.submitting" />
            </div>

            <div v-if="form.type === 'standard'" class="field">
              <label for="product-sku">SKU *</label>
              <input id="product-sku" v-model="form.sku" type="text" placeholder="e.g. MOUSE-001" required
                :disabled="props.submitting" />
            </div>

            <div class="field">
              <label for="product-category">Category *</label>
              <select id="product-category" v-model="form.category" required :disabled="props.submitting">
                <option value="" disabled>
                  Select a category
                </option>

                <option v-for="category in availableCategories" :key="category.id" :value="category.id">
                  {{ category.name }}{{ !category.isActive ? ' (Inactive)' : '' }}
                </option>

              </select>

              <small v-if="availableCategories.length === 0">
                No active categories available. Create a category before adding a product.
              </small>

            </div>

            <div class="field">
              <label for="product-type">Product Type *</label>
              <select id="product-type" v-model="form.type"
                :disabled="props.submitting || Boolean(props.initialProduct)">
                <option value="standard">Standard</option>
                <option value="variant">Variant</option>
              </select>
            </div>

            <div class="field">
              <label for="product-unit">Unit *</label>
              <select id="product-unit" v-model="form.unit" required
                :disabled="props.submitting || availableUnits.length === 0">
                <option value="" disabled>Select a unit</option>
                <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">
                  {{ unit.name }} ({{ unit.symbol }}){{ !unit.isActive ? ' — Inactive (current)' : '' }}
                </option>
              </select>

              <p v-if="availableUnits.length === 0" class="field-hint">
                No active units available. Please create an active unit first.
              </p>
            </div>

            <div class="field full-width">
              <label for="product-description">Description</label>
              <textarea id="product-description" v-model="form.description" rows="3"
                placeholder="Enter product description" :disabled="props.submitting" />
            </div>
          </div>
        </section>

        <!-- Variant Attributes -->
        <section v-if="form.type === 'variant'" class="form-section">
          <h3>Variant Attributes</h3>

          <p class="section-description">
            Define the options customers can choose, such as Color and Size.
            Separate multiple values with commas.
          </p>

          <p v-if="isAttributeDefinitionsReadOnly" class="attribute-readonly-message">
            You can add new values, but existing attribute names and attributes cannot be removed while variants exist.
          </p>

          <div v-for="(attribute, index) in attributeDefinitions" :key="index" class="form-grid"
            style="margin-bottom: 12px">
            <div class="field">
              <label :for="`attribute-name-${index}`">Attribute Name</label>

              <input :id="`attribute-name-${index}`" v-model="attribute.name" type="text" maxlength="50"
                placeholder="e.g. Color" :disabled="props.submitting || isAttributeDefinitionsReadOnly" />
            </div>

            <div class="field">
              <label :for="`attribute-values-${index}`">Values</label>

              <input :id="`attribute-values-${index}`" v-model="attribute.valuesText" type="text"
                placeholder="e.g. Red, Blue, Black" :disabled="props.submitting" />
            </div>

            <div class="field full-width">
              <button v-if="attributeDefinitions.length > 1" type="button" class="remove-image-button"
                :disabled="props.submitting || isAttributeDefinitionsReadOnly"
                @click="removeAttributeDefinition(index)">
                <Trash2 :size="15" />
                Remove Attribute
              </button>
            </div>
          </div>

          <button type="button" class="upload-image-button" :disabled="props.submitting ||
            Boolean(props.initialProduct) ||
            attributeDefinitions.length >= 20
            " @click="addAttributeDefinition">
            Add Attribute
          </button>
        </section>

        <!-- Barcode -->
        <section v-if="form.type === 'standard'" class="form-section">
          <h3>Barcode</h3>

          <p class="section-description">
            Choose how you want to assign a barcode to this product.
          </p>

          <div class="barcode-modes">
            <button type="button" class="barcode-mode" :class="{ selected: barcodeMode === 'auto' }"
              :disabled="props.submitting" @click="handleBarcodeModeChange('auto')">
              <span class="mode-icon">
                <WandSparkles :size="22" :stroke-width="1.8" />
              </span>

              <span class="mode-content">
                <strong>Auto Generate</strong>
                <small>Generate an internal CODE128 barcode.</small>
              </span>

              <CheckCircle2 v-if="barcodeMode === 'auto'" :size="20" class="selected-icon" />
            </button>

            <button type="button" class="barcode-mode" :class="{ selected: barcodeMode === 'manual' }"
              :disabled="props.submitting" @click="handleBarcodeModeChange('manual')">
              <span class="mode-icon">
                <Keyboard :size="22" :stroke-width="1.8" />
              </span>

              <span class="mode-content">
                <strong>Manual Entry</strong>
                <small>Enter an existing barcode yourself.</small>
              </span>

              <CheckCircle2 v-if="barcodeMode === 'manual'" :size="20" class="selected-icon" />
            </button>

            <button type="button" class="barcode-mode" :class="{ selected: barcodeMode === 'none' }"
              :disabled="props.submitting" @click="handleBarcodeModeChange('none')">
              <span class="mode-icon">
                <Ban :size="22" :stroke-width="1.8" />
              </span>

              <span class="mode-content">
                <strong>No Barcode</strong>
                <small>Create this product without a barcode.</small>
              </span>

              <CheckCircle2 v-if="barcodeMode === 'none'" :size="20" class="selected-icon" />
            </button>
          </div>

          <div v-if="barcodeMode !== 'none'" class="barcode-fields">
            <div class="field">
              <label for="product-barcode">Barcode *</label>

              <input id="product-barcode" v-model="form.barcode" type="text" :readonly="barcodeMode === 'auto'"
                :placeholder="barcodeMode === 'auto'
                  ? 'Generated automatically'
                  : 'Enter barcode value'" :disabled="props.submitting" />

              <small v-if="barcodeMode === 'auto'">
                Automatically generated internal barcode.
              </small>
            </div>

            <div class="field">
              <label for="product-barcode-type">Barcode Type *</label>

              <select id="product-barcode-type" v-model="form.barcodeType"
                :disabled="barcodeMode === 'auto' || props.submitting">
                <option value="CODE128">CODE128</option>
                <option value="EAN13">EAN13</option>
                <option value="UPC">UPC</option>
                <option value="EAN8">EAN8</option>
                <option value="QR">QR Code</option>
              </select>

              <small>
                {{
                  barcodeMode === 'auto'
                    ? 'Internal barcodes always use CODE128.'
                    : 'Select the format of your existing barcode.'
                }}
              </small>
            </div>
          </div>

          <div v-if="barcodeMode === 'auto'" class="barcode-notice">
            <Info :size="16" :stroke-width="1.8" />

            <span>
              This is an internal BizzFlow barcode, not an official
              manufacturer barcode.
            </span>
          </div>
        </section>

        <!-- Pricing & Inventory -->
        <section v-if="form.type === 'standard'" class="form-section">
          <h3>Pricing & Inventory</h3>

          <div class="form-grid">
            <div class="field">
              <label for="product-cost">Cost Price *</label>

              <input id="product-cost" v-model.number="form.costPrice" type="number" min="0" step="any" required
                :disabled="props.submitting" />
            </div>

            <div class="field">
              <label for="product-selling">Selling Price *</label>

              <input id="product-selling" v-model.number="form.sellingPrice" type="number" min="0" step="any" required
                :disabled="props.submitting" />
            </div>

            <div class="field">
              <label for="product-currency">Currency *</label>

              <select id="product-currency" v-model="form.currency" :disabled="props.submitting">
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>

            <div class="field">
              <label for="product-minimum-stock">Minimum Stock *</label>

              <input id="product-minimum-stock" v-model.number="form.minimumStock" type="number" min="0" step="any"
                required :disabled="props.submitting" />
            </div>
          </div>
        </section>

        <!-- Actions -->
        <footer class="form-actions">
          <button type="button" class="cancel-button" :disabled="props.submitting" @click="emit('cancel')">
            Cancel
          </button>

          <button type="submit" class="submit-button" :disabled="props.submitting">
            {{
              props.submitting
                ? 'Saving...'
                : props.initialProduct
                  ? 'Update Product'
                  : 'Create Product'
            }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.product-form-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(15 23 42 / 45%);
}

.product-form {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 50px rgb(0 0 0 / 15%);
}

.form-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 20px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: #737373;
    font-size: 13px;
  }
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 23px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

form {
  padding: 0 24px 24px;
}

.form-section {
  padding: 22px 0;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0 0 18px;
    color: #111827;
    font-size: 15px;
    font-weight: 600;
  }
}

.section-description {
  margin: -10px 0 16px;
  color: #737373;
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
    color: #374151;
    font-size: 13px;
    font-weight: 500;
  }

  input,
  select,
  textarea {
    width: 100%;
    min-height: 40px;
    padding: 9px 11px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    background: #fff;
    color: #111827;
    font: inherit;
    font-size: 13px;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
    }

    &:disabled {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }

    &:read-only {
      background: #f3f4f6;
      color: #4b5563;
      cursor: default;
    }
  }

  textarea {
    resize: vertical;
  }

  small {
    color: #737373;
    font-size: 11px;
  }
}

.full-width {
  grid-column: 1 / -1;
}

/* Product image upload */

.image-upload-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.image-preview,
.image-placeholder {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  overflow: hidden;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
}

.image-preview {
  background: #f9fafb;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.image-preview-label {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 4px 7px;
  border-radius: 4px;
  background: rgb(17 24 39 / 75%);
  color: #fff;
  font-size: 10px;
}

.image-placeholder {
  flex-direction: column;
  gap: 8px;
  background: #f9fafb;
  color: #9ca3af;

  strong {
    color: #4b5563;
    font-size: 12px;
    font-weight: 500;
  }

  span {
    font-size: 10px;
    text-align: center;
  }
}

.image-upload-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.upload-image-button,
.remove-image-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.upload-image-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }
}

.remove-image-button {
  color: #dc2626;

  &:hover:not(:disabled) {
    background: #fef2f2;
  }
}

.image-upload-hint {
  color: #737373;
  font-size: 11px;
}

/* Barcode */

.barcode-modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.barcode-mode {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  padding: 12px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    border-color: #93c5fd;
  }

  &.selected {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #4b5563;
}

.barcode-mode.selected .mode-icon {
  background: #dbeafe;
  color: #2563eb;
}

.mode-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  strong {
    color: #1f2937;
    font-size: 12px;
    font-weight: 600;
  }

  small {
    color: #737373;
    font-size: 10px;
    line-height: 1.4;
  }
}

.selected-icon {
  flex-shrink: 0;
  color: #2563eb;
}

.barcode-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.barcode-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  line-height: 1.5;

  :deep(svg) {
    flex-shrink: 0;
    margin-top: 1px;
  }
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

/* Form actions */

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 22px;

  button {
    min-height: 40px;
    padding: 9px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.cancel-button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.submit-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

@media (max-width: 600px) {
  .product-form-overlay {
    padding: 10px;
  }

  .product-form {
    max-height: 95vh;
  }

  .form-header {
    padding: 18px;
  }

  form {
    padding: 0 18px 18px;
  }

  .form-grid,
  .barcode-fields {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .barcode-modes {
    grid-template-columns: 1fr;
  }
}
</style>
