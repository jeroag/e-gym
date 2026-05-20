/**
 * useOfflineQueue — cola offline para series de entrenamiento.
 *
 * Cuando no hay conexión, los logs se guardan en localStorage
 * bajo la clave 'egym_offline_queue'. Al volver la conexión
 * (evento 'online') se sincronizan automáticamente.
 *
 * Uso en DashboardView:
 *   const { enqueue, pendingCount } = useOfflineQueue(onLogSaved)
 *   // en logSet, si api.post falla con NetworkError → enqueue(payload)
 */
import { ref, onMounted, onUnmounted } from 'vue'

const QUEUE_KEY = 'egym_offline_queue'

function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}
function writeQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function useOfflineQueue(api, onSynced) {
  const pendingCount = ref(readQueue().length)

  async function flush() {
    const items = readQueue()
    if (!items.length) return

    const remaining = []
    for (const item of items) {
      try {
        const { data } = await api.post('/progress/log', item)
        onSynced?.(data)
      } catch {
        remaining.push(item)
      }
    }
    writeQueue(remaining)
    pendingCount.value = remaining.length
  }

  function enqueue(payload) {
    const queue = readQueue()
    queue.push({ ...payload, _queued_at: Date.now() })
    writeQueue(queue)
    pendingCount.value = queue.length
  }

  function handleOnline() {
    if (pendingCount.value > 0) flush()
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    // Try to flush on mount in case we're already online
    if (navigator.onLine && pendingCount.value > 0) flush()
  })
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
  })

  return { enqueue, flush, pendingCount }
}
