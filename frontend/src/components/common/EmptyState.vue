<template>
  <div class="flex flex-col items-center justify-center text-center py-14 px-6 animate-fade-up">
    <!-- Icono contenedor con glow sutil -->
    <div class="relative mb-5">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
                  bg-white/[0.04] border border-white/[0.07]">
        {{ icon }}
      </div>
      <div class="absolute inset-0 rounded-2xl blur-xl bg-white/[0.02] -z-10 scale-110" />
    </div>

    <h3 v-if="title"
      class="font-oswald text-xl font-semibold text-white mb-1.5 tracking-wide">
      {{ title }}
    </h3>
    <p v-if="description"
      class="text-white/40 text-sm max-w-xs leading-relaxed mb-6 text-balance">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon:        { type: String, default: '✨' },
  title:       { type: String, default: '' },
  description: { type: String, default: '' }
})
</script>
