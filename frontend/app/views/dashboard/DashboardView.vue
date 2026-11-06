<script setup lang="ts">
import { onMounted } from 'vue'

import DashboardWelcome from '@components/dashboard/DashboardWelcome.vue'
import DashboardBusinessSelector from '@components/dashboard/DashboardBusinessSelector.vue'
import DashboardStatCard from '@components/dashboard/DashboardStatCard.vue'

import dashboard from '@composables/useDashboard'

const selectedBusiness = dashboard.selectedBusiness
const overview = dashboard.overviewValue
const loading = dashboard.loadingValue
const error = dashboard.errorValue

onMounted(async () => {
  await dashboard.loadDashboard()
})

async function handleRefresh(): Promise<void> {
  await dashboard.refreshDashboard()
}
</script>

<template>
  <div class="dashboard-view">
    <header class="dashboard-header">
      <DashboardWelcome>
        <template #actions>
          <button type="button" class="refresh-button" :disabled="loading" :aria-busy="loading" @click="handleRefresh">
            <svg class="refresh-icon" :class="{ spinning: loading }" xmlns="http://www.w3.org/2000/svg" width="16"
              height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" aria-hidden="true">
              <path d="M20 7v5h-5" />
              <path d="M4 17v-5h5" />
              <path d="M5.64 9A8 8 0 0 1 19 7l1 5" />
              <path d="M4 12l1 5a8 8 0 0 0 13.36-2" />
            </svg>

            <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </template>
      </DashboardWelcome>
    </header>

    <DashboardBusinessSelector :business="selectedBusiness" />

    <div v-if="loading" class="dashboard-state" role="status">
      <span class="loading-spinner" />
      <p>Loading your business overview...</p>
    </div>

    <section v-else-if="error" class="dashboard-state dashboard-error" role="alert">
      <div class="state-icon">!</div>
      <h2>Unable to load dashboard</h2>
      <p>{{ error }}</p>
      <button type="button" class="retry-button" @click="handleRefresh">
        Try Again
      </button>
    </section>

    <template v-else>
      <section class="dashboard-section">
        <div class="section-heading">
          <div>
            <h2>Inventory Overview</h2>
            <p>A snapshot of your current inventory</p>
          </div>
        </div>

        <div class="stats-grid">
          <DashboardStatCard title="Total Products" :value="overview.totalProducts" description="Active products"
            icon="📦" variant="blue" />

          <DashboardStatCard title="Total Variants" :value="overview.totalVariants"
            description="Active product variants" icon="🧩" variant="purple" />

          <DashboardStatCard title="Low Stock Items" :value="overview.lowStockProducts"
            description="At or below minimum stock" icon="⚠️" variant="orange" />

          <DashboardStatCard title="Out of Stock" :value="overview.outOfStockProducts"
            description="Items with zero stock" icon="🚫" variant="purple" />
        </div>
      </section>

      <section class="dashboard-section financial-section">
        <div class="section-heading">
          <div>
            <h2>Financial Overview</h2>
            <p>Estimated value of your current inventory</p>
          </div>
        </div>

        <div class="stats-grid financial-grid">
          <DashboardStatCard title="Inventory Cost Value" :currency-values="overview.inventoryCostValue"
            description="Cost value of current stock" icon="💰" variant="green" financial />

          <DashboardStatCard title="Potential Sales Value" :currency-values="overview.potentialSalesValue"
            description="Estimated selling value of current stock" icon="📈" variant="blue" financial />
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding-bottom: 28px;
}

.dashboard-header {
  width: 100%;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  min-height: 42px;
  padding: 0 18px;

  flex-shrink: 0;

  border: 1px solid #dce4ef;
  border-radius: 10px;

  background: #fff;
  color: #334155;

  font-family: inherit;
  font-size: 13px;
  font-weight: 650;

  cursor: pointer;

  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    background: #f0f6ff;
    border-color: #3979e8;
    color: #2563eb;
    box-shadow: 0 2px 6px rgba(57, 121, 232, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 3px solid rgba(57, 121, 232, 0.2);
    outline-offset: 2px;
  }
}

.refresh-icon {
  flex-shrink: 0;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.dashboard-section {
  margin-bottom: 28px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 0 0 5px;
    color: var(--color-text, #172033);
    font-size: 16px;
    font-weight: 750;
  }

  p {
    margin: 0;
    color: #8993a5;
    font-size: 12px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.financial-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dashboard-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 32px 16px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
  text-align: center;

  p {
    margin: 0;
    color: #7b8495;
    font-size: 13px;
  }
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5eaf1;
  border-top-color: #3979e8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.dashboard-error {
  h2 {
    margin: 0;
    color: #172033;
    font-size: 16px;
  }

  >p {
    max-width: 480px;
    color: #dc2626;
  }
}

.state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff0f0;
  color: #dc2626;
  font-weight: 750;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .stats-grid,
  .financial-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dashboard-section {
    margin-bottom: 22px;
  }
}
</style>
