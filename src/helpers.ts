// ===== Cálculos compartidos entre módulos =====
import type { EstadoActor, Gasto, LineaPresupuesto, Persona, Proyecto, ReporteDia, Solicitud } from './types'

// Días de rodaje ordenados por fecha (los sin fecha, al final)
export const diasOrdenados = (p: Proyecto) =>
  [...p.diasRodaje].sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'))

// Número de jornada ("Día 3") de un día de rodaje
export const numeroDia = (p: Proyecto, id: string) => diasOrdenados(p).findIndex(d => d.id === id) + 1

// Nombre de locación: del catálogo, o el texto libre
export const nombreLocacion = (p: Proyecto, locacionId: string, texto = '') =>
  p.locaciones.find(l => l.id === locacionId)?.nombre || texto

// Escenas que no están en ningún día de rodaje
export const escenasSinAsignar = (p: Proyecto) =>
  p.escenas.filter(e => !p.diasRodaje.some(d => d.escenaIds.includes(e.id)))

// Escenas asignadas a más de un día (¡alerta!)
export const escenasEnVariosDias = (p: Proyecto) =>
  p.escenas.filter(e => p.diasRodaje.filter(d => d.escenaIds.includes(e.id)).length > 1)

// ---- Presupuesto: cantidad × multiplicador × tarifa = subtotal, + IVA 16% ----
export const IVA = 0.16
export const estimadoLinea = (l: LineaPresupuesto) => (l.cantidad || 0) * (l.por ?? 1) * (l.tarifa || 0)
export const ivaLinea = (l: LineaPresupuesto) => (l.iva ? estimadoLinea(l) * IVA : 0)
export const totalLinea = (l: LineaPresupuesto) => estimadoLinea(l) + ivaLinea(l)

export function totalesCategoria(p: Proyecto, categoria: string) {
  const lineas = p.presupuesto.filter(l => l.categoria === categoria)
  const subtotal = lineas.reduce((t, l) => t + estimadoLinea(l), 0)
  const iva = lineas.reduce((t, l) => t + ivaLinea(l), 0)
  return {
    subtotal,
    iva,
    estimado: subtotal + iva, // total con IVA
    real: lineas.reduce((t, l) => t + (l.real || 0), 0),
  }
}

export function totalesProyecto(p: Proyecto) {
  const subtotal = p.presupuesto.reduce((t, l) => t + estimadoLinea(l), 0)
  const iva = p.presupuesto.reduce((t, l) => t + ivaLinea(l), 0)
  return {
    subtotal,
    iva,
    estimado: subtotal + iva,
    real: p.presupuesto.reduce((t, l) => t + (l.real || 0), 0),
  }
}

// Categorías con líneas que no están en la plantilla (proyectos viejos)
export function categoriasExtra(p: Proyecto, plantilla: { categoria: string }[]) {
  const enPlantilla = new Set(plantilla.map(c => c.categoria))
  return [...new Set(p.presupuesto.map(l => l.categoria).filter(c => !enPlantilla.has(c)))]
}

export const subcategoriasDe = (p: Proyecto, categoria: string) => [
  ...new Set(p.presupuesto.filter(l => l.categoria === categoria).map(l => l.subcategoria || 'General')),
]

// ---- Personal de la producción (contado desde el presupuesto) ----
// Las cuentas 1000–1600 son las de personal (dirección, casting, foto, sonido,
// arte, maquillaje…). El resto son equipo, servicios o gastos.
export const esCuentaDePersonal = (categoria: string) => /^1[0-6]00\b/.test(categoria.trim())

// Cuando la línea no tiene el dato capturado, se deduce del formato del machote:
// si la unidad es de tiempo (días/semanas), el multiplicador (×) es la gente;
// si no (proy, único, pieza), la gente es la cantidad.
export function personasSugeridas(l: LineaPresupuesto): number {
  const esTiempo = /^(d[ií]a|semana|mes|hora|jornada)/i.test((l.unidad || '').trim())
  return Math.max(1, Math.round(esTiempo ? (l.por ?? 1) : l.cantidad || 1))
}

// Personas que cubre una línea (0 si no es una cuenta de personal)
export function personasLinea(l: LineaPresupuesto): number {
  if (typeof l.personas === 'number') return Math.max(0, l.personas)
  return esCuentaDePersonal(l.categoria) ? personasSugeridas(l) : 0
}

export const personasCategoria = (p: Proyecto, categoria: string) =>
  p.presupuesto.filter(l => l.categoria === categoria).reduce((t, l) => t + personasLinea(l), 0)

export const personasTotal = (p: Proyecto) =>
  p.presupuesto.reduce((t, l) => t + personasLinea(l), 0)

// Desglose de personal por cuenta, solo las que tienen gente
export function plantillaPersonal(p: Proyecto) {
  const cuentas = [...new Set(p.presupuesto.map(l => l.categoria))]
  return cuentas
    .map(cuenta => ({ cuenta, personas: personasCategoria(p, cuenta) }))
    .filter(x => x.personas > 0)
    .sort((a, b) => a.cuenta.localeCompare(b.cuenta))
}

// Semáforo según porcentaje gastado: <80% verde, 80–100% amarillo, >100% rojo
export function semaforo(estimado: number, real: number): 'verde' | 'amarillo' | 'rojo' {
  if (!estimado) return real > 0 ? 'rojo' : 'verde'
  const r = real / estimado
  return r > 1 ? 'rojo' : r >= 0.8 ? 'amarillo' : 'verde'
}

// Número de un personaje en el elenco (1, 2, 3…), como se usa en la hoja de
// llamado y la tira de producción; 0 si no es del elenco
export const numeroPersonaje = (p: Proyecto, personaId: string) =>
  p.personas.filter(x => x.tipo === 'elenco').findIndex(x => x.id === personaId) + 1

// Páginas de guión en octavos, como se cuentan en la industria: 1.5 -> "1 4/8"
export function paginasEnOctavos(n: number): string {
  if (!n) return ''
  const octavos = Math.round(n * 8)
  const enteras = Math.floor(octavos / 8)
  const resto = octavos % 8
  if (!resto) return String(enteras)
  return enteras ? `${enteras} ${resto}/8` : `${resto}/8`
}

// "Personaje — Nombre real" para mostrar elenco
export const etiquetaElenco = (x: Persona) => (x.personaje ? `${x.personaje} — ${x.nombre}` : x.nombre)

export const elenco = (p: Proyecto) => p.personas.filter(x => x.tipo === 'elenco')
export const tecnicos = (p: Proyecto) => p.personas.filter(x => x.tipo === 'tecnico')

// ---- Reporte diario (con compatibilidad con el formato viejo, que era solo texto) ----
export const reporteDiaVacio = (): ReporteDia => ({
  llamado: '',
  primeraToma: '',
  corteComer: '',
  regresoComer: '',
  primeraTomaRegreso: '',
  corteSet: '',
  corteLocacion: '',
  notas: '',
})

export function reporteDia(p: Proyecto, diaId: string): ReporteDia {
  const r = p.reporteDiario[diaId]
  if (!r) return reporteDiaVacio()
  if (typeof r === 'string') return { ...reporteDiaVacio(), notas: r }
  return { ...reporteDiaVacio(), ...r }
}

// ---- Jornadas laborales (reglas de sindicatos / ANDA) ----
// Máximo recomendado: 12 h diurnas, 10 h nocturnas, por 10 h de descanso
export function horasJornada(inicio: string, fin: string): number | null {
  if (!inicio || !fin) return null
  const [hi, mi] = inicio.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  if ([hi, mi, hf, mf].some(isNaN)) return null
  let h = hf + mf / 60 - (hi + mi / 60)
  if (h <= 0) h += 24 // jornada que cruza la medianoche
  return Math.round(h * 10) / 10
}

export function alertaJornada(inicio: string, fin: string): string | null {
  const h = horasJornada(inicio, fin)
  if (h === null) return null
  const nocturna = fin < inicio || inicio >= '16:30' // clasificación ANDA: nocturno desde 16:30
  if (nocturna && h > 10) return `Jornada nocturna de ${h} h (máx. recomendado: 10 h + 10 h de descanso)`
  if (h > 12) return `Jornada de ${h} h (máx. recomendado: 12 h + 10 h de descanso)`
  return null
}

// ---- Day Out of Days: qué días trabaja cada actor ----
// SW = empieza · W = trabaja · F = termina · SWF = empieza y termina el mismo día
// H = "hold": entre su primer y último día, no trabaja pero sigue contratado
export function dayOutOfDays(p: Proyecto) {
  const dias = diasOrdenados(p)
  return elenco(p).map(actor => {
    const trabaja = dias.map(d =>
      d.escenaIds.some(id => p.escenas.find(e => e.id === id)?.personajeIds.includes(actor.id)),
    )
    const primero = trabaja.indexOf(true)
    const ultimo = trabaja.lastIndexOf(true)
    const codigos: (EstadoActor | '')[] = trabaja.map((t, i) => {
      if (primero < 0 || i < primero || i > ultimo) return ''
      if (!t) return 'H'
      if (primero === ultimo) return 'SWF'
      return i === primero ? 'SW' : i === ultimo ? 'F' : 'W'
    })
    const trabajados = trabaja.filter(Boolean).length
    const holds = codigos.filter(c => c === 'H').length
    return {
      actor,
      codigos,
      trabajados,
      holds,
      pagados: trabajados + holds, // del primer al último día, todos cuentan
      inicio: primero >= 0 ? dias[primero].fecha : '',
      fin: ultimo >= 0 ? dias[ultimo].fecha : '',
    }
  })
}

// Estado sugerido de un actor en un día (para la hoja de llamado)
export function estadoActorEnDia(p: Proyecto, actorId: string, diaId: string): EstadoActor | '' {
  const i = diasOrdenados(p).findIndex(d => d.id === diaId)
  return dayOutOfDays(p).find(x => x.actor.id === actorId)?.codigos[i] ?? ''
}

// Tarifa por día (si la unidad de la tarifa es por día/jornada)
export const tarifaDiaria = (x: Persona) => (/d[ií]a|jornada/i.test(x.unidadTarifa || '') ? x.tarifa || 0 : 0)

// ---- Presupuesto contra lo gastado (Control de Gastos) ----
export const ivaSolicitud = (s: Solicitud) => (s.iva ? (s.subtotal || 0) * IVA : 0)
export const totalSolicitud = (s: Solicitud) => (s.subtotal || 0) + ivaSolicitud(s)
export const totalGasto = (g: Gasto) => (g.importe || 0) + (g.iva || 0)

export const SIN_CUENTA = 'Por definir'

// Por cada cuenta: lo presupuestado, lo ya comprobado con ticket/factura y lo
// comprometido (solicitudes autorizadas o pagadas que aún no se comprueban)
export function ejercidoPorCuenta(p: Proyecto, ordenCuentas: string[]) {
  const gastos = p.gastos ?? []
  const solicitudes = p.solicitudes ?? []
  const usadas = new Set([
    ...p.presupuesto.map(l => l.categoria),
    ...gastos.map(g => g.cuenta),
    ...solicitudes.map(s => s.cuenta),
  ])
  const cuentas = [...ordenCuentas.filter(c => usadas.has(c)), ...[...usadas].filter(c => !ordenCuentas.includes(c)).sort()]
  return cuentas
    .map(cuenta => {
      const presupuestado = totalesCategoria(p, cuenta).estimado
      const comprobado = gastos.filter(g => g.cuenta === cuenta).reduce((t, g) => t + totalGasto(g), 0)
      const comprometido = solicitudes
        .filter(s => s.cuenta === cuenta && (s.estado === 'Autorizada' || s.estado === 'Pagada'))
        .reduce((t, s) => t + totalSolicitud(s), 0)
      return {
        cuenta,
        presupuestado,
        comprobado,
        comprometido,
        disponible: presupuestado - comprobado - comprometido,
      }
    })
    .filter(x => x.presupuestado || x.comprobado || x.comprometido)
}
