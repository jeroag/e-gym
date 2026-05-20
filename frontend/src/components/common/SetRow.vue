<template>
  <div>
  <div :class="[
    'grid items-center gap-2 py-1.5 px-2 rounded-xl transition-all duration-200',
    'grid-cols-[44px_52px_1fr_1fr_52px]',
    isLogged ? 'bg-success/[0.07]' : 'hover:bg-white/[0.02]'
  ]">

    <!-- Número de serie -->
    <div class="flex justify-center">
      <span :class="[
        'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold tnum',
        'transition-all duration-200',
        isLogged
          ? 'bg-success/25 text-success ring-1 ring-success/30'
          : 'bg-white/[0.06] text-white/45'
      ]">{{ setNumber }}</span>
    </div>

    <!-- Log anterior + indicador de mejora -->
    <div class="flex flex-col items-center justify-center gap-0.5 relative">
      <template v-if="previous">
        <span class="text-white/45 text-[11px] tnum leading-none font-medium flex items-center gap-0.5">
          {{ previous.weight_kg != null ? previous.weight_kg + 'kg' : '—' }}
          <!-- Flecha dorada si se completaron todas las reps la vez anterior -->
          <span v-if="hasSuggestion && !isLogged"
            class="text-gold text-[9px] font-bold leading-none">↑</span>
        </span>
        <span class="text-white/25 text-[10px] tnum leading-none">
          × {{ previous.reps_done ?? '—' }}
        </span>
      </template>
      <span v-else class="text-white/20 text-xs">—</span>
    </div>

    <!-- Input peso (kg) -->
    <div>
      <input
        v-model.number="weight"
        type="number"
        inputmode="decimal"
        step="0.5"
        min="0"
        :placeholder="weightPlaceholder"
        @keydown.enter="commit"
        :class="[
          'w-full text-center border rounded-xl py-3 text-base tnum font-medium',
          'focus:outline-none transition-all duration-150 bg-transparent',
          'placeholder-white/20',
          isLogged
            ? 'border-success/40 text-success'
            : hasSuggestion && !isLogged
              ? 'border-gold/25 text-white focus:border-gold/50 focus:ring-2 focus:ring-gold/10'
              : 'border-white/[0.09] text-white focus:border-gold/50 focus:ring-2 focus:ring-gold/10'
        ]"
        style="font-size: 16px;" />
    </div>

    <!-- Input reps -->
    <div>
      <input
        v-model.number="reps"
        type="number"
        inputmode="numeric"
        min="0"
        :placeholder="targetReps != null ? String(targetReps) : '0'"
        @keydown.enter="commit"
        :class="[
          'w-full text-center border rounded-xl py-3 text-base tnum font-medium',
          'focus:outline-none transition-all duration-150 bg-transparent',
          'placeholder-white/20',
          isLogged
            ? 'border-success/40 text-success'
            : 'border-white/[0.09] text-white focus:border-gold/50 focus:ring-2 focus:ring-gold/10'
        ]"
        style="font-size: 16px;" />
    </div>

    <!-- Botón confirmar serie -->
    <div class="flex justify-center">
      <button
        @click="toggle"
        :disabled="saving"
        :class="[
          'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
          'active:scale-95 disabled:opacity-50',
          isLogged
            ? 'bg-success text-dark shadow-[0_0_12px_rgba(55,214,165,0.3)]'
            : 'border border-white/[0.12] text-white/35 hover:border-gold/50 hover:text-gold hover:bg-gold/5'
        ]"
        :aria-label="isLogged ? 'Desmarcar serie' : 'Marcar como completada'">
        <span v-if="saving" class="text-base animate-spin inline-block">⟳</span>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- RPE picker (aparece cuando la serie está logueada) -->
  <Transition name="rpe-fade">
    <div v-if="isLogged" class="flex items-center gap-2 px-2 pb-1.5 mt-0.5">
      <span class="text-white/25 text-[10px] shrink-0 w-[44px] text-center">RPE</span>
      <div class="flex gap-1 flex-1">
        <button v-for="n in 10" :key="n"
          @click="setRpe(n)"
          :class="[
            'flex-1 h-5 rounded text-[9px] font-bold transition-all',
            rpe === n
              ? 'text-dark ' + rpeActiveBg(n)
              : 'bg-white/[0.05] text-white/20 hover:bg-white/[0.1] hover:text-white/50'
          ]">{{ n }}</button>
      </div>
      <span v-if="rpe" class="text-white/30 text-[10px] shrink-0 tnum w-[52px] text-center">
        {{ rpeLabel(rpe) }}
      </span>
      <span v-else class="shrink-0 w-[52px]" />
    </div>
  </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  setNumber:    { type: Number, required: true },
  targetWeight: { type: Number, default: null },
  targetReps:   { type: Number, default: null },
  logged:       { type: Object, default: null },
  previous:     { type: Object, default: null },
  saving:       { type: Boolean, default: false }
})

const emit = defineEmits(['log', 'unlog'])

const isLogged = computed(() => !!props.logged)

// ── Sugerencia de progressive overload ───────────────────
// Si la vez anterior completó todas las reps (o más) con ese peso,
// sugerimos +2.5 kg. Indicado con flecha dorada en la columna PREV.
const hasSuggestion = computed(() => {
  if (!props.previous || props.logged) return false
  const prevWeight = Number(props.previous.weight_kg)
  const prevReps   = Number(props.previous.reps_done)
  return prevWeight > 0 && props.targetReps != null && prevReps >= props.targetReps
})

const suggestedWeight = computed(() => {
  if (!props.previous) return null
  const pw = Number(props.previous.weight_kg)
  if (!pw) return null
  return hasSuggestion.value ? pw + 2.5 : pw
})

// Placeholder del campo peso: muestra la sugerencia entre paréntesis
const weightPlaceholder = computed(() => {
  if (props.targetWeight != null) return String(props.targetWeight)
  if (suggestedWeight.value != null) return String(suggestedWeight.value)
  return '0'
})

// Pre-rellenar con la sugerencia (o el peso anterior) si el campo está vacío
const weight = ref(
  props.logged?.weight_kg ??
  suggestedWeight.value ??
  props.targetWeight ??
  null
)
const reps = ref(
  props.logged?.reps_done ??
  props.previous?.reps_done ??
  props.targetReps ??
  null
)
const rpe = ref(props.logged?.rpe ?? null)

// Sincronizar si el padre actualiza logged o previous
watch(() => props.logged, l => {
  weight.value = l?.weight_kg ?? weight.value
  reps.value   = l?.reps_done ?? reps.value
})

watch(() => props.previous, prev => {
  // Solo rellenar si el campo todavía está vacío y no está logueado
  if (props.logged) return
  if (weight.value == null && prev?.weight_kg != null) {
    weight.value = suggestedWeight.value
  }
  if (reps.value == null && prev?.reps_done != null) {
    reps.value = prev.reps_done
  }
})

function commit() {
  emit('log', {
    set_number: props.setNumber,
    weight_kg:  weight.value,
    reps_done:  reps.value,
    rpe:        rpe.value
  })
}

function setRpe(n) {
  rpe.value = rpe.value === n ? null : n  // toggle off if same
  // Re-emit to update backend with RPE
  emit('log', {
    set_number: props.setNumber,
    weight_kg:  weight.value ?? props.logged?.weight_kg,
    reps_done:  reps.value  ?? props.logged?.reps_done,
    rpe:        rpe.value
  })
}

function toggle() {
  if (isLogged.value) emit('unlog', props.logged.id)
  else commit()
}

// ── RPE helpers ───────────────────────────────────────────
function rpeActiveBg(n) {
  const colors = ['','bg-green-500','bg-green-400','bg-green-300','bg-yellow-300','bg-yellow-400','bg-amber-500','bg-orange-400','bg-red-400','bg-red-500','bg-red-600']
  return colors[n] ?? 'bg-gold'
}
const RPE_LABELS = ['','Muy fácil','Fácil','Moderado','Algo duro','Duro','Muy duro','Muy duro','Máximo','Máximo','Fallo']
function rpeLabel(n) { return RPE_LABELS[n] ?? '' }
</script>

<style scoped>
.rpe-fade-enter-active { transition: all 0.2s ease; }
.rpe-fade-leave-active { transition: all 0.15s ease; }
.rpe-fade-enter-from, .rpe-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
