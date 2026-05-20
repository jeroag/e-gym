<template>
  <div
    class="bg-gradient-to-r from-deep via-deep-light to-deep
           bg-[length:200%_100%] animate-shimmer rounded-lg"
    :style="{ height, width }"
  ></div>
</template>

<script setup>
defineProps({
  height: { type: String, default: '1rem' },
  width:  { type: String, default: '100%' }
})
</script>
