
<script setup lang="ts">
import { computed } from 'vue'
import useAuthStore from '../../stores/auth.store'

const authStore = useAuthStore()

const userName = computed(() => {
  const user = authStore.user.value

  return user?.firstName || 'there'
})

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'

  return 'Good evening'
})

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
})
</script>

<template>
  <section class="dashboard-welcome">
    <div class="welcome-content">
      <span class="welcome-label">
        OVERVIEW
      </span>

      <h1>
        {{ greeting }}, {{ userName }}!
      </h1>

      <p>
        Here's what's happening with your business today.
      </p>
    </div>

    <div class="welcome-date">
      <span class="date-icon">▦</span>

      <span>{{ currentDate }}</span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.dashboard-welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.welcome-content {
  min-width: 0;
}

.welcome-label {
  color: #3979e8;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 1.5px;
}

h1 {
  margin: 9px 0 7px;
  color: #172033;
  font-size: clamp(23px, 2.5vw, 30px);
  font-weight: 750;
  letter-spacing: -0.8px;
  line-height: 1.3;
}

p {
  margin: 0;
  color: #7b8495;
  font-size: 14px;
  line-height: 1.6;
}

.welcome-date {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
  padding: 11px 14px;
  border: 1px solid #e8edf4;
  border-radius: 9px;
  color: #596579;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
}

.date-icon {
  color: #3979e8;
  font-size: 17px;
}

@media (max-width: 768px) {
  .dashboard-welcome {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 22px;
  }

  .welcome-date {
    padding: 9px 12px;
  }
}

@media (max-width: 380px) {
  h1 {
    font-size: 22px;
  }

  .welcome-date {
    font-size: 11px;
  }
}
</style>
