<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value?: number
  currencyValues?: {
    USD: number
    KHR: number
  }
  description: string
  icon: string
  variant: 'blue' | 'green' | 'orange' | 'purple'
  currency?: 'USD' | 'KHR'
  financial?: boolean
}

const props = defineProps<Props>()

const formattedValue = computed(() => {
  if (props.value === undefined) return ''

  if (props.currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: props.currency,
      maximumFractionDigits: props.currency === 'KHR' ? 0 : 2,
    }).format(props.value)
  }

  return new Intl.NumberFormat('en-US').format(props.value)
})

const formattedCurrencyValues = computed(() => {
  if (!props.currencyValues) return []

  return [
    {
      currency: 'USD',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(props.currencyValues.USD),
    },
    {
      currency: 'KHR',
      value: `KHR ${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(props.currencyValues.KHR)}`,
    },
  ]
})
</script>

<template>
  <article
    class="stat-card"
    :class="[
      `variant-${variant}`,
      { 'financial-card': financial },
    ]"
  >
    <template v-if="financial">
      <div class="financial-icon" aria-hidden="true">
        {{ icon }}
      </div>

      <div class="financial-divider" />

      <div class="stat-content financial-content">
        <span class="stat-title">{{ title }}</span>

        <div
          v-if="currencyValues"
          class="financial-values"
        >
          <div
            v-for="item in formattedCurrencyValues"
            :key="item.currency"
            class="financial-value-row"
          >
            <strong class="stat-value">{{ item.value }}</strong>
            <span class="currency-label" :class="item.currency.toLowerCase()">
              {{ item.currency }}
            </span>
          </div>
        </div>

        <strong v-else class="stat-value">{{ formattedValue }}</strong>
        <span class="stat-description">{{ description }}</span>
      </div>

      <div class="financial-decoration" aria-hidden="true" />
    </template>

    <template v-else>
      <div class="stat-header">
        <div class="stat-icon" :class="`icon-${variant}`">
          {{ icon }}
        </div>
      </div>

      <div class="stat-content">
        <span class="stat-title">{{ title }}</span>
        <div v-if="currencyValues" class="stat-currency-values">
          <strong
            v-for="item in formattedCurrencyValues"
            :key="item.currency"
            class="stat-value"
          >
            {{ item.value }}
          </strong>
        </div>
        <strong v-else class="stat-value">{{ formattedValue }}</strong>
        <span class="stat-description">{{ description }}</span>
      </div>
    </template>
  </article>
</template>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  min-width: 0;
  padding: 20px;
  overflow: hidden;
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

.stat-currency-values {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-description {
  color: #98a1b0;
  font-size: 11px;
}

.financial-card {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 178px;
  padding: 28px;
  isolation: isolate;

  &.variant-green {
    border-color: #d8eee3;
    background: linear-gradient(115deg, #fbfefc 0%, #f4fbf7 100%);
  }

  &.variant-blue {
    border-color: #dce7ff;
    background: linear-gradient(115deg, #fcfdff 0%, #f4f7ff 100%);
  }
}

.financial-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  flex-shrink: 0;
  border-radius: 24px;
  background: rgb(255 255 255 / 75%);
  font-size: 38px;
  z-index: 1;
}

.variant-green .financial-icon {
  background: #e7f7ee;
}

.variant-blue .financial-icon {
  background: #e9f0ff;
}

.financial-divider {
  width: 1px;
  align-self: stretch;
  flex-shrink: 0;
  background: #dce5e9;
}

.financial-content {
  position: relative;
  z-index: 1;
  gap: 10px;
  min-width: 0;
}

.financial-content .stat-title {
  color: #172033;
  font-size: 17px;
  font-weight: 750;
}

.financial-values {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.financial-value-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.financial-value-row .stat-value {
  font-size: clamp(20px, 2vw, 26px);
}

.currency-label {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 750;

  &.usd {
    color: #176b43;
    background: #e2f5e9;
  }

  &.khr {
    color: #2458ae;
    background: #e5edff;
  }
}

.financial-decoration {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 0;
  width: 38%;
  height: 65%;
  opacity: 0.7;
  pointer-events: none;
  clip-path: polygon(0 100%, 25% 78%, 45% 60%, 65% 50%, 82% 24%, 100% 10%, 100% 100%);
}

.variant-green .financial-decoration {
  background: linear-gradient(145deg, rgb(190 239 211 / 5%), rgb(135 220 172 / 38%));
}

.variant-blue .financial-decoration {
  background: linear-gradient(145deg, rgb(190 211 255 / 5%), rgb(137 173 255 / 38%));
}

@media (max-width: 700px) {
  .financial-card {
    gap: 16px;
    min-height: 150px;
    padding: 20px;
  }

  .financial-icon {
    width: 70px;
    height: 70px;
    border-radius: 18px;
    font-size: 29px;
  }

  .financial-content .stat-title {
    font-size: 14px;
  }

  .financial-value-row .stat-value {
    font-size: 19px;
  }

  .financial-decoration {
    width: 30%;
    height: 45%;
  }
}

@media (max-width: 420px) {
  .financial-card {
    gap: 12px;
    padding: 15px;
  }

  .financial-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    font-size: 23px;
  }

  .financial-value-row {
    gap: 6px;
  }

  .financial-value-row .stat-value {
    font-size: 17px;
  }

  .currency-label {
    padding: 4px 7px;
    font-size: 9px;
  }
}
</style>
