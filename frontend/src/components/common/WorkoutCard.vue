<template>
  <article class="card overflow-hidden card-hover transition-all duration-500"
    :class="logButton && timer.isActive.value ? 'ring-1 ring-success/40 shadow-[0_0_28px_rgba(55,214,165,0.18)] glow-pulse' : ''">

    <!-- ─── Header ─────────────────────────────────────── -->
    <div class="flex items-center gap-3 px-5 py-4">

      <!-- Zona clicable para expandir/colapsar -->
      <div @click="toggle"
        class="flex-1 min-w-0 cursor-pointer select-none hover:opacity-80 transition-opacity">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="num-heading text-white text-lg sm:text-xl leading-tight">{{ workout.name }}</h3>
          <span v-if="workout.self_created"
            class="text-[9px] uppercase tracking-[0.15em] text-purple-light/90 bg-purple-light/10
                   border border-purple-light/20 px-2 py-0.5 rounded-md font-semibold">
            Personal
          </span>
        </div>
        <div class="flex items-center gap-2 mt-1.5 flex-wrap">
          <span class="text-white/35 text-xs tnum">{{ localExercises.length }} ejercicios</span>
          <template v-if="workout.scheduled_date">
            <span class="text-white/20">·</span>
            <span class="text-gold/70 text-xs font-medium">{{ formatDate(workout.scheduled_date) }}</span>
          </template>
          <template v-if="clientLabel">
            <span class="text-white/20">·</span>
            <span class="text-white/45 text-xs">{{ clientLabel }}</span>
          </template>
          <template v-if="logButton && completedToday > 0">
            <span class="text-white/20">·</span>
            <span class="text-success text-xs tnum font-medium">{{ completedToday }}/{{ totalSets }} series</span>
          </template>
        </div>
      </div>

      <!-- Acciones del lado derecho -->
      <div class="flex items-center gap-2 shrink-0">

        <!-- Slot para acciones del padre (entrenador) -->
        <slot name="actions" :workout="workout" />

        <!-- ── Zona de entrenamiento (solo clientes, logButton=true) ── -->
        <template v-if="logButton">

          <!-- Timer activo -->
          <template v-if="timer.isActive.value">
            <div class="flex items-center gap-1.5 bg-success/10 border border-success/20
                        px-3 py-1.5 rounded-xl">
              <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
              <span class="text-success font-oswald font-semibold tnum text-base tracking-wide">
                {{ timer.formattedTime.value }}
              </span>
            </div>
            <button @click.stop="requestFinish"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-white/[0.05] border border-white/[0.1] text-white/60
                     hover:bg-danger/10 hover:border-danger/30 hover:text-danger
                     transition-all duration-150 active:scale-95">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
              FIN
            </button>
          </template>

          <!-- Sin timer: botón INICIAR -->
          <button v-else-if="!timer.anyActive.value"
            @click.stop="startWorkout"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                   border transition-all duration-150 active:scale-95"
            style="background: linear-gradient(135deg,rgba(244,196,106,0.12),rgba(236,167,44,0.08));
                   border-color: rgba(236,167,44,0.3); color: #ECA72C;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            INICIAR
          </button>

          <!-- Círculo de progreso -->
          <div v-if="totalSets > 0" class="relative w-8 h-8">
            <svg class="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5"/>
              <circle cx="18" cy="18" r="14" fill="none"
                :stroke="progressPercent >= 100 ? '#37D6A5' : '#ECA72C'"
                stroke-width="2.5" stroke-linecap="round"
                :stroke-dasharray="`${progressCircum} ${progressCircum}`"
                :stroke-dashoffset="progressOffset"
                style="transition: stroke-dashoffset 0.5s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s ease" />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-[8px] font-bold tnum"
              :class="progressPercent >= 100 ? 'text-success' : 'text-white/40'">
              {{ progressPercent >= 100 ? '✓' : Math.round(progressPercent) }}
            </span>
          </div>
          <div v-else @click="toggle" class="cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              :class="['transition-transform duration-200', expanded ? 'rotate-180' : '']">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </template>

        <!-- Sin logButton: solo chevron -->
        <div v-else @click="toggle" class="cursor-pointer p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            :class="['transition-transform duration-200', expanded ? 'rotate-180' : '']">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Barra de progreso bajo el header -->
    <div v-if="logButton && totalSets > 0" class="progress-bar-track mx-5">
      <div class="progress-bar-fill"
        :style="{
          width: `${progressPercent}%`,
          background: progressPercent >= 100
            ? 'linear-gradient(90deg, #37D6A5, #5AEFC0)'
            : 'linear-gradient(90deg, #C58A1E, #ECA72C, #F4C46A)'
        }" />
    </div>

    <!-- ─── Contenido expandible ───────────────────────── -->
    <Transition name="expand">
      <div v-if="expanded" class="border-t border-white/[0.04]">
        <p v-if="workout.description"
          class="px-5 py-3 text-white/40 text-sm italic border-b border-white/[0.04]">
          {{ workout.description }}
        </p>

        <div class="p-3 space-y-2">
          <p v-if="!localExercises.length" class="text-white/25 text-sm text-center py-8">
            Sin ejercicios. Añade uno para empezar.
          </p>

          <div v-for="(we, idx) in localExercises" :key="we.id"
            :class="[
              'card-flat p-4',
              isExerciseNew(we.id) ? 'ring-1 ring-success/20' : '',
              we.superset_group != null ? 'ring-1 ring-purple/30' : ''
            ]">
            <!-- Superset connector line to previous exercise -->
            <div v-if="idx > 0 && we.superset_group != null && localExercises[idx-1]?.superset_group === we.superset_group"
              class="absolute left-6 -top-2.5 w-px h-5 bg-purple/40" style="position:relative;margin-top:-20px;margin-left:20px;height:20px;width:2px;background:rgba(167,139,250,0.4);" />

            <!-- Cabecera del ejercicio -->
            <div class="flex items-start gap-3 mb-3">

              <!-- Número / reorder -->
              <div class="shrink-0 flex flex-col items-center gap-0.5 w-6 pt-0.5">
                <template v-if="allowReorder && localExercises.length > 1">
                  <button @click="moveExercise(idx, -1)" :disabled="idx === 0"
                    class="w-5 h-5 rounded flex items-center justify-center text-white/25
                           hover:text-white/70 disabled:opacity-20 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button @click="moveExercise(idx, 1)" :disabled="idx === localExercises.length - 1"
                    class="w-5 h-5 rounded flex items-center justify-center text-white/25
                           hover:text-white/70 disabled:opacity-20 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </template>
                <span v-else class="num-heading text-white/20 text-sm tnum">
                  {{ String(idx + 1).padStart(2, '0') }}
                </span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-white text-sm font-semibold leading-tight">{{ we.exercise?.name }}</p>
                  <span v-if="we.superset_group != null"
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple/20 text-purple-light border border-purple/30 uppercase tracking-wide">
                    SS
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <MuscleTag :group="we.exercise?.muscle_group" />
                  <span class="text-white/20 text-xs">·</span>
                  <span class="text-white/40 text-xs tnum font-medium">{{ we.sets }}×{{ we.reps }}</span>
                  <span class="text-white/20 text-xs">·</span>
                  <span class="text-white/35 text-xs tnum">{{ we.rest_secs }}s</span>
                </div>
                <p v-if="we.notes" class="text-white/35 text-xs mt-1.5 italic">{{ we.notes }}</p>
              </div>

              <!-- Botón superserie (solo en modo trainer, sin logButton) -->
              <button v-if="!logButton && idx < localExercises.length - 1"
                @click="toggleSuperset(we, idx)"
                :class="[
                  'p-1.5 rounded-lg transition-colors shrink-0 text-xs font-bold',
                  we.superset_group != null
                    ? 'text-purple-light bg-purple/15 border border-purple/30'
                    : 'text-white/20 hover:text-purple-light hover:bg-purple/10 border border-transparent'
                ]"
                title="Marcar como superserie">⇄</button>

              <!-- Botón calculadora de discos (solo con logButton) -->
              <button v-if="logButton"
                @click="openPlateCalc(we)"
                class="p-1.5 rounded-lg text-white/25 hover:text-gold hover:bg-gold/10
                       transition-colors shrink-0"
                title="Calculadora de discos">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </button>

              <!-- Botón vídeo -->
              <button v-if="we.exercise?.video_url"
                @click="openVideo(we.exercise)"
                class="p-1.5 rounded-lg text-white/25 hover:text-gold hover:bg-gold/10
                       transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </button>

              <!-- Eliminar ejercicio (solo durante entrenamiento) -->
              <button v-if="logButton && timer.isActive.value"
                @click="removeExercise(we)"
                class="p-1.5 rounded-lg text-white/20 hover:text-danger hover:bg-danger/10
                       transition-colors shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>

            <!-- Sugerencia de calentamiento (solo durante entreno activo, primer set sin loggear) -->
            <div v-if="logButton && timer.isActive.value && warmupSets(we).length > 0
                       && !logForSet(we.id, 1)"
              class="mb-3 px-1">
              <p class="stat-label mb-2">CALENTAMIENTO SUGERIDO</p>
              <div class="flex flex-wrap gap-1.5">
                <div v-for="ws in warmupSets(we)" :key="ws.label"
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs tnum
                         bg-white/[0.04] border border-white/[0.07] text-white/50">
                  <span class="text-white/30 text-[10px]">{{ ws.label }}</span>
                  <span class="font-semibold text-white/70">{{ ws.weight }}kg</span>
                  <span class="text-white/30">×</span>
                  <span class="text-white/60">{{ ws.reps }}</span>
                </div>
              </div>
            </div>

            <!-- Nota de sesión (solo durante entreno activo) -->
            <div v-if="logButton && timer.isActive.value" class="mb-3">
              <button @click="toggleNote(we.id)"
                class="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {{ sessionNotes[we.id] ? 'Nota guardada ✓' : 'Añadir nota' }}
              </button>
              <Transition name="note-slide">
                <textarea v-if="showNote[we.id]"
                  :value="sessionNotes[we.id] ?? ''"
                  @input="updateNote(we.id, $event.target.value)"
                  placeholder="Sensaciones, ajustes, observaciones..."
                  rows="2"
                  class="w-full mt-2 input text-xs resize-none leading-relaxed"
                  style="min-height:52px;" />
              </Transition>
            </div>

            <!-- Tabla de series -->
            <div v-if="logButton">
              <div class="grid grid-cols-[44px_52px_1fr_1fr_52px] gap-2 px-2 pb-1.5">
                <span class="stat-label text-center">SET</span>
                <span class="stat-label text-center">PREV</span>
                <span class="stat-label text-center">KG</span>
                <span class="stat-label text-center">REPS</span>
                <span />
              </div>
              <div class="space-y-1">
                <SetRow v-for="n in we.sets" :key="n"
                  :set-number="n"
                  :target-weight="null"
                  :target-reps="we.reps"
                  :logged="logForSet(we.id, n)"
                  :previous="previousForSet(we.id, n)"
                  :saving="savingSet === `${we.id}-${n}`"
                  @log="payload => handleLogSet(we, payload)"
                  @unlog="id => $emit('unlog-set', id)" />
              </div>
            </div>
          </div>

          <!-- Botón añadir ejercicio -->
          <button v-if="logButton && exerciseCatalog.length"
            @click="showAddSheet = true"
            class="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                   border border-dashed border-white/[0.12] text-white/40
                   hover:border-gold/30 hover:text-gold hover:bg-gold/[0.04]
                   transition-all duration-150 text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Añadir ejercicio
          </button>
        </div>
      </div>
    </Transition>

    <!-- Sheets -->
    <AddExerciseSheet v-model="showAddSheet" :catalog="exerciseCatalog" @add="handleAddExercise" />

    <PlateCalculatorSheet v-model="showPlateCalc" :initial-weight="plateCalcWeight" />

    <VideoSheet
      v-model="showVideoSheet"
      :url="videoExercise?.video_url ?? ''"
      :name="videoExercise?.name ?? ''"
      :muscle-group="videoExercise?.muscle_group ?? ''" />

    <WorkoutFinishedSheet
      v-model="showFinishedSheet"
      :duration="finishedDuration"
      :sets="finishedSets"
      @done="saveSession" />

  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import MuscleTag            from './MuscleTag.vue'
import SetRow               from './SetRow.vue'
import AddExerciseSheet     from './AddExerciseSheet.vue'
import VideoSheet              from './VideoSheet.vue'
import WorkoutFinishedSheet   from './WorkoutFinishedSheet.vue'
import PlateCalculatorSheet   from './PlateCalculatorSheet.vue'
import { useWorkoutTimer }  from '../../composables/useWorkoutTimer.js'
import { useRestTimer }     from '../../composables/useRestTimer.js'
import { useToast }         from '../../composables/useToast.js'
import api from '../../api/axios.js'

const props = defineProps({
  workout:         { type: Object,  required: true },
  logButton:       { type: Boolean, default: false },
  clientLabel:     { type: String,  default: '' },
  defaultOpen:     { type: Boolean, default: false },
  todayLogs:       { type: Array,   default: () => [] },
  previousLogs:    { type: Object,  default: () => ({}) },
  savingSet:       { type: String,  default: '' },
  exerciseCatalog: { type: Array,   default: () => [] },
  allowReorder:    { type: Boolean, default: false }
})

const emit = defineEmits(['log-set', 'unlog-set', 'exercise-added', 'exercise-removed'])

const toast    = useToast()
const timer    = useWorkoutTimer(props.workout.id)
const restTimer = useRestTimer()

const expanded          = ref(props.defaultOpen || timer.isActive.value)
const showAddSheet      = ref(false)
const showVideoSheet    = ref(false)
const showFinishedSheet = ref(false)
const showPlateCalc     = ref(false)
const videoExercise     = ref(null)
const plateCalcWeight   = ref(60)
const sessionStartTime  = ref(null)

// ── Notas por ejercicio (sesión) ──────────────────────────
const NOTES_KEY = `egym_session_notes_${props.workout.id}`
const sessionNotes = ref(JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}'))
const showNote     = ref({})

function toggleNote(weId) {
  showNote.value = { ...showNote.value, [weId]: !showNote.value[weId] }
}
function updateNote(weId, value) {
  const updated = { ...sessionNotes.value, [weId]: value }
  sessionNotes.value = updated
  localStorage.setItem(NOTES_KEY, JSON.stringify(updated))
}
function clearNotes() {
  sessionNotes.value = {}
  showNote.value = {}
  localStorage.removeItem(NOTES_KEY)
}

// Estado del finish para el sheet
const finishedDuration = ref('00:00')
const finishedSets     = ref(0)
const _pendingSession  = ref(null)   // guardamos los datos mientras el sheet está abierto

// Copia local de ejercicios
const localExercises = ref([...(props.workout.exercises ?? [])])
const newExerciseIds = ref([])

watch(() => props.workout.exercises, exs => {
  localExercises.value = [...(exs ?? [])]
}, { deep: true })

// ── Timer de entrenamiento ─────────────────────────────────
function startWorkout() {
  sessionStartTime.value = Date.now() - 2000   // margen 2s para desfase servidor
  timer.start()
  expanded.value = true
}

function requestFinish() {
  const secs = timer.stop()
  const m    = Math.floor(secs / 60)
  const s    = secs % 60

  finishedDuration.value = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  finishedSets.value     = sessionLogs.value.length
  _pendingSession.value  = {
    workout_id:     props.workout.id,
    workout_name:   props.workout.name,
    duration_secs:  secs,
    sets_completed: sessionLogs.value.length,
    started_at:     new Date((sessionStartTime.value ?? Date.now()) + 2000).toISOString()
  }
  sessionStartTime.value = null
  clearNotes()
  showFinishedSheet.value = true
}

async function saveSession(perceived_effort) {
  if (!_pendingSession.value) return
  try {
    await api.post('/sessions', {
      ..._pendingSession.value,
      perceived_effort: perceived_effort ?? null
    })
  } catch { /* silencioso */ }
  _pendingSession.value = null
}

// ── Logs de sesión (solo los hechos DESPUÉS de pulsar INICIAR) ──
const sessionLogs = computed(() => {
  if (!sessionStartTime.value) return []
  const startMs = sessionStartTime.value
  const weIds   = new Set(localExercises.value.map(we => we.id))
  return props.todayLogs.filter(l =>
    weIds.has(l.workout_exercise_id) &&
    new Date(l.logged_at).getTime() >= startMs
  )
})

// ── Progreso ──────────────────────────────────────────────
const completedToday = computed(() => {
  const source = timer.isActive.value ? sessionLogs.value : props.todayLogs
  return localExercises.value.reduce((sum, we) =>
    sum + source.filter(l => l.workout_exercise_id === we.id).length, 0
  )
})
const totalSets = computed(() =>
  localExercises.value.reduce((sum, we) => sum + (we.sets ?? 0), 0)
)
const progressCircum  = computed(() => 2 * Math.PI * 14)
const progressPercent = computed(() =>
  totalSets.value > 0 ? Math.min((completedToday.value / totalSets.value) * 100, 100) : 0
)
const progressOffset = computed(() =>
  progressCircum.value - (progressPercent.value / 100) * progressCircum.value
)

// ── Logs ──────────────────────────────────────────────────
function logForSet(weId, setNum) {
  const source = timer.isActive.value ? sessionLogs.value : props.todayLogs
  return source.find(l => l.workout_exercise_id === weId && l.set_number === setNum) ?? null
}
function previousForSet(weId, setNum) {
  return (props.previousLogs[weId] ?? []).find(l => l.set_number === setNum) ?? null
}

// Interceptar log para arrancar el descanso
function handleLogSet(we, payload) {
  emit('log-set', { workout_exercise_id: we.id, ...payload })
  if (!timer.isActive.value) return

  // Supersets: solo iniciar descanso cuando todos los ejercicios del grupo han logueado este set
  if (we.superset_group != null) {
    const groupExercises = localExercises.value.filter(x => x.superset_group === we.superset_group)
    const isLastInGroup  = groupExercises[groupExercises.length - 1]?.id === we.id
    if (!isLastInGroup) {
      // Show prompt to go to next exercise
      const nextInGroup = groupExercises[groupExercises.indexOf(we) + 1]
      if (nextInGroup) toast.info(`→ ${nextInGroup.exercise?.name ?? 'Siguiente ejercicio'}`, { timeout: 2000 })
      return  // no rest timer yet
    }
  }

  if (we.rest_secs > 0) {
    restTimer.start(we.rest_secs, we.exercise?.name ?? '')
  }
}

// ── Vídeo ─────────────────────────────────────────────────
function openVideo(exercise) {
  videoExercise.value  = exercise
  showVideoSheet.value = true
}

// ── Calculadora de discos ──────────────────────────────────
function openPlateCalc(we) {
  // Usar el peso de la sesión previa como referencia, o 60kg por defecto
  const prev = (props.previousLogs[we.id] ?? []).find(l => l.set_number === 1)
  plateCalcWeight.value = Number(prev?.weight_kg) || 60
  showPlateCalc.value   = true
}

// ── Reordenar ejercicios ───────────────────────────────────
async function moveExercise(idx, dir) {
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= localExercises.value.length) return

  // Mover en local inmediatamente (optimista)
  const arr = [...localExercises.value]
  ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
  localExercises.value = arr

  // Persistir en backend
  try {
    await api.patch(`/workouts/${props.workout.id}/exercises/reorder`, {
      orders: arr.map((we, i) => ({ id: we.id, order_index: i }))
    })
  } catch (e) {
    toast.error('No se pudo guardar el orden')
    // Revertir
    localExercises.value = [...(props.workout.exercises ?? [])]
  }
}

// ── Añadir ejercicio ──────────────────────────────────────
async function handleAddExercise({ exercise, onDone, onError }) {
  try {
    const { data } = await api.post(`/workouts/${props.workout.id}/exercises`, {
      exercise_id: exercise.id,
      sets: 3, reps: 10, rest_secs: 60
    })
    const newWe = {
      id: data.id, sets: data.sets, reps: data.reps,
      rest_secs: data.rest_secs, notes: data.notes,
      order_index: data.order_index,
      exercise: data.exercise ?? exercise
    }
    localExercises.value.push(newWe)
    newExerciseIds.value.push(data.id)
    setTimeout(() => {
      newExerciseIds.value = newExerciseIds.value.filter(id => id !== data.id)
    }, 3000)
    onDone(exercise.id)
    emit('exercise-added', { workoutId: props.workout.id, workoutExercise: newWe })
  } catch (e) {
    onError()
    toast.error(e.response?.data?.error ?? 'Error al añadir el ejercicio')
  }
}

// ── Eliminar ejercicio ─────────────────────────────────────
async function removeExercise(we) {
  try {
    await api.delete(`/workouts/${props.workout.id}/exercises/${we.id}`)
    localExercises.value = localExercises.value.filter(e => e.id !== we.id)
    emit('exercise-removed', { workoutId: props.workout.id, workoutExerciseId: we.id })
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al eliminar el ejercicio')
  }
}

// ── Calentamiento sugerido ────────────────────────────────
function warmupSets(we) {
  // Necesitamos un peso de referencia (anterior o target)
  const prev = (props.previousLogs[we.id] ?? []).find(l => l.set_number === 1)
  const refWeight = Number(prev?.weight_kg) || 0
  if (refWeight <= 20) return []  // sin peso o solo barra, no sugerir

  const round25 = w => Math.round(w / 2.5) * 2.5

  return [
    { label: '50%', weight: round25(refWeight * 0.50), reps: Math.min(12, (we.reps ?? 10) + 5) },
    { label: '70%', weight: round25(refWeight * 0.70), reps: Math.min(8,  (we.reps ?? 10) + 2) },
    { label: '90%', weight: round25(refWeight * 0.90), reps: Math.min(5,  we.reps ?? 10) }
  ].filter(ws => ws.weight >= 20)
}

// ── Supersets ──────────────────────────────────────────────
async function toggleSuperset(we, idx) {
  const nextWe = localExercises.value[idx + 1]
  if (!nextWe) return

  const alreadyLinked = we.superset_group != null && we.superset_group === nextWe.superset_group
  // Find a free superset group number or null (to unlink)
  let newGroup = null
  if (!alreadyLinked) {
    // Find a group number not already used in this workout
    const usedGroups = new Set(localExercises.value.map(x => x.superset_group).filter(g => g != null))
    newGroup = 1
    while (usedGroups.has(newGroup)) newGroup++
  }

  try {
    // Update both exercises
    await Promise.all([
      api.patch(`/workouts/${props.workout.id}/exercises/${we.id}`, { superset_group: newGroup }),
      api.patch(`/workouts/${props.workout.id}/exercises/${nextWe.id}`, { superset_group: newGroup })
    ])
    // Update local state
    const arr = [...localExercises.value]
    arr[idx]   = { ...we,     superset_group: newGroup }
    arr[idx+1] = { ...nextWe, superset_group: newGroup }
    localExercises.value = arr
    toast.success(newGroup ? 'Superserie activada' : 'Superserie desactivada', { timeout: 1500 })
  } catch (e) {
    toast.error('Error al actualizar')
  }
}

function isExerciseNew(id) { return newExerciseIds.value.includes(id) }
function toggle() { expanded.value = !expanded.value }
function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.note-slide-enter-active { transition: all 0.2s ease; }
.note-slide-leave-active { transition: all 0.15s ease; }
.note-slide-enter-from, .note-slide-leave-to { opacity: 0; transform: translateY(-4px); }

@keyframes glow-pulse-kf {
  0%, 100% { box-shadow: 0 0 18px rgba(55, 214, 165, 0.15); }
  50%       { box-shadow: 0 0 36px rgba(55, 214, 165, 0.30); }
}
.glow-pulse {
  animation: glow-pulse-kf 2.4s ease-in-out infinite;
}
</style>
