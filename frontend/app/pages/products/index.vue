<script setup lang="ts">
import ProductsView from '@views/products/ProductsView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <ProductsView />
</template>