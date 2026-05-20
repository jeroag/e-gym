<template>
  <div class="flex flex-col gap-1">
    <span class="stat-label">{{ label }}</span>
    <div class="flex items-baseline gap-1.5 leading-none">
      <span class="num-display text-white tnum" :class="sizeClass">{{ displayValue }}</span>
      <span v-if="unit" class="text-white/30 font-light" :class="unitSizeClass">{{ unit }}</span>
    </div>
    <div v-if="trend !== null && trend !== undefined" class="flex items-center gap-1 mt-0.5">
      <span class="text-[10px] font-bold flex items-center gap-0.5"
        :class="trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-white/30'">
        <svg v-if="trend > 0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        <svg v-else-if="trend < 0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="tnum">{{ Math.abs(trend) }}{{ trendUnit }}</span>
      </span>
    </div>
    <span v-if="hint" class="text-white/30 text-[11px] mt-0.5">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useCountUp } from '../../composables/useCountUp.js'

const props = defineProps({
  label:     { type: String, required: true },
  value:     { type: [String, Number], required: true },
  unit:      { type: String, default: '' },
  hint:      { type: String, default: '' },
  size:      { type: String, default: 'lg' },
  trend:     { type: Number, default: null },
  trendUnit: { type: String, default: '' }
})

const sizeClass = computed(() => ({
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl sm:text-5xl',
  xl: 'text-5xl sm:text-6xl'
}[props.size] ?? 'text-4xl'))

const unitSizeClass = computed(() => ({
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
}[props.size] ?? 'text-base'))

// Animate only if the value is a number
const isNumeric = computed(() => typeof props.value === 'number' || (typeof props.value === 'string' && !isNaN(Number(props.value)) && props.value !== '—' && props.value !== ''))

const numericValue = computed(() => isNumeric.value ? Number(props.value) : 0)
// Detect decimals
const decimalPlaces = computed(() => {
  if (!isNumeric.value) return 0
  const s = String(props.value)
  const dot = s.indexOf('.')
  return dot >= 0 ? s.length - dot - 1 : 0
})

const animated = useCountUp(() => numericValue.value, { duration: 650, decimals: decimalPlaces.value })

const displayValue = computed(() =>
  isNumeric.value ? animated.value : props.value
)
</script>
