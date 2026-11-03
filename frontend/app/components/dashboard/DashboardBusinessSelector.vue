
<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardBusiness } from '../../types/dashboard'

const props = defineProps<{
  businesses: DashboardBusiness[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedBusiness = computed(() => {
  return props.businesses.find(
    business => business.id === props.modelValue,
  )
})

function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement

  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="business-selector">
    <div class="business-info">
      <div class="business-icon">
        {{ selectedBusiness?.name.charAt(0).toUpperCase() || 'B' }}
      </div>

      <div class="business-details">
        <span class="business-label">CURRENT BUSINESS</span>

        <strong>
          {{ selectedBusiness?.name || 'Select a business' }}
        </strong>

        <span v-if="selectedBusiness" class="business-role">
          {{ selectedBusiness.role }}
        </span>
      </div>
    </div>

    <div class="select-wrapper">
      <select
        :value="modelValue"
        :disabled="businesses.length === 0"
        aria-label="Select business"
        @change="handleChange"
      >
        <option value="" disabled>
          Select a business
        </option>

        <option
          v-for="business in businesses"
          :key="business.id"
          :value="business.id"
        >
          {{ business.name }}
        </option>
      </select>

      <span class="select-arrow">⌄</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.business-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 24px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
}

.business-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.business-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #eaf0ff;
  color: #3979e8;
  font-size: 18px;
  font-weight: 750;
}

.business-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

  strong {
    overflow: hidden;
    color: #172033;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.business-label {
  color: #8993a5;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1px;
}

.business-role {
  color: #7b8495;
  font-size: 11px;
}

.select-wrapper {
  position: relative;
  flex-shrink: 0;

  select {
    min-width: 145px;
    appearance: none;
    padding: 10px 34px 10px 12px;
    border: 1px solid #e5eaf1;
    border-radius: 8px;
    outline: none;
    background: #fff;
    color: #465268;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  select:focus {
    border-color: #3979e8;
    box-shadow: 0 0 0 3px rgb(57 121 232 / 10%);
  }
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  color: #64748b;
  font-size: 16px;
  pointer-events: none;
  transform: translateY(-55%);
}

@media (max-width: 480px) {
  .business-selector {
    align-items: flex-start;
    flex-direction: column;
  }

  .select-wrapper {
    width: 100%;

    select {
      width: 100%;
    }
  }
}
</style>
