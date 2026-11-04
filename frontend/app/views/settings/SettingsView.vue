<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import useBusiness from '@composables/useBusiness'
import useUserAvatar from '@composables/useUserAvatar'
import useUserAccount from '@composables/useUserAccount'

import UserAvatarUpload from '@components/settings/UserAvatarUpload.vue'
import BusinessLogoUpload from '@components/settings/BusinessLogoUpload.vue'
import BusinessProfileForm from '@components/settings/BusinessProfileForm.vue'
import UnitsManagement from '@components/settings/UnitsManagement.vue'
import ConfirmationDialog from '@components/common/ConfirmationDialog.vue'

import useAuthStore from '@stores/auth.store'

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

const authStore = useAuthStore()

const {
  uploading: uploadingAvatar,
  removing: removingAvatar,
  uploadAvatar,
  removeAvatar,
} = useUserAvatar()

const {
  updatingProfile,
  changingPassword,
  updateProfile,
  changePassword,
} = useUserAccount()

const user = computed(() => authStore.user.value)

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Shared confirmation dialog state.
type ConfirmAction = 'remove-logo' | 'remove-avatar'

const showConfirmation = ref(false)
const confirmationTitle = ref('')
const confirmationMessage = ref('')
const confirmationItemName = ref('')
const confirmationText = ref('Confirm')
const confirmationVariant = ref<'danger' | 'success' | 'warning' | 'primary'>('danger')
const pendingConfirmationAction = ref<ConfirmAction | null>(null)
const confirmingAction = ref(false)

// Profile editing
const isEditingProfile = ref(false)
const firstName = ref('')
const lastName = ref('')

// Password editing
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Password visibility
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Confirm-password feedback
const passwordsMatch = computed(() => {
  return (
    newPassword.value.length > 0 &&
    confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value
  )
})

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

function showError(err: unknown, fallback: string) {
  error.value = getErrorMessage(err, fallback)
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

// Business handlers
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
  confirmationMessage.value = 'Your current business logo will be removed. You can upload a new logo later.'
  confirmationItemName.value = ''
  confirmationText.value = 'Remove Logo'
  confirmationVariant.value = 'danger'
  pendingConfirmationAction.value = 'remove-logo'
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

// Avatar handlers
async function handleUploadAvatar(file: File) {
  error.value = null
  successMessage.value = null

  try {
    await uploadAvatar(file)
    successMessage.value = 'Profile avatar uploaded successfully.'
  } catch (err) {
    showError(err, 'Unable to upload profile avatar.')
  }
}

function requestRemoveAvatar() {
  if (removingAvatar.value || !user.value?.avatarUrl) return

  confirmationTitle.value = 'Remove profile avatar?'
  confirmationMessage.value = 'Your current profile picture will be removed and your account will show your initials instead.'
  confirmationItemName.value = ''
  confirmationText.value = 'Remove Avatar'
  confirmationVariant.value = 'danger'
  pendingConfirmationAction.value = 'remove-avatar'
  showConfirmation.value = true
}

async function handleRemoveAvatar() {
  error.value = null
  successMessage.value = null

  try {
    await removeAvatar()
    successMessage.value = 'Profile avatar removed successfully.'
  } catch (err) {
    showError(err, 'Unable to remove profile avatar.')
  }
}

async function handleConfirmation() {
  const action = pendingConfirmationAction.value

  if (!action || confirmingAction.value) return

  confirmingAction.value = true

  try {
    if (action === 'remove-logo') {
      await handleRemoveLogo()
    } else if (action === 'remove-avatar') {
      await handleRemoveAvatar()
    }

    showConfirmation.value = false
    pendingConfirmationAction.value = null
  } finally {
    confirmingAction.value = false
  }
}

// Profile handlers
function startEditingProfile() {
  if (!user.value) return

  firstName.value = user.value.firstName
  lastName.value = user.value.lastName

  isEditingProfile.value = true
  error.value = null
  successMessage.value = null
}

function cancelEditingProfile() {
  isEditingProfile.value = false
  firstName.value = ''
  lastName.value = ''
}

async function handleUpdateProfile() {
  if (!firstName.value.trim() || !lastName.value.trim()) {
    error.value = 'First name and last name are required.'
    return
  }

  error.value = null
  successMessage.value = null

  try {
    await updateProfile({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
    })

    isEditingProfile.value = false
    successMessage.value = 'Profile updated successfully.'
  } catch (err) {
    showError(err, 'Unable to update profile.')
  }
}

// Password handlers
async function handleChangePassword() {
  error.value = null
  successMessage.value = null

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'Please complete all password fields.'
    return
  }

  if (newPassword.value.length < 8) {
    error.value = 'New password must contain at least 8 characters.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New password and confirmation do not match.'
    return
  }

  try {
    await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    successMessage.value = 'Password changed successfully.'
  } catch (err) {
    showError(err, 'Unable to change password.')
  }
}

const fullName = computed(() => {
  if (!user.value) return 'Unknown User'

  return `${user.value.firstName} ${user.value.lastName}`
})

const memberSince = computed(() => {
  if (!user.value?.createdAt) return 'Not available'

  return new Date(user.value.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  )
})

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
      <!-- User Account -->
      <section v-if="user" class="settings-card">
        <div class="section-heading">
          <div class="section-icon">
            <Icon name="lucide:user-round" />
          </div>

          <div>
            <h2>User Account</h2>
            <p>Manage your personal account information.</p>
          </div>
        </div>

        <div class="section-content">
          <!-- Avatar and account summary -->
          <div class="account-content">
            <UserAvatarUpload :avatar-url="user.avatarUrl" :uploading="uploadingAvatar" :removing="removingAvatar"
              @upload="handleUploadAvatar" @remove="requestRemoveAvatar" />

            <div class="account-description">
              <strong>{{ fullName }}</strong>
              <p>{{ user.email }}</p>

              <div class="account-meta">
                <span class="status-badge" :class="`status-${user.status}`">
                  {{ user.status }}
                </span>

                <span class="member-since">
                  Member since {{ memberSince }}
                </span>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- Personal Information -->
          <div class="form-section">
            <div class="form-section-heading">
              <div>
                <h3>Personal Information</h3>
                <p>Update your name and account details.</p>
              </div>

              <button v-if="!isEditingProfile" type="button" class="secondary-button" @click="startEditingProfile">
                <Icon name="lucide:pencil" />
                Edit Name
              </button>
            </div>

            <form v-if="isEditingProfile" class="account-form" @submit.prevent="handleUpdateProfile">
              <div class="form-grid">
                <label class="form-field">
                  <span>First Name</span>
                  <input v-model="firstName" type="text" maxlength="100" autocomplete="given-name" required
                    placeholder="Enter first name" />
                </label>

                <label class="form-field">
                  <span>Last Name</span>
                  <input v-model="lastName" type="text" maxlength="100" autocomplete="family-name" required
                    placeholder="Enter last name" />
                </label>
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-button" :disabled="updatingProfile">
                  <Icon v-if="updatingProfile" name="lucide:loader-circle" class="spin" />
                  {{ updatingProfile ? 'Saving...' : 'Save Changes' }}
                </button>

                <button type="button" class="secondary-button" :disabled="updatingProfile"
                  @click="cancelEditingProfile">
                  Cancel
                </button>
              </div>
            </form>

            <div v-else class="profile-details">
              <div class="detail-item">
                <span>First Name</span>
                <strong>{{ user.firstName }}</strong>
              </div>

              <div class="detail-item">
                <span>Last Name</span>
                <strong>{{ user.lastName }}</strong>
              </div>

              <div class="detail-item">
                <span>Email Address</span>
                <strong>{{ user.email }}</strong>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- Change Password -->
          <div class="form-section">
            <div class="form-section-heading">
              <div>
                <h3>Change Password</h3>
                <p>Use your current password to set a new password.</p>
              </div>
              <Icon name="lucide:shield-check" class="security-icon" />
            </div>

            <form class="account-form" @submit.prevent="handleChangePassword">
              <label class="form-field">
                <span>Current Password</span>

                <div class="password-input-wrapper">
                  <input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'"
                    autocomplete="current-password" required placeholder="Enter current password" />

                  <button type="button" class="password-toggle"
                    :aria-label="showCurrentPassword ? 'Hide current password' : 'Show current password'"
                    :aria-pressed="showCurrentPassword" @click="showCurrentPassword = !showCurrentPassword">
                    <Icon :name="showCurrentPassword ? 'lucide:eye-off' : 'lucide:eye'" />
                  </button>
                </div>
              </label>

              <div class="form-grid">
                <label class="form-field">
                  <span>New Password</span>

                  <div class="password-input-wrapper">
                    <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'"
                      autocomplete="new-password" minlength="8" maxlength="72" required
                      placeholder="Minimum 8 characters" />

                    <button type="button" class="password-toggle"
                      :aria-label="showNewPassword ? 'Hide new password' : 'Show new password'"
                      :aria-pressed="showNewPassword" @click="showNewPassword = !showNewPassword">
                      <Icon :name="showNewPassword ? 'lucide:eye-off' : 'lucide:eye'" />
                    </button>
                  </div>
                </label>

                <label class="form-field">
                  <span>Confirm New Password</span>

                  <div class="password-input-wrapper">
                    <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                      autocomplete="new-password" minlength="8" maxlength="72" required
                      placeholder="Confirm new password" />

                    <button type="button" class="password-toggle"
                      :aria-label="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'"
                      :aria-pressed="showConfirmPassword" @click="showConfirmPassword = !showConfirmPassword">
                      <Icon :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" />
                    </button>
                  </div>
                </label>

                <p v-if="confirmPassword.length > 0" class="password-match-message"
                  :class="passwordsMatch ? 'match-success' : 'match-error'" aria-live="polite">
                  <Icon :name="passwordsMatch ? 'lucide:check-circle' : 'lucide:alert-circle'" />
                  {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                </p>
              </div>

              <p class="password-hint">
                <Icon name="lucide:info" />
                Your new password must contain at least 8 characters.
              </p>

              <div class="form-actions">
                <button type="submit" class="primary-button" :disabled="changingPassword">
                  <Icon v-if="changingPassword" name="lucide:loader-circle" class="spin" />
                  {{ changingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section v-else class="settings-card">
        <div class="section-content">
          <p>User information is unavailable.</p>
        </div>
      </section>
      <!-- Business Profile -->
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
          <BusinessLogoUpload :logo-url="business.logoUrl" :uploading="uploadingLogo" :removing="removingLogo"
            @upload="handleUploadLogo" @remove="requestRemoveLogo" />

          <div class="section-divider" />

          <BusinessProfileForm :name="business.name" :status="business.status" :saving="saving"
            @save="handleUpdateBusiness" />
        </div>
      </section>

      <!-- Units Management -->
      <section class="settings-card">
        <div class="section-heading">
          <div class="section-icon">
            <Icon name="lucide:ruler" />
          </div>

          <div>
            <h2>Units Management</h2>
            <p>Manage measurement units used by your products.</p>
          </div>
        </div>

        <div class="section-content">
          <UnitsManagement />
        </div>
      </section>
    </template>

    <div v-else-if="!error" class="page-state">
      <p>Business information is not available.</p>

      <button type="button" class="retry-button" @click="initialize">
        Try Again
      </button>
    </div>

    <ConfirmationDialog v-model="showConfirmation" :title="confirmationTitle" :message="confirmationMessage"
      :item-name="confirmationItemName" :confirm-text="confirmationText" :variant="confirmationVariant"
      :loading="confirmingAction" @confirm="handleConfirmation" />
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
  flex-wrap: wrap;
  gap: 20px;
}

.account-description {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  strong {
    color: #111827;
    font-size: 14px;
  }

  p {
    margin: 0;
    color: #737373;
    font-size: 12px;
  }
}

.account-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
}

.status-badge {
  padding: 4px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-inactive {
  background: #fef3c7;
  color: #92400e;
}

.status-suspended {
  background: #fee2e2;
  color: #b91c1c;
}

.member-since {
  color: #737373;
  font-size: 11px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

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

.security-icon {
  color: #2563eb;
  font-size: 22px;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 7px;

  span {
    color: #737373;
    font-size: 12px;
  }

  strong {
    overflow-wrap: anywhere;
    color: #111827;
    font-size: 13px;
    font-weight: 500;
  }
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  span {
    color: #374151;
    font-size: 12px;
    font-weight: 500;
  }

  input {
    width: 100%;
    min-height: 40px;
    padding: 9px 11px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    background: #fff;
    color: #111827;
    font-family: inherit;
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &::placeholder {
      color: #9ca3af;
    }

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
    }
  }
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.primary-button,
.secondary-button,
.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 8px 13px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.primary-button,
.retry-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }
}

.secondary-button {
  border-color: #d1d5db;
  background: #fff;
  color: #374151;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  input {
    width: 100%;
    padding-right: 44px;
  }
}

.password-toggle {
  position: absolute;
  right: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 5px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #737373;
  font-size: 17px;
  cursor: pointer;

  &:hover {
    background: #eff6ff;
    color: #2563eb;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
}

.password-match-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -8px 0 0;
  font-size: 12px;

  &.match-success {
    color: #15803d;
  }

  &.match-error {
    color: #dc2626;
  }
}

.password-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: -5px 0 0;
  color: #737373;
  font-size: 11px;
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

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {

  .form-grid,
  .profile-details {
    grid-template-columns: 1fr;
  }

  .section-heading {
    padding: 16px;
  }

  .section-content {
    padding: 18px 16px;
  }

  .form-section-heading {
    align-items: flex-start;
  }
}
</style>
