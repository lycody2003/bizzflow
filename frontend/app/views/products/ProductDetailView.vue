<script setup lang="ts">
const productImageService = useProductImageService()
import { computed, onBeforeUnmount, ref, watch } from 'vue'


import useProductImageService from '@services/products/product-image.service'
import useBusiness from '@composables/useBusiness'

import ProductBarcode from '@components/products/ProductBarcode.vue'
import ProductForm from '@components/products/ProductForm.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'

import type { Category } from '@app-types/category'
import type { Unit } from '@app-types/unit'

import ProductVariantList from '@components/products/ProductVariantList.vue'
import ProductVariantForm from '@components/products/ProductVariantForm.vue'

import type {
  ProductVariant,
  VariantProduct,
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from '@app-types/product'

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@app-types/product'

interface ProductFormSubmitPayload {
  data: CreateProductInput
  imageFile: File | null
  removeImage: boolean
}

const props = defineProps<{
  productId: string
}>()

const categories = ref<Category[]>([])
const units = ref<Unit[]>([])

const { business, loadBusiness } = useBusiness()
const businessId = computed(() => business.value?.id ?? '')

const product = ref<Product | null>(null)
const hasExistingVariants = ref(false)

const loading = ref(false)
const saving = ref(false)

const showEditForm = ref(false)
const showConfirmation = ref(false)
// Product Variant state
const showVariantForm = ref(false)
const selectedVariant = ref<ProductVariant | null>(null)
const savingVariant = ref(false)
const variantListKey = ref(0)

const confirmationAction = ref<'archive' | 'restore'>('archive')

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const initialImageUrl = ref<string | null>(null)
const detailImageUrl = ref<string | null>(null)

const loadingProductImage = ref(false)
const loadingDetailImage = ref(false)

let requestId = 0
let imageRequestId = 0
let detailImageRequestId = 0

function revokeInitialImageUrl() {
  if (initialImageUrl.value) {
    URL.revokeObjectURL(initialImageUrl.value)
    initialImageUrl.value = null
  }
}

function revokeDetailImageUrl() {
  if (detailImageUrl.value) {
    URL.revokeObjectURL(detailImageUrl.value)
    detailImageUrl.value = null
  }
}

const confirmationTitle = computed(() =>
  confirmationAction.value === 'archive'
    ? 'Archive Product?'
    : 'Restore Product?',
)

const confirmationMessage = computed(() =>
  confirmationAction.value === 'archive'
    ? 'This product will no longer appear in Active Products. You can restore it later.'
    : 'This product will become active again and appear in Active Products.',
)

const confirmationText = computed(() =>
  confirmationAction.value === 'archive'
    ? 'Archive Product'
    : 'Restore Product',
)

const confirmationVariant = computed(() =>
  confirmationAction.value === 'archive'
    ? 'danger'
    : 'success',
)

async function loadDetailImage(
  productId: string,
  currentBusinessId: string,
) {
  const currentRequestId = ++detailImageRequestId

  revokeDetailImageUrl()
  loadingDetailImage.value = true

  try {
    const image = await productImageService.getImage(
      productId,
      currentBusinessId,
    )

    if (
      currentRequestId !== detailImageRequestId ||
      product.value?.id !== productId
    ) {
      return
    }

    detailImageUrl.value = image?.imageUrl ??
      (image?.blob ? URL.createObjectURL(image.blob) : null)
  } catch (err) {
    if (currentRequestId !== detailImageRequestId) return

    console.error('Unable to load product detail image:', err)
    detailImageUrl.value = null
  } finally {
    if (currentRequestId === detailImageRequestId) {
      loadingDetailImage.value = false
    }
  }
}

async function loadProduct() {
  const currentRequestId = ++requestId

  loading.value = true
  error.value = null

  try {
    await loadBusiness()

    if (currentRequestId !== requestId) return

    const currentBusinessId = businessId.value

    if (!currentBusinessId) {
      throw new Error('Business information is unavailable.')
    }

    try {
      categories.value = await $categoryService.getCategories(
        currentBusinessId,
        'all',
      )
    } catch (categoryError) {
      console.error('Unable to load product categories:', categoryError)
      categories.value = []
    }

    if (currentRequestId !== requestId) return

    try {
      const unitResult = await $unitService.getUnits(
        currentBusinessId,
        {
          status: 'all',
          page: 1,
          limit: 100,
        },
      )

      if (currentRequestId !== requestId) return

      units.value = unitResult.items
    } catch (unitError) {
      console.error('Unable to load product units:', unitError)
      units.value = []
    }

    if (currentRequestId !== requestId) return

    if (!props.productId) {
      throw new Error('Product ID is missing.')
    }

    const result = await productService.getProduct(
      props.productId,
      currentBusinessId,
    )

    if (currentRequestId !== requestId) return

    if (!result) {
      product.value = null
      revokeDetailImageUrl()
      throw new Error('Product not found.')
    }

    product.value = result

    if (result.type === 'variant') {
      const variants = await productVariantService.getVariants(
        result.id,
        currentBusinessId,
      )

      hasExistingVariants.value = variants.length > 0
    } else {
      hasExistingVariants.value = false
    }

    await loadDetailImage(
      result.id,
      currentBusinessId,
    )
  } catch (err) {
    if (currentRequestId !== requestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load product.'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

async function openEditForm() {
  if (
    !product.value ||
    product.value.status !== 'active' ||
    loadingProductImage.value
  ) {
    return
  }

  const currentProduct = product.value
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    error.value = 'Business information is unavailable.'
    return
  }

  revokeInitialImageUrl()

  showEditForm.value = false
  loadingProductImage.value = true

  const currentImageRequestId = ++imageRequestId

  try {
    const image = await productImageService.getImage(
      currentProduct.id,
      currentBusinessId,
    )

    if (
      currentImageRequestId !== imageRequestId ||
      product.value?.id !== currentProduct.id
    ) {
      return
    }

    initialImageUrl.value = image?.imageUrl ??
      (image?.blob ? URL.createObjectURL(image.blob) : null)

    showEditForm.value = true
    error.value = null
  } catch (err) {
    if (currentImageRequestId !== imageRequestId) return

    error.value = err instanceof Error
      ? `Unable to load product image: ${err.message}`
      : 'Unable to load product image.'
  } finally {
    if (currentImageRequestId === imageRequestId) {
      loadingProductImage.value = false
    }
  }
}

function closeEditForm() {
  if (saving.value) return

  imageRequestId++
  revokeInitialImageUrl()

  showEditForm.value = false
  loadingProductImage.value = false
}

async function handleUpdateProduct(payload: ProductFormSubmitPayload) {
  if (!product.value || saving.value) return

  const currentProduct = product.value
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    error.value = 'Business information is unavailable.'
    return
  }

  saving.value = true
  error.value = null
  successMessage.value = null

  let productUpdated = false

  try {
    const updateData: UpdateProductInput =
      payload.data.type === 'standard'
        ? {
          name: payload.data.name,
          sku: payload.data.sku,
          barcode: payload.data.barcode,
          barcodeType: payload.data.barcodeType,
          description: payload.data.description,
          category: payload.data.category,
          unit: payload.data.unit,
          costPrice: payload.data.costPrice,
          sellingPrice: payload.data.sellingPrice,
          currency: payload.data.currency,
          minimumStock: payload.data.minimumStock,
        }
        : {
          name: payload.data.name,
          description: payload.data.description,
          category: payload.data.category,
          unit: payload.data.unit,
          ...(hasExistingVariants.value
            ? {}
            : {
              attributeDefinitions: payload.data.attributeDefinitions,
            }),
        }

    await productService.updateProduct(
      currentProduct.id,
      currentBusinessId,
      updateData,
    )

    productUpdated = true

    if (payload.imageFile) {
      await productImageService.upload(
        currentProduct.id,
        currentBusinessId,
        payload.imageFile,
      )
    } else if (payload.removeImage) {
      await productImageService.delete(
        currentProduct.id,
        currentBusinessId,
      )
    }

    imageRequestId++
    revokeInitialImageUrl()

    showEditForm.value = false

    await loadProduct()

    if (!error.value) {
      successMessage.value = 'Product updated successfully.'
    }
  } catch (err) {
    if (productUpdated) {
      imageRequestId++
      revokeInitialImageUrl()

      showEditForm.value = false

      await loadProduct()

      error.value = err instanceof Error
        ? `Product details were updated, but the image change failed: ${err.message}`
        : 'Product details were updated, but the image change failed.'
    } else {
      error.value = err instanceof Error
        ? err.message
        : 'Unable to update product.'
    }
  } finally {
    saving.value = false
  }
}

function openCreateVariantForm() {
  if (
    !product.value ||
    product.value.type !== 'variant' ||
    product.value.status !== 'active' ||
    savingVariant.value
  ) {
    return
  }

  selectedVariant.value = null
  showVariantForm.value = true
  error.value = null
  successMessage.value = null
}

function openEditVariantForm(variant: ProductVariant) {
  if (
    !product.value ||
    product.value.type !== 'variant' ||
    product.value.status !== 'active' ||
    variant.status !== 'active' ||
    savingVariant.value
  ) {
    return
  }

  selectedVariant.value = variant
  showVariantForm.value = true
  error.value = null
  successMessage.value = null
}

function closeVariantForm() {
  if (savingVariant.value) return

  showVariantForm.value = false
  selectedVariant.value = null
}

async function handleVariantSubmit(
  payload: CreateProductVariantInput | UpdateProductVariantInput,
) {
  const currentProduct = product.value
  const currentBusinessId = businessId.value

  if (
    !currentProduct ||
    currentProduct.type !== 'variant' ||
    savingVariant.value
  ) {
    return
  }

  if (!currentBusinessId) {
    error.value = 'Business information is unavailable.'
    return
  }

  savingVariant.value = true
  error.value = null
  successMessage.value = null

  try {
    if (selectedVariant.value) {
      await productVariantService.updateVariant(
        currentProduct.id,
        selectedVariant.value.id,
        currentBusinessId,
        payload as UpdateProductVariantInput,
      )

      successMessage.value = 'Product variant updated successfully.'
    } else {
      await productVariantService.createVariant(
        currentProduct.id,
        currentBusinessId,
        payload as CreateProductVariantInput,
      )

      successMessage.value = 'Product variant created successfully.'
    }

    showVariantForm.value = false
    selectedVariant.value = null

    // Reload ProductVariantList
    variantListKey.value++
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to save product variant.'
  } finally {
    savingVariant.value = false
  }
}

function openArchiveConfirmation() {
  if (
    !product.value ||
    product.value.status !== 'active' ||
    saving.value
  ) {
    return
  }

  confirmationAction.value = 'archive'
  showConfirmation.value = true
}

function openRestoreConfirmation() {
  if (
    !product.value ||
    product.value.status !== 'inactive' ||
    saving.value
  ) {
    return
  }

  confirmationAction.value = 'restore'
  showConfirmation.value = true
}

function closeConfirmation() {
  if (saving.value) return

  showConfirmation.value = false
}

async function handleConfirmation() {
  if (!product.value || saving.value) return

  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    error.value = 'Business information is unavailable.'
    return
  }

  const action = confirmationAction.value
  const productId = product.value.id

  const newStatus = action === 'archive'
    ? 'inactive'
    : 'active'

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    await productService.updateProduct(
      productId,
      currentBusinessId,
      { status: newStatus },
    )

    showConfirmation.value = false

    await loadProduct()

    if (!error.value) {
      successMessage.value = action === 'archive'
        ? 'Product archived successfully.'
        : 'Product restored successfully.'
    }
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to update product status.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.productId,
  () => {
    requestId++
    imageRequestId++
    detailImageRequestId++

    revokeInitialImageUrl()
    revokeDetailImageUrl()

    showEditForm.value = false
    showConfirmation.value = false

    loadingProductImage.value = false
    loadingDetailImage.value = false

    successMessage.value = null
    product.value = null
    hasExistingVariants.value = false

    void loadProduct()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  requestId++
  imageRequestId++
  detailImageRequestId++

  revokeInitialImageUrl()
  revokeDetailImageUrl()
})
const {
  $productService: productService,
  $productVariantService: productVariantService,
  $categoryService,
  $unitService,
} = useNuxtApp()

</script>

<template>
  <div class="product-detail-view">
    <header class="page-header">
      <button type="button" class="back-button" @click="navigateTo('/products')">
        <Icon name="lucide:arrow-left" />
        Back to Products
      </button>

      <div v-if="product" class="header-actions">
        <template v-if="product.status === 'active'">
          <button type="button" class="edit-button" :disabled="saving || loadingProductImage" @click="openEditForm">
            <Icon name="lucide:pencil" />
            {{ loadingProductImage ? 'Loading...' : 'Edit Product' }}
          </button>

          <button type="button" class="archive-button" :disabled="saving" @click="openArchiveConfirmation">
            <Icon name="lucide:archive" />
            Archive
          </button>
        </template>

        <button v-else type="button" class="restore-button" :disabled="saving" @click="openRestoreConfirmation">
          <Icon name="lucide:archive-restore" />
          Restore Product
        </button>
      </div>
    </header>

    <div v-if="successMessage" class="success-message">
      <Icon name="lucide:check-circle" />
      {{ successMessage }}

      <button type="button" aria-label="Dismiss success message" @click="successMessage = null">
        ×
      </button>
    </div>

    <div v-if="error" class="error-message">
      <Icon name="lucide:alert-circle" />
      {{ error }}

      <button type="button" aria-label="Dismiss error message" @click="error = null">
        ×
      </button>
    </div>

    <div v-if="loading && !product" class="page-state">
      <Icon name="lucide:loader-circle" class="loading-icon" />
      Loading product...
    </div>

    <div v-else-if="product" class="product-content">
      <!-- Product image and summary -->
      <section class="product-hero">
        <div class="detail-product-image">
          <img v-if="detailImageUrl" :src="detailImageUrl" :alt="product.name" />

          <div v-else-if="loadingDetailImage" class="image-placeholder">
            <Icon name="lucide:loader-circle" class="loading-icon" />
            <span>Loading image...</span>
          </div>

          <div v-else class="image-placeholder">
            <Icon name="lucide:package" />
            <span>No product image</span>
          </div>
        </div>

        <div class="product-heading">
          <div class="product-title-row">
            <h1>{{ product.name }}</h1>

            <span class="status-badge" :class="product.status">
              {{ product.status }}
            </span>
          </div>

          <p v-if="product.description">
            {{ product.description }}
          </p>

          <div class="product-meta">
            <span>
              <Icon name="lucide:barcode" />
              SKU: {{ product.sku || 'N/A' }}
            </span>

            <span>
              <Icon name="lucide:tag" />
              {{ product.categoryName || 'General' }}
            </span>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="detail-card">
          <h2>Product Information</h2>

          <div class="detail-row">
            <span>Product Name</span>
            <strong>{{ product.name }}</strong>
          </div>

          <div class="detail-row">
            <span>SKU</span>
            <strong>{{ product.sku || 'N/A' }}</strong>
          </div>

          <div class="detail-row">
            <span>Barcode</span>
            <strong>{{ product.barcode || 'N/A' }}</strong>
          </div>

          <div class="detail-row">
            <span>Category</span>
            <strong>{{ product.categoryName || 'General' }}</strong>
          </div>

          <div class="detail-row">
            <span>Type</span>
            <strong>{{ product.type }}</strong>
          </div>

          <div class="detail-row">
            <span>Unit</span>
            <strong>{{ product.unit.name }} ({{ product.unit.symbol }})</strong>
          </div>

          <div class="detail-row">
            <span>Status</span>
            <strong>{{ product.status }}</strong>
          </div>
        </section>

        <section v-if="product.type === 'standard'" class="detail-card">
          <h2>Pricing</h2>

          <div class="detail-row">
            <span>Cost Price</span>
            <strong>
              {{ product.currency }}
              {{ product.costPrice.toFixed(2) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Selling Price</span>
            <strong class="selling-price">
              {{ product.currency }}
              {{ product.sellingPrice.toFixed(2) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Profit per Unit</span>
            <strong class="profit-value">
              {{ product.currency }}
              {{ (product.sellingPrice - product.costPrice).toFixed(2) }}
            </strong>
          </div>
        </section>

        <section v-if="product.type === 'standard'" class="detail-card">
          <h2>Inventory</h2>

          <div class="detail-row">
            <span>Current Stock</span>
            <strong>
              {{ product.currentStock }} {{ product.unit.symbol }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Minimum Stock</span>
            <strong>
              {{ product.minimumStock }} {{ product.unit.symbol }}
            </strong>
          </div>

          <div class="detail-row">
            <span>Stock Status</span>

            <strong :class="{
              'stock-low': product.currentStock <= product.minimumStock,
              'stock-normal': product.currentStock > product.minimumStock,
            }">
              {{
                product.currentStock <= 0 ? 'Out of Stock' : product.currentStock <= product.minimumStock ? 'Low Stock'
                  : 'In Stock' }} </strong>
          </div>
        </section>

        <section v-if="product.type === 'standard'" class="detail-card barcode-card">
          <h2>Barcode</h2>

          <ProductBarcode v-if="product.barcode && product.barcodeType" :value="product.barcode"
            :type="product.barcodeType" />

          <p v-else class="empty-barcode">
            No barcode available.
          </p>
        </section>
      </div>

      <ProductVariantList v-if="product.type === 'variant'" :key="variantListKey" :product-id="product.id"
        :business-id="businessId" @create="openCreateVariantForm" @edit="openEditVariantForm" />

      <section class="detail-card timestamps-card">
        <h2>Record Information</h2>

        <div class="detail-row">
          <span>Created At</span>
          <strong>
            {{ new Date(product.createdAt).toLocaleString() }}
          </strong>
        </div>

        <div class="detail-row">
          <span>Last Updated</span>
          <strong>
            {{ new Date(product.updatedAt).toLocaleString() }}
          </strong>
        </div>
      </section>
    </div>

    <div v-else-if="!loading" class="page-state">
      <Icon name="lucide:package-x" />
      <p>Product not found.</p>

      <button type="button" class="edit-button" @click="navigateTo('/products')">
        Back to Products
      </button>
    </div>

    <ProductForm v-if="showEditForm && product" :has-existing-variants="hasExistingVariants" :key="product.id"
      :business-id="businessId" :initial-product="product" :initial-image-url="initialImageUrl" :submitting="saving"
      :categories="categories" :units="units" @submit="handleUpdateProduct" @cancel="closeEditForm" />

    <ProductVariantForm v-if="showVariantForm && product?.type === 'variant'" :product="product as VariantProduct"
      :variant="selectedVariant" :submitting="savingVariant" @submit="handleVariantSubmit" @cancel="closeVariantForm" />

    <ConfirmationDialog v-model="showConfirmation" :title="confirmationTitle" :message="confirmationMessage"
      :item-name="product?.name ?? ''" :confirm-text="confirmationText" :variant="confirmationVariant" :loading="saving"
      @confirm="handleConfirmation" />
  </div>
</template>

<style lang="scss" scoped>
.product-detail-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.back-button,
.edit-button,
.archive-button,
.restore-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.back-button {
  border: none;
  padding-left: 0;
}

.edit-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.archive-button {
  border-color: #fecaca;
  color: #b91c1c;
}

.restore-button {
  border-color: #bbf7d0;
  color: #15803d;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* Product hero */
.product-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.detail-product-image {
  display: flex;
  flex: 0 0 190px;
  align-items: center;
  justify-content: center;
  width: 190px;
  height: 190px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  color: #94a3b8;
  font-size: 12px;

  :deep(svg) {
    font-size: 38px;
  }
}

.product-heading {
  flex: 1;
  min-width: 0;

  h1 {
    margin: 0;
    color: #111827;
    font-size: 25px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  p {
    margin: 12px 0;
    color: #737373;
    font-size: 14px;
    line-height: 1.6;
  }
}

.product-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #64748b;
    font-size: 12px;
  }
}

.status-badge {
  padding: 4px 9px;
  border-radius: 20px;
  font-size: 11px;
  text-transform: capitalize;

  &.active {
    background: #dcfce7;
    color: #15803d;
  }

  &.inactive {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.detail-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;

  h2 {
    margin: 0 0 18px;
    color: #111827;
    font-size: 15px;
    font-weight: 600;
  }
}

.detail-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  span {
    color: #737373;
  }

  strong {
    color: #111827;
    text-align: right;
    overflow-wrap: anywhere;
  }
}

.selling-price,
.profit-value,
.stock-normal {
  color: #15803d !important;
}

.stock-low {
  color: #d97706 !important;
}

.barcode-card {
  display: flex;
  flex-direction: column;
}

.empty-barcode {
  color: #9ca3af;
  font-size: 13px;
}

.timestamps-card {
  margin-top: 18px;
}

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 6px;
  font-size: 13px;

  button {
    margin-left: auto;
    border: none;
    background: transparent;
    font-size: 19px;
    cursor: pointer;
  }
}

.success-message {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.error-message {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  color: #737373;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .product-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
    padding: 16px;
  }

  .detail-product-image {
    flex-basis: auto;
    width: 100%;
    height: 220px;
  }

  .product-heading {
    width: 100%;

    h1 {
      font-size: 21px;
    }
  }
}
</style>
