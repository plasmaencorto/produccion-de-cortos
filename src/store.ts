// ===== Estado global con Zustand + guardado automático en localStorage =====
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CallSheet,
  Dano,
  DiaRodaje,
  Entregable,
  EtapaPost,
  Equipo,
  Escena,
  Gasto,
  LineaPresupuesto,
  Locacion,
  Persona,
  Proyecto,
  ReporteDia,
  Solicitud,
} from './types'
import { reporteDiaVacio } from './helpers'
import { uid } from './utils'

// Mapa de las colecciones editables dentro de un proyecto
export type Colecciones = {
  escenas: Escena
  presupuesto: LineaPresupuesto
  diasRodaje: DiaRodaje
  personas: Persona
  locaciones: Locacion
  equipos: Equipo
  solicitudes: Solicitud
  gastos: Gasto
  danos: Dano
  postproduccion: EtapaPost
  entregables: Entregable
}

// Crea un proyecto vacío
export function proyectoNuevo(nombre: string): Proyecto {
  return {
    id: uid(),
    nombre,
    director: '',
    productor: '',
    primerAD: '',
    inicioRodaje: '',
    finRodaje: '',
    estado: 'En Preproducción',
    creado: new Date().toISOString(),
    escenas: [],
    presupuesto: [],
    diasRodaje: [],
    personas: [],
    locaciones: [],
    equipos: [],
    solicitudes: [],
    gastos: [],
    danos: [],
    postproduccion: [],
    entregables: [],
    callSheets: {},
    reporteDiario: {},
  }
}

// Rellena lo que falte en un proyecto (respaldos viejos o de versiones anteriores),
// para que la app nunca se rompa por un dato ausente
export function normalizarProyecto(p: Partial<Proyecto>): Proyecto {
  const base = proyectoNuevo(p.nombre || 'Proyecto sin nombre')
  return {
    ...base,
    ...p,
    id: p.id || base.id,
    escenas: p.escenas ?? [],
    presupuesto: (p.presupuesto ?? []).map(l => ({
      ...l,
      categoria: l.categoria ?? '',
      subcategoria: l.subcategoria ?? '',
    })),
    diasRodaje: (p.diasRodaje ?? []).map(d => ({ ...d, escenaIds: d.escenaIds ?? [] })),
    personas: p.personas ?? [],
    locaciones: (p.locaciones ?? []).map(l => ({ ...l, fotos: l.fotos ?? [] })),
    equipos: p.equipos ?? [],
    solicitudes: p.solicitudes ?? [],
    gastos: p.gastos ?? [],
    danos: p.danos ?? [],
    postproduccion: p.postproduccion ?? [],
    entregables: p.entregables ?? [],
    callSheets: p.callSheets ?? {},
    reporteDiario: p.reporteDiario ?? {},
  }
}

// Las comidas del día, en el orden del machote profesional
export const COMIDAS = ['Desayuno', 'Café', 'Snack fuerte', 'Comida', 'Snack ligero', 'Cena']

export function callSheetVacia(): CallSheet {
  return {
    llamadoGeneral: '',
    desayuno: '',
    listosPrimerTiro: '',
    oficinaProduccion: '',
    llamados: {},
    llamadosActores: {},
    extras: [],
    comidas: {},
    salidaSol: '',
    puestaSol: '',
    clima: '',
    tempMin: '',
    tempMax: '',
    hospital: '',
    estacionamiento: '',
    catering: '',
    emergencias: '',
    radios: '',
    notasSeguridad: '',
    notasProduccion: '',
  }
}

// Papelera temporal para deshacer la última eliminación (no se persiste)
export interface Papelera {
  col: keyof Colecciones
  item: Colecciones[keyof Colecciones]
  index: number // posición original en la lista
  proyectoId: string
}

interface Store {
  proyectos: Proyecto[]
  activoId: string | null
  soloLectura: boolean
  respaldos: Record<string, string> // id de proyecto -> fecha del último respaldo descargado
  pospuestos: Record<string, string> // id de proyecto -> no recordar el respaldo antes de esta fecha
  papelera: Papelera | null // último ítem eliminado (para deshacer)
  marcarRespaldo: (id: string) => void
  posponerRespaldo: (id: string, dias: number) => void
  setActivo: (id: string | null) => void
  setSoloLectura: (v: boolean) => void
  crearProyecto: (nombre: string) => string
  duplicarProyecto: (id: string) => void
  eliminarProyecto: (id: string) => void
  importarProyecto: (p: Proyecto) => void
  actualizarActivo: (patch: Partial<Proyecto>) => void
  mutarActivo: (fn: (p: Proyecto) => Proyecto) => void
  agregar: <K extends keyof Colecciones>(col: K, item: Colecciones[K]) => void
  actualizar: <K extends keyof Colecciones>(col: K, id: string, patch: Partial<Colecciones[K]>) => void
  eliminar: <K extends keyof Colecciones>(col: K, id: string) => void
  restaurar: () => void // deshace la última eliminación
  setCallSheet: (diaId: string, patch: Partial<CallSheet>) => void
  setReporteDiario: (diaId: string, patch: Partial<ReporteDia>) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      // Todas las escrituras al proyecto pasan por aquí:
      // así el modo "solo lectura" bloquea cualquier cambio
      const mutar = (fn: (p: Proyecto) => Proyecto) => {
        const { soloLectura, activoId } = get()
        if (soloLectura || !activoId) return
        const ahora = new Date().toISOString()
        set(s => ({
          proyectos: s.proyectos.map(p => (p.id === activoId ? { ...fn(p), modificado: ahora } : p)),
        }))
      }

      return {
        proyectos: [],
        activoId: null,
        soloLectura: false,
        respaldos: {},
        pospuestos: {},
        papelera: null,
        marcarRespaldo: id => set(s => ({ respaldos: { ...s.respaldos, [id]: new Date().toISOString() } })),
        posponerRespaldo: (id, dias) =>
          set(s => ({
            pospuestos: { ...s.pospuestos, [id]: new Date(Date.now() + dias * 86400000).toISOString() },
          })),
        setActivo: id => set({ activoId: id }),
        setSoloLectura: v => set({ soloLectura: v }),

        crearProyecto: nombre => {
          const p = proyectoNuevo(nombre)
          set(s => ({ proyectos: [...s.proyectos, p] }))
          return p.id
        },
        duplicarProyecto: id =>
          set(s => {
            const original = s.proyectos.find(p => p.id === id)
            if (!original) return s
            const copia = structuredClone(original)
            copia.id = uid()
            copia.nombre = original.nombre + ' (copia)'
            return { proyectos: [...s.proyectos, copia] }
          }),
        eliminarProyecto: id =>
          set(s => ({
            proyectos: s.proyectos.filter(p => p.id !== id),
            activoId: s.activoId === id ? null : s.activoId,
          })),
        // lo importado viene de un archivo de respaldo, así que cuenta como respaldado
        importarProyecto: p =>
          set(s => {
            const nuevo = { ...normalizarProyecto(p), id: uid() }
            return {
              proyectos: [...s.proyectos, nuevo],
              respaldos: { ...s.respaldos, [nuevo.id]: new Date().toISOString() },
            }
          }),

        actualizarActivo: patch => mutar(p => ({ ...p, ...patch })),
        mutarActivo: mutar,

        // (p[col] ?? []) protege proyectos guardados antes de agregar colecciones nuevas
        agregar: (col, item) => mutar(p => ({ ...p, [col]: [...(p[col] ?? []), item] }) as Proyecto),
        actualizar: (col, id, patch) =>
          mutar(
            p =>
              ({
                ...p,
                [col]: ((p[col] ?? []) as { id: string }[]).map(i => (i.id === id ? { ...i, ...patch } : i)),
              }) as Proyecto,
          ),
        eliminar: (col, id) => {
          const { activoId, proyectos } = get()
          if (!activoId) return
          const p = proyectos.find(x => x.id === activoId)
          if (!p) return
          const lista = ((p[col] ?? []) as { id: string }[])
          const index = lista.findIndex(i => i.id === id)
          const item = lista[index]
          if (item) set({ papelera: { col, item: item as Colecciones[keyof Colecciones], index, proyectoId: activoId } })
          mutar(p => ({ ...p, [col]: lista.filter(i => i.id !== id) }) as Proyecto)
        },
        restaurar: () => {
          const { papelera } = get()
          if (!papelera) return
          const { col, item, index, proyectoId } = papelera
          set(s => ({
            papelera: null,
            proyectos: s.proyectos.map(p => {
              if (p.id !== proyectoId) return p
              const lista = [...((p[col] ?? []) as { id: string }[])]
              lista.splice(index, 0, item as { id: string })
              return { ...p, [col]: lista }
            }),
          }))
        },

        setCallSheet: (diaId, patch) =>
          mutar(p => ({
            ...p,
            callSheets: {
              ...p.callSheets,
              [diaId]: { ...callSheetVacia(), ...p.callSheets[diaId], ...patch },
            },
          })),
        setReporteDiario: (diaId, patch) =>
          mutar(p => {
            // compatibilidad: el formato viejo guardaba solo un texto de notas
            const previo = p.reporteDiario[diaId]
            const base = typeof previo === 'string' ? { notas: previo } : previo || {}
            return {
              ...p,
              reporteDiario: {
                ...p.reporteDiario,
                [diaId]: { ...reporteDiaVacio(), ...base, ...patch },
              },
            }
          }),
      }
    },
    {
      name: 'produccion-cortos',
      version: 2,
      // No guardar la papelera en localStorage — es solo temporal en memoria
      partialize: ({ papelera: _p, ...rest }: Store) => rest,
      // Al cargar datos guardados con una versión anterior, se completan los
      // campos nuevos para que ninguna pantalla se rompa
      migrate: (guardado: unknown) => {
        const s = (guardado ?? {}) as {
          proyectos?: Partial<Proyecto>[]
          activoId?: string | null
          respaldos?: Record<string, string>
          pospuestos?: Record<string, string>
        }
        return {
          ...s,
          proyectos: (s.proyectos ?? []).map(normalizarProyecto),
          activoId: s.activoId ?? null,
          soloLectura: false,
          respaldos: s.respaldos ?? {},
          pospuestos: s.pospuestos ?? {},
        }
      },
    },
  ),
)

// Hook: el proyecto activo (o undefined)
export const useProyecto = () => useStore(s => s.proyectos.find(p => p.id === s.activoId))
