<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="close">
        <div :class="[
          'bg-deep rounded-2xl border border-white/10 shadow-card-hover w-full',
          'max-h-[90vh] overflow-y-auto animate-scale-in',
          sizeClass
        ]">
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-deep z-10">
            <div>
              <slot name="header">
                <h3 class="font-oswald text-xl text-white font-semibold">{{ title }}</h3>
                <p v-if="subtitle" class="text-white/40 text-sm mt-0.5">{{ subtitle }}</p>
              </slot>
            </div>
            <button @click="close"
              class="text-white/40 hover:text-white hover:bg-white/5 w-8 h-8 rounded-lg
                     flex items-center justify-center transition-colors">×</button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-white/5 bg-dark/30 sticky bottom-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String,  default: '' },
  subtitle:   { type: String,  default: '' },
  size:       { type: String,  default: 'md' } // sm | md | lg | xl
})

const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}[props.size] ?? 'max-w-md'))

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; }
</style>
