import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
})

// Añadir token en cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Renovar token si expira (401) y manejar el cierre de sesión de forma correcta
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    const status   = err.response?.status

    // ── 401: intentar refrescar el token una sola vez ──
    if (status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/auth/refresh`,
            { refresh_token: refresh }
          )
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          // El refresh falló (token revocado o expirado): limpiar sesión
          await _clearSession()
          return Promise.reject(err)
        }
      } else {
        await _clearSession()
        return Promise.reject(err)
      }
    }

    return Promise.reject(err)
  }
)

/**
 * Limpia la sesión usando el store de Pinia (si ya está inicializado)
 * o directamente localStorage como fallback.
 * Redirige a /login usando el router de Vue si está disponible.
 */
async function _clearSession() {
  try {
    // Importación dinámica para evitar dependencia circular en tiempo de carga.
    // Los interceptores solo se ejecutan cuando hay peticiones activas,
    // momento en el que Pinia y el router ya están inicializados.
    const { useAuthStore } = await import('../stores/auth.js')
    const auth = useAuthStore()
    auth.clear()

    const { default: router } = await import('../router/index.js')
    if (!router.currentRoute.value.path.startsWith('/login')) {
      router.push('/login')
    }
  } catch {
    // Fallback si Pinia aún no está inicializado (caso extremadamente improbable)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
}

export default api
