<template>
  <AppLayout>
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-oswald text-3xl sm:text-4xl text-white font-bold">Ejercicios</h1>
        <p class="text-white/40 text-sm mt-1">{{ exercises.length }} disponibles</p>
      </div>
      <button @click="openCreate" class="btn-primary px-5 py-2.5">+ NUEVO</button>
    </div>

    <!-- Buscador + chips -->
    <div class="space-y-3 mb-6">
      <div class="relative max-w-md">
        <input v-model="search" placeholder="Buscar ejercicio..." class="input pl-10" />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔎</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-for="g in muscleGroups" :key="g.id" @click="filter = g.id"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5',
            filter === g.id
              ? 'bg-gold text-dark'
              : 'bg-white/[0.05] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'
          ]">
          <span v-if="g.color" class="w-1.5 h-1.5 rounded-full" :style="{ background: g.color }"></span>
          {{ g.label }}
          <span class="opacity-60 tnum">{{ countByGroup(g.id) }}</span>
        </button>
      </div>
    </div>

    <!-- Lista -->
    <div v-if="loading" class="space-y-2">
      <Skeleton v-for="i in 6" :key="i" height="72px" />
    </div>

    <EmptyState v-else-if="!filtered.length"
      icon="💪"
      :title="search ? 'Sin coincidencias' : 'Sin ejercicios'"
      :description="search ? 'Prueba con otro término o cambia el filtro.' : 'Crea ejercicios o ejecuta el seed con ejercicios globales.'" />

    <div v-else class="card divide-y divide-white/[0.05]">
      <article v-for="ex in filtered" :key="ex.id"
        class="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :style="{ background: groupColor(ex.muscle_group) + '20', color: groupColor(ex.muscle_group) }">
          <span class="text-xl">{{ groupIcon(ex.muscle_group) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-white font-medium truncate">{{ ex.name }}</p>
            <span v-if="ex.is_global"
              class="bg-white/[0.06] text-white/50 text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider shrink-0">
              Global
            </span>
          </div>
          <div class="flex items-center gap-2 mt-0.5 text-xs">
            <MuscleTag :group="ex.muscle_group" />
            <a v-if="ex.video_url" :href="ex.video_url" target="_blank" rel="noopener"
              @click.stop class="text-gold/60 hover:text-gold">· 🎬 video</a>
          </div>
        </div>
        <div v-if="!ex.is_global" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEdit(ex)"
            class="text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/5">Editar</button>
          <button @click="remove(ex)"
            class="text-danger/70 hover:text-danger text-xs px-3 py-1.5 rounded-lg hover:bg-danger/10">Eliminar</button>
        </div>
        <span v-else class="text-white/20 text-xs italic shrink-0">compartido</span>
      </article>
    </div>

    <!-- Modal crear/editar -->
    <Modal v-model="showModal" :title="form.id ? 'Editar ejercicio' : 'Nuevo ejercicio'" size="md">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="stat-label block mb-1.5">Nombre *</label>
          <input v-model="form.name" type="text" required placeholder="Press banca" class="input" />
        </div>
        <div>
          <label class="stat-label block mb-1.5">Grupo muscular</label>
          <select v-model="form.muscle_group" class="input">
            <option :value="null">— Sin grupo —</option>
            <option v-for="g in muscleGroups.filter(g => g.id !== 'all')" :key="g.id" :value="g.id">
              {{ g.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="stat-label block mb-1.5">Descripción</label>
          <textarea v-model="form.description" rows="3" class="input resize-none"
            placeholder="Cómo se hace, postura..."></textarea>
        </div>
        <div>
          <label class="stat-label block mb-1.5">URL del video</label>
          <input v-model="form.video_url" type="url" placeholder="https://youtube.com/..." class="input" />
        </div>
      </form>

      <template #footer>
        <div class="flex gap-3">
          <button @click="showModal = false" class="flex-1 btn-secondary py-2.5">Cancelar</button>
          <button @click="save" :disabled="saving"
            class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
            <Spinner v-if="saving" />
            {{ saving ? '...' : 'GUARDAR' }}
          </button>
        </div>
      </template>
    </Modal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/common/AppLayout.vue'
import Modal from '../../components/common/Modal.vue'
import Skeleton from '../../components/common/Skeleton.vue'
import Spinner from '../../components/common/Spinner.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import MuscleTag from '../../components/common/MuscleTag.vue'
import api from '../../api/axios.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()

const muscleGroups = [
  { id: 'all',       label: 'Todos',     color: null },
  { id: 'chest',     label: 'Pecho',     color: '#FF7A59' },
  { id: 'back',      label: 'Espalda',   color: '#5BA0F2' },
  { id: 'legs',      label: 'Pierna',    color: '#37D6A5' },
  { id: 'shoulders', label: 'Hombros',   color: '#F4C46A' },
  { id: 'arms',      label: 'Brazos',    color: '#FFB547' },
  { id: 'core',      label: 'Core',      color: '#FF6B6B' },
  { id: 'cardio',    label: 'Cardio',    color: '#A78BFA' }
]
const groupIcons = {
  chest: '💪', back: '🔱', legs: '🦵', shoulders: '🎯',
  arms: '💥', core: '🧘', cardio: '🏃'
}

function groupColor(id) {
  return muscleGroups.find(g => g.id === id)?.color ?? '#6B7280'
}
function groupIcon(id) {
  return groupIcons[id] ?? '🏋️'
}

const loading   = ref(true)
const saving    = ref(false)
const showModal = ref(false)
const exercises = ref([])
const filter    = ref('all')
const search    = ref('')
const form      = ref({ id: null, name: '', description: '', muscle_group: null, video_url: '' })

const filtered = computed(() => {
  let list = exercises.value
  if (filter.value !== 'all') list = list.filter(e => e.muscle_group === filter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }
  return list
})

function countByGroup(id) {
  return id === 'all' ? exercises.value.length : exercises.value.filter(e => e.muscle_group === id).length
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/exercises')
    exercises.value = data
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  form.value = { id: null, name: '', description: '', muscle_group: null, video_url: '' }
  showModal.value = true
}

function openEdit(ex) {
  form.value = { ...ex }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || null,
      muscle_group: form.value.muscle_group || null,
      video_url: form.value.video_url || null
    }
    if (form.value.id) {
      await api.patch(`/exercises/${form.value.id}`, payload)
      toast.success('Ejercicio actualizado')
    } else {
      await api.post('/exercises', payload)
      toast.success('Ejercicio creado')
    }
    showModal.value = false
    await load()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function remove(ex) {
  if (!confirm(`¿Eliminar "${ex.name}"?`)) return
  try {
    await api.delete(`/exercises/${ex.id}`)
    toast.success('Eliminado')
    await load()
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'No se pudo eliminar')
  }
}
</script>
