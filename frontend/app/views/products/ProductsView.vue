
<script setup lang="ts">
const productImageService = useProductImageService()
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'


import useProductImageService from '@services/products/product-image.service'
import useBusiness from '@composables/useBusiness'

import ProductForm from '@components/products/ProductForm.vue'
import ProductSearch from '@components/products/ProductSearch.vue'
import ProductTable from '@components/products/ProductTable.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'
import BasePagination from '@components/data-table/BasePagination.vue'

import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@app-types/product'

import type { Category } from '@app-types/category'

interface ProductFormSubmitPayload {
  data: CreateProductInput
  imageFile: File | null
  removeImage: boolean
}

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

type ConfirmationAction = 'archive' | 'restore' | 'bulk-archive'

const products = ref<Product[]>([])
const loading = ref(false)
const saving = ref(false)

const showProductForm = ref(false)
const editingProduct = ref<Product | null>(null)
const initialImageUrl = ref<string | null>(null)
const loadingProductImage = ref(false)

let imageRequestId = 0

function revokeInitialImageUrl() {
  if (initialImageUrl.value) {
    URL.revokeObjectURL(initialImageUrl.value)
    initialImageUrl.value = null
  }
}

const showConfirmation = ref(false)
const confirmationAction = ref<ConfirmationAction>('archive')
const confirmationProduct = ref<Product | null>(null)

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const initialized = ref(false)

const searchQuery = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('active')
const stockFilter = ref<StockFilter>('all')
const sortBy = ref<SortOption>('newest')

const currentPage = ref(1)
const pageSize = ref(10)
const selectedProductIds = ref<string[]>([])

const { business, loadBusiness } = useBusiness()
const businessId = computed(() => business.value?.id ?? '')

const categories = ref<Category[]>([])
const loadingCategories = ref(false)
let categoryRequestId = 0

let requestId = 0

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const result = products.value.filter((product) => {
    const name = product.name ?? ''
    const sku = product.sku ?? ''
    const barcode = product.barcode ?? ''

    const matchesSearch = !query ||
      name.toLowerCase().includes(query) ||
      sku.toLowerCase().includes(query) ||
      barcode.toLowerCase().includes(query)

    const matchesCategory =
      categoryFilter.value === 'all' ||
      product.categoryId === categoryFilter.value

    const matchesStatus =
      statusFilter.value === 'all' ||
      product.status === statusFilter.value

    let matchesStock = true

    if (stockFilter.value === 'in-stock') {
      matchesStock = product.currentStock > product.minimumStock
    } else if (stockFilter.value === 'low-stock') {
      matchesStock =
        product.currentStock > 0 &&
        product.currentStock <= product.minimumStock
    } else if (stockFilter.value === 'out-of-stock') {
      matchesStock = product.currentStock <= 0
    }

    return matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesStock
  })

  return result.sort((a, b) => {
    switch (sortBy.value) {
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt)

      case 'name-asc':
        return (a.name ?? '').localeCompare(b.name ?? '')

      case 'name-desc':
        return (b.name ?? '').localeCompare(a.name ?? '')

      case 'price-asc':
        return a.sellingPrice - b.sellingPrice

      case 'price-desc':
        return b.sellingPrice - a.sellingPrice

      case 'stock-asc':
        return a.currentStock - b.currentStock

      case 'stock-desc':
        return b.currentStock - a.currentStock

      case 'newest':
      default:
        return b.createdAt.localeCompare(a.createdAt)
    }
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / pageSize.value)),
)

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value

  return filteredProducts.value.slice(
    start,
    start + pageSize.value,
  )
})

const selectedCount = computed(() =>
  selectedProductIds.value.length,
)

const activeSelectedProducts = computed(() =>
  products.value.filter(product =>
    selectedProductIds.value.includes(product.id) &&
    product.status === 'active',
  ),
)

const confirmationTitle = computed(() => {
  if (confirmationAction.value === 'restore') {
    return 'Restore Product?'
  }

  if (confirmationAction.value === 'bulk-archive') {
    return 'Archive Selected Products?'
  }

  return 'Archive Product?'
})

const confirmationMessage = computed(() => {
  if (confirmationAction.value === 'restore') {
    return 'Are you sure you want to restore this product? It will become active again.'
  }

  if (confirmationAction.value === 'bulk-archive') {
    return `Are you sure you want to archive ${activeSelectedProducts.value.length} selected product(s)? You can restore them later.`
  }

  return 'Are you sure you want to archive this product? It will no longer appear in Active Products. You can restore it later.'
})

const confirmationItemName = computed(() =>
  confirmationAction.value === 'archive'
    ? confirmationProduct.value?.name ?? ''
    : '',
)

const confirmationText = computed(() => {
  return confirmationAction.value === 'restore'
    ? 'Restore Product'
    : confirmationAction.value === 'bulk-archive'
      ? 'Archive Selected'
      : 'Archive Product'
})

const confirmationVariant = computed(() =>
  confirmationAction.value === 'restore' ? 'success' : 'danger',
)

async function loadCategories() {
  const currentRequestId = ++categoryRequestId
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    categories.value = []
    loadingCategories.value = false
    return
  }

  loadingCategories.value = true

  try {
    const result = await $categoryService.getCategories(
      currentBusinessId,
      'all',
    )

    if (
      currentRequestId !== categoryRequestId ||
      businessId.value !== currentBusinessId
    ) {
      return
    }

    categories.value = result
  } catch (err) {
    if (currentRequestId !== categoryRequestId) return

    categories.value = []
    error.value = err instanceof Error
      ? `Unable to load categories: ${err.message}`
      : 'Unable to load categories.'
  } finally {
    if (currentRequestId === categoryRequestId) {
      loadingCategories.value = false
    }
  }
}

async function loadProducts() {
  const currentRequestId = ++requestId
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    products.value = []
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await productService.getProducts(currentBusinessId)

    if (
      currentRequestId !== requestId ||
      businessId.value !== currentBusinessId
    ) {
      return
    }

    products.value = result
  } catch (err) {
    if (currentRequestId !== requestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load products.'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

async function initializeProducts() {
  loading.value = true
  error.value = null

  try {
    await loadBusiness()
    initialized.value = true

    if (!businessId.value) {
      products.value = []
      error.value = 'Unable to load business information.'
      return
    }

    await Promise.all([
      loadProducts(),
      loadCategories(),
    ])
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to initialize products.'
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  revokeInitialImageUrl()
  editingProduct.value = null
  showProductForm.value = true
}

async function openEditForm(product: Product) {
  if (product.status !== 'active' || loadingProductImage.value) return

  revokeInitialImageUrl()
  editingProduct.value = product
  loadingProductImage.value = true

  const currentImageRequestId = ++imageRequestId

  try {
    const image = await productImageService.getImage(
      product.id,
      businessId.value,
    )

    if (
      currentImageRequestId !== imageRequestId ||
      editingProduct.value?.id !== product.id
    ) {
      return
    }

    initialImageUrl.value = image?.imageUrl ??
      (image?.blob ? URL.createObjectURL(image.blob) : null)

    showProductForm.value = true
  } catch (err) {
    if (currentImageRequestId !== imageRequestId) return

    editingProduct.value = null

    error.value = err instanceof Error
      ? `Unable to load product image: ${err.message}`
      : 'Unable to load product image.'
  } finally {
    if (currentImageRequestId === imageRequestId) {
      loadingProductImage.value = false
    }
  }
}

function closeProductForm() {
  if (saving.value) return

  imageRequestId++
  revokeInitialImageUrl()

  showProductForm.value = false
  editingProduct.value = null
  loadingProductImage.value = false
}

async function handleCreateProduct(payload: ProductFormSubmitPayload) {
  if (saving.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  let createdProduct: Product | null = null

  try {
    createdProduct = await productService.createProduct(payload.data)

    if (payload.imageFile) {
      await productImageService.upload(
        createdProduct.id,
        createdProduct.businessId,
        payload.imageFile,
      )
    }

    showProductForm.value = false

    await loadProducts()

    currentPage.value = 1
    statusFilter.value = 'active'

    successMessage.value = 'Product created successfully.'
  } catch (err) {
    if (createdProduct) {
      showProductForm.value = false

      await loadProducts()

      error.value = err instanceof Error
        ? `Product was created, but its image could not be saved: ${err.message}`
        : 'Product was created, but its image could not be saved.'
    } else {
      error.value = err instanceof Error
        ? err.message
        : 'Unable to create product.'
    }
  } finally {
    saving.value = false
  }
}

async function handleUpdateProduct(payload: ProductFormSubmitPayload) {
  if (saving.value || !editingProduct.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  const product = editingProduct.value
  let productUpdated = false

  try {
    const updateData: UpdateProductInput = {
      name: payload.data.name,
      sku: payload.data.sku,
      barcode: payload.data.barcode,
      barcodeType: payload.data.barcodeType,
      description: payload.data.description,
      categoryId: payload.data.categoryId,
      type: payload.data.type,
      unit: payload.data.unit,
      costPrice: payload.data.costPrice,
      sellingPrice: payload.data.sellingPrice,
      currency: payload.data.currency,
      minimumStock: payload.data.minimumStock,
    }

    await productService.updateProduct(
      product.id,
      businessId.value,
      updateData,
    )

    productUpdated = true

    if (payload.imageFile) {
      await productImageService.upload(
        product.id,
        businessId.value,
        payload.imageFile,
      )
    } else if (payload.removeImage) {
      await productImageService.delete(
        product.id,
        businessId.value,
      )
    }

    imageRequestId++
    revokeInitialImageUrl()

    showProductForm.value = false
    editingProduct.value = null

    await loadProducts()

    successMessage.value = 'Product updated successfully.'
  } catch (err) {
    if (productUpdated) {
      imageRequestId++
      revokeInitialImageUrl()

      showProductForm.value = false
      editingProduct.value = null

      await loadProducts()

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

function openArchiveConfirmation(product: Product) {
  if (saving.value || product.status !== 'active') return

  confirmationAction.value = 'archive'
  confirmationProduct.value = product
  showConfirmation.value = true
}

function openRestoreConfirmation(product: Product) {
  if (saving.value || product.status !== 'inactive') return

  confirmationAction.value = 'restore'
  confirmationProduct.value = product
  showConfirmation.value = true
}

function openBulkArchiveConfirmation() {
  if (saving.value || activeSelectedProducts.value.length === 0) return

  confirmationAction.value = 'bulk-archive'
  confirmationProduct.value = null
  showConfirmation.value = true
}

function closeConfirmation() {
  if (saving.value) return

  showConfirmation.value = false
  confirmationProduct.value = null
}

async function executeArchive(productsToArchive: Product[]) {
  for (const product of productsToArchive) {
    await productService.updateProduct(
      product.id,
      businessId.value,
      { status: 'inactive' },
    )
  }
}

async function executeRestore(product: Product) {
  await productService.updateProduct(
    product.id,
    businessId.value,
    { status: 'active' },
  )
}

async function handleConfirmation() {
  if (saving.value) return

  const action = confirmationAction.value
  const product = confirmationProduct.value

  if (action === 'archive' && !product) return
  if (action === 'restore' && !product) return

  const productsToArchive = action === 'bulk-archive'
    ? [...activeSelectedProducts.value]
    : action === 'archive' && product
      ? [product]
      : []

  if (action === 'bulk-archive' && productsToArchive.length === 0) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    if (action === 'restore' && product) {
      await executeRestore(product)
    } else {
      await executeArchive(productsToArchive)
    }

    showConfirmation.value = false
    confirmationProduct.value = null

    selectedProductIds.value = []

    await loadProducts()

    if (action === 'restore') {
      successMessage.value = 'Product restored successfully.'
    } else {
      successMessage.value =
        `${productsToArchive.length} product(s) archived successfully.`
    }
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to complete this action.'
  } finally {
    saving.value = false
  }
}

function clearSelection() {
  selectedProductIds.value = []
}

function clearFilters() {
  searchQuery.value = ''
  categoryFilter.value = 'all'
  statusFilter.value = 'active'
  stockFilter.value = 'all'
  sortBy.value = 'newest'
  currentPage.value = 1
  selectedProductIds.value = []
}

watch(
  [
    searchQuery,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortBy,
    pageSize,
  ],
  () => {
    currentPage.value = 1
    selectedProductIds.value = []
  },
)

watch(currentPage, () => {
  selectedProductIds.value = []
})

watch(businessId, () => {
  if (initialized.value) {
    imageRequestId++
    revokeInitialImageUrl()

    showProductForm.value = false
    editingProduct.value = null
    loadingProductImage.value = false

    showConfirmation.value = false
    confirmationProduct.value = null
    selectedProductIds.value = []
    successMessage.value = null

    void loadProducts()
    void loadCategories()
  }
})

watch(filteredProducts, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

onMounted(initializeProducts)

onBeforeUnmount(() => {
  imageRequestId++
  categoryRequestId++
  revokeInitialImageUrl()
})

const {
  $productService: productService,
  $categoryService,
} = useNuxtApp()

</script>

<template>
  <div class="products-view">
    <header class="page-header">
      <div>
        <h1>Products</h1>
        <p>Manage your business products and inventory items.</p>
      </div>

      <button
        type="button"
        class="create-button"
        :disabled="!businessId || saving"
        @click="openCreateForm"
      >
        <Icon name="lucide:plus" />
        Add Product
      </button>
    </header>

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

    <template v-if="!loading || products.length > 0">
      <ProductSearch
        v-model:search="searchQuery"
        v-model:category="categoryFilter"
        v-model:status="statusFilter"
        v-model:stock="stockFilter"
        v-model:sort="sortBy"
        :categories="categories"
        @clear="clearFilters"
      />

      <section class="list-toolbar">
        <div class="list-summary">
          <strong>{{ filteredProducts.length }}</strong>
          <span>products found</span>
        </div>

        <div v-if="selectedCount > 0" class="bulk-actions">
          <span>{{ selectedCount }} selected</span>

          <button
            type="button"
            class="bulk-archive-button"
            :disabled="saving || activeSelectedProducts.length === 0"
            @click="openBulkArchiveConfirmation"
          >
            <Icon name="lucide:archive" />
            Archive Selected
          </button>

          <button
            type="button"
            class="clear-selection-button"
            @click="clearSelection"
          >
            Clear
          </button>
        </div>
      </section>

      <ProductTable
        v-model:selected-ids="selectedProductIds"
        :products="paginatedProducts"
        :categories="categories"
        :loading="loading"
        :saving="saving"
        @view="navigateTo(`/products/${$event.id}`)"
        @edit="openEditForm"
        @archive="openArchiveConfirmation"
        @restore="openRestoreConfirmation"
      />

      <BasePagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        :total-items="filteredProducts.length"
      />
    </template>

    <div v-else class="page-state">
      <Icon name="lucide:loader-circle" class="loading-icon" />
      Loading products...
    </div>

    <ProductForm
      v-if="showProductForm"
      :key="editingProduct?.id ?? 'create-product'"
      :business-id="businessId"
      :submitting="saving"
      :initial-product="editingProduct"
      :initial-image-url="initialImageUrl"
      :categories="categories"
      @submit="editingProduct
        ? handleUpdateProduct($event)
        : handleCreateProduct($event)"
      @cancel="closeProductForm"
    />

    <ConfirmationDialog
      v-model="showConfirmation"
      :title="confirmationTitle"
      :message="confirmationMessage"
      :item-name="confirmationItemName"
      :confirm-text="confirmationText"
      :variant="confirmationVariant"
      :loading="saving"
      @confirm="handleConfirmation"
    />
  </div>
</template>

<style lang="scss" scoped>
.products-view {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    color: #111827;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin: 8px 0 0;
    color: #737373;
    font-size: 14px;
  }
}

.create-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 16px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
}

.list-summary {
  display: flex;
  gap: 5px;
  color: #737373;
  font-size: 13px;

  strong {
    color: #111827;
  }
}

.bulk-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

.bulk-archive-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.clear-selection-button {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
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

@media (max-width: 700px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
