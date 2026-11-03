
<script setup lang="ts">
import { onMounted } from 'vue'

import DashboardWelcome from '@components/dashboard/DashboardWelcome.vue'
import DashboardBusinessSelector from '@components/dashboard/DashboardBusinessSelector.vue'
import DashboardStatCard from '@components/dashboard/DashboardStatCard.vue'
import DashboardSalesChart from '@components/dashboard/DashboardSalesChart.vue'
import DashboardRecentTransactions from '@components/dashboard/DashboardRecentTransactions.vue'
import DashboardTopProducts from '@components/dashboard/DashboardTopProducts.vue'
import DashboardLowStock from '@components/dashboard/DashboardLowStock.vue'

import dashboard from '@composables/useDashboard'

const selectedBusinessId = dashboard.selectedBusinessIdValue
const businesses = dashboard.businessesValue
const stats = dashboard.statsValue
const transactions = dashboard.transactionsValue
const topProducts = dashboard.topProductsValue
const lowStockProducts = dashboard.lowStockProductsValue
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
                    v-for="stat in stats"
                    :key="stat.id"
                    :stat="stat"
                />
            </section>

            <section class="dashboard-charts">
                <DashboardSalesChart
                    :business-id="selectedBusinessId"
                />
            </section>

            <section class="dashboard-transactions">
                <DashboardRecentTransactions
                    :transactions="transactions"
                />
            </section>

            <section class="dashboard-bottom">
                <DashboardTopProducts :products="topProducts" />

                <DashboardLowStock :products="lowStockProducts" />
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
}

.dashboard-charts,
.dashboard-transactions {
    margin-top: 24px;
}

.dashboard-bottom {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 24px;
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

    .dashboard-bottom {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>
