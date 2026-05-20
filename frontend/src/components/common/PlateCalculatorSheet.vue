<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/65 backdrop-blur-sm" @click="close" />

        <div class="relative rounded-t-2xl overflow-hidden"
          style="background:#1A171F; padding-bottom:env(safe-area-inset-bottom,0px);">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-white/20"/>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <div>
              <h3 class="font-oswald text-xl font-semibold text-white tracking-wide">Calculadora de discos</h3>
              <p class="text-white/35 text-xs mt-0.5">Barra olímpica · {{ barWeight }} kg</p>
            </div>
            <button @click="close"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Input peso objetivo -->
          <div class="px-5 pt-4 pb-3">
            <label class="stat-label block mb-1.5">Peso objetivo (kg)</label>
            <div class="flex items-center gap-3">
              <button @click="targetWeight = Math.max(barWeight, targetWeight - 2.5)"
                class="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08]
                       text-white font-bold text-lg flex items-center justify-center
                       hover:bg-white/[0.1] active:scale-95 transition-all">−</button>
              <input v-model.number="targetWeight" type="number" inputmode="decimal" step="2.5"
                :min="barWeight"
                class="flex-1 input text-center text-xl font-bold tnum"
                style="font-size:20px;" />
              <button @click="targetWeight = targetWeight + 2.5"
                class="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08]
                       text-white font-bold text-lg flex items-center justify-center
                       hover:bg-white/[0.1] active:scale-95 transition-all">+</button>
            </div>
          </div>

          <!-- Selector de barra -->
          <div class="px-5 pb-3 flex gap-2">
            <button v-for="b in [15, 20]" :key="b"
              @click="barWeight = b"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                barWeight === b ? 'bg-gold text-dark' : 'bg-white/[0.06] text-white/50'
              ]">
              Barra {{ b }}kg
            </button>
          </div>

          <!-- Visualización de la barra -->
          <div class="px-5 pb-4">
            <!-- Barra visual -->
            <div class="flex items-center justify-center gap-0 mb-5 overflow-x-auto py-2">
              <!-- Punta izquierda -->
              <div class="w-4 h-3 rounded-l-sm bg-white/20 shrink-0"/>
              <!-- Discos lado izquierdo (en espejo) -->
              <div class="flex flex-row-reverse items-center gap-px shrink-0">
                <div v-for="(p, i) in plates" :key="'L'+i"
                  :style="{
                    width: plateWidth(p) + 'px',
                    height: plateHeight(p) + 'px',
                    background: plateColor(p),
                    borderRadius: '3px'
                  }" />
              </div>
              <!-- Barra central -->
              <div class="h-3 bg-white/30 shrink-0" :style="{ width: '80px' }"/>
              <!-- Discos lado derecho -->
              <div class="flex items-center gap-px shrink-0">
                <div v-for="(p, i) in plates" :key="'R'+i"
                  :style="{
                    width: plateWidth(p) + 'px',
                    height: plateHeight(p) + 'px',
                    background: plateColor(p),
                    borderRadius: '3px'
                  }" />
              </div>
              <!-- Punta derecha -->
              <div class="w-4 h-3 rounded-r-sm bg-white/20 shrink-0"/>
            </div>

            <!-- Lista de discos por lado -->
            <div v-if="plates.length" class="card-flat p-4">
              <p class="stat-label mb-3">DISCOS POR LADO</p>
              <div class="flex flex-wrap gap-2 mb-3">
                <div v-for="(p, i) in plates" :key="i"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold tnum"
                  :style="{ background: plateColor(p) + '22', border: '1px solid ' + plateColor(p) + '44', color: plateColor(p) }">
                  {{ p }} kg
                </div>
              </div>
              <div class="h-px bg-white/[0.06] mb-3"/>
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p class="font-oswald text-lg text-white font-bold tnum">{{ weightPerSide.toFixed(1) }}</p>
                  <p class="stat-label text-[10px]">kg por lado</p>
                </div>
                <div>
                  <p class="font-oswald text-lg text-gold font-bold tnum">{{ targetWeight }}</p>
                  <p class="stat-label text-[10px]">kg total</p>
                </div>
                <div>
                  <p class="font-oswald text-lg text-white font-bold tnum">{{ plates.length * 2 }}</p>
                  <p class="stat-label text-[10px]">discos total</p>
                </div>
              </div>
            </div>

            <div v-else class="card-flat p-4 text-center">
              <p class="text-white/30 text-sm">Solo barra · {{ barWeight }} kg</p>
            </div>

            <!-- Peso no alcanzable con placas estándar -->
            <p v-if="remainder > 0.01" class="text-warning text-xs text-center mt-2 tnum">
              ⚠ Diferencia de {{ remainder.toFixed(2) }} kg (peso no alcanzable con discos estándar)
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue:    { type: Boolean, default: false },
  initialWeight: { type: Number,  default: 60 }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

const barWeight    = ref(20)
const targetWeight = ref(props.initialWeight)

watch(() => props.initialWeight, w => { if (w) targetWeight.value = w })
watch(() => props.modelValue, v => { if (v) targetWeight.value = props.initialWeight })

// Discos disponibles por lado (kg)
const AVAILABLE = [25, 20, 15, 10, 5, 2.5, 1.25]

const weightPerSide = computed(() =>
  Math.max(0, (targetWeight.value - barWeight.value) / 2)
)

// Algoritmo greedy
const platesAndRemainder = computed(() => {
  let remaining = Math.max(0, weightPerSide.value)
  const result = []
  for (const p of AVAILABLE) {
    while (remaining >= p - 0.001) {
      result.push(p)
      remaining = Math.round((remaining - p) * 1000) / 1000
    }
  }
  return { plates: result, remainder: remaining }
})

const plates    = computed(() => platesAndRemainder.value.plates)
const remainder = computed(() => platesAndRemainder.value.remainder)

// Colores por tamaño de disco (colores olímpicos estándar)
const PLATE_COLORS = {
  25: '#EF4444', 20: '#3B82F6', 15: '#F59E0B', 10: '#22C55E',
  5:  '#FFFFFF', 2.5: '#9CA3AF', 1.25: '#6B7280'
}
const plateColor = p => PLATE_COLORS[p] ?? '#6B7280'

// Altura visual proporcional al peso del disco
const plateHeight = p => Math.round(20 + (p / 25) * 44)  // 20–64px
const plateWidth  = p => Math.max(8, Math.round(p * 0.7))  // proporcional
</script>

<style scoped>
.sheet-enter-active { transition: all 0.32s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: all 0.22s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .relative,
.sheet-leave-to   .relative { transform: translateY(100%); }
.sheet-enter-active .relative,
.sheet-leave-active .relative { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1); }
</style>
