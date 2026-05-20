<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/65 backdrop-blur-sm" @click="close" />

        <div class="relative rounded-t-2xl overflow-hidden flex flex-col"
          style="background:#1A171F; max-height:90dvh; padding-bottom:env(safe-area-inset-bottom,0px);">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-white/20"/>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
            <div>
              <h3 class="font-oswald text-xl font-semibold text-white tracking-wide">Semana programada</h3>
              <p class="text-white/35 text-xs mt-0.5">{{ clientName }}</p>
            </div>
            <button @click="close"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto overscroll-contain p-5 space-y-2">
            <div v-if="loading" class="space-y-2">
              <div v-for="i in 7" :key="i" class="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>

            <div v-else v-for="day in days" :key="day.dow"
              class="card-flat p-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 text-center shrink-0">
                  <p class="font-oswald font-bold text-white/60 text-base leading-none">{{ day.abbr }}</p>
                  <p class="text-white/25 text-[9px] uppercase tracking-wide mt-0.5">{{ day.full }}</p>
                </div>
                <div class="flex-1 min-w-0">
                  <p v-if="schedule[day.dow]" class="text-white text-sm font-medium truncate">
                    {{ schedule[day.dow].workout_name }}
                  </p>
                  <p v-else class="text-white/20 text-sm italic">Descanso</p>
                </div>
              </div>

              <!-- Selector de rutina -->
              <select
                :value="schedule[day.dow]?.workout_id ?? ''"
                @change="assign(day.dow, $event.target.value)"
                class="input text-xs max-w-[130px] shrink-0 py-1.5">
                <option value="">Descanso</option>
                <option v-for="w in workouts" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId:   { type: String, default: null },
  clientName: { type: String, default: '' },
  workouts:   { type: Array, default: () => [] }  // list of client's workouts
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

const toast   = useToast()
const loading = ref(false)
// Map: day_of_week -> { workout_id, workout_name }
const schedule = ref({})

const days = [
  { dow: 1, abbr: 'LUN', full: 'Lunes' },
  { dow: 2, abbr: 'MAR', full: 'Martes' },
  { dow: 3, abbr: 'MIÉ', full: 'Miércoles' },
  { dow: 4, abbr: 'JUE', full: 'Jueves' },
  { dow: 5, abbr: 'VIE', full: 'Viernes' },
  { dow: 6, abbr: 'SÁB', full: 'Sábado' },
  { dow: 0, abbr: 'DOM', full: 'Domingo' }
]

watch(() => props.modelValue, async (v) => {
  if (v && props.clientId) {
    loading.value = true
    try {
      const { data } = await api.get(`/schedule/client/${props.clientId}`)
      const map = {}
      for (const row of data) map[row.day_of_week] = row
      schedule.value = map
    } catch {
      schedule.value = {}
    } finally {
      loading.value = false
    }
  }
})

async function assign(dow, workoutId) {
  try {
    await api.put(`/schedule/client/${props.clientId}`, {
      day_of_week: dow,
      workout_id: workoutId || null
    })
    if (workoutId) {
      const w = props.workouts.find(x => x.id === workoutId)
      schedule.value = { ...schedule.value, [dow]: { workout_id: workoutId, workout_name: w?.name ?? '' } }
    } else {
      const updated = { ...schedule.value }
      delete updated[dow]
      schedule.value = updated
    }
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al guardar')
  }
}
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
