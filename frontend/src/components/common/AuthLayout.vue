<template>
  <div class="min-h-screen bg-dark flex">
    <!-- Panel branding (oculto en móvil) -->
    <aside class="hidden lg:flex w-1/2 xl:w-5/12 bg-gradient-purple relative overflow-hidden">
      <!-- Decoración -->
      <div class="absolute inset-0 opacity-30 bg-gradient-radial"></div>
      <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-light/30 blur-3xl"></div>

      <div class="relative z-10 flex flex-col justify-between p-12 w-full">
        <div class="animate-fade-up">
          <h1 class="font-oswald text-6xl xl:text-7xl font-bold text-gold tracking-widest">E-GYM</h1>
          <p class="text-white/60 mt-3 text-lg">Entrenamiento personal, llevado a otro nivel.</p>
        </div>

        <div class="space-y-6 animate-fade-up" style="animation-delay: 100ms">
          <Feature icon="📋" title="Rutinas a tu medida"
            text="Tu entrenador diseña planes específicos para ti y los ajusta según tu progreso." />
          <Feature icon="📈" title="Progreso visible"
            text="Gráficos en tiempo real con tus pesos, repeticiones y evolución corporal." />
          <Feature icon="💬" title="Siempre conectados"
            text="Mensajería integrada con tu entrenador para resolver dudas al momento." />
        </div>

        <p class="text-white/30 text-xs">© 2026 E-GYM · TFG · Jerónimo Ávalos &amp; Joan Tomás</p>
      </div>
    </aside>

    <!-- Panel formulario -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
      <div class="absolute top-4 left-4 lg:hidden">
        <h1 class="font-oswald text-2xl font-bold text-gold tracking-widest">E-GYM</h1>
      </div>

      <div class="w-full max-w-md animate-fade-up">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import Feature from './AuthFeature.vue'
</script>
