<template>
  <span v-if="group" class="inline-flex items-center gap-1.5 text-xs font-medium" :class="textClass">
    <span class="muscle-dot" :style="{ background: color }"></span>
    <span class="capitalize">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  group:   { type: String, default: '' },
  textClass: { type: String, default: 'text-white/55' }
})

const colors = {
  chest:     '#FF7A59',
  back:      '#5BA0F2',
  legs:      '#37D6A5',
  shoulders: '#F4C46A',
  arms:      '#FFB547',
  core:      '#FF6B6B',
  cardio:    '#A78BFA',
  other:     '#6B7280'
}
const labels = {
  chest: 'Pecho', back: 'Espalda', legs: 'Pierna', shoulders: 'Hombros',
  arms: 'Brazos', core: 'Core', cardio: 'Cardio', other: 'Otros'
}

const color = computed(() => colors[props.group] ?? colors.other)
const label = computed(() => labels[props.group] ?? props.group)
</script>
