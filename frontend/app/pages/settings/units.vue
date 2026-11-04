<script setup lang="ts">
import UnitsView from '@views/settings/UnitsView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <UnitsView />
</template>
