<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">

        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />

        <div class="relative flex flex-col rounded-t-2xl overflow-hidden"
          style="background: #1A171F; max-height: 88vh; padding-bottom: env(safe-area-inset-bottom, 0px);">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
            <div class="min-w-0">
              <h3 class="font-oswald text-lg font-semibold text-white truncate">{{ name }}</h3>
              <p v-if="muscleGroup" class="text-white/40 text-xs capitalize mt-0.5">{{ muscleGroup }}</p>
            </div>
            <button @click="close"
              class="w-8 h-8 rounded-lg flex items-center justify-center ml-3 shrink-0
                     text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Video -->
          <div class="flex-1 overflow-y-auto">
            <!-- Embed (YouTube / Vimeo) -->
            <div v-if="embedUrl" class="relative w-full" style="padding-bottom: 56.25%;">
              <iframe
                :src="embedUrl"
                class="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                frameborder="0" />
            </div>

            <!-- Enlace externo si no es embeddable -->
            <div v-else class="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08]
                          flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)"
                  stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <p class="text-white/50 text-sm">Este vídeo no se puede reproducir aquí</p>
              <a :href="url" target="_blank" rel="noopener"
                class="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Abrir vídeo
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  url:         { type: String,  default: '' },
  name:        { type: String,  default: '' },
  muscleGroup: { type: String,  default: '' }
})

const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

const embedUrl = computed(() => {
  const u = props.url
  if (!u) return null

  // YouTube long: https://www.youtube.com/watch?v=VIDEO_ID
  const ytLong = u.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/)
  if (ytLong) return `https://www.youtube.com/embed/${ytLong[1]}?autoplay=1`

  // YouTube short: https://youtu.be/VIDEO_ID
  const ytShort = u.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=1`

  // YouTube embed already
  if (u.includes('youtube.com/embed/')) return u

  // Vimeo: https://vimeo.com/VIDEO_ID
  const vimeo = u.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`

  return null  // not embeddable
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
