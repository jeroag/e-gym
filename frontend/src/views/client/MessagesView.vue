<template>
  <AppLayout v-if="!auth.user?.trainer_id">
    <h1 class="font-oswald text-3xl text-white font-bold mb-6">Mensajes</h1>
    <div class="bg-deep rounded-2xl p-12 text-center border border-white/5">
      <p class="text-white/50 mb-2">Todavía no tienes un entrenador asignado.</p>
      <p class="text-white/30 text-sm mb-6">
        Comparte tu ID con tu entrenador para que te vincule a su lista.
      </p>
      <RouterLink to="/client/settings" class="text-gold hover:underline">
        Ver mi ID en Ajustes →
      </RouterLink>
    </div>
  </AppLayout>

  <SharedMessages
    v-else
    :other-user-id="auth.user.trainer_id"
    :title="'Mi entrenador'"
  />
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppLayout from '../../components/common/AppLayout.vue'
import SharedMessages from '../shared/MessagesView.vue'
import { useAuthStore } from '../../stores/auth.js'

const auth = useAuthStore()
</script>
