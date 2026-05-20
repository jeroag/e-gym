import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/axios.js'
import router from '../router/index.js'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('user') ?? 'null'))
  const token = ref(localStorage.getItem('access_token'))

  // `ready` pasa a true cuando bootstrap() termina.
  // `_bootstrapPromise` evita que dos llamadas simultáneas lancen la petición dos veces.
  const ready = ref(false)
  let _bootstrapPromise = null

  const isLoggedIn = computed(() => !!token.value)
  const isTrainer  = computed(() => user.value?.role === 'trainer')
  const isClient   = computed(() => user.value?.role === 'client')

  function persist(accessToken, refreshToken, userData) {
    token.value = accessToken
    user.value  = userData
    localStorage.setItem('access_token',  accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clear() {
    token.value = null
    user.value  = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.access_token, data.refresh_token, data.user)
    router.push(data.user.role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard')
  }

  // Registra y, si todo va bien, hace login automático.
  async function register(payload) {
    await api.post('/auth/register', payload)
    await login(payload.email, payload.password)
  }

  // Cierra sesión: invalida el refresh token en el servidor y limpia el cliente.
  async function logout() {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken })
    } catch {
      // best-effort: aunque falle, limpiamos el estado local
    }
    clear()
    router.push('/login')
  }

  // Al arrancar la app valida el token llamando /users/me.
  // Es idempotente y segura frente a llamadas concurrentes.
  async function bootstrap() {
    if (ready.value) return
    if (_bootstrapPromise) return _bootstrapPromise

    _bootstrapPromise = (async () => {
      if (!token.value) {
        ready.value = true
        return
      }
      try {
        const { data } = await api.get('/users/me')
        user.value = data
        localStorage.setItem('user', JSON.stringify(data))
      } catch {
        clear()
      } finally {
        ready.value = true
      }
    })()

    return _bootstrapPromise
  }

  return {
    user, token, ready,
    isLoggedIn, isTrainer, isClient,
    login, register, logout, bootstrap, clear
  }
})
