// ===== Vigilancia del guardado automático =====
// El guardado en el navegador puede fallar: se llena el espacio (lo más común,
// por las fotos de locaciones), se navega en incógnito, o el navegador borra los
// datos del sitio. Antes fallaba en silencio mientras la pantalla seguía diciendo
// "guardado automático activo", así que se podía perder trabajo sin enterarse.
// Esto envuelve el almacenamiento para saber si de verdad se guardó.
import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'

type Estado = 'inicial' | 'guardado' | 'error'

interface Vigilancia {
  estado: Estado
  ultimo: number | null // cuándo se guardó bien por última vez
  motivo: string // qué pasó, en palabras para la usuaria
}

export const useGuardado = create<Vigilancia>(() => ({
  estado: 'inicial',
  ultimo: null,
  motivo: '',
}))

// Se queda sin espacio: es el error que de verdad va a ver, y tiene remedio concreto
const sinEspacio = (e: unknown) =>
  e instanceof DOMException &&
  (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)

function explicar(e: unknown): string {
  if (sinEspacio(e))
    return 'Tu navegador se quedó sin espacio. Descarga un respaldo AHORA y luego borra fotos de locaciones que ya no necesites.'
  return 'Tu navegador no está dejando guardar. Puede ser una ventana de incógnito o los datos del sitio están bloqueados. Descarga un respaldo para no perder tu trabajo.'
}

export const almacenamientoVigilado: StateStorage = {
  getItem: nombre => {
    try {
      return localStorage.getItem(nombre)
    } catch {
      return null
    }
  },
  setItem: (nombre, valor) => {
    try {
      localStorage.setItem(nombre, valor)
      useGuardado.setState({ estado: 'guardado', ultimo: Date.now(), motivo: '' })
    } catch (e) {
      useGuardado.setState({ estado: 'error', motivo: explicar(e) })
    }
  },
  removeItem: nombre => {
    try {
      localStorage.removeItem(nombre)
    } catch {
      /* si no se puede borrar no hay nada que avisar */
    }
  },
}

// "hace un momento" / "hace 3 min" — el respaldo cuenta en días, esto en segundos
export function haceCuantoCorto(ms: number | null): string {
  if (!ms) return ''
  const seg = Math.round((Date.now() - ms) / 1000)
  if (seg < 5) return 'hace un momento'
  if (seg < 60) return `hace ${seg} s`
  const min = Math.round(seg / 60)
  if (min < 60) return `hace ${min} min`
  return `hace ${Math.round(min / 60)} h`
}
