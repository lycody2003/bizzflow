<script setup lang="ts">
import InventoryView from '@views/inventory/InventoryView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <InventoryView />
</template>
