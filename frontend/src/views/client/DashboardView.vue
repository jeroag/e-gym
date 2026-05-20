<template>
  <AppLayout>
    <div class="flex items-start justify-between mb-8 gap-4 flex-wrap animate-fade-up">
      <div>
        <p class="text-white/40 text-sm">{{ greeting }}</p>
        <h1 class="font-oswald text-white text-4xl sm:text-5xl font-bold mt-0.5 tracking-wide leading-tight">
          {{ auth.user?.full_name?.split(' ')[0] }}
        </h1>
      </div>
      <button @click="showCreate = true" class="btn-primary px-4 py-2.5 text-sm">
        + NUEVA RUTINA
      </button>
    </div>

    <!-- Quick stats -->
    <div v-if="!loading && workouts.length" class="grid grid-cols-4 gap-3 mb-6">
      <div class="card p-4">
        <StatBlock label="Rutinas" :value="workouts.length" size="md" />
      </div>
      <div class="card p-4">
        <StatBlock label="Series hoy" :value="todayLogs.length" size="md" />
      </div>
      <!-- Streak — hero size with flame -->
      <div class="card p-4 col-span-1 relative overflow-hidden">
        <div class="absolute inset-0 opacity-[0.04]"
          style="background: radial-gradient(circle at 70% 50%, #F97316 0%, transparent 70%)" />
        <p class="stat-label mb-1">Racha</p>
        <div class="flex items-baseline gap-1 leading-none">
          <span class="font-oswald font-bold text-white tnum text-3xl sm:text-4xl leading-none">{{ streak }}</span>
          <span class="text-white/30 font-light text-base">{{ streak === 1 ? 'día' : 'días' }}</span>
        </div>
        <p class="text-base mt-1">🔥</p>
      </div>
      <div class="card p-4">
        <StatBlock label="Próxima" :value="nextDate" size="md" />
      </div>
    </div>

    <!-- Offline pending badge -->
    <div v-if="pendingCount > 0"
      class="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-semibold">
      <span class="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0"/>
      {{ pendingCount }} serie{{ pendingCount > 1 ? 's' : '' }} pendiente{{ pendingCount > 1 ? 's' : '' }} de sincronizar · Conecta a internet para guardarlas
    </div>

    <!-- Hoy toca (semana programada) -->
    <div v-if="!loading && todaySchedule" class="mb-5 animate-fade-up">
      <div class="card p-4 border border-gold/20"
        style="background: linear-gradient(135deg, rgba(244,196,106,0.06) 0%, rgba(236,167,44,0.03) 100%)">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ECA72C"
              stroke-width="2" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-gold/80 text-[10px] uppercase tracking-[0.15em] font-semibold">Hoy toca</p>
            <p class="text-white font-semibold text-base truncate leading-tight mt-0.5">
              {{ todaySchedule.workout_name }}
            </p>
          </div>
          <button @click="scrollToWorkout(todaySchedule.workout_id)"
            class="shrink-0 text-xs text-gold/70 hover:text-gold font-semibold px-3 py-1.5
                   rounded-lg hover:bg-gold/10 transition-colors">
            Ir →
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 3" :key="i" height="72px" />
    </div>

    <EmptyState v-else-if="!workouts.length"
      icon="🏋️"
      title="Aún no tienes rutinas"
      description="Crea tu primera rutina o espera a que tu entrenador te asigne una.">
      <button @click="showCreate = true" class="btn-primary px-5 py-2.5">CREAR RUTINA</button>
    </EmptyState>

    <div v-else class="space-y-3">
      <WorkoutCard v-for="w in workouts" :key="w.id" :workout="w" log-button
        :today-logs="todayLogs" :previous-logs="previousLogs" :saving-set="savingSet"
        :exercise-catalog="exerciseCatalog"
        :data-workout-id="w.id"
        @log-set="logSet" @unlog-set="unlogSet" />
    </div>

    <!-- Modal crear rutina -->
    <WorkoutFormModal v-model="showCreate" title="Nueva rutina propia"
      subtitle="Crea tu propia rutina con los ejercicios disponibles"
      :exercise-catalog="exerciseCatalog" :saving="creating" @save="createWorkout" />
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import AppLayout       from '../../components/common/AppLayout.vue'
import Skeleton        from '../../components/common/Skeleton.vue'
import EmptyState      from '../../components/common/EmptyState.vue'
import StatBlock       from '../../components/common/StatBlock.vue'
import WorkoutCard     from '../../components/common/WorkoutCard.vue'
import WorkoutFormModal from '../../components/common/WorkoutFormModal.vue'
import api    from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'
import { useOfflineQueue } from '../../composables/useOfflineQueue.js'

const auth  = useAuthStore()
const toast = useToast()

// ── Offline queue ────────────────────────────────────────
function onOfflineSynced(data) {
  // Merge synced log into todayLogs
  const idx = todayLogs.value.findIndex(l =>
    l.workout_exercise_id === data.workout_exercise_id && l.set_number === data.set_number
  )
  if (idx >= 0) todayLogs.value[idx] = data
  else todayLogs.value.push(data)
}
const { enqueue, pendingCount } = useOfflineQueue(api, onOfflineSynced)

const loading  = ref(true)
const workouts = ref([])
const exerciseCatalog = ref([])
const todayLogs    = ref([])
const previousLogs = ref({})
const savingSet    = ref('')
const streak       = ref(0)
const mySchedule   = ref([])   // array of { day_of_week, workout_id, workout_name }

const showCreate = ref(false)
const creating   = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

// Today's day of week (0=Sunday, 1=Monday, ...)
const todaySchedule = computed(() => {
  const dow = new Date().getDay()
  return mySchedule.value.find(s => s.day_of_week === dow) ?? null
})

const nextDate = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  const upcoming = workouts.value
    .filter(w => w.scheduled_date && new Date(w.scheduled_date) >= today)
    .sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0]
  if (!upcoming) return '—'
  const d    = new Date(upcoming.scheduled_date)
  const diff = Math.round((d - today) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `${diff}d`
})

async function loadAll() {
  loading.value = true
  try {
    const [w, ex, t, sess, sched] = await Promise.all([
      api.get('/workouts/my'),
      api.get('/exercises').catch(() => ({ data: [] })),
      api.get('/progress/today'),
      api.get('/sessions/my').catch(() => ({ data: [] })),
      api.get('/schedule/my').catch(() => ({ data: [] }))
    ])
    workouts.value        = w.data
    exerciseCatalog.value = ex.data
    todayLogs.value       = t.data
    streak.value          = computeStreak(sess.data)
    mySchedule.value      = sched.data

    await loadPreviousLogsBatch()
  } finally {
    loading.value = false
  }
}

function scrollToWorkout(workoutId) {
  // Find the WorkoutCard element and scroll to it
  const el = document.querySelector(`[data-workout-id="${workoutId}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function computeStreak(sessions) {
  if (!sessions?.length) return 0
  // Recopilar días únicos en que hubo entrenamiento
  const days = new Set(sessions.map(s => s.finished_at.slice(0, 10)))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const toStr = d => d.toISOString().slice(0, 10)
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1)

  // La racha solo cuenta si entrenaste hoy o ayer
  if (!days.has(toStr(today)) && !days.has(toStr(yest))) return 0

  let count = 0
  const cursor = days.has(toStr(today)) ? new Date(today) : new Date(yest)
  while (days.has(toStr(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

/**
 * Reemplaza el patrón N+1: en vez de una petición por ejercicio,
 * manda todos los IDs de una vez y el backend resuelve en una sola query.
 */
async function loadPreviousLogsBatch() {
  const ids = []
  for (const w of workouts.value) {
    for (const we of (w.exercises ?? [])) ids.push(we.id)
  }
  if (!ids.length) return

  try {
    const { data } = await api.get(`/progress/last-batch?ids=${ids.join(',')}`)
    // data ya viene agrupado por workout_exercise_id
    previousLogs.value = data
  } catch {
    previousLogs.value = {}
  }
}

onMounted(loadAll)

async function logSet({ workout_exercise_id, set_number, weight_kg, reps_done, rpe }) {
  savingSet.value = `${workout_exercise_id}-${set_number}`
  try {
    const { data } = await api.post('/progress/log', {
      workout_exercise_id, set_number, weight_kg, reps_done, rpe
    })
    // Reemplazar o añadir en todayLogs
    const idx = todayLogs.value.findIndex(l =>
      l.workout_exercise_id === workout_exercise_id && l.set_number === set_number
    )
    if (idx >= 0) todayLogs.value[idx] = data
    else todayLogs.value.push(data)
    toast.success(`Serie ${set_number} guardada`, { timeout: 1500 })
  } catch (e) {
    // Si es un error de red (sin respuesta), encolar para offline
    if (!e.response) {
      enqueue({ workout_exercise_id, set_number, weight_kg, reps_done, rpe })
      // Optimistic update con datos locales
      const fakeLog = { id: `offline-${Date.now()}`, workout_exercise_id, set_number, weight_kg, reps_done, rpe, logged_at: new Date().toISOString() }
      const idx = todayLogs.value.findIndex(l =>
        l.workout_exercise_id === workout_exercise_id && l.set_number === set_number
      )
      if (idx >= 0) todayLogs.value[idx] = fakeLog
      else todayLogs.value.push(fakeLog)
      toast.info(`Sin conexión — serie ${set_number} guardada localmente`, { timeout: 3000 })
    } else {
      toast.error(e.response?.data?.error ?? 'Error al guardar')
    }
  } finally {
    savingSet.value = ''
  }
}

async function unlogSet(logId) {
  try {
    await api.delete(`/progress/log/${logId}`)
    todayLogs.value = todayLogs.value.filter(l => l.id !== logId)
    toast.info('Serie desmarcada', { timeout: 1500 })
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  }
}

async function createWorkout(payload) {
  creating.value = true
  try {
    delete payload.client_id
    await api.post('/workouts', payload)
    toast.success('Rutina creada')
    showCreate.value = false
    await loadAll()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al crear')
  } finally {
    creating.value = false
  }
}
</script>
