<script setup lang="ts">
import CategoriesView from '@views/categories/CategoriesView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <CategoriesView />
</template>
