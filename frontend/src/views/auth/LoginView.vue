<template>
  <AuthLayout>
    <h2 class="font-oswald text-3xl text-white font-bold mb-1">Bienvenido de nuevo</h2>
    <p class="text-white/50 text-sm mb-8">Inicia sesión para continuar entrenando.</p>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-white/60 text-sm mb-1.5">Email</label>
        <input v-model="form.email" type="email" required placeholder="tu@email.com" class="input" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-white/60 text-sm">Contraseña</label>
          <RouterLink to="/forgot-password" class="text-gold/70 hover:text-gold text-xs">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
        <input v-model="form.password" type="password" required placeholder="••••••••" class="input" />
      </div>

      <Transition name="fade">
        <p v-if="error" class="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-3">
          {{ error }}
        </p>
      </Transition>

      <button type="submit" :disabled="loading"
        class="btn-primary w-full py-3 text-lg tracking-wide flex items-center justify-center gap-2">
        <Spinner v-if="loading" />
        {{ loading ? 'ENTRANDO...' : 'ENTRAR' }}
      </button>
    </form>

    <p class="text-white/50 text-sm text-center mt-8">
      ¿No tienes cuenta?
      <RouterLink to="/register" class="text-gold hover:underline font-semibold">Crea una</RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthLayout from '../../components/common/AuthLayout.vue'
import Spinner from '../../components/common/Spinner.vue'
import { useAuthStore } from '../../stores/auth.js'
import { useToast } from '../../composables/useToast.js'

const auth    = useAuthStore()
const toast   = useToast()
const error   = ref('')
const loading = ref(false)
const form    = ref({ email: '', password: '' })

async function submit() {
  loading.value = true
  error.value   = ''
  try {
    await auth.login(form.value.email, form.value.password)
    toast.success('¡Bienvenido de vuelta!')
  } catch (e) {
    error.value = e.response?.data?.error ?? 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
