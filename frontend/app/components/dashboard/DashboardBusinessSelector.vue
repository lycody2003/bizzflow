<script setup lang="ts">
import type { DashboardBusiness } from '../../types/dashboard'

defineProps<{
  business: DashboardBusiness | null
}>()
</script>

<template>
  <section class="business-context">
    <div class="business-logo" aria-hidden="true">
      <img
        v-if="business?.logoUrl"
        :src="business.logoUrl"
        :alt="`${business.name} logo`"
      >
      <span v-else>
        {{ business?.name?.charAt(0).toUpperCase() || 'B' }}
      </span>
    </div>

    <div class="business-details">
      <span class="business-label">CURRENT BUSINESS</span>
      <strong>{{ business?.name || 'Business unavailable' }}</strong>
      <span v-if="business" class="business-role">
        {{ business.role }}
      </span>
    </div>

    <span class="context-indicator">
      <span class="status-dot" />
      Active workspace
    </span>
  </section>
</template>

<style lang="scss" scoped>
.business-context {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 15px 18px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border, #e8edf4);
  border-radius: 12px;
  background: var(--color-card, #fff);
}

.business-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #e8edf4;
  border-radius: 11px;
  background: #eaf0ff;
  color: #3979e8;
  font-size: 18px;
  font-weight: 750;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #fff;
  }
}

.business-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;

  strong {
    overflow: hidden;
    color: var(--color-text, #172033);
    font-size: 13px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.business-label {
  color: #8993a5;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1px;
}

.business-role {
  color: #7b8495;
  font-size: 11px;
  text-transform: capitalize;
}

.context-indicator {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16a36a;
}

@media (max-width: 480px) {
  .business-context {
    padding: 13px;
  }

  .context-indicator {
    font-size: 0;
  }
}
</style>
