<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
    :title="title" :subtitle="subtitle" size="lg">
    <form @submit.prevent="save" class="space-y-4">
      <div v-if="showClientPicker" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="stat-label block mb-1.5">Cliente</label>
          <select v-model="form.client_id" required class="input">
            <option value="">— Selecciona cliente —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.full_name }}</option>
          </select>
        </div>
        <div>
          <label class="stat-label block mb-1.5">Fecha</label>
          <input v-model="form.scheduled_date" type="date" class="input" />
        </div>
      </div>
      <div v-else>
        <label class="stat-label block mb-1.5">Fecha (opcional)</label>
        <input v-model="form.scheduled_date" type="date" class="input max-w-xs" />
      </div>

      <div>
        <label class="stat-label block mb-1.5">Nombre</label>
        <input v-model="form.name" type="text" required
          placeholder="Día 1 — Pecho/Tríceps" class="input" />
      </div>

      <div>
        <label class="stat-label block mb-1.5">Descripción</label>
        <textarea v-model="form.description" rows="2" class="input resize-none"
          placeholder="Notas (opcional)"></textarea>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="stat-label">Ejercicios · {{ form.exercises.length }}</label>
          <button type="button" @click="addExercise"
            class="text-gold text-sm hover:underline" :disabled="!exerciseCatalog.length">
            + Añadir
          </button>
        </div>

        <p v-if="!exerciseCatalog.length"
          class="text-warning text-xs bg-warning/10 border border-warning/20 rounded-lg p-3">
          No hay ejercicios disponibles. Crea alguno primero.
        </p>

        <div v-else-if="!form.exercises.length"
          class="text-white/35 text-sm text-center py-8 border border-dashed border-white/[0.08] rounded-xl">
          Pulsa "+ Añadir" para incluir ejercicios.
        </div>

        <div v-else class="space-y-2">
          <div v-for="(ex, i) in form.exercises" :key="i"
            class="card-flat p-3 space-y-2 animate-fade-up">
            <div class="flex gap-2 items-center">
              <span class="num-heading text-white/30 w-6 text-center text-sm shrink-0">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <select v-model="ex.exercise_id" required class="input input-sm flex-1">
                <option value="">— Ejercicio —</option>
                <option v-for="e in exerciseCatalog" :key="e.id" :value="e.id">
                  {{ e.name }}{{ e.muscle_group ? ` · ${e.muscle_group}` : '' }}
                </option>
              </select>
              <button type="button" @click="form.exercises.splice(i, 1)"
                class="text-danger/60 hover:text-danger text-xl px-2 shrink-0">×</button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="stat-label block mb-1 text-[9px]">Series</label>
                <input v-model.number="ex.sets" type="number" min="1" class="input input-sm tnum" />
              </div>
              <div>
                <label class="stat-label block mb-1 text-[9px]">Reps</label>
                <input v-model.number="ex.reps" type="number" min="1" class="input input-sm tnum" />
              </div>
              <div>
                <label class="stat-label block mb-1 text-[9px]">Descanso (s)</label>
                <input v-model.number="ex.rest_secs" type="number" min="0" class="input input-sm tnum" />
              </div>
            </div>
            <input v-model="ex.notes" type="text" placeholder="Notas (opcional)" class="input input-sm" />
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3">
        <button @click="$emit('update:modelValue', false)" class="flex-1 btn-secondary py-2.5">
          Cancelar
        </button>
        <button @click="save" :disabled="saving"
          class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
          <Spinner v-if="saving" />
          {{ saving ? '...' : 'CREAR RUTINA' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import Spinner from './Spinner.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String, default: 'Nueva rutina' },
  subtitle:   { type: String, default: '' },
  showClientPicker: { type: Boolean, default: false },
  clients:    { type: Array, default: () => [] },
  exerciseCatalog: { type: Array, default: () => [] },
  saving:     { type: Boolean, default: false },
  initialClientId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref(blankForm())

function blankForm() {
  return {
    client_id: props.initialClientId || '',
    name: '',
    description: '',
    scheduled_date: '',
    exercises: []
  }
}

watch(() => props.modelValue, v => {
  if (v) form.value = blankForm()
})

function addExercise() {
  form.value.exercises.push({ exercise_id: '', sets: 3, reps: 10, rest_secs: 60, notes: '' })
}

function save() {
  emit('save', {
    client_id: form.value.client_id || undefined,
    name: form.value.name,
    description: form.value.description || null,
    scheduled_date: form.value.scheduled_date || null,
    exercises: form.value.exercises.filter(e => e.exercise_id)
  })
}
</script>
