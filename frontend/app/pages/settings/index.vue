
<script setup lang="ts">
import SettingsView from '@views/settings/SettingsView.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <SettingsView />
</template>
