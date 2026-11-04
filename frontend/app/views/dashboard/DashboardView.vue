<script setup lang="ts">
import { onMounted } from 'vue'

import DashboardWelcome from '@components/dashboard/DashboardWelcome.vue'
import DashboardBusinessSelector from '@components/dashboard/DashboardBusinessSelector.vue'
import DashboardStatCard from '@components/dashboard/DashboardStatCard.vue'

import dashboard from '@composables/useDashboard'

const selectedBusinessId = dashboard.selectedBusinessIdValue
const businesses = dashboard.businessesValue
const overview = dashboard.overviewValue
const loading = dashboard.loadingValue
const error = dashboard.errorValue

onMounted(async () => {
  await dashboard.loadDashboard()
})

async function handleBusinessChange(businessId: string) {
  await dashboard.selectBusiness(businessId)
}
</script>

<template>
  <div class="dashboard-view">
    <DashboardWelcome />

    <DashboardBusinessSelector
      :model-value="selectedBusinessId"
      :businesses="businesses"
      @update:model-value="handleBusinessChange"
    />

    <div v-if="loading" class="dashboard-state">
      Loading dashboard...
    </div>

    <div v-else-if="error" class="dashboard-state dashboard-error">
      <p>{{ error }}</p>

      <button type="button" @click="dashboard.refreshDashboard()">
        Try Again
      </button>
    </div>

    <template v-else>
      <section class="stats-grid">
        <DashboardStatCard
          title="Total Products"
          :value="overview.totalProducts"
          description="Active products in inventory"
          icon="📦"
          variant="blue"
        />

        <DashboardStatCard
          title="Low Stock"
          :value="overview.lowStockProducts"
          description="Products at or below minimum stock"
          icon="⚠️"
          variant="orange"
        />

        <DashboardStatCard
          title="Out of Stock"
          :value="overview.outOfStockProducts"
          description="Products with zero stock"
          icon="🚫"
          variant="purple"
        />

        <DashboardStatCard
          title="Inventory Cost Value"
          :currency-values="overview.inventoryCostValue"
          description="Cost value of current inventory"
          icon="💰"
          variant="green"
        />

        <DashboardStatCard
          title="Potential Sales Value"
          :currency-values="overview.potentialSalesValue"
          description="Estimated selling value of current stock"
          icon="📈"
          variant="blue"
        />
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.dashboard-state {
  padding: 32px 16px;
  text-align: center;
}

.dashboard-error {
  color: #dc2626;

  button {
    margin-top: 12px;
    padding: 8px 16px;
    border: 1px solid currentColor;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
