/**
 * useNotifications — Notification API wrapper.
 *
 * - notify(title, opts): muestra una notificación si hay permiso
 * - requestPermission(): pide permiso al usuario
 * - scheduleReminder(hourMin): guarda 'HH:MM' en localStorage y el SW lo usa
 *   cuando la app está en segundo plano via periodic check
 */
import { ref } from 'vue'

const REMINDER_KEY = 'egym_daily_reminder'

const permission = ref(
  typeof Notification !== 'undefined' ? Notification.permission : 'default'
)

export function useNotifications() {
  const isSupported = typeof Notification !== 'undefined'

  async function requestPermission() {
    if (!isSupported) return false
    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  function notify(title, options = {}) {
    if (!isSupported || Notification.permission !== 'granted') return
    // Use SW notification if available (works when tab is in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          ...options
        })
      })
    } else {
      new Notification(title, { icon: '/icon-192.png', ...options })
    }
  }

  function getReminderTime() {
    return localStorage.getItem(REMINDER_KEY) ?? null
  }

  function setReminderTime(timeStr) {
    // timeStr: 'HH:MM' or null to disable
    if (timeStr) {
      localStorage.setItem(REMINDER_KEY, timeStr)
    } else {
      localStorage.removeItem(REMINDER_KEY)
    }
  }

  // Check if it's time to show the daily reminder (call this on app load)
  function checkDailyReminder() {
    const time = getReminderTime()
    if (!time || Notification.permission !== 'granted') return

    const lastShown = localStorage.getItem('egym_reminder_last_shown') ?? ''
    const today = new Date().toLocaleDateString('en-CA')
    if (lastShown === today) return  // already shown today

    const [targetH, targetM] = time.split(':').map(Number)
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const targetMinutes = targetH * 60 + targetM

    // Show if we're within a 5-minute window after the scheduled time
    if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 5) {
      notify('🏋️ ¡Hora de entrenar!', {
        body: 'No olvides tu sesión de hoy. Tu entrenador cuenta contigo.',
        tag: 'daily-reminder'
      })
      localStorage.setItem('egym_reminder_last_shown', today)
    }
  }

  return {
    isSupported,
    permission,
    requestPermission,
    notify,
    getReminderTime,
    setReminderTime,
    checkDailyReminder
  }
}
