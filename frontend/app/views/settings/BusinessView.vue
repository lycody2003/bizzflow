<script setup lang="ts">
import { onMounted, ref } from 'vue'

import useBusiness from '@composables/useBusiness'

import BusinessLogoUpload from '@components/settings/BusinessLogoUpload.vue'
import BusinessProfileForm from '@components/settings/BusinessProfileForm.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'

const {
  business,
  loading,
  saving,
  uploadingLogo,
  removingLogo,
  loadBusiness,
  updateBusiness,
  uploadLogo,
  removeLogo,
} = useBusiness()

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const showConfirmation = ref(false)
const confirmationTitle = ref('')
const confirmationMessage = ref('')
const confirmationItemName = ref('')
const confirmationText = ref('Confirm')
const confirmationVariant = ref<'danger' | 'success' | 'warning' | 'primary'>('danger')
const confirmingAction = ref(false)

function showError(err: unknown, fallback: string) {
  error.value = err instanceof Error ? err.message : fallback
  successMessage.value = null
}

async function initialize() {
  loading.value = true
  error.value = null

  try {
    await loadBusiness()
  } catch (err) {
    showError(err, 'Unable to load business settings.')
  } finally {
    loading.value = false
  }
}

async function handleUpdateBusiness(name: string) {
  error.value = null
  successMessage.value = null

  try {
    await updateBusiness(name)
    successMessage.value = 'Business information updated successfully.'
  } catch (err) {
    showError(err, 'Unable to update business information.')
  }
}

async function handleUploadLogo(file: File) {
  error.value = null
  successMessage.value = null

  try {
    await uploadLogo(file)
    successMessage.value = 'Business logo uploaded successfully.'
  } catch (err) {
    showError(err, 'Unable to upload business logo.')
  }
}

function requestRemoveLogo() {
  if (removingLogo.value || !business.value?.logoUrl) return

  confirmationTitle.value = 'Remove business logo?'
  confirmationMessage.value =
    'Your current business logo will be removed. You can upload a new logo later.'
  confirmationItemName.value = ''
  confirmationText.value = 'Remove Logo'
  confirmationVariant.value = 'danger'
  showConfirmation.value = true
}

async function handleRemoveLogo() {
  error.value = null
  successMessage.value = null

  try {
    await removeLogo()
    successMessage.value = 'Business logo removed successfully.'
  } catch (err) {
    showError(err, 'Unable to remove business logo.')
  }
}

async function handleConfirmation() {
  if (confirmingAction.value) return

  confirmingAction.value = true

  try {
    await handleRemoveLogo()
    showConfirmation.value = false
  } finally {
    confirmingAction.value = false
  }
}

onMounted(initialize)
</script>

<template>
  <div class="business-view">
    <header class="page-header">
      <div>
        <h1>Business Account</h1>
        <p>Manage your business identity and information.</p>
      </div>
    </header>

    <div v-if="error" class="alert alert-error" role="alert">
      {{ error }}
    </div>

    <div v-if="successMessage" class="alert alert-success" role="status">
      {{ successMessage }}
    </div>

    <div v-if="loading && !business" class="page-state">
      <Icon name="lucide:loader-circle" class="spin" />
      Loading business information...
    </div>

    <section v-else-if="business" class="settings-card">
      <div class="section-content">
        <BusinessLogoUpload
          :logo-url="business.logoUrl"
          :uploading="uploadingLogo"
          :removing="removingLogo"
          @upload="handleUploadLogo"
          @remove="requestRemoveLogo"
        />

        <div class="section-divider" />

        <BusinessProfileForm
          :name="business.name"
          :status="business.status"
          :saving="saving"
          @save="handleUpdateBusiness"
        />
      </div>
    </section>

    <ConfirmationDialog
      v-model="showConfirmation"
      :title="confirmationTitle"
      :message="confirmationMessage"
      :item-name="confirmationItemName"
      :confirm-text="confirmationText"
      :variant="confirmationVariant"
      :loading="confirmingAction"
      @confirm="handleConfirmation"
    />
  </div>
</template>

<style lang="scss" scoped>
.business-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  h1 {
    margin: 0;
    color: #182951;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    margin: 8px 0 0;
    color: #718096;
    font-size: 14px;
  }
}

.settings-card {
  padding: 24px;
  border: 1px solid #e5eaf2;
  border-radius: 12px;
  background: #fff;
}

.section-content {
  width: 100%;
}

.page-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #718096;
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.alert-error {
  color: #b42318;
  background: #fef3f2;
}

.alert-success {
  color: #027a48;
  background: #ecfdf3;
}
</style>
