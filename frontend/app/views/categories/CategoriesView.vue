<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@app-types/category'
import useBusiness from '@composables/useBusiness'
import CategoryForm from '@components/categories/CategoryForm.vue'
import CategorySearch, {
  type CategorySortOption,
  type CategoryStatusFilter,
} from '@components/categories/CategorySearch.vue'
import BaseDataTable from '@components/data-table/BaseDataTable.vue'
import BasePagination from '@components/data-table/BasePagination.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'

const { $categoryService } = useNuxtApp()
const { business, loadBusiness } = useBusiness()

const businessId = computed(() => business.value?.id ?? '')

const categories = ref<Category[]>([])
const loading = ref(false)
const saving = ref(false)

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const showForm = ref(false)
const editingCategory = ref<Category | null>(null)

const showDeactivateDialog = ref(false)
const selectedCategory = ref<Category | null>(null)

const searchQuery = ref('')
const statusFilter = ref<CategoryStatusFilter>('active')
const sortBy = ref<CategorySortOption>('newest')

const currentPage = ref(1)
const pageSize = ref(10)

let requestId = 0

const filteredCategories = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  const result = categories.value.filter((category) =>
    category.name.toLowerCase().includes(keyword),
  )

  return result.sort((a, b) => {
    switch (sortBy.value) {
      case 'oldest':
        return new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()

      case 'name-asc':
        return a.name.localeCompare(b.name)

      case 'name-desc':
        return b.name.localeCompare(a.name)

      case 'newest':
      default:
        return new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
    }
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCategories.value.length / pageSize.value)),
)

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value

  return filteredCategories.value.slice(
    start,
    start + pageSize.value,
  )
})

async function loadCategories() {
  const currentRequestId = ++requestId
  const currentBusinessId = businessId.value

  if (!currentBusinessId) {
    categories.value = []
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await $categoryService.getCategories(
      currentBusinessId,
      statusFilter.value,
    )

    if (
      currentRequestId !== requestId ||
      businessId.value !== currentBusinessId
    ) {
      return
    }

    categories.value = result
  } catch (err) {
    if (currentRequestId !== requestId) return

    error.value = err instanceof Error
      ? err.message
      : 'Unable to load categories.'
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

async function initialize() {
  loading.value = true
  error.value = null

  try {
    await loadBusiness()

    if (!businessId.value) {
      error.value = 'Unable to load business information.'
      return
    }

    await loadCategories()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to initialize categories.'
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  editingCategory.value = null
  error.value = null
  successMessage.value = null
  showForm.value = true
}

function openEditForm(category: Category) {
  editingCategory.value = category
  error.value = null
  successMessage.value = null
  showForm.value = true
}

function closeForm() {
  if (saving.value) return

  showForm.value = false
  editingCategory.value = null
}

async function handleSubmit(
  payload: CreateCategoryInput | UpdateCategoryInput,
) {
  if (saving.value || !businessId.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    if (editingCategory.value) {
      await $categoryService.updateCategory(
        editingCategory.value.id,
        businessId.value,
        payload as UpdateCategoryInput,
      )

      successMessage.value = 'Category updated successfully.'
    } else {
      await $categoryService.createCategory(
        payload as CreateCategoryInput,
      )

      successMessage.value = 'Category created successfully.'
    }

    showForm.value = false
    editingCategory.value = null

    await loadCategories()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to save category.'
  } finally {
    saving.value = false
  }
}

function deactivateCategory(category: Category) {
  if (saving.value) return

  selectedCategory.value = category
  error.value = null
  successMessage.value = null
  showDeactivateDialog.value = true
}

async function confirmDeactivate() {
  if (saving.value || !selectedCategory.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    await $categoryService.deleteCategory(
      selectedCategory.value.id,
      businessId.value,
    )

    successMessage.value = 'Category deactivated successfully.'
    showDeactivateDialog.value = false
    selectedCategory.value = null

    await loadCategories()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to deactivate category.'

    showDeactivateDialog.value = false
    selectedCategory.value = null
  } finally {
    saving.value = false
  }
}

async function activateCategory(category: Category) {
  if (saving.value || !businessId.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    await $categoryService.updateCategory(
      category.id,
      businessId.value,
      { isActive: true },
    )

    successMessage.value = 'Category activated successfully.'
    await loadCategories()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to activate category.'
  } finally {
    saving.value = false
  }
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'active'
  sortBy.value = 'newest'
  currentPage.value = 1
}

watch(statusFilter, () => {
  currentPage.value = 1

  if (businessId.value) {
    void loadCategories()
  }
})

watch([searchQuery, sortBy, pageSize], () => {
  currentPage.value = 1
})

watch(filteredCategories, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

watch(businessId, (newId, oldId) => {
  if (newId && oldId && newId !== oldId) {
    showForm.value = false
    editingCategory.value = null
    successMessage.value = null
    currentPage.value = 1
    void loadCategories()
  }
})

onMounted(initialize)
</script>

<template>
  <div class="categories-view">
    <header class="page-header">
      <div>
        <h1>Categories</h1>
        <p>Manage product categories for your business.</p>
      </div>

      <button
        type="button"
        class="primary-button"
        :disabled="!businessId || saving"
        @click="openCreateForm"
      >
        <Icon name="lucide:plus" />
        Add Category
      </button>
    </header>

    <div v-if="successMessage" class="success-message">
      <Icon name="lucide:check-circle" />
      {{ successMessage }}
    </div>

    <div v-if="error" class="error-message">
      <Icon name="lucide:alert-circle" />
      {{ error }}
    </div>

    <section class="category-list">
      <div class="list-header">
        <div>
          <h2>Product Categories</h2>
          <p>Manage and organize your product categories.</p>
        </div>

        <span class="category-count">
          {{ filteredCategories.length }}
          {{ filteredCategories.length === 1 ? 'category' : 'categories' }}
        </span>
      </div>

      <CategorySearch
        v-model:search="searchQuery"
        v-model:status="statusFilter"
        v-model:sort="sortBy"
        @clear="clearFilters"
      />

      <BaseDataTable
        min-width="760px"
        :loading="loading"
        :empty="!loading && filteredCategories.length === 0"
        empty-title="No categories found"
        empty-message="Try changing your search or filters, or create a new category."
      >
        <thead>
          <tr>
            <th>Category</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="category in paginatedCategories"
            :key="category.id"
          >
            <td>
              <div class="category-name-cell">
                <span
                  v-if="category.icon"
                  class="category-icon"
                >
                  <Icon :name="`lucide:${category.icon}`" />
                </span>

                <span
                  v-else
                  class="category-icon category-icon-empty"
                >
                  <Icon name="lucide:folder" />
                </span>

                <span class="category-name">
                  {{ category.name }}
                </span>
              </div>
            </td>

            <td>
              <span
                :class="[
                  'status',
                  category.isActive ? 'status-active' : 'status-inactive',
                ]"
              >
                <span class="status-dot" />
                {{ category.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>

            <td>
              {{ new Date(category.createdAt).toLocaleDateString() }}
            </td>

            <td>
              <div class="row-actions">
                <template v-if="category.isActive">
                  <button
                    type="button"
                    class="icon-action edit-action"
                    title="Edit category"
                    aria-label="Edit category"
                    :disabled="saving"
                    @click="openEditForm(category)"
                  >
                    <Icon name="lucide:pencil" />
                  </button>

                  <button
                    type="button"
                    class="icon-action archive-action"
                    title="Deactivate category"
                    aria-label="Deactivate category"
                    :disabled="saving"
                    @click="deactivateCategory(category)"
                  >
                    <Icon name="lucide:archive" />
                  </button>
                </template>

                <button
                  v-else
                  type="button"
                  class="icon-action restore-action"
                  title="Activate category"
                  aria-label="Activate category"
                  :disabled="saving"
                  @click="activateCategory(category)"
                >
                  <Icon name="lucide:rotate-ccw" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </BaseDataTable>

      <BasePagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        :total-items="filteredCategories.length"
      />
    </section>

    <CategoryForm
      v-if="showForm"
      :submitting="saving"
      :initial-category="editingCategory"
      @submit="handleSubmit"
      @cancel="closeForm"
    />

    <ConfirmationDialog
      v-model="showDeactivateDialog"
      title="Deactivate Category"
      message="Are you sure you want to deactivate this category?"
      confirm-text="Deactivate"
      cancel-text="Cancel"
      variant="danger"
      :loading="saving"
      :item-name="selectedCategory?.name ?? ''"
      @confirm="confirmDeactivate"
    />
  </div>
</template>

<style lang="scss" scoped>
.categories-view {
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

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 16px;
  border: 1px solid #2563eb;
  border-radius: 7px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 7px;
  font-size: 13px;
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

.category-list {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    color: #737373;
    font-size: 12px;
  }
}

.category-count {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.category-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 17px;
}

.category-icon-empty {
  background: #f3f4f6;
  color: #6b7280;
}

.category-name {
  color: #1f2937;
  font-weight: 500;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-inactive {
  background: #f1f5f9;
  color: #64748b;
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
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  color: #64748b;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.edit-action:hover:not(:disabled) {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
}

.archive-action:hover:not(:disabled) {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.restore-action:hover:not(:disabled) {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-list {
    padding: 14px;
  }

  .list-header {
    align-items: flex-start;
  }
}
</style>
