
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import type { SalesPeriod, DashboardCurrency } from '../../types/dashboard'
import {
  salesChartData,
  salesChartCurrencies,
} from '../../data/dashboard.data'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
)

const props = defineProps<{
  businessId: string
}>()

const selectedPeriod = ref<SalesPeriod>('7days')

const periodOptions: { label: string; value: SalesPeriod }[] = [
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '12 Months', value: '12months' },
]

const currency = computed<DashboardCurrency>(() => {
  return salesChartCurrencies[props.businessId] ?? 'USD'
})

const currentData = computed(() => {
  return salesChartData[props.businessId]?.[selectedPeriod.value] ?? []
})

const totalSales = computed(() => {
  return currentData.value.reduce(
    (total, item) => total + item.sales,
    0,
  )
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.value,
    maximumFractionDigits: currency.value === 'KHR' ? 0 : 2,
  }).format(value)
}

const chartData = computed(() => ({
  labels: currentData.value.map(item => item.label),
  datasets: [
    {
      label: 'Sales',
      data: currentData.value.map(item => item.sales),
      borderColor: '#3979e8',
      backgroundColor: 'rgba(57, 121, 232, 0.10)',
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#3979e8',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      displayColors: false,
      callbacks: {
        label: context => {
          return `Sales: ${formatCurrency(Number(context.raw))}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#8993a5',
        font: {
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      border: {
        display: false,
        dash: [4, 4],
      },
      grid: {
        color: '#edf0f5',
      },
      ticks: {
        color: '#8993a5',
        font: {
          size: 11,
        },
        callback: value => formatCurrency(Number(value)),
      },
    },
  },
}

const formattedTotalSales = computed(() => {
  return formatCurrency(totalSales.value)
})
</script>

<template>
  <section class="sales-chart-card">
    <div class="chart-header">
      <div class="chart-heading">
        <h2>Sales Overview</h2>
        <p>Monitor your sales performance over time.</p>
      </div>

      <select
        v-model="selectedPeriod"
        class="period-select"
        aria-label="Select sales period"
      >
        <option
          v-for="option in periodOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="chart-summary">
      <span>Total Sales</span>
      <strong>{{ formattedTotalSales }}</strong>
    </div>

    <div class="chart-container">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.sales-chart-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.chart-heading {
  min-width: 0;

  h2 {
    margin: 0 0 7px;
    color: #172033;
    font-size: 16px;
    font-weight: 750;
  }

  p {
    margin: 0;
    color: #8993a5;
    font-size: 12px;
    line-height: 1.5;
  }
}

.period-select {
  flex-shrink: 0;
  padding: 9px 30px 9px 11px;
  border: 1px solid #e5eaf1;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #596579;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:focus {
    border-color: #3979e8;
  }
}

.chart-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 24px;

  span {
    color: #8993a5;
    font-size: 12px;
  }

  strong {
    color: #172033;
    font-size: 24px;
    font-weight: 750;
  }
}

.chart-container {
  position: relative;
  width: 100%;
  height: 260px;
  margin-top: 20px;
}

@media (max-width: 480px) {
  .sales-chart-card {
    padding: 16px;
  }

  .chart-header {
    flex-direction: column;
  }

  .chart-container {
    height: 220px;
  }
}
</style>
