/**
 * useCountUp — anima un número desde 0 hasta `target` usando rAF.
 * Retorna un ref con el valor actual animado.
 *
 * Uso:
 *   const displayed = useCountUp(() => props.value, { duration: 800 })
 */
import { ref, watch, isRef } from 'vue'

export function useCountUp(getTarget, { duration = 700, decimals = 0 } = {}) {
  const displayed = ref(0)
  let rafId = null
  let startTime = null
  let startVal = 0
  let endVal = 0

  function animate(ts) {
    if (!startTime) startTime = ts
    const elapsed = ts - startTime
    const progress = Math.min(elapsed / duration, 1)
    // Easing: ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    displayed.value = Number((startVal + (endVal - startVal) * eased).toFixed(decimals))
    if (progress < 1) {
      rafId = requestAnimationFrame(animate)
    } else {
      displayed.value = endVal
    }
  }

  function run(target) {
    const num = Number(target)
    if (isNaN(num)) { displayed.value = 0; return }
    if (rafId) cancelAnimationFrame(rafId)
    startTime = null
    startVal = displayed.value
    endVal = num
    rafId = requestAnimationFrame(animate)
  }

  // Support both a ref and a getter function
  if (isRef(getTarget)) {
    watch(getTarget, val => run(val), { immediate: true })
  } else {
    watch(getTarget, val => run(val), { immediate: true })
  }

  return displayed
}
