
<script setup lang="ts">
import AccountSetting from '@views/settings/AccountSetting.vue'

definePageMeta({
  middleware: 'auth',
})
</script>

<template>
  <AccountSetting />
</template>
