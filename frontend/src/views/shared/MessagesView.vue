<template>
  <AppLayout>
    <div class="flex items-center gap-3 mb-4">
      <button v-if="backTo" @click="$router.push(backTo)"
        class="text-white/40 hover:text-white text-sm">←</button>
      <h1 class="font-oswald text-3xl text-white font-bold">{{ title }}</h1>
    </div>

    <div class="bg-deep rounded-2xl border border-white/5 flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      <!-- Cabecera con info del otro -->
      <div v-if="otherUser" class="flex items-center gap-3 px-5 py-3 border-b border-white/5">
        <div class="w-10 h-10 rounded-full bg-purple flex items-center justify-center text-white font-oswald font-bold">
          {{ otherInitial }}
        </div>
        <div>
          <p class="text-white font-medium">{{ otherUser.full_name }}</p>
          <p class="text-white/40 text-xs capitalize">{{ otherUser.role === 'trainer' ? 'Entrenador' : 'Cliente' }}</p>
        </div>
      </div>

      <!-- Lista de mensajes -->
      <div ref="scrollEl" class="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        <p v-if="loading" class="text-white/40 text-center py-8">Cargando conversación...</p>
        <p v-else-if="!messages.length" class="text-white/40 text-center py-8">
          No hay mensajes todavía. Rompe el hielo 👋
        </p>
        <div v-else>
          <div v-for="(m, i) in messages" :key="m.id"
            :class="['flex', m.sender_id === me ? 'justify-end' : 'justify-start']">
            <div class="max-w-[75%]">
              <div v-if="shouldShowDate(i)"
                class="text-white/30 text-xs text-center my-3">
                {{ formatDay(m.sent_at) }}
              </div>
              <div :class="[
                'px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap',
                m.sender_id === me
                  ? 'bg-gold text-dark rounded-br-md'
                  : 'bg-purple text-white rounded-bl-md'
              ]">
                {{ m.content }}
              </div>
              <p class="text-white/30 text-[10px] mt-1"
                :class="m.sender_id === me ? 'text-right' : 'text-left'">
                {{ formatTime(m.sent_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <form @submit.prevent="send" class="flex gap-2 p-4 border-t border-white/5">
        <input v-model="draft" type="text" placeholder="Escribe un mensaje..."
          :disabled="!otherId || sending"
          class="flex-1 bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-white
                 placeholder-white/30 focus:outline-none focus:border-gold disabled:opacity-50" />
        <button type="submit" :disabled="!draft.trim() || sending"
          class="bg-gold hover:bg-gold/90 text-dark font-oswald font-bold px-5 py-2.5 rounded-xl
                 transition-colors disabled:opacity-50">
          {{ sending ? '...' : 'ENVIAR' }}
        </button>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppLayout from '../../components/common/AppLayout.vue'
import api from '../../api/axios.js'
import { useAuthStore } from '../../stores/auth.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()

const props = defineProps({
  otherUserId: { type: String, default: null },
  title:       { type: String, default: 'Mensajes' },
  backTo:      { type: String, default: null }
})

const auth = useAuthStore()
const me = computed(() => auth.user?.id)

const otherId   = computed(() => props.otherUserId)
const otherUser = ref(null)
const messages  = ref([])
const draft     = ref('')
const loading   = ref(true)
const sending   = ref(false)
const scrollEl  = ref(null)

const otherInitial = computed(() => otherUser.value?.full_name?.charAt(0).toUpperCase() ?? '?')

let pollTimer = null

async function loadOther() {
  if (!otherId.value) return
  try {
    const { data } = await api.get(`/users/peer/${otherId.value}`)
    otherUser.value = data
  } catch {
    otherUser.value = null
  }
}

async function loadMessages() {
  if (!otherId.value) return
  try {
    const { data } = await api.get(`/messages/conversation/${otherId.value}`)
    const prevCount = messages.value.length
    messages.value = data
    if (data.length !== prevCount) await scrollBottom()
  } catch {
    /* silencioso para no spammear errores en polling */
  } finally {
    loading.value = false
  }
}

async function send() {
  const content = draft.value.trim()
  if (!content || !otherId.value) return
  sending.value = true
  try {
    await api.post('/messages', { receiver_id: otherId.value, content })
    draft.value = ''
    await loadMessages()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al enviar')
  } finally {
    sending.value = false
  }
}

async function scrollBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

function shouldShowDate(i) {
  if (i === 0) return true
  const prev = new Date(messages.value[i - 1].sent_at).toDateString()
  const curr = new Date(messages.value[i].sent_at).toDateString()
  return prev !== curr
}

function formatDay(d) {
  const date = new Date(d)
  const today = new Date(); today.setHours(0,0,0,0)
  const day   = new Date(date); day.setHours(0,0,0,0)
  const diff = Math.round((today - day) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

watch(otherId, async () => {
  loading.value = true
  messages.value = []
  otherUser.value = null
  await loadOther()
  await loadMessages()
})

onMounted(async () => {
  await loadOther()
  await loadMessages()
  // Polling cada 5s
  pollTimer = setInterval(loadMessages, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
