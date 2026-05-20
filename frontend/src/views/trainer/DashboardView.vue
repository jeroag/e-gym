<template>
  <AppLayout>
    <div class="mb-8 animate-fade-up">
      <p class="text-white/40 text-sm">Hola,</p>
      <h1 class="font-oswald text-3xl sm:text-4xl text-white font-bold mt-0.5">
        {{ auth.user?.full_name?.split(' ')[0] }}
      </h1>
    </div>

    <!-- Stats -->
    <div v-if="loading" class="grid grid-cols-3 gap-3 mb-8">
      <Skeleton v-for="i in 3" :key="i" height="100px" />
    </div>
    <div v-else class="grid grid-cols-3 gap-3 mb-8">
      <div class="card p-5">
        <StatBlock label="Clientes" :value="clients.length" />
      </div>
      <div class="card p-5">
        <StatBlock label="Series · 7d" :value="weekSets" />
      </div>
      <div class="card p-5">
        <StatBlock label="Sin leer" :value="unread"
          :hint="unread > 0 ? 'Mensajes nuevos' : 'Todo al día'" />
      </div>
    </div>

    <!-- Clientes inactivos -->
    <div v-if="!loading && inactiveClients.length" class="mb-6 animate-fade-up">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-warning text-lg">⚠</span>
        <h2 class="font-oswald text-lg text-white font-semibold">Necesitan atención</h2>
        <span class="text-xs text-white/30">sin entrenar en +7 días</span>
      </div>
      <div class="card divide-y divide-white/[0.05]">
        <RouterLink v-for="c in inactiveClients" :key="c.id"
          :to="`/trainer/clients/${c.id}`"
          class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center
                        text-warning text-sm font-semibold shrink-0">
              {{ c.full_name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-white text-sm truncate">{{ c.full_name }}</p>
              <p class="text-white/35 text-xs">
                {{ c.last_session ? `Último entreno: ${daysAgo(c.last_session)}` : 'Nunca ha entrenado' }}
              </p>
            </div>
          </div>
          <span class="text-warning/50 text-sm">→</span>
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Feed actividad (col 2) -->
      <section class="lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-oswald text-xl text-white font-semibold">Actividad reciente</h2>
          <span class="text-white/30 text-xs">Últimas 24h</span>
        </div>

        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="i in 4" :key="i" height="64px" />
        </div>

        <EmptyState v-else-if="!feed.length"
          icon="📊"
          title="Sin actividad todavía"
          description="Cuando tus clientes registren series las verás aquí." />

        <div v-else class="card divide-y divide-white/[0.05]">
          <RouterLink v-for="entry in feed" :key="entry.id"
            :to="`/trainer/clients/${entry.client_id}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <div class="w-9 h-9 rounded-full bg-purple/40 flex items-center justify-center
                        text-white font-semibold text-sm shrink-0">
              {{ entry.client_name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm truncate">
                <span class="font-semibold">{{ entry.client_name }}</span>
                <span class="text-white/50"> · </span>
                <span class="text-white/80">{{ entry.exercise_name }}</span>
              </p>
              <div class="flex items-center gap-2 text-xs mt-0.5">
                <MuscleTag :group="entry.muscle_group" />
                <span class="text-white/30">·</span>
                <span class="text-white/50 tnum">
                  <span v-if="entry.weight_kg">{{ entry.weight_kg }}kg</span>
                  <span v-else-if="entry.reps_done">{{ entry.reps_done }} reps</span>
                  <span v-else>Serie {{ entry.set_number }}</span>
                </span>
              </div>
            </div>
            <span class="text-white/30 text-xs whitespace-nowrap">{{ timeAgo(entry.logged_at) }}</span>
          </RouterLink>
        </div>
      </section>

      <!-- Clientes (col 1) -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-oswald text-xl text-white font-semibold">Clientes</h2>
          <RouterLink to="/trainer/clients" class="text-gold text-xs hover:underline">Ver todos →</RouterLink>
        </div>

        <div v-if="loading" class="space-y-2">
          <Skeleton v-for="i in 4" :key="i" height="48px" />
        </div>

        <EmptyState v-else-if="!clients.length"
          icon="👥"
          title="Sin clientes"
          description="Añade tu primer cliente para empezar.">
          <RouterLink to="/trainer/clients" class="btn-primary px-4 py-2 text-sm">AÑADIR CLIENTE</RouterLink>
        </EmptyState>

        <div v-else class="card divide-y divide-white/[0.05]">
          <RouterLink v-for="c in clients.slice(0,6)" :key="c.id"
            :to="`/trainer/clients/${c.id}`"
            class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-purple/40 flex items-center justify-center
                          text-white text-sm font-semibold shrink-0">
                {{ c.full_name.charAt(0).toUpperCase() }}
              </div>
              <span class="text-white text-sm truncate">{{ c.full_name }}</span>
            </div>
            <span class="text-white/30 text-sm">→</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import AppLayout  from '../../components/common/AppLayout.vue'
import StatBlock  from '../../components/common/StatBlock.vue'
import Skeleton   from '../../components/common/Skeleton.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import MuscleTag  from '../../components/common/MuscleTag.vue'
import api from '../../api/axios.js'

const auth    = useAuthStore()
const clients = ref([])
const feed    = ref([])
const unread  = ref(0)
const weekSets = ref(0)  // series de los últimos 7 días (dato directo del backend)
const loading = ref(true)

onMounted(async () => {
  try {
    const [c, f, u, w] = await Promise.all([
      api.get('/users/clients'),
      api.get('/progress/feed?limit=30'),
      api.get('/messages/unread'),
      api.get('/progress/week-stats')   // endpoint dedicado → sin sesgo por el límite del feed
    ])
    clients.value  = c.data
    feed.value     = f.data
    unread.value   = u.data.unread ?? 0
    weekSets.value = w.data.sets   ?? 0
  } finally {
    loading.value = false
  }
})

// Clients with no session in last 7 days (or never trained)
const inactiveClients = computed(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return clients.value.filter(c => {
    if (!c.last_session) return true
    return new Date(c.last_session).getTime() < cutoff
  })
})

function daysAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'ayer'
  return `hace ${diff} días`
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60)    return 'ahora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}
</script>
