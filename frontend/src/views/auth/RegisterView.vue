<template>
  <AuthLayout>
    <h2 class="font-oswald text-3xl text-white font-bold mb-1">Crear cuenta</h2>
    <p class="text-white/50 text-sm mb-8">Empieza a entrenar de forma inteligente.</p>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-white/60 text-sm mb-1.5">Nombre completo</label>
        <input v-model="form.full_name" type="text" required placeholder="Tu nombre" class="input" />
      </div>

      <div>
        <label class="block text-white/60 text-sm mb-1.5">Email</label>
        <input v-model="form.email" type="email" required placeholder="tu@email.com" class="input" />
      </div>

      <div>
        <label class="block text-white/60 text-sm mb-1.5">Contraseña</label>
        <input v-model="form.password" type="password" required minlength="8"
          placeholder="Mínimo 8 caracteres" class="input" />
      </div>

      <div>
        <label class="block text-white/60 text-sm mb-2">Tipo de cuenta</label>
        <div class="grid grid-cols-2 gap-2">
          <RoleButton :active="form.role === 'client'" icon="🏋️" label="Cliente"
            @click="form.role = 'client'" />
          <RoleButton :active="form.role === 'trainer'" icon="📋" label="Entrenador"
            @click="form.role = 'trainer'" />
        </div>
      </div>

      <Transition name="slide-fade">
        <div v-if="form.role === 'trainer'">
          <label class="block text-white/60 text-sm mb-1.5">Código de licencia</label>
          <input v-model="form.license_code" type="text" required
            placeholder="Código facilitado por E-GYM" class="input" />
          <p class="text-white/40 text-xs mt-1.5 flex items-start gap-1">
            <span>🔒</span>
            <span>Solo entrenadores con licencia pueden registrarse como Entrenador.</span>
          </p>
        </div>
      </Transition>

      <Transition name="fade">
        <p v-if="error" class="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-3">
          {{ error }}
        </p>
      </Transition>

      <button type="submit" :disabled="loading"
        class="btn-primary w-full py-3 text-lg tracking-wide flex items-center justify-center gap-2">
        <Spinner v-if="loading" />
        {{ loading ? 'CREANDO...' : 'CREAR CUENTA' }}
      </button>
    </form>

    <p class="text-white/50 text-sm text-center mt-8">
      ¿Ya tienes cuenta?
      <RouterLink to="/login" class="text-gold hover:underline font-semibold">Inicia sesión</RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref, h } from 'vue'
import { RouterLink } from 'vue-router'
import AuthLayout from '../../components/common/AuthLayout.vue'
import Spinner from '../../components/common/Spinner.vue'
import { useAuthStore } from '../../stores/auth.js'
import { useToast } from '../../composables/useToast.js'

const RoleButton = {
  props: ['active', 'icon', 'label'],
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', {
      type: 'button',
      onClick: () => emit('click'),
      class: [
        'py-3.5 rounded-xl font-oswald font-semibold tracking-wide border-2 transition-all duration-200',
        'flex flex-col items-center justify-center gap-1',
        props.active
          ? 'bg-gold/15 text-gold border-gold shadow-gold'
          : 'bg-dark text-white/60 border-white/10 hover:border-white/30 hover:text-white'
      ]
    }, [
      h('span', { class: 'text-2xl' }, props.icon),
      h('span', { class: 'text-sm' }, props.label)
    ])
  }
}

const auth    = useAuthStore()
const toast   = useToast()
const error   = ref('')
const loading = ref(false)
const form    = ref({
  full_name: '',
  email: '',
  password: '',
  role: 'client',
  license_code: ''
})

async function submit() {
  loading.value = true
  error.value   = ''
  try {
    const payload = {
      full_name: form.value.full_name,
      email:     form.value.email,
      password:  form.value.password,
      role:      form.value.role
    }
    if (form.value.role === 'trainer') payload.license_code = form.value.license_code
    await auth.register(payload)
    toast.success('¡Cuenta creada con éxito!')
  } catch (e) {
    error.value = e.response?.data?.error ?? 'Error al crear la cuenta'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.slide-fade-enter-to, .slide-fade-leave-from {
  max-height: 200px;
}
</style>
