
<script setup lang="ts">
import type {
  DashboardTransaction,
  DashboardCurrency,
  TransactionStatus,
  TransactionType,
} from '../../types/dashboard'

defineProps<{
  transactions: DashboardTransaction[]
}>()

function formatDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate)
}

function formatAmount(
  amount: number,
  currency: DashboardCurrency,
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'KHR' ? 0 : 2,
    maximumFractionDigits: currency === 'KHR' ? 0 : 2,
  }).format(amount)
}

function getTypeClass(type: TransactionType): string {
  return `type-${type.toLowerCase()}`
}

function getStatusClass(status: TransactionStatus): string {
  return `status-${status.toLowerCase()}`
}
</script>

<template>
  <section class="transactions-card">
    <div class="section-header">
      <div>
        <h2>Recent Transactions</h2>
        <p>Your latest business activities</p>
      </div>

      <button type="button" class="view-all-button">
        View All
        <span>→</span>
      </button>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Type</th>
            <th>Customer / Supplier</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="transaction in transactions"
            :key="transaction.id"
          >
            <td class="reference">
              {{ transaction.reference }}
            </td>

            <td>
              <span
                class="type-badge"
                :class="getTypeClass(transaction.type)"
              >
                {{ transaction.type }}
              </span>
            </td>

            <td class="contact">
              {{ transaction.contact }}
            </td>

            <td class="date">
              {{ formatDate(transaction.date) }}
            </td>

            <td
              class="amount"
              :class="{
                'amount-negative': transaction.direction === 'outflow',
              }"
            >
              {{ transaction.direction === 'outflow' ? '-' : '+' }}{{ formatAmount(transaction.amount, transaction.currency) }}
            </td>

            <td>
              <span
                class="status-badge"
                :class="getStatusClass(transaction.status)"
              >
                {{ transaction.status }}
              </span>
            </td>
          </tr>

          <tr v-if="transactions.length === 0">
            <td colspan="6" class="empty-state">
              No transactions available.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.transactions-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;

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

.view-all-button {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid #e5eaf1;
  border-radius: 7px;
  background: #fff;
  color: #3979e8;
  font-family: inherit;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: #f5f8ff;
  }
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 12px 14px;
  border-bottom: 1px solid #edf0f5;
  background: #f8f9fc;
  color: #8993a5;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

td {
  padding: 15px 14px;
  border-bottom: 1px solid #f0f2f6;
  color: #596579;
  font-size: 12px;
  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.reference {
  color: #3979e8;
  font-weight: 700;
}

.contact {
  color: #263248;
  font-weight: 600;
}

.date {
  color: #8993a5;
}

.amount {
  color: #159765;
  font-weight: 700;
}

.amount-negative {
  color: #d65b5b;
}

.type-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 650;
}

.type-sale {
  color: #3979e8;
  background: #eaf0ff;
}

.type-purchase {
  color: #8856d8;
  background: #f2eaff;
}

.type-expense {
  color: #e58a27;
  background: #fff3e5;
}

.type-refund {
  color: #d65b5b;
  background: #fff0f0;
}

.status-completed {
  color: #159765;
  background: #e8f7ef;
}

.status-pending {
  color: #d58a20;
  background: #fff5df;
}

.status-cancelled {
  color: #d65b5b;
  background: #fff0f0;
}

.empty-state {
  padding: 35px;
  color: #8993a5;
  text-align: center;
}

@media (max-width: 480px) {
  .transactions-card {
    padding: 16px;
  }

  .section-header {
    align-items: flex-start;
  }
}
</style>
