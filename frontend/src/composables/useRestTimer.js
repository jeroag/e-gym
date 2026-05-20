/**
 * useRestTimer — temporizador de descanso entre series.
 * Singleton: un único descanso activo a la vez.
 */
import { ref, computed } from 'vue'
import { useNotifications } from './useNotifications.js'

const _remaining = ref(0)
const _total     = ref(0)
const _label     = ref('')   // nombre del ejercicio
let   _interval  = null

export function useRestTimer() {
  const isActive  = computed(() => _remaining.value > 0)
  const progress  = computed(() =>
    _total.value > 0
      ? Math.min((_total.value - _remaining.value) / _total.value, 1)
      : 0
  )
  const formatted = computed(() => {
    const s = _remaining.value
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${s}`
  })

  function start(secs, label = '') {
    if (secs <= 0) return
    if (_interval) { clearInterval(_interval); _interval = null }
    _remaining.value = Math.floor(secs)
    _total.value     = Math.floor(secs)
    _label.value     = label

    _interval = setInterval(() => {
      if (_remaining.value <= 1) {
        _remaining.value = 0
        clearInterval(_interval)
        _interval = null
        // Vibrar al acabar el descanso
        try { navigator.vibrate?.([200, 100, 200]) } catch { /* noop */ }
        // Notificación push si la tab está en background
        try {
          const { notify } = useNotifications()
          notify('⏱ ¡Descanso terminado!', {
            body: _label.value ? `Siguiente serie de ${_label.value}` : 'Es hora de tu siguiente serie.',
            tag: 'rest-timer'
          })
        } catch { /* noop */ }
      } else {
        _remaining.value--
      }
    }, 1000)
  }

  function skip() {
    if (_interval) { clearInterval(_interval); _interval = null }
    _remaining.value = 0
  }

  function addTime(secs = 15) {
    _remaining.value += secs
    _total.value      = Math.max(_total.value, _remaining.value)
  }

  return { isActive, remaining: _remaining, total: _total, label: _label, formatted, progress, start, skip, addTime }
}
