
<script setup lang="ts">
import type { DashboardTopProduct } from '../../types/dashboard'

defineProps<{
  products: DashboardTopProduct[]
}>()

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}
</script>

<template>
  <section class="top-products-card">
    <div class="section-header">
      <div>
        <h2>Top Selling Products</h2>
        <p>Your best performing products</p>
      </div>

      <span class="period-label">This Month</span>
    </div>

    <div class="products-list">
      <div
        v-for="(product, index) in products"
        :key="product.id"
        class="product-item"
      >
        <div class="product-rank">
          {{ index + 1 }}
        </div>

        <div
          class="product-avatar"
          :style="{ backgroundColor: product.color }"
        >
          {{ product.initials }}
        </div>

        <div class="product-info">
          <strong>{{ product.name }}</strong>
          <span>SKU: {{ product.sku }}</span>
        </div>

        <div class="product-sales">
          <strong>{{ product.unitsSold }}</strong>
          <span>Units sold</span>
        </div>

        <div class="product-revenue">
          <strong>{{ formatCurrency(product.revenue) }}</strong>
          <span>Revenue</span>
        </div>
      </div>

      <div v-if="products.length === 0" class="empty-state">
        No products available.
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.top-products-card {
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

.period-label {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 6px;
  background: #f5f7fb;
  color: #596579;
  font-size: 11px;
  font-weight: 600;
}

.products-list {
  display: flex;
  flex-direction: column;
}

.product-item {
  display: grid;
  grid-template-columns: 24px 42px minmax(0, 1fr) 75px 110px;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f2f6;

  &:last-child {
    border-bottom: 0;
  }
}

.product-rank {
  color: #a0a8b6;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.product-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 9px;
  color: #465268;
  font-size: 12px;
  font-weight: 750;
}

.product-info,
.product-sales,
.product-revenue {
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

.product-sales,
.product-revenue {
  text-align: right;
}

.product-revenue strong {
  color: #159765;
}

.empty-state {
  padding: 30px 10px;
  color: #8993a5;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 600px) {
  .top-products-card {
    padding: 16px;
  }

  .product-item {
    grid-template-columns: 20px 38px minmax(0, 1fr) 65px;
    gap: 9px;
  }

  .product-avatar {
    width: 38px;
    height: 38px;
  }

  .product-revenue {
    display: none;
  }
}
</style>
