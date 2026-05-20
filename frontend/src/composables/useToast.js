import { reactive } from 'vue'

// Estado global de toasts compartido por toda la app.
const state = reactive({
  list: [],
  nextId: 1
})

function push(type, message, opts = {}) {
  const id = state.nextId++
  const toast = { id, type, message, timeout: opts.timeout ?? 4000 }
  state.list.push(toast)
  if (toast.timeout > 0) {
    setTimeout(() => dismiss(id), toast.timeout)
  }
  return id
}

function dismiss(id) {
  const i = state.list.findIndex(t => t.id === id)
  if (i >= 0) state.list.splice(i, 1)
}

export function useToast() {
  return {
    toasts: state.list,
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    dismiss
  }
}
