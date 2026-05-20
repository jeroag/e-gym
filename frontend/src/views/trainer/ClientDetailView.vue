<template>
  <AppLayout>
    <RouterLink to="/trainer/clients" class="text-white/40 hover:text-white text-sm mb-4 inline-block">
      ← Volver a Clientes
    </RouterLink>

    <p v-if="loading" class="text-white/40 text-center py-16">Cargando ficha del cliente...</p>

    <p v-else-if="!client" class="bg-deep rounded-2xl p-8 text-center text-white/50">
      Cliente no encontrado o no es tuyo.
    </p>

    <div v-else>
      <!-- Cabecera -->
      <div class="bg-deep rounded-2xl p-6 border border-white/5 mb-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-3xl text-white font-oswald font-bold">
              {{ initial }}
            </div>
            <div>
              <h1 class="font-oswald text-3xl text-white font-bold">{{ client.full_name }}</h1>
              <p class="text-white/50 text-sm">{{ client.email }}</p>
              <p class="text-white/30 text-xs mt-1">Cliente desde {{ formatDate(client.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <RouterLink :to="`/trainer/messages/${client.id}`"
              class="bg-purple hover:bg-purple/80 text-white text-sm font-oswald px-4 py-2 rounded-xl transition-colors">
              💬 Mensaje
            </RouterLink>
            <button @click="newWorkout"
              class="bg-gold hover:bg-gold/90 text-dark text-sm font-oswald font-bold px-4 py-2 rounded-xl transition-colors">
              + RUTINA
            </button>
            <button @click="unlink"
              class="text-red-400/70 hover:text-red-400 text-sm px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors">
              Desvincular
            </button>
          </div>
        </div>
      </div>

      <!-- Stats rápidas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-deep rounded-2xl p-4 border border-white/5">
          <p class="text-white/40 text-xs uppercase tracking-wider">Rutinas activas</p>
          <p class="text-gold font-oswald font-bold text-3xl">{{ activeWorkouts }}</p>
        </div>
        <div class="bg-deep rounded-2xl p-4 border border-white/5">
          <p class="text-white/40 text-xs uppercase tracking-wider">Total series</p>
          <p class="text-gold font-oswald font-bold text-3xl">{{ progressLogs.length }}</p>
        </div>
        <div class="bg-deep rounded-2xl p-4 border border-white/5">
          <p class="text-white/40 text-xs uppercase tracking-wider">Última sesión</p>
          <p class="text-gold font-oswald font-bold text-2xl">{{ lastSession }}</p>
        </div>
        <div class="bg-deep rounded-2xl p-4 border border-white/5">
          <p class="text-white/40 text-xs uppercase tracking-wider">Medidas</p>
          <p class="text-gold font-oswald font-bold text-3xl">{{ bodyMetrics.length }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Rutinas asignadas -->
        <section class="bg-deep rounded-2xl p-6 border border-white/5">
          <h2 class="font-oswald text-xl text-white font-semibold mb-4">Rutinas asignadas</h2>
          <p v-if="!workouts.length" class="text-white/40 text-sm text-center py-8">
            Aún no le has asignado rutinas.
          </p>
          <div v-else class="space-y-2">
            <div v-for="w in workouts" :key="w.id"
              class="bg-dark/50 rounded-xl p-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-white font-medium">{{ w.name }}</p>
                  <p class="text-white/40 text-xs">
                    {{ w.exercises?.length ?? 0 }} ejercicios
                    <span v-if="w.scheduled_date"> · {{ formatDate(w.scheduled_date) }}</span>
                    <span v-if="!w.is_active"> · <span class="text-red-400">inactiva</span></span>
                  </p>
                </div>
                <span v-if="w.is_active" class="text-emerald-400 text-xs">● activa</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Evolución de peso -->
        <section class="bg-deep rounded-2xl p-6 border border-white/5">
          <h2 class="font-oswald text-xl text-white font-semibold mb-4">Evolución corporal</h2>
          <p v-if="!bodyMetrics.length" class="text-white/40 text-sm text-center py-8">
            El cliente aún no ha registrado medidas.
          </p>
          <div v-else class="h-56">
            <Line :data="bodyChartData" :options="lineOpts" />
          </div>
        </section>
      </div>

      <!-- Registros recientes -->
      <section class="bg-deep rounded-2xl p-6 border border-white/5 mt-6">
        <h2 class="font-oswald text-xl text-white font-semibold mb-4">Últimos registros</h2>
        <p v-if="!progressLogs.length" class="text-white/40 text-sm text-center py-8">
          El cliente aún no ha registrado ninguna serie.
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-white/40 text-xs uppercase tracking-wider border-b border-white/5">
                <th class="text-left py-2">Fecha</th>
                <th class="text-left">Ejercicio</th>
                <th class="text-left">Grupo</th>
                <th class="text-center">Serie</th>
                <th class="text-center">Peso</th>
                <th class="text-center">Reps</th>
                <th class="text-left">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="log in progressLogs.slice(0, 30)" :key="log.id" class="text-white/80">
                <td class="py-2 text-white/50 whitespace-nowrap">{{ formatDateTime(log.logged_at) }}</td>
                <td>{{ log.exercise_name }}</td>
                <td class="text-white/50 capitalize">{{ log.muscle_group ?? '—' }}</td>
                <td class="text-center">{{ log.set_number }}</td>
                <td class="text-center text-gold">{{ log.weight_kg ?? '—' }}</td>
                <td class="text-center">{{ log.reps_done ?? '—' }}</td>
                <td class="text-white/50 text-xs">{{ log.notes ?? '' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="progressLogs.length > 30" class="text-white/30 text-xs text-center mt-3">
            Mostrando 30 de {{ progressLogs.length }} registros.
          </p>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppLayout from '../../components/common/AppLayout.vue'
import api from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()
import { Line } from 'vue-chartjs'
import {
  Chart, LineElement, PointElement, LinearScale, CategoryScale,
  Tooltip, Legend, Filler
} from 'chart.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler)

const route  = useRoute()
const router = useRouter()
const clientId = route.params.id

const loading      = ref(true)
const client       = ref(null)
const workouts     = ref([])
const progressLogs = ref([])
const bodyMetrics  = ref([])

const initial = computed(() => client.value?.full_name?.charAt(0).toUpperCase() ?? '?')
const activeWorkouts = computed(() => workouts.value.filter(w => w.is_active).length)
const lastSession = computed(() => {
  if (!progressLogs.value.length) return '—'
  const last = progressLogs.value[0].logged_at
  const diff = Math.floor((Date.now() - new Date(last)) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return `Hace ${diff}d`
})

onMounted(async () => {
  try {
    const [c, w, p, b] = await Promise.all([
      api.get(`/users/clients/${clientId}`),
      api.get(`/workouts/client/${clientId}`),
      api.get(`/progress/client/${clientId}`),
      api.get(`/progress/client/${clientId}/body-metrics`)
    ])
    client.value       = c.data
    workouts.value     = w.data
    progressLogs.value = p.data
    bodyMetrics.value  = b.data
  } catch (e) {
    // 403/404 → no es su cliente
    client.value = null
  } finally {
    loading.value = false
  }
})

async function unlink() {
  if (!confirm(`¿Desvincular a ${client.value.full_name}? Sus rutinas seguirán existiendo pero ya no podrás verlas.`)) return
  try {
    await api.delete(`/users/clients/${clientId}`)
    toast.success(`${client.value.full_name} desvinculado`)
    router.push('/trainer/clients')
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  }
}

function newWorkout() {
  // Vamos al listado de rutinas filtrado por este cliente y abrimos el modal manual
  router.push({ path: '/trainer/workouts', query: { client: clientId } })
}

// ── Chart body metrics ─────────────────────────────────
const bodyChartData = computed(() => ({
  labels: bodyMetrics.value.map(m => formatDate(m.measured_at)),
  datasets: [{
    label: 'Peso (kg)',
    data: bodyMetrics.value.map(m => m.weight_kg),
    borderColor: '#ECA72C',
    backgroundColor: 'rgba(236,167,44,0.15)',
    tension: 0.3,
    fill: true,
    spanGaps: true
  }]
}))

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#ffffff99' } },
    tooltip: { backgroundColor: '#31263E', titleColor: '#ECA72C' }
  },
  scales: {
    x: { ticks: { color: '#ffffff60' }, grid: { color: '#ffffff10' } },
    y: { ticks: { color: '#ffffff60' }, grid: { color: '#ffffff10' } }
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function formatDateTime(d) {
  return new Date(d).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>
