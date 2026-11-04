<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

import type {
  Unit,
  CreateUnitInput,
  UpdateUnitInput,
} from '@app-types/unit'

import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'
import BasePagination from '@components/data-table/BasePagination.vue'

const { $unitService } = useNuxtApp()
const { business } = useBusiness()

const businessId = computed(() => business.value?.id ?? '')

const units = ref<Unit[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const statusFilter = ref<'all' | 'active' | 'inactive'>('active')
const searchQuery = ref('')

const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

const showForm = ref(false)
const editingUnitId = ref<string | null>(null)

const showConfirmation = ref(false)
const confirmingAction = ref(false)
const selectedUnit = ref<Unit | null>(null)
const pendingStatus = ref<boolean | null>(null)

const name = ref('')
const symbol = ref('')

const filteredUnits = computed(() => units.value)
const isEditing = computed(() => editingUnitId.value !== null)

let searchTimeout: ReturnType<typeof setTimeout> | undefined

async function loadUnits(): Promise<void> {
  if (!businessId.value) {
    units.value = []
    totalItems.value = 0
    error.value = 'Business information is unavailable.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await $unitService.getUnits(businessId.value, {
      status: statusFilter.value,
      search: searchQuery.value.trim(),
      page: currentPage.value,
      limit: pageSize.value,
    })

    totalItems.value = result.pagination.totalItems

    if (
      result.pagination.totalPages > 0 &&
      currentPage.value > result.pagination.totalPages
    ) {
      currentPage.value = result.pagination.totalPages
      await loadUnits()
      return
    }

    units.value = result.items
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to load units.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  name.value = ''
  symbol.value = ''
  editingUnitId.value = null
  showForm.value = false
}

function startCreate() {
  resetForm()
  error.value = null
  successMessage.value = null
  showForm.value = true
}

function startEdit(unit: Unit) {
  error.value = null
  successMessage.value = null

  editingUnitId.value = unit.id
  name.value = unit.name
  symbol.value = unit.symbol
  showForm.value = true
}

async function handleSubmit() {
  if (saving.value) return

  const normalizedName = name.value.trim()
  const normalizedSymbol = symbol.value.trim()

  if (!normalizedName || !normalizedSymbol) {
    error.value = 'Unit name and symbol are required.'
    return
  }

  if (normalizedName.length > 100 || normalizedSymbol.length > 20) {
    error.value = 'Unit name or symbol exceeds the allowed length.'
    return
  }

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    if (editingUnitId.value) {
      const input: UpdateUnitInput = {
        name: normalizedName,
        symbol: normalizedSymbol,
      }

      await $unitService.updateUnit(
        editingUnitId.value,
        businessId.value,
        input,
      )

      successMessage.value = 'Unit updated successfully.'
    } else {
      const input: CreateUnitInput = {
        name: normalizedName,
        symbol: normalizedSymbol,
      }

      await $unitService.createUnit(input)

      successMessage.value = 'Unit created successfully.'
    }

    resetForm()
    await loadUnits()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Unable to save unit.'
  } finally {
    saving.value = false
  }
}

function requestToggleUnitStatus(unit: Unit) {
  selectedUnit.value = unit
  pendingStatus.value = !unit.isActive
  error.value = null

  showConfirmation.value = true
}

async function handleConfirmStatusChange() {
  if (
    confirmingAction.value ||
    !selectedUnit.value ||
    pendingStatus.value === null
  ) {
    return
  }

  confirmingAction.value = true
  error.value = null
  successMessage.value = null

  const unit = selectedUnit.value
  const action = pendingStatus.value ? 'activate' : 'deactivate'

  try {
    const input: UpdateUnitInput = {
      isActive: pendingStatus.value,
    }

    await $unitService.updateUnit(
      unit.id,
      businessId.value,
      input,
    )

    successMessage.value = `Unit ${action}d successfully.`
    showConfirmation.value = false
    selectedUnit.value = null
    pendingStatus.value = null

    await loadUnits()
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : `Unable to ${action} unit.`
  } finally {
    confirmingAction.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  void loadUnits()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadUnits()
}

watch([searchQuery, statusFilter], () => {
  currentPage.value = 1

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    void loadUnits()
  }, 300)
})

onMounted(() => {
  void loadUnits()
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<template>
  <section class="units-management">
    <div class="units-header">
      <div>
        <h3>Units Management</h3>
        <p>Manage the measurement units used by your products.</p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="startCreate"
      >
        <Icon name="lucide:plus" />
        Add Unit
      </button>
    </div>

    <div v-if="successMessage" class="units-message success-message">
      <Icon name="lucide:check-circle" />
      {{ successMessage }}
    </div>

    <div v-if="error" class="units-message error-message">
      <Icon name="lucide:alert-circle" />
      {{ error }}
    </div>

    <Teleport to="body">
      <Transition name="unit-modal">
        <div
          v-if="showForm"
          class="unit-modal-overlay"
          @click.self="resetForm"
        >
          <section class="unit-modal" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h3>{{ isEditing ? 'Edit Unit' : 'Create Unit' }}</h3>
              <button
                type="button"
                class="modal-close"
                :disabled="saving"
                aria-label="Close modal"
                @click="resetForm"
              >
                <Icon name="lucide:x" />
              </button>
            </div>

            <form class="unit-form" @submit.prevent="handleSubmit">
              <div class="unit-form-grid">
                <label class="form-field">
                  <span>Unit Name</span>
                  <input
                    v-model="name"
                    type="text"
                    maxlength="100"
                    required
                    :disabled="saving"
                    placeholder="e.g. Kilogram"
                  />
                </label>

                <label class="form-field">
                  <span>Symbol</span>
                  <input
                    v-model="symbol"
                    type="text"
                    maxlength="20"
                    required
                    :disabled="saving"
                    placeholder="e.g. kg"
                  />
                </label>
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="primary-button"
                  :disabled="saving"
                >
                  <Icon
                    v-if="saving"
                    name="lucide:loader-circle"
                    class="spin"
                  />
                  {{ saving ? 'Saving...' : isEditing ? 'Update Unit' : 'Create Unit' }}
                </button>

                <button
                  type="button"
                  class="secondary-button"
                  :disabled="saving"
                  @click="resetForm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>

    <div class="units-toolbar">
      <label class="search-field">
        <span>Search by unit name</span>
        <div class="search-input-wrapper">
          <Icon name="lucide:search" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search by name or symbol..."
            aria-label="Search units by name"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-search-button"
            aria-label="Clear search"
            @click="searchQuery = ''"
          >
            <Icon name="lucide:x" />
          </button>
        </div>
      </label>

      <label class="filter-field">
        <span>Filter by status</span>
        <select v-model="statusFilter">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All Units</option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="units-state">
      <Icon name="lucide:loader-circle" class="spin" />
      Loading units...
    </div>

    <div v-else-if="filteredUnits.length === 0" class="units-state">
      <Icon name="lucide:package" />
      <strong>No units found</strong>
      <p>
        {{ statusFilter === 'active'
          ? 'Create your first measurement unit.'
          : 'No units match this status filter.' }}
      </p>
    </div>

    <div v-else class="units-table-wrapper">
      <table class="units-table">
        <thead>
          <tr>
            <th>Unit Name</th>
            <th>Symbol</th>
            <th>Status</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="unit in filteredUnits"
            :key="unit.id"
          >
            <td>{{ unit.name }}</td>
            <td><strong>{{ unit.symbol }}</strong></td>
            <td>
              <span
                class="unit-status"
                :class="unit.isActive ? 'status-active' : 'status-inactive'"
              >
                {{ unit.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="unit-actions">
                <template v-if="unit.isActive">
                  <button
                    type="button"
                    class="icon-action-button"
                    aria-label="Edit unit"
                    title="Edit"
                    @click="startEdit(unit)"
                  >
                    <Icon name="lucide:pencil" />
                  </button>

                  <button
                    type="button"
                    class="icon-action-button danger-action"
                    aria-label="Deactivate unit"
                    title="Deactivate"
                    @click="requestToggleUnitStatus(unit)"
                  >
                    <Icon name="lucide:archive" />
                  </button>
                </template>

                <button
                  v-else
                  type="button"
                  class="icon-action-button success-action"
                  aria-label="Activate unit"
                  title="Activate"
                  @click="requestToggleUnitStatus(unit)"
                >
                  <Icon name="lucide:archive-restore" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BasePagination
      v-if="!loading && totalItems > 0"
      :page="currentPage"
      :page-size="pageSize"
      :total-items="totalItems"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />
  </section>

  <ConfirmationDialog
    v-model="showConfirmation"
    :title="pendingStatus ? 'Activate unit?' : 'Deactivate unit?'"
    :message="pendingStatus
      ? 'This unit will become available for use again.'
      : 'This unit will no longer be available for new use.'"
    :item-name="selectedUnit?.name ?? ''"
    :confirm-text="pendingStatus ? 'Activate' : 'Deactivate'"
    :variant="pendingStatus ? 'success' : 'danger'"
    :loading="confirmingAction"
    @confirm="handleConfirmStatusChange"
  />
</template>

<style lang="scss" scoped>
.units-management {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.units-header,
.units-toolbar,
.form-actions,
.unit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.units-header {
  h3 {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 5px 0 0;
    color: #737373;
    font-size: 12px;
  }
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 38px;
  padding: 9px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.primary-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.secondary-button {
  border-color: #d1d5db;
  background: #fff;
  color: #374151;
}

.units-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.success-message {
  background: #f0fdf4;
  color: #15803d;
}

.error-message {
  background: #fef2f2;
  color: #b91c1c;
}

.unit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #f9fafb;

  h4 {
    margin: 0;
    color: #111827;
    font-size: 13px;
    font-weight: 600;
  }
}

.unit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-field,
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  span {
    color: #374151;
    font-size: 12px;
    font-weight: 500;
  }

  input,
  select {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    background: #fff;
    color: #111827;
    font-size: 12px;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgb(37 99 235 / 10%);
    }

    &:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }
  }
}

.form-actions {
  justify-content: flex-end;
}

.units-toolbar {
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
}

.search-field,
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  > span {
    color: #374151;
    font-size: 12px;
    font-weight: 500;
  }
}

.search-field {
  flex: 1;
  min-width: 220px;
  max-width: 380px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgb(37 99 235 / 10%);
  }

  input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: #111827;
    font-size: 12px;
  }
}

.clear-search-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.filter-field {
  width: 180px;
}

.units-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 150px;
  color: #737373;
  font-size: 13px;

  strong {
    color: #374151;
  }

  p {
    margin: 0;
    font-size: 12px;
  }
}

.units-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
}

.units-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 12px 14px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
    font-size: 12px;
    white-space: nowrap;
  }

  th {
    background: #f9fafb;
    color: #6b7280;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  td strong {
    color: #111827;
  }
}

.actions-column {
  text-align: right;
}

.unit-actions {
  justify-content: flex-end;
}

.icon-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #dce3ee;
  border-radius: 10px;
  background: #fff;
  color: #64748b;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: #2563eb;
    background: #f8fafc;
    color: #2563eb;
  }
}

.danger-action:hover {
  border-color: #dc2626;
  background: #fef2f2;
  color: #dc2626;
}

.success-action:hover {
  border-color: #15803d;
  background: #f0fdf4;
  color: #15803d;
}

.unit-status {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-active {
  background: #f0fdf4;
  color: #15803d;
}

.status-inactive {
  background: #f3f4f6;
  color: #4b5563;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.unit-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(15 23 42 / 50%);
  backdrop-filter: blur(2px);
}

.unit-modal {
  width: 100%;
  max-width: 520px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 60px rgb(0 0 0 / 18%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 600;
  }
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.unit-modal .unit-form {
  padding: 0;
  border: 0;
  background: transparent;
}

.unit-modal-enter-active,
.unit-modal-leave-active {
  transition: opacity 0.2s ease;
}

.unit-modal-enter-from,
.unit-modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .units-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .unit-form-grid {
    grid-template-columns: 1fr;
  }

  .units-toolbar {
    justify-content: flex-start;
  }
}
</style>
