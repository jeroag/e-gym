import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },

    // Públicas
    { path: '/login',           component: () => import('../views/auth/LoginView.vue'),           meta: { public: true } },
    { path: '/register',        component: () => import('../views/auth/RegisterView.vue'),        meta: { public: true } },
    { path: '/forgot-password', component: () => import('../views/auth/ForgotPasswordView.vue'),  meta: { public: true } },

    // Entrenador
    { path: '/trainer/dashboard',   component: () => import('../views/trainer/DashboardView.vue'),    meta: { role: 'trainer' } },
    { path: '/trainer/clients',     component: () => import('../views/trainer/ClientsView.vue'),      meta: { role: 'trainer' } },
    { path: '/trainer/clients/:id', component: () => import('../views/trainer/ClientDetailView.vue'), meta: { role: 'trainer' } },
    { path: '/trainer/workouts',    component: () => import('../views/trainer/WorkoutsView.vue'),     meta: { role: 'trainer' } },
    { path: '/trainer/exercises',   component: () => import('../views/trainer/ExercisesView.vue'),    meta: { role: 'trainer' } },
    {
      path: '/trainer/messages/:userId',
      component: () => import('../views/shared/MessagesView.vue'),
      meta: { role: 'trainer' },
      props: route => ({
        otherUserId: route.params.userId,
        title:  'Conversación',
        backTo: '/trainer/clients'
      })
    },

    // Cliente
    { path: '/client/dashboard', component: () => import('../views/client/DashboardView.vue'), meta: { role: 'client' } },
    { path: '/client/progress',  component: () => import('../views/client/ProgressView.vue'),  meta: { role: 'client' } },
    { path: '/client/messages',  component: () => import('../views/client/MessagesView.vue'),  meta: { role: 'client' } },
    { path: '/client/settings',  component: () => import('../views/client/SettingsView.vue'),  meta: { role: 'client' } },

    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
})

// Guard: usa el store de Pinia vía import dinámico para evitar el ciclo store ↔ router.
// Llama a bootstrap() directamente en vez de usar setInterval para esperar a que esté listo.
router.beforeEach(async to => {
  const { useAuthStore } = await import('../stores/auth.js')
  const auth = useAuthStore()

  // Garantizar que bootstrap() se completa antes de evaluar la ruta.
  // bootstrap() es idempotente y gestiona llamadas concurrentes con una Promise guardada.
  await auth.bootstrap()

  // Rutas públicas: si ya está logueado, redirigir a su dashboard
  if (to.meta.public) {
    if (auth.isLoggedIn) {
      return auth.isTrainer ? '/trainer/dashboard' : '/client/dashboard'
    }
    return true
  }

  // Rutas privadas: requieren sesión
  if (!auth.isLoggedIn) return '/login'

  // Rutas con rol: redirigir al dashboard del rol correcto si no coincide
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.isTrainer ? '/trainer/dashboard' : '/client/dashboard'
  }

  return true
})

export default router
