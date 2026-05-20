<template>
  <AppLayout>
    <div class="mb-6 animate-fade-up">
      <h1 class="font-oswald text-3xl sm:text-4xl text-white font-bold">Mi Progreso</h1>
      <p class="text-white/40 text-sm mt-1">Tu evolución, en cifras.</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 bg-card-hover/40 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
      <button v-for="t in tabs" :key="t.id" @click="tab = t.id"
        :class="[
          'shrink-0 px-4 py-2 font-oswald text-sm font-semibold tracking-wide rounded-lg transition-all',
          tab === t.id ? 'bg-gold text-dark' : 'text-white/60 hover:text-white'
        ]">
        {{ t.label }}
      </button>
    </div>

    <!-- TAB: Cuerpo -->
    <section v-if="tab === 'body'" class="space-y-6 animate-fade-up">
      <!-- Stats principales -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="card p-5">
          <StatBlock label="Peso" :value="latestWeight ?? '—'" unit="kg" :trend="weightTrend" trendUnit="kg" />
        </div>
        <div class="card p-5">
          <StatBlock label="% grasa" :value="latestBodyFat ?? '—'" unit="%" :trend="bodyFatTrend" trendUnit="%" />
        </div>
        <div class="card p-5">
          <StatBlock label="Medidas" :value="bodyMetrics.length" size="md" hint="Registradas" />
        </div>
        <div class="card p-5">
          <StatBlock label="Última" :value="lastBodyAgo" size="md" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Form -->
        <div class="card p-5 lg:col-span-1">
          <h3 class="font-oswald text-lg text-white font-semibold mb-4">Nueva medida</h3>
          <form @submit.prevent="saveBodyMetric" class="space-y-3">
            <div>
              <label class="stat-label block mb-1">Peso (kg)</label>
              <input v-model.number="bodyForm.weight_kg" type="number" step="0.1" min="0" class="input tnum" />
            </div>
            <div>
              <label class="stat-label block mb-1">% grasa</label>
              <input v-model.number="bodyForm.body_fat_pct" type="number" step="0.1" min="0" max="100" class="input tnum" />
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="stat-label block mb-1 text-[9px]">Pecho</label>
                <input v-model.number="bodyForm.chest_cm" type="number" step="0.1" class="input input-sm tnum" />
              </div>
              <div>
                <label class="stat-label block mb-1 text-[9px]">Cintura</label>
                <input v-model.number="bodyForm.waist_cm" type="number" step="0.1" class="input input-sm tnum" />
              </div>
              <div>
                <label class="stat-label block mb-1 text-[9px]">Cadera</label>
                <input v-model.number="bodyForm.hips_cm" type="number" step="0.1" class="input input-sm tnum" />
              </div>
            </div>
            <button type="submit" :disabled="savingBody"
              class="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2">
              <Spinner v-if="savingBody" />
              GUARDAR MEDIDA
            </button>
          </form>
        </div>

        <!-- Chart -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-oswald text-lg text-white font-semibold mb-4">Evolución</h3>
          <EmptyState v-if="!bodyMetrics.length" icon="📏" title="Sin medidas todavía"
            description="Registra tu primera medida para empezar." />
          <div v-else class="h-64">
            <Line :data="bodyChartData" :options="lineOpts" />
          </div>
        </div>
      </div>
    </section>

    <!-- TAB: Por ejercicio -->
    <section v-else-if="tab === 'exercise'" class="space-y-6 animate-fade-up">
      <div class="card p-5">
        <div class="flex flex-wrap items-center gap-3 mb-5">
          <h3 class="font-oswald text-lg text-white font-semibold flex-1">Progreso por ejercicio</h3>
          <select v-model="selectedExerciseId" @change="loadExerciseProgress" class="input max-w-xs">
            <option value="">— Selecciona —</option>
            <option v-for="e in myExercises" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>

        <EmptyState v-if="!selectedExerciseId" icon="📈" title="Selecciona un ejercicio"
          description="Elige uno para ver tu evolución." />
        <EmptyState v-else-if="!exerciseLogs.length" icon="🏋️" title="Sin registros"
          description="Aún no has hecho este ejercicio." />

        <div v-else>
          <!-- Chart type toggle -->
          <div class="flex gap-1 mb-4 bg-card-hover/40 p-1 rounded-xl w-fit">
            <button v-for="ct in chartTypes" :key="ct.id" @click="chartType = ct.id"
              :class="[
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all font-oswald tracking-wide',
                chartType === ct.id ? 'bg-gold text-dark' : 'text-white/50 hover:text-white'
              ]">{{ ct.label }}</button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div class="card-flat p-4">
              <StatBlock label="Max peso" :value="exerciseStats.maxWeight" unit="kg" />
            </div>
            <div class="card-flat p-4">
              <StatBlock label="1RM estimado" :value="exerciseStats.estimated1RM" unit="kg"
                hint="Fórmula Epley" />
            </div>
            <div class="card-flat p-4">
              <StatBlock label="Total series" :value="exerciseStats.totalSets" />
            </div>
            <div class="card-flat p-4">
              <StatBlock label="Sesiones" :value="exerciseStats.sessions" />
            </div>
          </div>
          <div class="h-64">
            <Line :data="chartType === 'weight' ? exerciseChartData : volumeChartData" :options="chartType === 'weight' ? lineOpts : volumeLineOpts" />
          </div>
        </div>
      </div>

      <!-- Objetivo del ejercicio seleccionado -->
      <div v-if="selectedExerciseId && exerciseLogs.length" class="card p-5">
        <div class="flex items-center justify-between mb-4 gap-3">
          <h3 class="font-oswald text-lg text-white font-semibold">🎯 Mi objetivo</h3>
          <button v-if="currentGoal" @click="deleteGoal"
            class="text-xs text-danger/50 hover:text-danger transition-colors">Eliminar</button>
        </div>

        <!-- Barra de progreso si ya hay objetivo -->
        <div v-if="currentGoal" class="mb-4">
          <div class="flex justify-between items-baseline mb-2">
            <span class="text-white/50 text-xs">Progreso</span>
            <div class="text-right">
              <span class="font-oswald text-gold font-bold text-xl tnum">{{ goalProgress }}%</span>
              <span class="text-white/30 text-xs ml-1">
                ({{ exerciseStats.maxWeight }}kg / {{ currentGoal.target_weight_kg }}kg)
              </span>
            </div>
          </div>
          <div class="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
              :style="{
                width: goalProgress + '%',
                background: goalProgress >= 100
                  ? 'linear-gradient(90deg,#37D6A5,#5AEFC0)'
                  : 'linear-gradient(90deg,#C58A1E,#ECA72C,#F4C46A)'
              }" />
          </div>
          <p v-if="goalProgress >= 100" class="text-success text-xs mt-2 text-center font-semibold">
            🏆 ¡Objetivo alcanzado!
          </p>
        </div>

        <!-- Input para definir/actualizar objetivo -->
        <div class="flex items-center gap-3">
          <input v-model.number="goalInput" type="number" step="2.5" min="0"
            placeholder="Peso objetivo (kg)"
            class="flex-1 input tnum text-sm" />
          <button @click="saveGoal" :disabled="!goalInput || goalInput <= 0"
            class="btn-primary px-4 py-2.5 text-sm shrink-0 disabled:opacity-40">
            {{ currentGoal ? 'Actualizar' : 'Fijar' }}
          </button>
        </div>
      </div>

      <!-- Personal Records -->
      <div v-if="personalRecords.length" class="card p-5">
        <h3 class="font-oswald text-lg text-white font-semibold mb-4 flex items-center gap-2">
          🏆 Records personales
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="pr in personalRecords" :key="pr.id"
            class="card-flat p-4 flex items-center justify-between gap-3
                   hover:border-gold/30 transition-colors cursor-pointer"
            @click="selectExerciseAndLoad(pr.id)">
            <div class="min-w-0">
              <p class="text-white font-medium truncate">{{ pr.name }}</p>
              <MuscleTag :group="pr.muscle_group" />
            </div>
            <div class="text-right shrink-0">
              <p class="font-oswald font-bold text-gold text-2xl tnum leading-none">{{ pr.max_weight }}</p>
              <p class="stat-label mt-1">kg max</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly volume chart -->
      <div v-if="weeklyVolumeChartData" class="card p-5">
        <h3 class="font-oswald text-lg text-white font-semibold mb-4">📊 Volumen semanal por músculo</h3>
        <div class="h-64">
          <Bar :data="weeklyVolumeChartData" :options="barOpts" />
        </div>
      </div>
    </section>

    <!-- TAB: Historial -->
    <section v-else-if="tab === 'history'" class="space-y-3 animate-fade-up">

      <!-- Export button -->
      <div v-if="sessions.length" class="flex justify-end">
        <button @click="exportCSV"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                 bg-white/[0.06] border border-white/[0.08] text-white/60
                 hover:text-white hover:bg-white/[0.1] transition-all">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      <div v-if="loadingSessions" class="space-y-3">
        <div v-for="i in 5" :key="i" class="card h-20 animate-pulse opacity-30" />
      </div>

      <EmptyState v-else-if="!sessions.length"
        icon="🏃"
        title="Sin entrenamientos registrados"
        description="Completa tu primer entreno para verlo aquí." />

      <template v-else>
        <!-- Stats rápidas del historial -->
        <div class="grid grid-cols-3 gap-3 mb-2">
          <div class="card p-4">
            <StatBlock label="Sesiones" :value="sessions.length" size="md" />
          </div>
          <div class="card p-4">
            <StatBlock label="Series total" :value="totalSetsAllTime" size="md" />
          </div>
          <div class="card p-4">
            <StatBlock label="Tiempo total" :value="totalTimeFormatted" size="md" />
          </div>
        </div>

        <!-- Heatmap de frecuencia -->
        <div class="card p-5 overflow-x-auto">
          <p class="stat-label mb-3">FRECUENCIA · ÚLTIMAS 26 SEMANAS</p>
          <div class="flex gap-1 min-w-max">
            <div v-for="(week, wi) in heatmapWeeks" :key="wi" class="flex flex-col gap-1">
              <div v-for="(day, di) in week" :key="di"
                :title="day.label"
                :class="[
                  'w-3 h-3 rounded-sm transition-colors',
                  day.count === 0 ? 'bg-white/[0.06]'
                  : day.count === 1 ? 'bg-gold/40'
                  : 'bg-gold'
                ]" />
            </div>
          </div>
          <div class="flex items-center gap-2 mt-3 justify-end">
            <span class="text-white/25 text-[10px]">Menos</span>
            <div class="w-3 h-3 rounded-sm bg-white/[0.06]" />
            <div class="w-3 h-3 rounded-sm bg-gold/40" />
            <div class="w-3 h-3 rounded-sm bg-gold" />
            <span class="text-white/25 text-[10px]">Más</span>
          </div>
        </div>

        <!-- Lista de sesiones -->
        <div v-for="session in sessions" :key="session.id" class="card px-5 py-4">
          <div class="flex items-start gap-4">
            <!-- Fecha -->
            <div class="shrink-0 text-center w-10">
              <p class="font-oswald text-gold font-bold text-xl tnum leading-none">
                {{ sessionDay(session.finished_at) }}
              </p>
              <p class="text-white/35 text-[10px] uppercase tracking-wide mt-0.5">
                {{ sessionMonth(session.finished_at) }}
              </p>
            </div>

            <!-- Separador -->
            <div class="w-px self-stretch bg-white/[0.06] shrink-0" />

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm truncate">{{ session.workout_name }}</p>
              <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                <!-- Duración -->
                <div class="flex items-center gap-1.5 text-white/45 text-xs">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span class="tnum">{{ formatDuration(session.duration_secs) }}</span>
                </div>
                <!-- Series -->
                <div class="flex items-center gap-1.5 text-white/45 text-xs">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span class="tnum">{{ session.sets_completed }} series</span>
                </div>
                <!-- Hora -->
                <span class="text-white/25 text-xs tnum">
                  {{ sessionTime(session.finished_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>

    <!-- TAB: Músculos -->
    <section v-else-if="tab === 'muscle'" class="animate-fade-up">
      <div class="card p-5">
        <h3 class="font-oswald text-lg text-white font-semibold mb-4">Distribución muscular</h3>
        <EmptyState v-if="!muscleEntries.length" icon="🎯" title="Sin datos"
          description="Registra series para ver tu distribución." />
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div class="h-72">
            <Doughnut :data="muscleChartData" :options="doughnutOpts" />
          </div>
          <div class="space-y-2">
            <div v-for="[group, count] in muscleEntries" :key="group"
              class="flex items-center justify-between card-flat px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="muscle-dot" :style="{ background: colorFor(group) }"></span>
                <span class="text-white capitalize">{{ muscleLabel(group) }}</span>
              </div>
              <span class="text-gold font-oswald font-bold tnum">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/common/AppLayout.vue'
import StatBlock from '../../components/common/StatBlock.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import MuscleTag from '../../components/common/MuscleTag.vue'
import Spinner from '../../components/common/Spinner.vue'
import api from '../../api/axios.js'
import { Line, Doughnut, Bar } from 'vue-chartjs'
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale,
  ArcElement, Tooltip, Legend, Filler, TimeScale, BarElement
} from 'chart.js'
import { useToast } from '../../composables/useToast.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, ArcElement, Tooltip, Legend, Filler, TimeScale, BarElement)

const toast = useToast()

const tabs = [
  { id: 'history',  label: 'Historial' },
  { id: 'body',     label: 'Cuerpo' },
  { id: 'exercise', label: 'Ejercicios' },
  { id: 'muscle',   label: 'Músculos' }
]
const tab = ref('history')

// Body metrics
const bodyMetrics = ref([])
const bodyForm    = ref({ weight_kg: null, body_fat_pct: null, chest_cm: null, waist_cm: null, hips_cm: null })
const savingBody  = ref(false)

// Per-exercise
const myExercises        = ref([])
const selectedExerciseId = ref('')
const exerciseLogs       = ref([])
const personalRecords    = ref([])
const chartType          = ref('weight')
const chartTypes         = [
  { id: 'weight', label: 'Peso máx.' },
  { id: 'volume', label: 'Volumen' }
]

// Objetivos
const exerciseGoals = ref([])   // [{ exercise_id, target_weight_kg, exercise_name }]
const goalInput     = ref(null) // editing goal for selected exercise

// Weekly volume
const weeklyVolume = ref([])

// Muscle distribution
const muscleDist = ref({})

// Workout history (sesiones finalizadas)
const sessions        = ref([])
const loadingSessions = ref(false)

onMounted(async () => {
  await Promise.all([loadBody(), loadMyExercises(), loadMuscle(), loadSessions(), loadWeeklyVolume(), loadGoals()])
})

async function loadSessions() {
  loadingSessions.value = true
  try {
    const { data } = await api.get('/sessions/my')
    sessions.value = data
  } catch {
    sessions.value = []
  } finally {
    loadingSessions.value = false
  }
}

async function loadBody() {
  const { data } = await api.get('/progress/body-metrics')
  bodyMetrics.value = data
}

async function loadMyExercises() {
  const { data: workouts } = await api.get('/workouts/my')
  const seen = new Map()
  for (const w of workouts) {
    for (const we of (w.exercises ?? [])) {
      if (we.exercise?.id) seen.set(we.exercise.id, we.exercise)
    }
  }
  myExercises.value = Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))

  // Cargar PRs en una sola query de backend (reemplaza el patrón N+1 anterior)
  try {
    const { data } = await api.get('/progress/personal-records')
    personalRecords.value = data
  } catch {
    personalRecords.value = []
  }
}

async function loadGoals() {
  try {
    const { data } = await api.get('/progress/goals')
    exerciseGoals.value = data
  } catch {
    exerciseGoals.value = []
  }
}

async function saveGoal() {
  if (!goalInput.value || goalInput.value <= 0 || !selectedExerciseId.value) return
  try {
    await api.put(`/progress/goals/${selectedExerciseId.value}`, {
      target_weight_kg: goalInput.value
    })
    await loadGoals()
    toast.success('Objetivo guardado')
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  }
}

async function deleteGoal() {
  if (!selectedExerciseId.value) return
  try {
    await api.delete(`/progress/goals/${selectedExerciseId.value}`)
    await loadGoals()
    goalInput.value = null
    toast.info('Objetivo eliminado')
  } catch { /* ignore */ }
}

async function loadWeeklyVolume() {
  try {
    const { data } = await api.get('/progress/volume-weekly')
    weeklyVolume.value = data
  } catch {
    weeklyVolume.value = []
  }
}

async function loadExerciseProgress() {
  if (!selectedExerciseId.value) { exerciseLogs.value = []; return }
  const { data } = await api.get(`/progress/exercise/${selectedExerciseId.value}`)
  exerciseLogs.value = data
  // Pre-fill goal input with existing goal
  const existing = exerciseGoals.value.find(g => g.exercise_id === selectedExerciseId.value)
  goalInput.value = existing ? Number(existing.target_weight_kg) : null
}

function selectExerciseAndLoad(id) {
  selectedExerciseId.value = id
  loadExerciseProgress()
}

async function loadMuscle() {
  const { data } = await api.get('/progress/muscle-distribution')
  muscleDist.value = data ?? {}
}

async function saveBodyMetric() {
  savingBody.value = true
  try {
    await api.post('/progress/body-metrics', { ...bodyForm.value })
    toast.success('Medida registrada')
    bodyForm.value = { weight_kg: null, body_fat_pct: null, chest_cm: null, waist_cm: null, hips_cm: null }
    await loadBody()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  } finally {
    savingBody.value = false
  }
}

// ── Computed: stats body ────────────────────────────
const latestWeight  = computed(() => [...bodyMetrics.value].reverse().find(m => m.weight_kg)?.weight_kg)
const latestBodyFat = computed(() => [...bodyMetrics.value].reverse().find(m => m.body_fat_pct)?.body_fat_pct)
const weightTrend = computed(() => {
  const weights = bodyMetrics.value.filter(m => m.weight_kg).map(m => Number(m.weight_kg))
  if (weights.length < 2) return null
  return Number((weights.at(-1) - weights[0]).toFixed(1))
})
const bodyFatTrend = computed(() => {
  const fats = bodyMetrics.value.filter(m => m.body_fat_pct).map(m => Number(m.body_fat_pct))
  if (fats.length < 2) return null
  return Number((fats.at(-1) - fats[0]).toFixed(1))
})
const lastBodyAgo = computed(() => {
  if (!bodyMetrics.value.length) return '—'
  const last = bodyMetrics.value[bodyMetrics.value.length - 1].measured_at
  const diff = Math.floor((Date.now() - new Date(last)) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return `${diff}d`
})

// ── Charts ──────────────────────────────────────────
const bodyChartData = computed(() => ({
  labels: bodyMetrics.value.map(m => formatDate(m.measured_at)),
  datasets: [
    {
      label: 'Peso (kg)',
      data: bodyMetrics.value.map(m => m.weight_kg),
      borderColor: '#ECA72C',
      backgroundColor: 'rgba(236,167,44,0.15)',
      tension: 0.4,
      fill: true,
      spanGaps: true,
      pointRadius: 3,
      pointBackgroundColor: '#ECA72C',
      pointBorderColor: '#1A171F',
      pointBorderWidth: 2
    },
    {
      label: '% grasa',
      data: bodyMetrics.value.map(m => m.body_fat_pct),
      borderColor: '#A78BFA',
      backgroundColor: 'rgba(167,139,250,0.1)',
      tension: 0.4,
      spanGaps: true,
      hidden: !bodyMetrics.value.some(m => m.body_fat_pct != null),
      pointRadius: 3,
      pointBackgroundColor: '#A78BFA',
      pointBorderColor: '#1A171F',
      pointBorderWidth: 2
    }
  ]
}))

const exerciseChartData = computed(() => {
  const byDay = new Map()
  for (const log of exerciseLogs.value) {
    const day = log.logged_at.slice(0, 10)
    const max = Math.max(byDay.get(day) ?? 0, Number(log.weight_kg) || 0)
    byDay.set(day, max)
  }
  const days = Array.from(byDay.keys()).sort()
  return {
    labels: days.map(d => formatDate(d)),
    datasets: [{
      label: 'Peso máximo (kg)',
      data: days.map(d => byDay.get(d)),
      borderColor: '#ECA72C',
      backgroundColor: 'rgba(236,167,44,0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#ECA72C',
      pointBorderColor: '#1A171F',
      pointBorderWidth: 2
    }]
  }
})

const volumeChartData = computed(() => {
  // Volume load per day = sum(weight × reps) for all sets that day
  const byDay = new Map()
  for (const log of exerciseLogs.value) {
    const day = log.logged_at.slice(0, 10)
    const vol = (Number(log.weight_kg) || 0) * (Number(log.reps_done) || 0)
    byDay.set(day, (byDay.get(day) ?? 0) + vol)
  }
  const days = Array.from(byDay.keys()).sort()
  return {
    labels: days.map(d => formatDate(d)),
    datasets: [{
      label: 'Volumen (kg·reps)',
      data: days.map(d => byDay.get(d)),
      borderColor: '#A78BFA',
      backgroundColor: 'rgba(167,139,250,0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#A78BFA',
      pointBorderColor: '#1A171F',
      pointBorderWidth: 2
    }]
  }
})

const volumeLineOpts = {
  ...({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#ffffff99', font: { family: 'Inter' } } },
      tooltip: {
        backgroundColor: '#0F0D10', titleColor: '#A78BFA', borderColor: '#A78BFA', borderWidth: 1,
        padding: 10, displayColors: false
      }
    },
    scales: {
      x: { ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } },
      y: { ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } }
    }
  })
}

const exerciseStats = computed(() => {
  const logs = exerciseLogs.value
  if (!logs.length) return { maxWeight: 0, estimated1RM: '—', totalSets: 0, sessions: 0 }
  const maxWeight = logs.reduce((m, l) => Math.max(m, Number(l.weight_kg) || 0), 0)
  const days = new Set(logs.map(l => l.logged_at.slice(0, 10)))

  // Epley 1RM = weight × (1 + reps / 30); find the set that yields the highest estimate
  let best1RM = 0
  for (const l of logs) {
    const w = Number(l.weight_kg) || 0
    const r = Number(l.reps_done) || 0
    if (w > 0 && r > 0) {
      const est = w * (1 + r / 30)
      if (est > best1RM) best1RM = est
    }
  }
  const estimated1RM = best1RM > 0 ? Math.round(best1RM * 10) / 10 : '—'

  return { maxWeight, estimated1RM, totalSets: logs.length, sessions: days.size }
})

// ── Exercise goal ────────────────────────────────────
const currentGoal = computed(() =>
  exerciseGoals.value.find(g => g.exercise_id === selectedExerciseId.value) ?? null
)
const goalProgress = computed(() => {
  if (!currentGoal.value) return 0
  const max = exerciseStats.value.maxWeight || 0
  const target = Number(currentGoal.value.target_weight_kg)
  if (!target) return 0
  return Math.min(100, Math.round((max / target) * 100))
})

// ── Weekly volume chart ─────────────────────────────
const weeklyVolumeChartData = computed(() => {
  const rows = weeklyVolume.value
  if (!rows.length) return null

  // Collect all weeks and muscle groups
  const weeksSet = new Set(rows.map(r => r.week_start))
  const weeks = Array.from(weeksSet).sort()

  // Get top 5 muscle groups by total sets
  const groupTotals = {}
  for (const r of rows) {
    groupTotals[r.muscle_group] = (groupTotals[r.muscle_group] ?? 0) + Number(r.sets)
  }
  const groups = Object.entries(groupTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g)

  // Build lookup: week→group→sets
  const lookup = {}
  for (const r of rows) {
    if (!lookup[r.week_start]) lookup[r.week_start] = {}
    lookup[r.week_start][r.muscle_group] = Number(r.sets)
  }

  const formatWeek = d => {
    const dt = new Date(d)
    return dt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return {
    labels: weeks.map(formatWeek),
    datasets: groups.map(g => ({
      label: muscleLabels[g] ?? g,
      data: weeks.map(w => lookup[w]?.[g] ?? 0),
      backgroundColor: (muscleColors[g] ?? '#6B7280') + 'CC',
      borderColor: muscleColors[g] ?? '#6B7280',
      borderWidth: 1,
      borderRadius: 4,
      stack: 'volume'
    }))
  }
})

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#ffffff99', font: { family: 'Inter' }, boxWidth: 12 } },
    tooltip: {
      backgroundColor: '#0F0D10', titleColor: '#ECA72C', borderColor: '#ECA72C', borderWidth: 1,
      padding: 10
    }
  },
  scales: {
    x: { stacked: true, ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } },
    y: { stacked: true, ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } }
  }
}

const muscleEntries = computed(() => Object.entries(muscleDist.value).sort((a, b) => b[1] - a[1]))

const muscleColors = {
  chest: '#FF7A59', back: '#5BA0F2', legs: '#37D6A5', shoulders: '#F4C46A',
  arms: '#FFB547', core: '#FF6B6B', cardio: '#A78BFA', other: '#6B7280'
}
function colorFor(group) { return muscleColors[group] ?? muscleColors.other }

const muscleLabels = {
  chest: 'Pecho', back: 'Espalda', legs: 'Pierna', shoulders: 'Hombros',
  arms: 'Brazos', core: 'Core', cardio: 'Cardio', other: 'Otros'
}
function muscleLabel(group) { return muscleLabels[group] ?? group }

const muscleChartData = computed(() => ({
  labels: muscleEntries.value.map(([g]) => muscleLabel(g)),
  datasets: [{
    data: muscleEntries.value.map(([, c]) => c),
    backgroundColor: muscleEntries.value.map(([g]) => colorFor(g)),
    borderColor: '#1A171F',
    borderWidth: 3
  }]
}))

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#ffffff99', font: { family: 'Inter' } } },
    tooltip: {
      backgroundColor: '#0F0D10', titleColor: '#ECA72C', borderColor: '#ECA72C', borderWidth: 1,
      padding: 10, displayColors: false
    }
  },
  scales: {
    x: { ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } },
    y: { ticks: { color: '#ffffff50' }, grid: { color: '#ffffff08' } }
  }
}

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#0F0D10', titleColor: '#ECA72C' }
  }
}

// ── Historial helpers ────────────────────────────────────
const totalSetsAllTime = computed(() =>
  sessions.value.reduce((s, sess) => s + (sess.sets_completed ?? 0), 0)
)
const totalTimeFormatted = computed(() => {
  const totalSecs = sessions.value.reduce((s, sess) => s + (sess.duration_secs ?? 0), 0)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
})

// ── Heatmap ──────────────────────────────────────────────────
const heatmapWeeks = computed(() => {
  // Build a Set of date strings (YYYY-MM-DD) that have sessions, count per day
  const dayCounts = {}
  for (const s of sessions.value) {
    const d = new Date(s.finished_at).toLocaleDateString('en-CA') // YYYY-MM-DD
    dayCounts[d] = (dayCounts[d] ?? 0) + 1
  }

  // Start from Sunday of 26 weeks ago
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDay = new Date(today)
  startDay.setDate(today.getDate() - 26 * 7 + (today.getDay() === 0 ? 0 : 7 - today.getDay()) - (6 * 7))
  // Simpler: go back 26*7 days, then align to Sunday
  const start = new Date(today)
  start.setDate(today.getDate() - 26 * 7)
  // align to previous Sunday
  start.setDate(start.getDate() - start.getDay())

  const weeks = []
  let cur = new Date(start)
  while (cur <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const key = cur.toLocaleDateString('en-CA')
      const isFuture = cur > today
      week.push({
        count: isFuture ? -1 : (dayCounts[key] ?? 0),
        label: isFuture ? '' : `${cur.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${dayCounts[key] ?? 0} entrenamientos`
      })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
})

function formatDuration(secs) {
  if (!secs) return '0m'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`
  return `${s}s`
}

function sessionDay(ts) {
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric' })
}
function sessionMonth(ts) {
  return new Date(ts).toLocaleDateString('es-ES', { month: 'short' })
}
function sessionTime(ts) {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ── CSV export ────────────────────────────────────────────────
function exportCSV() {
  const effortLabel = { 1: 'Duro', 2: 'Bien', 3: 'Brutal' }
  const rows = [
    ['Fecha', 'Rutina', 'Duración (min)', 'Series completadas', 'Esfuerzo percibido']
  ]
  for (const s of sessions.value) {
    rows.push([
      new Date(s.finished_at).toLocaleDateString('es-ES'),
      s.workout_name ?? '',
      s.duration_secs != null ? Math.round(s.duration_secs / 60) : '',
      s.sets_completed ?? '',
      s.perceived_effort != null ? (effortLabel[s.perceived_effort] ?? s.perceived_effort) : ''
    ])
  }

  const csv = rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `egym-historial-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
