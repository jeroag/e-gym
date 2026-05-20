<template>
  <Teleport to="body">
    <Transition name="rest-slide">
      <div v-if="rt.isActive.value"
        class="fixed bottom-0 inset-x-0 z-40"
        style="padding-bottom: env(safe-area-inset-bottom, 0px);">

        <div class="mx-3 mb-3 rounded-2xl overflow-hidden"
          style="background: #1A171F; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 -8px 32px rgba(0,0,0,0.4);">

          <div class="flex items-center gap-4 px-5 py-4">

            <!-- ── Circular SVG timer ──────────────────────── -->
            <div class="relative shrink-0 flex items-center justify-center" style="width:64px; height:64px;">
              <svg width="64" height="64" viewBox="0 0 64 64" class="-rotate-90">
                <!-- Track -->
                <circle cx="32" cy="32" r="27"
                  fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4" />
                <!-- Progress arc -->
                <circle cx="32" cy="32" r="27"
                  fill="none"
                  :stroke="rt.remaining.value <= 5 ? '#37D6A5' : '#ECA72C'"
                  stroke-width="4"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="dashOffset"
                  style="transition: stroke-dashoffset 1s linear, stroke 0.4s ease;" />
              </svg>
              <!-- Centered countdown text -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-oswald font-bold tnum leading-none text-lg"
                  :class="rt.remaining.value <= 5 ? 'text-success' : 'text-gold'">
                  {{ rt.formatted.value }}
                </span>
              </div>
            </div>

            <!-- Separador -->
            <div class="w-px h-10 bg-white/[0.06] shrink-0" />

            <!-- Ejercicio / label -->
            <div class="flex-1 min-w-0">
              <p class="text-white/40 text-[10px] uppercase tracking-wider">Siguiente</p>
              <p class="text-white font-semibold text-sm truncate mt-0.5">{{ rt.label.value || 'ejercicio' }}</p>
              <!-- Mini progress bar under label -->
              <div class="mt-2 h-0.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-linear"
                  :style="{
                    width: `${rt.progress.value * 100}%`,
                    background: rt.remaining.value <= 5 ? '#37D6A5' : '#ECA72C'
                  }" />
              </div>
            </div>

            <!-- Botones -->
            <div class="flex flex-col items-center gap-2 shrink-0">
              <button @click="rt.addTime(15)"
                class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white/50
                       bg-white/[0.05] border border-white/[0.07]
                       hover:bg-white/[0.1] hover:text-white transition-all">
                +15s
              </button>
              <button @click="rt.skip()"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold
                       bg-white/[0.06] border border-white/[0.08] text-white/60
                       hover:bg-success/10 hover:border-success/30 hover:text-success
                       transition-all">
                Saltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRestTimer } from '../../composables/useRestTimer.js'

const rt = useRestTimer()

const radius = 27
const circumference = 2 * Math.PI * radius  // ≈ 169.6

const dashOffset = computed(() => {
  const pct = 1 - rt.progress.value  // 1 = full circle remaining, 0 = done
  return circumference * pct
})
</script>

<style scoped>
.rest-slide-enter-active { transition: all 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.rest-slide-leave-active { transition: all 0.22s cubic-bezier(0.32, 0.72, 0, 1); }
.rest-slide-enter-from,
.rest-slide-leave-to { opacity: 0; transform: translateY(100%); }
</style>
