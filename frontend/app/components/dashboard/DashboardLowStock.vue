
<script setup lang="ts">
import type { DashboardLowStockProduct } from '../../types/dashboard'

defineProps<{
  products: DashboardLowStockProduct[]
}>()

function getStockPercentage(product: DashboardLowStockProduct): number {
  if (product.minimumStock <= 0) return 0

  return Math.min(
    (product.currentStock / product.minimumStock) * 100,
    100,
  )
}

function getStockStatus(product: DashboardLowStockProduct): string {
  if (product.currentStock === 0) return 'Out of Stock'
  if (product.currentStock <= product.minimumStock * 0.5) {
    return 'Critical'
  }

  return 'Low Stock'
}

function getStockClass(product: DashboardLowStockProduct): string {
  if (product.currentStock === 0) return 'stock-out'
  if (product.currentStock <= product.minimumStock * 0.5) {
    return 'stock-critical'
  }

  return 'stock-low'
}
</script>

<template>
  <section class="low-stock-card">
    <div class="section-header">
      <div>
        <h2>Low Stock Alerts</h2>
        <p>Products that need restocking</p>
      </div>

      <span class="alert-count">
        {{ products.length }} Alerts
      </span>
    </div>

    <div class="products-list">
      <div
        v-for="product in products"
        :key="product.id"
        class="stock-item"
      >
        <div class="product-info">
          <div class="product-details">
            <strong>{{ product.name }}</strong>
            <span>SKU: {{ product.sku }}</span>
          </div>

          <span
            class="stock-status"
            :class="getStockClass(product)"
          >
            {{ getStockStatus(product) }}
          </span>
        </div>

        <div class="stock-progress">
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="getStockClass(product)"
              :style="{ width: `${getStockPercentage(product)}%` }"
            />
          </div>

          <div class="stock-numbers">
            <span>
              <strong>{{ product.currentStock }}</strong>
              {{ product.unit }} available
            </span>

            <span>
              Minimum: {{ product.minimumStock }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="products.length === 0" class="empty-state">
        <span class="empty-icon">✓</span>
        <strong>All products are well stocked!</strong>
        <p>No low stock alerts at the moment.</p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.low-stock-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;

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
  }
}

.alert-count {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 6px;
  background: #fff0f0;
  color: #d65b5b;
  font-size: 11px;
  font-weight: 700;
}

.products-list {
  display: flex;
  flex-direction: column;
}

.stock-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f2f6;

  &:last-child {
    border-bottom: 0;
  }
}

.product-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  strong {
    overflow: hidden;
    color: #263248;
    font-size: 12px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #98a1b0;
    font-size: 10px;
  }
}

.stock-status {
  flex-shrink: 0;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
}

.stock-out {
  color: #d65b5b;
  background: #fff0f0;
}

.stock-critical {
  color: #d65b5b;
  background: #fff0f0;
}

.stock-low {
  color: #d58a20;
  background: #fff5df;
}

.progress-track {
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 10px;
  background: #edf0f5;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.25s ease;

  &.stock-out,
  &.stock-critical {
    background: #e46a6a;
  }

  &.stock-low {
    background: #e6a33e;
  }
}

.stock-numbers {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  color: #98a1b0;
  font-size: 10px;

  strong {
    color: #465268;
    font-weight: 750;
  }
}

.empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 35px 10px;
  text-align: center;

  strong {
    color: #263248;
    font-size: 13px;
  }

  p {
    margin: 0;
    color: #8993a5;
    font-size: 11px;
  }
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #e8f7ef;
  color: #159765;
  font-size: 20px;
}
</style>
