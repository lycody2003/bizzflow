<script setup lang="ts">
import { ref } from 'vue'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@app-types/category'
import IconPicker from '@components/common/IconPicker.vue'

const props = defineProps<{
  submitting: boolean
  initialCategory?: Category | null
}>()

const emit = defineEmits<{
  submit: [payload: CreateCategoryInput | UpdateCategoryInput]
  cancel: []
}>()

const categoryName = ref(props.initialCategory?.name ?? '')
const categoryIcon = ref<string | null>(
  props.initialCategory?.icon ?? null,
)
const error = ref<string | null>(null)

function handleSubmit() {
  if (props.submitting) return

  const name = categoryName.value.trim()

  if (name.length < 2 || name.length > 100) {
    error.value = 'Category name must contain 2 to 100 characters.'
    return
  }

  error.value = null

  emit('submit', {
    name,
    icon: categoryIcon.value,
  })
}
</script>

<template>
  <div
    class="category-form-overlay"
    @click.self="!submitting && emit('cancel')"
  >
    <section
      class="category-form-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
    >
      <header class="form-header">
        <div>
          <h2 id="category-form-title">
            {{ initialCategory ? 'Edit Category' : 'Create Category' }}
          </h2>

          <p>
            {{
              initialCategory
                ? 'Update the information of this category.'
                : 'Add a new category to your business.'
            }}
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          aria-label="Close form"
          :disabled="submitting"
          @click="emit('cancel')"
        >
          ×
        </button>
      </header>

      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="form-error">
          {{ error }}
        </div>

        <div class="form-body">
          <div class="field">
            <label for="category-name">Category Name</label>

            <input
              id="category-name"
              v-model="categoryName"
              type="text"
              minlength="2"
              maxlength="100"
              placeholder="Enter category name"
              required
              :disabled="submitting"
            />
          </div>

          <div class="field icon-field">
            <label>Category Icon</label>

            <IconPicker
              v-model="categoryIcon"
              :disabled="submitting"
            />
          </div>
        </div>

        <footer class="form-actions">
          <button
            type="button"
            class="secondary-button"
            :disabled="submitting"
            @click="emit('cancel')"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="primary-button"
            :disabled="submitting"
          >
            {{
              submitting
                ? 'Saving...'
                : initialCategory
                  ? 'Update Category'
                  : 'Save Category'
            }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.category-form-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(15 23 42 / 45%);
}

.category-form-modal {
  width: 100%;
  max-width: 520px;
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
  gap: 16px;
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
  flex-shrink: 0;
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

.form-body {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  label {
    color: #374151;
    font-size: 13px;
    font-weight: 500;
  }

  input {
    min-height: 40px;
    padding: 9px 11px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    font: inherit;
    font-size: 13px;

    &:focus {
      border-color: #2563eb;
    }

    &:disabled {
      background: #f9fafb;
      cursor: not-allowed;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid #e5e7eb;
}

.primary-button,
.secondary-button {
  min-height: 40px;
  padding: 9px 16px;
  border-radius: 6px;
  font-size: 13px;
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

.form-error {
  margin: 20px 24px 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

@media (max-width: 600px) {
  .category-form-overlay {
    padding: 12px;
  }

  .form-header,
  .form-body {
    padding: 18px;
  }

  .form-actions {
    padding: 16px 18px;
  }
}
</style>
