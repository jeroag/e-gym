<template>
  <AuthLayout>
    <h2 class="font-oswald text-3xl text-white font-bold mb-1">Recuperar contraseña</h2>
    <p class="text-white/50 text-sm mb-8">
      Introduce tu email y te enviaremos un enlace para restablecerla.
    </p>

    <form v-if="!sent" @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-white/60 text-sm mb-1.5">Email</label>
        <input v-model="email" type="email" required placeholder="tu@email.com" class="input" />
      </div>

      <Transition name="fade">
        <p v-if="error" class="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-3">
          {{ error }}
        </p>
      </Transition>

      <button type="submit" :disabled="loading"
        class="btn-primary w-full py-3 text-lg tracking-wide flex items-center justify-center gap-2">
        <Spinner v-if="loading" />
        {{ loading ? 'ENVIANDO...' : 'ENVIAR ENLACE' }}
      </button>
    </form>

    <div v-else class="animate-fade-up">
      <div class="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
        <div class="w-14 h-14 mx-auto rounded-full bg-success/20 border border-success/40
                    flex items-center justify-center text-success text-2xl mb-3">
          ✓
        </div>
        <p class="text-success font-oswald text-lg font-semibold">Solicitud enviada</p>
        <p class="text-white/60 text-sm mt-2">
          Si el email existe en nuestro sistema recibirás un enlace en breve.
        </p>
      </div>
    </div>

    <p class="text-white/50 text-sm text-center mt-8">
      <RouterLink to="/login" class="text-gold hover:underline">← Volver al login</RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthLayout from '../../components/common/AuthLayout.vue'
import Spinner from '../../components/common/Spinner.vue'
import api from '../../api/axios.js'

const email   = ref('')
const error   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function submit() {
  loading.value = true
  error.value   = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (e) {
    error.value = e.response?.data?.error ?? 'Error al enviar la solicitud'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
