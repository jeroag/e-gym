<template>
  <span
    class="inline-block border-2 border-current border-r-transparent rounded-full animate-spin"
    :style="{ width: size, height: size }"
  ></span>
</template>

<script setup>
defineProps({
  size: { type: String, default: '1rem' }
})
</script>
