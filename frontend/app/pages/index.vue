
<script setup lang="ts">
import DashboardView from '@views/dashboard/DashboardView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <DashboardView />
</template>
