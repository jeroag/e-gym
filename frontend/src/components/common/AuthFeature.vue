<template>
  <div class="flex items-start gap-4">
    <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10
                flex items-center justify-center text-xl shrink-0">
      {{ icon }}
    </div>
    <div>
      <h3 class="font-oswald text-white font-semibold text-lg">{{ title }}</h3>
      <p class="text-white/50 text-sm leading-relaxed">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: String, required: true },
  title: { type: String, required: true },
  text:  { type: String, required: true }
})
</script>
