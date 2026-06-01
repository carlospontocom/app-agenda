import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'sucesso' | 'perigo' | 'aviso' | 'informativo'
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function show(message: string, type: Toast['type'] = 'informativo', duration = 3500) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function sucesso(message: string) { show(message, 'sucesso') }
  function perigo(message: string) { show(message, 'perigo') }
  function aviso(message: string) { show(message, 'aviso') }
  function informativo(message: string) { show(message, 'informativo') }

  return { toasts, show, sucesso, perigo, aviso, informativo }
}
