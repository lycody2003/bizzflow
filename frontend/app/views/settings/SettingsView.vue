
<script setup lang="ts">
import { onMounted, ref } from 'vue'

import useBusiness from '@composables/useBusiness'

import BusinessLogoUpload from '@components/settings/BusinessLogoUpload.vue'
import BusinessProfileForm from '@components/settings/BusinessProfileForm.vue'

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

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

async function initialize() {
  loading.value = true
  error.value = null

  try {
    await loadBusiness()
  } catch (err) {
    error.value = getErrorMessage(
      err,
      'Unable to load business settings.',
    )
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
    error.value = getErrorMessage(
      err,
      'Unable to update business information.',
    )
  }
}

async function handleUploadLogo(file: File) {
  error.value = null
  successMessage.value = null

  try {
    await uploadLogo(file)
    successMessage.value = 'Business logo uploaded successfully.'
  } catch (err) {
    error.value = getErrorMessage(
      err,
      'Unable to upload business logo.',
    )
  }
}

async function handleRemoveLogo() {
  if (removingLogo.value || !business.value?.logoUrl) return

  if (!window.confirm('Are you sure you want to remove your business logo?')) {
    return
  }

  error.value = null
  successMessage.value = null

  try {
    await removeLogo()
    successMessage.value = 'Business logo removed successfully.'
  } catch (err) {
    error.value = getErrorMessage(
      err,
      'Unable to remove business logo.',
    )
  }
}

onMounted(initialize)
</script>

<template>
  <div class="settings-view">
    <header class="page-header">
      <div>
        <h1>Settings</h1>
        <p>Manage your business information and account preferences.</p>
      </div>
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

    <div v-if="loading && !business" class="page-state">
      <Icon name="lucide:loader-circle" class="spin" />
      Loading settings...
    </div>

    <template v-else-if="business">
      <section class="settings-card">
        <div class="section-heading">
          <div class="section-icon">
            <Icon name="lucide:building-2" />
          </div>

          <div>
            <h2>Business Profile</h2>
            <p>Manage your business identity and information.</p>
          </div>
        </div>

        <div class="section-content">
          <BusinessLogoUpload
            :logo-url="business.logoUrl"
            :uploading="uploadingLogo"
            :removing="removingLogo"
            @upload="handleUploadLogo"
            @remove="handleRemoveLogo"
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

      <section class="settings-card account-card">
        <div class="section-heading">
          <div class="section-icon">
            <Icon name="lucide:user-round" />
          </div>

          <div>
            <h2>User Account</h2>
            <p>Manage your personal account information.</p>
          </div>
        </div>

        <div class="account-content">
          <div class="avatar-placeholder">
            <Icon name="lucide:user-round" size="28" />
          </div>

          <div class="account-description">
            <strong>Profile Avatar</strong>
            <p>
              Personal profile photo upload will be available in a future update.
            </p>
            <span class="coming-soon">Coming later</span>
          </div>
        </div>

        <div class="account-note">
          <Icon name="lucide:info" />
          User profile and avatar management are not connected to the API yet.
        </div>
      </section>
    </template>

    <div v-else-if="!error" class="page-state">
      <p>Business information is not available.</p>
      <button type="button" class="retry-button" @click="initialize">
        Try Again
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-view {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
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

.settings-card {
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    color: #111827;
    font-size: 15px;
    font-weight: 600;
  }

  p {
    margin: 5px 0 0;
    color: #737373;
    font-size: 12px;
  }
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 7px;
  background: #eff6ff;
  color: #2563eb;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 22px 20px;
}

.section-divider {
  height: 1px;
  background: #e5e7eb;
}

.account-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px 20px;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: #f9fafb;
  color: #9ca3af;
}

.account-description {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  strong {
    color: #111827;
    font-size: 13px;
  }

  p {
    margin: 0;
    color: #737373;
    font-size: 12px;
    line-height: 1.5;
  }
}

.coming-soon {
  padding: 4px 8px;
  border-radius: 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 500;
}

.account-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 20px 20px;
  padding: 11px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  color: #737373;
  font-size: 12px;
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
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #737373;
}

.retry-button {
  padding: 8px 14px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
