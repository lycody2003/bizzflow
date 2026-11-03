
<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardStat } from '../../types/dashboard'

const props = defineProps<{
  stat: DashboardStat
}>()

const formattedValue = computed(() => {
  if (props.stat.valueType === 'currency' && props.stat.currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: props.stat.currency,
      maximumFractionDigits: props.stat.currency === 'KHR' ? 0 : 2,
    }).format(props.stat.value)
  }

  return new Intl.NumberFormat('en-US').format(props.stat.value)
})
</script>

<template>
  <article class="stat-card">
    <div class="stat-header">
      <div class="stat-icon" :class="`icon-${stat.variant}`">
        {{ stat.icon }}
      </div>

      <span
        class="stat-change"
        :class="stat.change >= 0 ? 'positive' : 'negative'"
      >
        {{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}%
      </span>
    </div>

    <div class="stat-content">
      <span class="stat-title">{{ stat.title }}</span>

      <strong class="stat-value">{{ formattedValue }}</strong>

      <span class="stat-description">
        {{ stat.description }}
      </span>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.stat-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgb(15 23 42 / 5%);
  }
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 750;

  &.icon-blue {
    color: #3979e8;
    background: #eaf0ff;
  }

  &.icon-green {
    color: #16a36a;
    background: #e6f7ef;
  }

  &.icon-orange {
    color: #e58a27;
    background: #fff3e5;
  }

  &.icon-purple {
    color: #8856d8;
    background: #f2eaff;
  }
}

.stat-change {
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;

  &.positive {
    color: #159765;
    background: #e8f7ef;
  }

  &.negative {
    color: #d65b5b;
    background: #fff0f0;
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-title {
  color: #7b8495;
  font-size: 13px;
  font-weight: 600;
}

.stat-value {
  overflow: hidden;
  color: #172033;
  font-size: clamp(20px, 2vw, 25px);
  font-weight: 750;
  letter-spacing: -0.7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-description {
  color: #98a1b0;
  font-size: 11px;
}

@media (max-width: 380px) {
  .stat-card {
    padding: 15px;
  }
}
</style>
