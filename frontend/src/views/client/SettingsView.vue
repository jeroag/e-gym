<template>
  <AppLayout>
    <h1 class="font-oswald text-3xl text-white font-bold mb-6">Ajustes</h1>

    <div class="space-y-6 max-w-2xl">
      <!-- Perfil -->
      <section class="bg-deep rounded-2xl p-6 border border-white/5">
        <h2 class="font-oswald text-xl text-white font-semibold mb-4">Mi perfil</h2>
        <div class="space-y-3">
          <div class="flex items-center gap-4 pb-3 border-b border-white/5">
            <div class="w-14 h-14 rounded-full bg-purple flex items-center justify-center
                        text-2xl text-white font-oswald font-bold">
              {{ initial }}
            </div>
            <div>
              <p class="text-white text-lg font-medium">{{ auth.user?.full_name }}</p>
              <p class="text-white/40 text-sm">{{ auth.user?.email }}</p>
            </div>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/40">Rol</span>
            <span class="text-white capitalize">Cliente</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/40">Estado</span>
            <span v-if="auth.user?.trainer_id" class="text-emerald-400">
              ✓ Vinculado a un entrenador
            </span>
            <span v-else class="text-amber-400">
              ⚠ Sin entrenador asignado
            </span>
          </div>
        </div>
      </section>

      <!-- ID -->
      <section class="bg-deep rounded-2xl p-6 border border-white/5">
        <h2 class="font-oswald text-xl text-white font-semibold mb-2">Mi ID de cliente</h2>
        <p class="text-white/50 text-sm mb-4">
          <span v-if="!auth.user?.trainer_id">
            Comparte este código con tu entrenador para que te añada a su lista de clientes.
          </span>
          <span v-else>
            Ya estás vinculado a tu entrenador, pero puedes seguir compartiendo este ID si lo necesitas.
          </span>
        </p>

        <div class="flex items-center gap-2 bg-dark border border-white/10 rounded-xl p-3 mb-3">
          <code class="flex-1 text-gold font-mono text-sm select-all break-all">
            {{ auth.user?.id }}
          </code>
          <button @click="copy"
            class="bg-gold hover:bg-gold/90 text-dark font-oswald font-bold text-sm
                   px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            {{ copied ? '✓ COPIADO' : 'COPIAR' }}
          </button>
        </div>

        <details class="text-white/40 text-xs">
          <summary class="cursor-pointer hover:text-white/60">¿Cómo lo uso?</summary>
          <ol class="list-decimal pl-5 mt-2 space-y-1">
            <li>Copia tu ID con el botón de arriba.</li>
            <li>Pégaselo a tu entrenador por mensaje, email, WhatsApp…</li>
            <li>Tu entrenador lo introducirá en su panel de Clientes → Añadir.</li>
            <li>A partir de ese momento podrá enviarte rutinas y ver tu progreso.</li>
          </ol>
        </details>
      </section>

      <!-- Notificaciones -->
      <section class="bg-deep rounded-2xl p-6 border border-white/5">
        <h2 class="font-oswald text-xl text-white font-semibold mb-1">Notificaciones</h2>
        <p class="text-white/40 text-sm mb-4">Activa para recibir avisos cuando acabe el descanso y recordatorios de entrenamiento.</p>

        <!-- Permiso -->
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <p class="text-white text-sm font-medium">Permiso de notificaciones</p>
            <p class="text-white/40 text-xs mt-0.5">
              {{ notifPermission === 'granted' ? '✓ Concedido' : notifPermission === 'denied' ? '✗ Bloqueado en el navegador' : 'Sin configurar' }}
            </p>
          </div>
          <button v-if="notifPermission !== 'granted' && notifPermission !== 'denied'"
            @click="requestNotifPermission"
            class="btn-primary text-xs px-3 py-1.5">
            Activar
          </button>
          <span v-else-if="notifPermission === 'granted'"
            class="text-success text-xs font-semibold">✓ Activo</span>
          <span v-else class="text-danger/60 text-xs">Bloqueado</span>
        </div>

        <!-- Recordatorio diario -->
        <div v-if="notifPermission === 'granted'" class="flex items-center justify-between gap-3">
          <div>
            <p class="text-white text-sm font-medium">Recordatorio diario</p>
            <p class="text-white/40 text-xs mt-0.5">Aviso a una hora fija para no saltarte el entreno</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <input type="time" v-model="reminderTime"
              class="input text-sm py-1.5 px-2 w-24 text-center tnum"
              style="font-size:15px;" />
            <button @click="saveReminder"
              class="btn-primary text-xs px-3 py-1.5">Guardar</button>
            <button v-if="currentReminder" @click="clearReminder"
              class="text-danger/50 hover:text-danger text-xs transition-colors">✕</button>
          </div>
        </div>
        <p v-if="currentReminder && notifPermission === 'granted'" class="text-white/30 text-xs mt-2">
          Recordatorio activo a las {{ currentReminder }}
        </p>
      </section>

      <!-- Cuenta -->
      <section class="bg-deep rounded-2xl p-6 border border-white/5">
        <h2 class="font-oswald text-xl text-white font-semibold mb-4">Cuenta</h2>
        <button @click="auth.logout()"
          class="text-red-400/80 hover:text-red-400 text-sm">
          ← Cerrar sesión
        </button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../../components/common/AppLayout.vue'
import { useAuthStore } from '../../stores/auth.js'
import { useToast } from '../../composables/useToast.js'
import { useNotifications } from '../../composables/useNotifications.js'

const auth   = useAuthStore()
const toast  = useToast()
const copied = ref(false)
const notif  = useNotifications()
const notifPermission = notif.permission
const reminderTime  = ref('')
const currentReminder = ref(null)

onMounted(() => {
  currentReminder.value = notif.getReminderTime()
  reminderTime.value    = currentReminder.value ?? ''
  // Check daily reminder
  notif.checkDailyReminder()
})

async function requestNotifPermission() {
  const granted = await notif.requestPermission()
  if (granted) toast.success('Notificaciones activadas')
  else toast.error('Permiso denegado')
}

function saveReminder() {
  if (!reminderTime.value) return
  notif.setReminderTime(reminderTime.value)
  currentReminder.value = reminderTime.value
  toast.success(`Recordatorio guardado para las ${reminderTime.value}`)
}

function clearReminder() {
  notif.setReminderTime(null)
  currentReminder.value = null
  reminderTime.value = ''
  toast.info('Recordatorio desactivado')
}

const initial = computed(() =>
  auth.user?.full_name?.charAt(0).toUpperCase() ?? '?'
)

async function copy() {
  try {
    await navigator.clipboard.writeText(auth.user?.id ?? '')
    copied.value = true
    toast.success('ID copiado al portapapeles')
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = auth.user?.id ?? ''
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    toast.success('ID copiado al portapapeles')
    setTimeout(() => (copied.value = false), 2000)
  }
}
</script>
