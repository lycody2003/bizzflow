<script setup lang="ts">
import BusinessView from '@views/settings/BusinessView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <BusinessView />
</template>
