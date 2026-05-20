<template>
  <RouterLink :to="to"
    class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
    :class="active
      ? 'bg-white/[0.08] text-white font-semibold'
      : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]'">

    <!-- Indicador activo: línea a la izquierda -->
    <span v-if="active"
      class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r-full -ml-3" />

    <!-- Icono SVG -->
    <span class="w-[18px] h-[18px] shrink-0 flex items-center justify-center
                 transition-colors duration-150 [&>svg]:w-full [&>svg]:h-full"
      v-html="icon" />

    <span class="flex-1 truncate"><slot /></span>

    <!-- Badge de notificaciones -->
    <span v-if="badge"
      class="bg-gold text-dark text-[9px] font-bold px-1.5 py-[2px] rounded-md
             min-w-[18px] text-center leading-tight tabular-nums">
      {{ badge > 99 ? '99+' : badge }}
    </span>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({
  to:    { type: String, required: true },
  icon:  { type: String, default: '' },
  badge: { type: Number, default: 0 }
})

const route  = useRoute()
const active = computed(() => route.path === props.to || route.path.startsWith(props.to + '/'))
</script>
