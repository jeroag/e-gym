<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="num-heading text-white text-3xl sm:text-4xl">Rutinas</h1>
        <p class="text-white/40 text-sm mt-1">Crea y asigna rutinas a tus clientes.</p>
      </div>
      <button @click="openCreate" class="btn-primary px-5 py-2.5">+ NUEVA RUTINA</button>
    </div>

    <!-- Filtro por cliente -->
    <div v-if="clients.length" class="flex flex-wrap items-center gap-2 mb-6">
      <span class="stat-label">Filtrar</span>
      <select v-model="filterClientId" @change="loadWorkouts" class="input input-sm max-w-xs">
        <option value="">— Todos los clientes —</option>
        <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.full_name }}</option>
      </select>
      <button v-if="filterClientId" @click="showSchedule = true"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
               bg-white/[0.06] border border-white/[0.08] text-white/60
               hover:text-white hover:bg-white/[0.1] transition-all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Semana
      </button>
    </div>

    <div v-if="loading" class="space-y-3">
      <Skeleton v-for="i in 3" :key="i" height="72px" />
    </div>

    <EmptyState v-else-if="!workouts.length"
      icon="📋"
      :title="filterClientId ? 'Sin rutinas para este cliente' : 'Sin rutinas'"
      description="Crea tu primera rutina y asígnasela a un cliente.">
      <button @click="openCreate" class="btn-primary px-5 py-2.5">+ NUEVA RUTINA</button>
    </EmptyState>

    <div v-else class="space-y-3">
      <WorkoutCard v-for="w in workouts" :key="w.id" :workout="w"
        :client-label="clientName(w.client_id)"
        allow-reorder>
        <template #actions="{ workout }">
          <button @click.stop="duplicate(workout)" title="Duplicar"
            class="p-1.5 rounded-lg text-white/30 hover:text-gold hover:bg-gold/10 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button @click.stop="toggleActive(workout)" class="text-white/40 hover:text-white text-xs
            px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
            {{ workout.is_active ? 'Desactivar' : 'Activar' }}
          </button>
          <button @click.stop="remove(workout)" class="text-danger/60 hover:text-danger text-xs
            px-2 py-1 rounded-lg hover:bg-danger/10 transition-colors">
            Eliminar
          </button>
        </template>
      </WorkoutCard>
    </div>

    <!-- Historial de entrenamientos del cliente seleccionado -->
    <div v-if="filterClientId && clientHistory.length" class="mt-8">
      <h2 class="font-oswald text-lg text-white font-semibold mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(236,167,44,0.8)"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Últimos entrenamientos
      </h2>
      <div class="space-y-2">
        <div v-for="sess in clientHistory" :key="sess.id"
          class="card px-5 py-3.5 flex items-center gap-4">
          <div class="shrink-0 text-center w-10">
            <p class="font-oswald text-gold font-bold text-xl tnum leading-none">
              {{ new Date(sess.finished_at).getDate() }}
            </p>
            <p class="text-white/30 text-[10px] uppercase tracking-wide">
              {{ new Date(sess.finished_at).toLocaleDateString('es-ES', { month: 'short' }) }}
            </p>
          </div>
          <div class="w-px self-stretch bg-white/[0.06] shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-semibold truncate">{{ sess.workout_name }}</p>
            <div class="flex items-center gap-3 mt-1 flex-wrap">
              <span class="text-white/40 text-xs tnum">{{ formatDuration(sess.duration_secs) }}</span>
              <span class="text-white/20 text-xs">·</span>
              <span class="text-white/40 text-xs tnum">{{ sess.sets_completed }} series</span>
              <template v-if="sess.perceived_effort">
                <span class="text-white/20 text-xs">·</span>
                <span class="text-sm">{{ effortEmoji(sess.perceived_effort) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ScheduleSheet v-model="showSchedule"
      :client-id="filterClientId"
      :client-name="clients.find(c => c.id === filterClientId)?.full_name ?? ''"
      :workouts="workouts" />

    <WorkoutFormModal v-model="showModal" title="Nueva rutina"
      subtitle="Asigna una rutina con ejercicios a un cliente"
      show-client-picker :clients="clients" :exercise-catalog="exerciseCatalog"
      :initial-client-id="filterClientId" :saving="saving" @save="save" />
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../../components/common/AppLayout.vue'
import Skeleton from '../../components/common/Skeleton.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import WorkoutCard from '../../components/common/WorkoutCard.vue'
import WorkoutFormModal from '../../components/common/WorkoutFormModal.vue'
import ScheduleSheet from '../../components/common/ScheduleSheet.vue'
import api from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'

const route = useRoute()
const toast = useToast()

const loading         = ref(true)
const saving          = ref(false)
const showModal       = ref(false)
const workouts        = ref([])
const clients         = ref([])
const exerciseCatalog = ref([])
const filterClientId  = ref('')
const clientHistory   = ref([])
const showSchedule    = ref(false)

async function loadAll() {
  const [c, ex] = await Promise.all([
    api.get('/users/clients'),
    api.get('/exercises')
  ])
  clients.value         = c.data
  exerciseCatalog.value = ex.data

  if (route.query.client) {
    filterClientId.value = String(route.query.client)
    await loadWorkouts()
    openCreate()
  } else {
    await loadWorkouts()
  }
}

async function loadWorkouts() {
  loading.value = true
  try {
    if (filterClientId.value) {
      const [w, h] = await Promise.all([
        api.get(`/workouts/client/${filterClientId.value}`),
        api.get(`/sessions/client/${filterClientId.value}`).catch(() => ({ data: [] }))
      ])
      workouts.value      = w.data
      clientHistory.value = h.data
    } else {
      clientHistory.value = []
      const all = await Promise.all(
        clients.value.map(c =>
          api.get(`/workouts/client/${c.id}`).then(r => r.data).catch(() => [])
        )
      )
      workouts.value = all.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

function clientName(id) {
  return clients.value.find(c => c.id === id)?.full_name ?? '—'
}

function openCreate() {
  showModal.value = true
}

async function save(payload) {
  saving.value = true
  try {
    await api.post('/workouts', payload)
    toast.success('Rutina creada')
    showModal.value = false
    await loadWorkouts()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al crear la rutina')
  } finally {
    saving.value = false
  }
}

async function toggleActive(w) {
  try {
    await api.patch(`/workouts/${w.id}`, { is_active: !w.is_active })
    toast.success(w.is_active ? 'Rutina desactivada' : 'Rutina activada')
    await loadWorkouts()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  }
}

async function remove(w) {
  if (!confirm(`¿Eliminar la rutina "${w.name}"?`)) return
  try {
    await api.delete(`/workouts/${w.id}`)
    toast.success('Rutina eliminada')
    await loadWorkouts()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al eliminar')
  }
}

async function duplicate(w) {
  try {
    await api.post(`/workouts/${w.id}/duplicate`, { client_id: w.client_id })
    toast.success(`Rutina "${w.name}" duplicada`)
    await loadWorkouts()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al duplicar')
  }
}

function formatDuration(secs) {
  if (!secs) return '0m'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`
  return `${s}s`
}

function effortEmoji(val) {
  return ['', '😫', '😊', '💪'][val] ?? ''
}
</script>
