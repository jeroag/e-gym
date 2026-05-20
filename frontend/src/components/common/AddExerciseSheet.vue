<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/65 backdrop-blur-sm"
          @click="$emit('update:modelValue', false)" />

        <!-- Sheet -->
        <div class="relative flex flex-col rounded-t-2xl overflow-hidden"
          style="background: #1A171F; max-height: 88vh; padding-bottom: env(safe-area-inset-bottom, 0px);">

          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
            <h3 class="font-oswald text-xl font-semibold text-white tracking-wide">Añadir ejercicio</h3>
            <button @click="$emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Búsqueda -->
          <div class="px-4 pt-3 pb-2 shrink-0">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 shrink-0"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input v-model="search" type="search" placeholder="Buscar ejercicio..."
                class="input pl-9 py-2.5" style="font-size:16px;"
                autocomplete="off" />
            </div>
          </div>

          <!-- Filtros por grupo muscular -->
          <div class="px-4 pb-2 shrink-0">
            <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button v-for="g in muscleGroups" :key="g.value"
                @click="selectedGroup = selectedGroup === g.value ? '' : g.value"
                :class="[
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150',
                  selectedGroup === g.value
                    ? 'bg-gold text-dark'
                    : 'bg-white/[0.06] text-white/55 hover:bg-white/[0.1] hover:text-white'
                ]">
                {{ g.label }}
              </button>
            </div>
          </div>

          <!-- Lista de ejercicios -->
          <div class="flex-1 overflow-y-auto px-3 pb-4">
            <p v-if="!filteredExercises.length"
              class="text-white/35 text-sm text-center py-12">
              Sin ejercicios que coincidan
            </p>

            <div v-else class="space-y-1">
              <button v-for="ex in filteredExercises" :key="ex.id"
                @click="select(ex)"
                :disabled="adding === ex.id"
                :class="[
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left',
                  'transition-all duration-150 active:scale-[0.98]',
                  'border border-transparent',
                  justAdded === ex.id
                    ? 'bg-success/10 border-success/20'
                    : 'hover:bg-white/[0.04] hover:border-white/[0.06]'
                ]">

                <!-- Dot del grupo muscular -->
                <span class="w-2 h-2 rounded-full shrink-0"
                  :style="{ background: muscleColor(ex.muscle_group) }" />

                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm font-medium truncate">{{ ex.name }}</p>
                  <p class="text-white/35 text-xs capitalize mt-0.5">
                    {{ muscleLabel(ex.muscle_group) }}
                  </p>
                </div>

                <!-- Estado del botón -->
                <div v-if="justAdded === ex.id"
                  class="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#37D6A5"
                    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div v-else-if="adding === ex.id"
                  class="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <span class="text-white/40 text-sm animate-spin inline-block">⟳</span>
                </div>
                <div v-else
                  class="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-gold/20 flex items-center
                         justify-center shrink-0 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round" class="text-white/50 group-hover:text-gold">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  catalog:    { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'add'])

const search        = ref('')
const selectedGroup = ref('')
const adding        = ref(null)   // exercise_id en proceso
const justAdded     = ref(null)   // exercise_id recién añadido (feedback visual)

const muscleGroups = [
  { value: '',          label: 'Todos'    },
  { value: 'chest',     label: 'Pecho'    },
  { value: 'back',      label: 'Espalda'  },
  { value: 'legs',      label: 'Piernas'  },
  { value: 'shoulders', label: 'Hombros'  },
  { value: 'arms',      label: 'Brazos'   },
  { value: 'core',      label: 'Core'     },
  { value: 'cardio',    label: 'Cardio'   },
]

const filteredExercises = computed(() =>
  props.catalog.filter(ex => {
    const q  = search.value.trim().toLowerCase()
    const ok = !q || ex.name.toLowerCase().includes(q)
    const gk = !selectedGroup.value || ex.muscle_group === selectedGroup.value
    return ok && gk
  })
)

async function select(exercise) {
  if (adding.value) return
  adding.value = exercise.id

  // Emitir la selección y esperar a que el padre resuelva
  emit('add', { exercise, onDone, onError })
}

function onDone(exerciseId) {
  adding.value   = null
  justAdded.value = exerciseId
  setTimeout(() => { if (justAdded.value === exerciseId) justAdded.value = null }, 2000)
}

function onError() {
  adding.value = null
}

const muscleColors = {
  chest: '#FF7A59', back: '#5BA0F2', legs: '#37D6A5', shoulders: '#F4C46A',
  arms: '#FFB547', core: '#FF6B6B', cardio: '#A78BFA', other: '#6B7280'
}
const muscleLabels = {
  chest: 'Pecho', back: 'Espalda', legs: 'Pierna', shoulders: 'Hombros',
  arms: 'Brazos', core: 'Core', cardio: 'Cardio'
}
const muscleColor = g => muscleColors[g] ?? muscleColors.other
const muscleLabel = g => muscleLabels[g] ?? (g || 'Otros')
</script>

<style scoped>
.sheet-enter-active { transition: all 0.32s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: all 0.22s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from   { opacity: 0; }
.sheet-leave-to     { opacity: 0; }
.sheet-enter-from .relative,
.sheet-leave-to   .relative { transform: translateY(100%); }
.sheet-enter-active .relative,
.sheet-leave-active .relative { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1); }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
