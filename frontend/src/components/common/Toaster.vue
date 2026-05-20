<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none
                max-w-sm w-[calc(100vw-2rem)] sm:w-96">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl
                 shadow-card-hover border backdrop-blur-sm animate-fade-up"
          :class="styles[t.type]">
          <span class="text-lg leading-none shrink-0 mt-0.5">{{ icons[t.type] }}</span>
          <p class="flex-1 text-sm leading-snug">{{ t.message }}</p>
          <button @click="dismiss(t.id)"
            class="text-white/40 hover:text-white text-lg leading-none shrink-0">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast.js'

const { toasts, dismiss } = useToast()

const icons = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ'
}

const styles = {
  success: 'bg-success/15 border-success/40 text-white',
  error:   'bg-danger/15  border-danger/40  text-white',
  warning: 'bg-warning/15 border-warning/40 text-white',
  info:    'bg-info/15    border-info/40    text-white'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.toast-enter-from   { opacity: 0; transform: translateX(20px); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
.toast-move         { transition: transform 0.25s ease; }
</style>
