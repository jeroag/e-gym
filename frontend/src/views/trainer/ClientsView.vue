<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-oswald text-3xl sm:text-4xl text-white font-bold">Mis Clientes</h1>
        <p class="text-white/40 text-sm mt-1">Gestiona los clientes vinculados a tu licencia.</p>
      </div>
      <button @click="showAdd = true" class="btn-primary px-5 py-2.5">+ AÑADIR CLIENTE</button>
    </div>

    <div class="relative max-w-sm mb-6">
      <input v-model="q" placeholder="Buscar por nombre o email..." class="input pl-10" />
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔎</span>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="p-4 space-y-2">
        <Skeleton v-for="i in 4" :key="i" height="56px" />
      </div>

      <EmptyState v-else-if="!filtered.length"
        :icon="q ? '🔍' : '👥'"
        :title="q ? 'Sin coincidencias' : 'Sin clientes todavía'"
        :description="q ? 'Prueba con otro término de búsqueda.' : 'Pide a tus clientes su ID de cuenta desde Ajustes y añádelos aquí.'">
        <button v-if="!q" @click="showAdd = true" class="btn-primary px-4 py-2 text-sm">
          AÑADIR MI PRIMER CLIENTE
        </button>
      </EmptyState>

      <div v-else class="divide-y divide-white/5">
        <div v-for="c in filtered" :key="c.id"
          class="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors">
          <RouterLink :to="`/trainer/clients/${c.id}`" class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple to-purple-light
                        flex items-center justify-center text-white font-oswald font-bold shrink-0">
              {{ c.full_name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium truncate">{{ c.full_name }}</p>
              <p class="text-white/40 text-xs truncate">{{ c.email }}</p>
            </div>
          </RouterLink>
          <div class="flex gap-1 sm:gap-2 shrink-0">
            <RouterLink :to="`/trainer/clients/${c.id}`"
              class="text-gold/70 hover:text-gold text-sm px-3 py-1.5 hover:bg-gold/5 rounded-lg transition-colors">
              Ver
            </RouterLink>
            <button @click="openNotes(c)"
              class="text-white/40 hover:text-white text-sm px-3 py-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
              title="Notas privadas">
              📝
            </button>
            <button @click="remove(c)"
              class="text-danger/60 hover:text-danger text-sm px-3 py-1.5 hover:bg-danger/10 rounded-lg transition-colors">
              Desvincular
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes sheet -->
    <NotesSheet v-model="showNotes" :client-id="notesClient?.id" :client-name="notesClient?.full_name ?? ''" />

    <!-- Modal añadir -->
    <Modal v-model="showAdd" title="Añadir cliente" subtitle="Necesitas el ID de cuenta del cliente" size="sm">
      <div class="space-y-4">
        <div class="bg-info/10 border border-info/30 rounded-xl p-3 text-sm">
          <p class="text-info font-semibold mb-1">💡 ¿De dónde sale el ID?</p>
          <p class="text-white/60 text-xs leading-relaxed">
            El cliente lo encuentra en su panel: <strong>Ajustes → Mi ID de cliente</strong>.
            Que te lo pase por mensaje, WhatsApp, etc.
          </p>
        </div>
        <div>
          <label class="block text-white/60 text-sm mb-1.5">ID del cliente</label>
          <input v-model="newId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            class="input font-mono text-sm" />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <button @click="showAdd = false" class="flex-1 btn-ghost py-2.5 border border-white/10">
            Cancelar
          </button>
          <button @click="addClient" :disabled="!newId.trim() || adding"
            class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
            <Spinner v-if="adding" />
            {{ adding ? '...' : 'AÑADIR' }}
          </button>
        </div>
      </template>
    </Modal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../../components/common/AppLayout.vue'
import Modal from '../../components/common/Modal.vue'
import NotesSheet from '../../components/common/NotesSheet.vue'
import Skeleton from '../../components/common/Skeleton.vue'
import Spinner from '../../components/common/Spinner.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import api from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()

const loading     = ref(true)
const adding      = ref(false)
const clients     = ref([])
const q           = ref('')
const showAdd     = ref(false)
const newId       = ref('')
const showNotes   = ref(false)
const notesClient = ref(null)

const filtered = computed(() => {
  const term = q.value.toLowerCase()
  return clients.value.filter(c =>
    c.full_name.toLowerCase().includes(term) ||
    (c.email ?? '').toLowerCase().includes(term)
  )
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/users/clients')
    clients.value = data
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function addClient() {
  adding.value = true
  try {
    await api.post(`/users/clients/${newId.value.trim()}`)
    toast.success('Cliente añadido')
    showAdd.value = false
    newId.value = ''
    await load()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'No se pudo añadir')
  } finally {
    adding.value = false
  }
}

function openNotes(c) {
  notesClient.value = c
  showNotes.value = true
}

async function remove(c) {
  if (!confirm(`¿Desvincular a ${c.full_name}?`)) return
  try {
    await api.delete(`/users/clients/${c.id}`)
    toast.success(`${c.full_name} desvinculado`)
    await load()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error')
  }
}
</script>
