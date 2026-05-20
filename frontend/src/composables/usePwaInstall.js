import { ref } from 'vue'

const _prompt  = ref(null)   // the deferred beforeinstallprompt event
const _shown   = ref(false)  // user has dismissed the banner this session
const _installed = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    _prompt.value = e
  })
  window.addEventListener('appinstalled', () => {
    _installed.value = true
    _prompt.value    = null
  })
}

export function usePwaInstall() {
  function dismiss() {
    _shown.value = true
  }

  async function install() {
    if (!_prompt.value) return
    _prompt.value.prompt()
    const { outcome } = await _prompt.value.userChoice
    if (outcome === 'accepted') {
      _installed.value = true
    }
    _prompt.value = null
  }

  return {
    canInstall: _prompt,   // non-null when installable
    installed:  _installed,
    dismissed:  _shown,
    install,
    dismiss
  }
}
