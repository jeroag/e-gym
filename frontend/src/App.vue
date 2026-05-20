<template>
  <RouterView v-if="auth.ready" />
  <Toaster />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import Toaster from './components/common/Toaster.vue'

const auth = useAuthStore()
onMounted(() => auth.bootstrap())
</script>
