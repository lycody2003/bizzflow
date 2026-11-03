
<script setup lang="ts">
import { computed } from 'vue'

type DialogVariant = 'danger' | 'success' | 'warning' | 'primary'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  loading?: boolean
  itemName?: string
}>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'primary',
  loading: false,
  itemName: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const iconName = computed(() => {
  const icons: Record<DialogVariant, string> = {
    danger: 'archive',
    success: 'check-circle',
    warning: 'alert-triangle',
    primary: 'info',
  }

  return icons[props.variant]
})

function closeDialog() {
  if (props.loading) return

  emit('update:modelValue', false)
  emit('cancel')
}

function confirmAction() {
  if (props.loading) return
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="dialog-overlay"
        @click.self="closeDialog"
        @keydown.esc="closeDialog"
      >
        <section
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-message"
        >
          <div :class="['dialog-icon', variant]">
            <Icon :name="`lucide:${iconName}`" />
          </div>

          <h2 id="confirmation-title">
            {{ title }}
          </h2>

          <p id="confirmation-message">
            {{ message }}
            <strong v-if="itemName">{{ itemName }}</strong>
          </p>

          <div class="dialog-actions">
            <button
              type="button"
              class="cancel-button"
              :disabled="loading"
              @click="closeDialog"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              :class="['confirm-button', variant]"
              :disabled="loading"
              @click="confirmAction"
            >
              <Icon
                v-if="loading"
                name="lucide:loader-circle"
                class="loading-icon"
              />

              {{ loading ? 'Please wait...' : confirmText }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(15 23 42 / 50%);
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  width: 100%;
  max-width: 420px;
  padding: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 60px rgb(0 0 0 / 18%);

  h2 {
    margin: 16px 0 8px;
    color: #111827;
    font-size: 19px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.7;
  }

  strong {
    color: #111827;
    font-weight: 600;
  }
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  font-size: 21px;

  &.danger {
    background: #fef2f2;
    color: #dc2626;
  }

  &.success {
    background: #f0fdf4;
    color: #16a34a;
  }

  &.warning {
    background: #fffbeb;
    color: #d97706;
  }

  &.primary {
    background: #eff6ff;
    color: #2563eb;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 26px;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 39px;
    padding: 9px 15px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.cancel-button {
  border-color: #d1d5db !important;
  background: #fff;
  color: #374151;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }
}

.confirm-button {
  color: #fff;

  &.danger {
    border-color: #dc2626;
    background: #dc2626;
  }

  &.success {
    border-color: #16a34a;
    background: #16a34a;
  }

  &.warning {
    border-color: #d97706;
    background: #d97706;
  }

  &.primary {
    border-color: #2563eb;
    background: #2563eb;
  }
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;

  .confirm-dialog {
    transition: transform 0.2s ease;
  }
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .confirm-dialog {
    transform: translateY(10px) scale(0.98);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 420px) {
  .confirm-dialog {
    padding: 21px;
  }

  .dialog-actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
