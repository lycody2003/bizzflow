<script setup lang="ts">
import { computed, ref } from 'vue'
import iconCatalog from '../../data/lucide-icons.json'

const iconNames: string[] = iconCatalog

const props = withDefaults(defineProps<{
  modelValue?: string | null
  disabled?: boolean
}>(), {
  modelValue: null,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const search = ref('')
const visibleLimit = ref(100)

const filteredIcons = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) return iconNames

  return iconNames.filter(name => name.includes(keyword))
})

const visibleIcons = computed(() =>
  filteredIcons.value.slice(0, visibleLimit.value),
)

function handleSearch() {
  visibleLimit.value = 100
}

function selectIcon(name: string) {
  if (props.disabled) return

  emit('update:modelValue', name)
}

function clearSelection() {
  if (props.disabled) return

  emit('update:modelValue', null)
}

function loadMore() {
  visibleLimit.value += 100
}
</script>

<template>
  <div class="icon-picker">
    <div class="icon-picker-header">
      <div class="selected-icon">
        <div class="selected-icon-preview">
          <Icon
            v-if="modelValue"
            :name="`lucide:${modelValue}`"
            size="24"
          />
          <Icon
            v-else
            name="lucide:image-plus"
            size="24"
          />
        </div>

        <div class="selected-icon-info">
          <span class="selected-icon-label">Selected Icon</span>
          <span class="selected-icon-name">
            {{ modelValue || 'No icon selected' }}
          </span>
        </div>
      </div>

      <button
        v-if="modelValue"
        type="button"
        class="clear-button"
        :disabled="disabled"
        @click="clearSelection"
      >
        Clear
      </button>
    </div>

    <div class="icon-search">
      <Icon name="lucide:search" size="18" />

      <input
        v-model="search"
        type="search"
        placeholder="Search all Lucide icons..."
        :disabled="disabled"
        @input="handleSearch"
      />
    </div>

    <div class="icon-results-header">
      <span>Available Icons</span>
      <span>{{ filteredIcons.length.toLocaleString() }} icons</span>
    </div>

    <div v-if="visibleIcons.length" class="icon-grid">
      <button
        v-for="name in visibleIcons"
        :key="name"
        type="button"
        :class="[
          'icon-option',
          { selected: modelValue === name },
        ]"
        :disabled="disabled"
        :title="name"
        @click="selectIcon(name)"
      >
        <Icon :name="`lucide:${name}`" size="22" />
        <span>{{ name }}</span>
      </button>
    </div>

    <div v-else class="empty-state">
      <Icon name="lucide:search-x" size="24" />
      <span>No icons found.</span>
    </div>

    <button
      v-if="visibleLimit < filteredIcons.length"
      type="button"
      class="load-more-button"
      @click="loadMore"
    >
      Load More Icons
      ({{ Math.min(visibleLimit, filteredIcons.length) }} of
      {{ filteredIcons.length }})
    </button>
  </div>
</template>

<style lang="scss" scoped>
.icon-picker {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.icon-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.selected-icon {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #374151;
}

.selected-icon-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-icon-label,
.icon-results-header {
  color: #6b7280;
  font-size: 12px;
}

.selected-icon-name {
  color: #111827;
  font-size: 13px;
  font-weight: 500;
}

.clear-button {
  padding: 7px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }
}

.icon-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  color: #6b7280;

  &:focus-within {
    border-color: #2563eb;
  }

  input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #111827;
    font-size: 13px;
  }
}

.icon-results-header {
  display: flex;
  justify-content: space-between;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 2px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  min-height: 76px;
  padding: 8px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: white;
  color: #374151;
  cursor: pointer;

  span {
    width: 100%;
    overflow: hidden;
    color: #6b7280;
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover:not(:disabled) {
    border-color: #93c5fd;
    background: #eff6ff;
  }

  &.selected {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;

    span {
      color: #2563eb;
      font-weight: 600;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: #9ca3af;
  font-size: 13px;
}

.load-more-button {
  min-height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
}

@media (max-width: 480px) {
  .icon-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
