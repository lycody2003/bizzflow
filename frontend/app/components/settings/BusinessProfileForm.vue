
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  name: string
  status: 'active' | 'inactive'
  saving: boolean
}>()

const emit = defineEmits<{
  save: [name: string]
}>()

const name = ref(props.name)

watch(
  () => props.name,
  (value) => {
    name.value = value
  },
)

const hasChanges = computed(
  () => name.value.trim() !== props.name,
)

function submit() {
  if (
    props.saving ||
    !hasChanges.value ||
    name.value.trim().length < 2 ||
    name.value.trim().length > 150
  ) {
    return
  }

  emit('save', name.value.trim())
}
</script>

<template>
  <form class="profile-form" @submit.prevent="submit">
    <div class="form-field">
      <label for="business-name">Business Name</label>

      <input
        id="business-name"
        v-model="name"
        type="text"
        maxlength="150"
        placeholder="Enter your business name"
        :disabled="saving"
      >

      <p>Use the name customers recognize your business by.</p>
    </div>

    <div class="form-field">
      <label>Business Status</label>

      <span
        class="status"
        :class="status === 'active' ? 'status-active' : 'status-inactive'"
      >
        {{ status === 'active' ? 'Active' : 'Inactive' }}
      </span>
    </div>

    <div class="form-footer">
      <button
        type="submit"
        class="save-button"
        :disabled="saving || !hasChanges || name.trim().length < 2"
      >
        <Icon
          v-if="saving"
          name="lucide:loader-circle"
          class="spin"
        />

        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;

  label {
    color: #374151;
    font-size: 13px;
    font-weight: 500;
  }

  input {
    width: 100%;
    max-width: 480px;
    min-height: 40px;
    padding: 9px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
    color: #111827;
    font-size: 13px;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgb(37 99 235 / 10%);
    }

    &:disabled {
      background: #f9fafb;
      cursor: not-allowed;
    }
  }

  p {
    margin: 0;
    color: #737373;
    font-size: 12px;
  }
}

.status {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 12px;
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

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.save-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 9px 15px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
