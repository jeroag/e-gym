<template>
  <div class="min-h-screen flex">

    <!-- ─── Backdrop móvil (sidebar) ──────────────────────── -->
    <Transition name="fade">
      <div v-if="sidebarOpen" @click="sidebarOpen = false"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden" />
    </Transition>

    <!-- ─── Sidebar (desktop siempre visible, móvil oculto) ── -->
    <aside :class="[
      'fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col',
      'border-r border-white/[0.05] transition-transform duration-300 ease-out',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]" style="background: rgba(20,17,25,0.98); backdrop-filter: blur(20px);">

      <!-- Logo -->
      <div class="px-6 py-5 flex items-center justify-between border-b border-white/[0.05]">
        <div>
          <div class="flex items-baseline gap-1.5">
            <h1 class="font-oswald text-2xl font-bold tracking-[0.12em]"
              style="background: linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
              E-GYM
            </h1>
          </div>
          <p class="text-white/25 text-[9px] mt-0.5 uppercase tracking-[0.2em] font-medium">
            {{ roleLabel }}
          </p>
        </div>
        <button @click="sidebarOpen = false"
          class="lg:hidden p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/[0.05] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <template v-if="auth.isTrainer">
          <p class="px-3 py-2 text-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold">Panel</p>
          <NavLink :to="'/trainer/dashboard'" :icon="icons.home" :badge="unread">Dashboard</NavLink>

          <p class="px-3 pt-4 pb-2 text-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold">Gestión</p>
          <NavLink :to="'/trainer/clients'"   :icon="icons.clients">Clientes</NavLink>
          <NavLink :to="'/trainer/workouts'"  :icon="icons.workouts">Rutinas</NavLink>
          <NavLink :to="'/trainer/exercises'" :icon="icons.exercises">Ejercicios</NavLink>
        </template>
        <template v-else>
          <p class="px-3 py-2 text-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold">Mi cuenta</p>
          <NavLink :to="'/client/dashboard'" :icon="icons.home">Mi Entrenamiento</NavLink>
          <NavLink :to="'/client/progress'"  :icon="icons.progress">Mi Progreso</NavLink>
          <NavLink :to="'/client/messages'"  :icon="icons.messages" :badge="unread">Mensajes</NavLink>

          <p class="px-3 pt-4 pb-2 text-white/25 text-[9px] uppercase tracking-[0.2em] font-semibold">Configuración</p>
          <NavLink :to="'/client/settings'"  :icon="icons.settings">Ajustes</NavLink>
        </template>
      </nav>

      <!-- Usuario -->
      <div class="p-3 border-t border-white/[0.05]">
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0
                      text-dark font-oswald font-bold text-sm"
            style="background: linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%);">
            {{ initial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate leading-tight">{{ auth.user?.full_name }}</p>
            <p class="text-white/35 text-[11px] truncate mt-0.5">{{ auth.user?.email }}</p>
          </div>
        </div>
        <button @click="handleLogout"
          class="w-full mt-1 text-white/35 hover:text-danger text-xs py-2 px-3 rounded-lg
                 hover:bg-danger/5 transition-all duration-150 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- ─── Contenido principal ────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Topbar móvil -->
      <header class="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3
                     border-b border-white/[0.05]"
        style="background: rgba(15,13,16,0.92); backdrop-filter: blur(16px);">
        <button @click="sidebarOpen = true"
          class="p-2 -ml-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <span class="font-oswald text-lg font-bold tracking-[0.12em]"
          style="background: linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          E-GYM
        </span>

        <div class="relative">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0
                      text-dark font-oswald font-bold text-sm"
            style="background: linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%);">
            {{ initial }}
          </div>
          <span v-if="unread > 0"
            class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold text-dark text-[8px]
                   font-bold rounded-full flex items-center justify-center">
            {{ unread > 9 ? '9+' : unread }}
          </span>
        </div>
      </header>

      <!-- Main -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-24 lg:pb-8">
        <slot />
      </main>
    </div>

    <!-- ─── Rest timer overlay (global, singleton) ──────────── -->
    <RestTimerOverlay />

    <!-- ─── PWA install banner ───────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="pwa.canInstall.value && !pwa.dismissed.value && !pwa.installed.value"
        class="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-sm z-40">
        <div class="rounded-2xl border border-gold/20 p-4 flex items-center gap-4 shadow-2xl"
          style="background: rgba(26,23,31,0.98); backdrop-filter: blur(20px);">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-oswald font-bold text-dark text-sm"
            style="background: linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%);">E</div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-semibold leading-tight">Instalar E-GYM</p>
            <p class="text-white/40 text-xs mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="pwa.dismiss()"
              class="text-white/30 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              Ahora no
            </button>
            <button @click="pwa.install()"
              class="bg-gold text-dark text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gold/90 transition-colors">
              Instalar
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ─── Bottom navigation (móvil) ─────────────────────── -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/[0.06]"
      style="background: rgba(15,13,16,0.95); backdrop-filter: blur(20px); padding-bottom: env(safe-area-inset-bottom, 0px);">
      <div class="relative flex items-stretch h-16">

        <!-- Sliding pill indicator -->
        <div class="absolute top-1.5 h-[calc(100%-12px)] w-1/4 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          :style="{ transform: `translateX(${activeTabIndex * 100}%)` }">
          <div class="mx-2 h-full rounded-xl bg-white/[0.07]" />
        </div>

        <template v-if="auth.isTrainer">
          <BottomNavLink to="/trainer/dashboard" :icon="icons.home" :badge="unread">Panel</BottomNavLink>
          <BottomNavLink to="/trainer/clients"   :icon="icons.clients">Clientes</BottomNavLink>
          <BottomNavLink to="/trainer/workouts"  :icon="icons.workouts">Rutinas</BottomNavLink>
          <BottomNavLink to="/trainer/exercises" :icon="icons.exercises">Ejercicios</BottomNavLink>
        </template>
        <template v-else>
          <BottomNavLink to="/client/dashboard" :icon="icons.home">Inicio</BottomNavLink>
          <BottomNavLink to="/client/progress"  :icon="icons.progress">Progreso</BottomNavLink>
          <BottomNavLink to="/client/messages"  :icon="icons.messages" :badge="unread">Mensajes</BottomNavLink>
          <BottomNavLink to="/client/settings"  :icon="icons.settings">Ajustes</BottomNavLink>
        </template>
      </div>
    </nav>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { useToast } from '../../composables/useToast.js'
import { usePwaInstall } from '../../composables/usePwaInstall.js'
import NavLink from './NavLink.vue'
import RestTimerOverlay from './RestTimerOverlay.vue'
import api from '../../api/axios.js'

// ── Componente interno: ítem del bottom nav ───────────────
const BottomNavLink = {
  name: 'BottomNavLink',
  props: {
    to:    { type: String, required: true },
    icon:  { type: String, default: '' },
    badge: { type: Number, default: 0 }
  },
  setup(props) {
    const route  = useRoute()
    const active = computed(() => route.path === props.to || route.path.startsWith(props.to + '/'))
    return { active }
  },
  template: `
    <RouterLink :to="to" custom v-slot="{ navigate, href }">
      <a :href="href" @click="navigate"
        :class="['bottom-nav-link', active ? 'active' : '']">
        <div class="relative">
          <span class="w-6 h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            v-html="icon" />
          <span v-if="badge" class="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-gold text-dark
                text-[8px] font-bold rounded-full flex items-center justify-center">
            {{ badge > 9 ? '9+' : badge }}
          </span>
        </div>
        <span class="text-[10px] font-medium tracking-wide"><slot /></span>
      </a>
    </RouterLink>
  `
}

const auth  = useAuthStore()
const toast = useToast()
const route = useRoute()
const pwa   = usePwaInstall()

const sidebarOpen = ref(false)
const unread      = ref(0)

const initial   = computed(() => auth.user?.full_name?.charAt(0).toUpperCase() ?? '?')
const roleLabel = computed(() => auth.user?.role === 'trainer' ? 'Entrenador' : 'Cliente')

// Sliding pill: map current route to tab index (0-3)
const trainerRoutes = ['/trainer/dashboard', '/trainer/clients', '/trainer/workouts', '/trainer/exercises']
const clientRoutes  = ['/client/dashboard',  '/client/progress', '/client/messages',  '/client/settings']
const activeTabIndex = computed(() => {
  const routes = auth.isTrainer ? trainerRoutes : clientRoutes
  const idx = routes.findIndex(r => route.path === r || route.path.startsWith(r + '/'))
  return idx >= 0 ? idx : 0
})

// Cerrar sidebar al navegar
watch(() => route.path, () => { sidebarOpen.value = false })

// ── Iconos SVG (stroke, 24×24, sin fill) ──────────────────
const icons = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,

  clients: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>`,

  workouts: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="2" width="6" height="4" rx="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M9 12h6M9 16h4"/>
  </svg>`,

  exercises: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M3.5 8.5V15.5M20.5 8.5V15.5M1.5 10.5V13.5M22.5 10.5V13.5"/>
  </svg>`,

  progress: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>`,

  messages: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,

  settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`
}

// ── Polling de mensajes no leídos ─────────────────────────
let timer = null
async function refreshUnread() {
  if (!auth.isLoggedIn) return
  try {
    const { data } = await api.get('/messages/unread')
    unread.value = data.unread ?? 0
  } catch { /* silencio */ }
}

async function handleLogout() {
  await auth.logout()
  toast.info('Sesión cerrada')
}

onMounted(() => {
  refreshUnread()
  timer = setInterval(refreshUnread, 15000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.32,0.72,0,1); }
.slide-up-leave-active { transition: all 0.22s cubic-bezier(0.32,0.72,0,1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(16px); }
</style>
