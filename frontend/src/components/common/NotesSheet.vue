<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/65 backdrop-blur-sm" @click="close" />

        <div class="relative rounded-t-2xl overflow-hidden flex flex-col"
          style="background:#1A171F; max-height:85dvh; padding-bottom:env(safe-area-inset-bottom,0px);">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-white/20"/>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
            <div>
              <h3 class="font-oswald text-xl font-semibold text-white tracking-wide">Notas privadas</h3>
              <p class="text-white/35 text-xs mt-0.5">{{ clientName }} · solo tú las ves</p>
            </div>
            <button @click="close"
              class="w-8 h-8 rounded-lg flex items-center justify-center
                     text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Input nueva nota -->
          <div class="px-5 pt-4 pb-3 shrink-0 border-b border-white/[0.06]">
            <div class="flex items-end gap-2">
              <textarea v-model="newNote"
                placeholder="Escribe una nota sobre este cliente..."
                rows="2"
                class="flex-1 input resize-none text-sm leading-relaxed"
                style="min-height:64px;"
                @keydown.enter.ctrl="save"
              />
              <button @click="save" :disabled="!newNote.trim() || saving"
                class="w-11 h-11 shrink-0 rounded-xl bg-gold text-dark flex items-center justify-center
                       font-bold text-lg hover:bg-gold/90 active:scale-95 transition-all disabled:opacity-40">
                <Spinner v-if="saving" class="w-4 h-4" />
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            <p class="text-white/20 text-[10px] mt-1.5">Ctrl+Enter para guardar</p>
          </div>

          <!-- Lista de notas -->
          <div class="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-3">
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>

            <div v-else-if="!notes.length" class="text-center py-8">
              <p class="text-white/25 text-sm">Sin notas todavía.</p>
              <p class="text-white/15 text-xs mt-1">Añade observaciones, objetivos, lesiones...</p>
            </div>

            <div v-else v-for="note in notes" :key="note.id"
              class="card-flat p-4 group">
              <div class="flex items-start gap-3">
                <p class="flex-1 text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{{ note.content }}</p>
                <button @click="remove(note)"
                  class="shrink-0 w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100
                         flex items-center justify-center text-danger/50 hover:text-danger
                         hover:bg-danger/10 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
              <p class="text-white/25 text-[10px] mt-2 tnum">{{ formatDate(note.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../api/axios.js'
import Spinner from './Spinner.vue'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientId:   { type: String, default: null },
  clientName: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

const toast   = useToast()
const notes   = ref([])
const loading = ref(false)
const saving  = ref(false)
const newNote = ref('')

watch(() => props.modelValue, async (v) => {
  if (v && props.clientId) {
    loading.value = true
    try {
      const { data } = await api.get(`/users/clients/${props.clientId}/notes`)
      notes.value = data
    } catch {
      notes.value = []
    } finally {
      loading.value = false
    }
    newNote.value = ''
  }
})

async function save() {
  if (!newNote.value.trim() || saving.value) return
  saving.value = true
  try {
    const { data } = await api.post(`/users/clients/${props.clientId}/notes`, {
      content: newNote.value.trim()
    })
    notes.value.unshift(data)
    newNote.value = ''
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

async function remove(note) {
  try {
    await api.delete(`/users/clients/${props.clientId}/notes/${note.id}`)
    notes.value = notes.value.filter(n => n.id !== note.id)
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al eliminar')
  }
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.sheet-enter-active { transition: all 0.32s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: all 0.22s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .relative,
.sheet-leave-to   .relative { transform: translateY(100%); }
.sheet-enter-active .relative,
.sheet-leave-active .relative { transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1); }
</style>
