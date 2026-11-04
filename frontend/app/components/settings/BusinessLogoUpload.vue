<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  logoUrl: string | null
  uploading: boolean
  removing: boolean
}>()

const emit = defineEmits<{
  upload: [file: File]
  remove: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileError = ref<string | null>(null)

const busy = computed(() => props.uploading || props.removing)

function clearPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  selectedFile.value = null
}

function selectFile() {
  if (busy.value) return
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  fileError.value = null

  if (!file) return

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    fileError.value = 'Only JPG, PNG, and WebP images are allowed.'
    input.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    fileError.value = 'Image must not exceed 2MB.'
    input.value = ''
    return
  }

  clearPreview()

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function uploadSelectedFile() {
  if (!selectedFile.value || busy.value) return

  emit('upload', selectedFile.value)
}

function cancelSelection() {
  clearPreview()
  fileError.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

watch(
  () => props.logoUrl,
  () => {
    cancelSelection()
  },
)

onBeforeUnmount(clearPreview)
</script>

<template>
  <section class="logo-section">
    <div class="logo-preview">
      <img v-if="previewUrl || logoUrl" :src="previewUrl || logoUrl || undefined" alt="Business logo">

      <Icon v-else name="lucide:image" size="28" />
    </div>

    <div class="logo-content">
      <h3>Business Logo</h3>

      <p>
        Upload your business logo. JPG, PNG, or WebP. Maximum 2MB.
      </p>

      <div class="logo-actions">
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFileChange">

        <button type="button" class="secondary-button" :disabled="busy" @click="selectFile">
          <Icon name="lucide:upload" />
          {{ logoUrl ? 'Change Logo' : 'Choose Logo' }}
        </button>

        <button v-if="logoUrl && !previewUrl" type="button" class="text-danger-button" :disabled="busy"
          @click="emit('remove')">
          Remove
        </button>
      </div>

      <div v-if="previewUrl" class="preview-actions">
        <button type="button" class="primary-button" :disabled="busy" @click="uploadSelectedFile">
          <Icon v-if="uploading" name="lucide:loader-circle" class="spin" />
          {{ uploading ? 'Uploading...' : 'Save Logo' }}
        </button>

        <button type="button" class="secondary-button" :disabled="busy" @click="cancelSelection">
          Cancel
        </button>
      </div>

      <p v-if="fileError" class="field-error">
        {{ fileError }}
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.logo-section {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.logo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #9ca3af;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border: 2px solid #e5e7eb;
    box-shadow: 0 0 0 3px #f9fafb;
  }
}

.logo-content {
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 12px;
    color: #737373;
    font-size: 12px;
    line-height: 1.5;
  }
}

.logo-actions,
.preview-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.primary-button,
.secondary-button,
.text-danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.primary-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.secondary-button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.text-danger-button {
  border: none;
  background: transparent;
  color: #dc2626;
}

.preview-actions {
  margin-top: 10px;
}

.field-error {
  color: #b91c1c !important;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .logo-section {
    flex-direction: column;
  }
}
</style>
