// ===== Respaldos: descargar el proyecto y recordar cuándo hace falta =====
// Los proyectos viven solo en el navegador; si alguien borra el historial o
// cambia de equipo, lo único que los salva es el archivo de respaldo.
import { useStore } from './store'
import { descargarArchivo } from './utils'
import type { Proyecto } from './types'

const DIA = 86400000
// Cada cuánto conviene respaldar un proyecto que se sigue editando
export const DIAS_ENTRE_RESPALDOS = 7
// Gracia para un proyecto recién creado que aún no se ha respaldado nunca
const DIAS_PRIMER_RESPALDO = 2

// Descarga el .json del proyecto y anota la fecha
export function descargarRespaldo(p: Proyecto) {
  const fecha = new Date().toISOString().slice(0, 10)
  descargarArchivo(`${p.nombre} (respaldo ${fecha}).json`, JSON.stringify(p, null, 2), 'application/json')
  useStore.getState().marcarRespaldo(p.id)
}

// Días completos desde una fecha ISO (null si no hay fecha)
export const diasDesde = (iso?: string) => (iso ? Math.floor((Date.now() - Date.parse(iso)) / DIA) : null)

// ¿Hay que recordarle a la persona que respalde este proyecto?
export function necesitaRespaldo(p: Proyecto, ultimo?: string, pospuestoHasta?: string): boolean {
  if (pospuestoHasta && Date.parse(pospuestoHasta) > Date.now()) return false
  if (!ultimo) return (diasDesde(p.creado) ?? 0) >= DIAS_PRIMER_RESPALDO
  // ya respaldado: solo si cambió algo después y ya pasó una semana
  const cambioDespues = !!p.modificado && p.modificado > ultimo
  return cambioDespues && (diasDesde(ultimo) ?? 0) >= DIAS_ENTRE_RESPALDOS
}

// "hoy", "ayer", "hace 5 días"
export function haceCuanto(iso?: string): string {
  const d = diasDesde(iso)
  if (d === null) return 'nunca'
  if (d <= 0) return 'hoy'
  if (d === 1) return 'ayer'
  return `hace ${d} días`
}
