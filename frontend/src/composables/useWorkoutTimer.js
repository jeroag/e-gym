/**
 * useWorkoutTimer — temporizador global de entrenamiento.
 *
 * Singleton: solo puede haber un entrenamiento activo a la vez.
 * El estado persiste en localStorage para sobrevivir a refrescos de página.
 *
 * Uso:
 *   const { isActive, anyActive, formattedTime, elapsed, start, stop } = useWorkoutTimer(workoutId)
 */
import { ref, computed } from 'vue'

// ── Estado singleton a nivel de módulo (compartido entre todos los componentes) ──
const _activeId   = ref(null)
const _startTime  = ref(null)
const _elapsed    = ref(0)      // segundos transcurridos
let   _interval   = null

const STORAGE_KEY = 'egym_workout_timer'

function _tick() {
  if (_startTime.value) {
    _elapsed.value = Math.floor((Date.now() - _startTime.value) / 1000)
  }
}

function _persist() {
  if (_activeId.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id:    _activeId.value,
      start: _startTime.value
    }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Restaurar estado al cargar el módulo (si había un entreno activo al cerrar)
;(function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const { id, start } = JSON.parse(raw)
    if (!id || !start) return
    _activeId.value  = id
    _startTime.value = start
    _tick()
    _interval = setInterval(_tick, 1000)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
})()

// ── Función que devuelve el timer para un workout concreto ──
export function useWorkoutTimer(workoutId) {
  /** true si ESTE workout es el activo */
  const isActive = computed(() => _activeId.value === workoutId)

  /** true si CUALQUIER workout tiene el timer en marcha */
  const anyActive = computed(() => _activeId.value !== null)

  /** Tiempo formateado: MM:SS o H:MM:SS */
  const formattedTime = computed(() => {
    const secs = isActive.value ? _elapsed.value : 0
    const s = secs % 60
    const m = Math.floor(secs / 60) % 60
    const h = Math.floor(secs / 3600)
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
    return `${pad(m)}:${pad(s)}`
  })

  /** Segundos crudos (para calcular el resumen final) */
  const elapsed = computed(() => isActive.value ? _elapsed.value : 0)

  /** Inicia el timer para este workout (detiene cualquier otro activo) */
  function start() {
    if (_interval) clearInterval(_interval)
    _activeId.value  = workoutId
    _startTime.value = Date.now()
    _elapsed.value   = 0
    _persist()
    _tick()
    _interval = setInterval(_tick, 1000)
  }

  /**
   * Detiene el timer.
   * @returns {number} segundos totales del entreno
   */
  function stop() {
    if (_interval) { clearInterval(_interval); _interval = null }
    const duration  = _elapsed.value
    _activeId.value  = null
    _startTime.value = null
    _elapsed.value   = 0
    _persist()
    return duration
  }

  return { isActive, anyActive, formattedTime, elapsed, start, stop }
}

// ── Helper ──────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0') }
