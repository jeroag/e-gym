<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">

        <!-- Confetti canvas -->
        <canvas ref="confettiCanvas" class="absolute inset-0 w-full h-full pointer-events-none" style="z-index:1" />

        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <div class="relative rounded-t-2xl overflow-hidden" style="z-index:2"
          style="background: #1A171F; padding-bottom: env(safe-area-inset-bottom, 0px);">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <!-- Icono + resumen -->
          <div class="px-6 pt-4 pb-5 text-center">
            <div class="w-16 h-16 rounded-2xl bg-success/10 border border-success/20
                        flex items-center justify-center mx-auto mb-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#37D6A5"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="font-oswald text-2xl text-white font-bold tracking-wide">
              ¡Entrenamiento finalizado!
            </h3>
            <div class="flex items-center justify-center gap-10 mt-6">
              <div class="text-center">
                <p class="font-oswald text-5xl sm:text-6xl text-gold tnum font-bold leading-none tracking-tight">{{ duration }}</p>
                <p class="text-white/35 text-[10px] uppercase tracking-[0.18em] mt-2">Duración</p>
              </div>
              <div class="w-px h-12 bg-white/[0.08]" />
              <div class="text-center">
                <p class="font-oswald text-5xl sm:text-6xl text-gold tnum font-bold leading-none tracking-tight">{{ sets }}</p>
                <p class="text-white/35 text-[10px] uppercase tracking-[0.18em] mt-2">Series</p>
              </div>
            </div>
          </div>

          <!-- Divisor -->
          <div class="mx-6 h-px bg-white/[0.06]" />

          <!-- Rating -->
          <div class="px-6 pt-5 pb-3">
            <p class="text-white/45 text-sm text-center mb-4 font-medium">¿Cómo te sentiste?</p>
            <div class="flex gap-3">
              <button v-for="opt in ratings" :key="opt.value"
                @click="select(opt.value)"
                :class="[
                  'flex-1 flex flex-col items-center gap-2.5 py-5 rounded-2xl border transition-all duration-150',
                  'active:scale-95',
                  selected === opt.value
                    ? 'bg-gold/10 border-gold/40'
                    : 'bg-white/[0.04] border-white/[0.07] hover:border-white/20'
                ]">
                <span class="text-3xl">{{ opt.emoji }}</span>
                <span class="text-xs font-semibold tracking-wide"
                  :class="selected === opt.value ? 'text-gold' : 'text-white/45'">
                  {{ opt.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- Botón cerrar -->
          <div class="px-6 pt-2 pb-6">
            <button @click="close"
              :class="[
                'w-full py-3.5 rounded-xl font-oswald font-semibold text-sm tracking-wider transition-all',
                selected
                  ? 'btn-primary'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
              ]">
              {{ selected ? 'GUARDAR Y CERRAR' : 'SALTAR' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  duration:   { type: String, default: '00:00' },
  sets:       { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'done'])

const selected = ref(null)
const confettiCanvas = ref(null)

const ratings = [
  { value: 1, emoji: '😫', label: 'Duro' },
  { value: 2, emoji: '😊', label: 'Bien' },
  { value: 3, emoji: '💪', label: 'Brutal' }
]

function select(val) {
  selected.value = val
}

function close() {
  emit('done', selected.value)
  emit('update:modelValue', false)
  selected.value = null
}

// ─── Confetti ───────────────────────────────────────────────────────────────
const COLORS = ['#F5C842', '#37D6A5', '#A855F7', '#F97316', '#3B82F6', '#EC4899', '#ffffff']

function launchConfetti() {
  const canvas = confettiCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight

  const count = 130
  const particles = Array.from({ length: count }, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * -8 - 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 7 + 4,
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 8,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    opacity: 1
  }))

  let rafId = null
  const duration = 2800
  const start = performance.now()

  function draw(now) {
    const elapsed = now - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const p of particles) {
      p.x  += p.vx
      p.y  += p.vy
      p.vy += 0.25          // gravity
      p.vx *= 0.99          // slight drag
      p.rotation += p.spin
      p.opacity = Math.max(0, 1 - (elapsed / duration) * 1.2)

      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    if (elapsed < duration) {
      rafId = requestAnimationFrame(draw)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(draw)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    // Slight delay so the sheet animation finishes first
    setTimeout(launchConfetti, 280)
  }
})
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
