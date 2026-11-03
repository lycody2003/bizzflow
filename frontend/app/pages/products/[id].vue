
<script setup lang="ts">
import ProductDetailView from '@views/products/ProductDetailView.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const route = useRoute()

const productId = computed(() => String(route.params.id || ''))
</script>

<template>
  <ProductDetailView :product-id="productId" />
</template>
