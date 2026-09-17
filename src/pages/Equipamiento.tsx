// ===== Equipamiento por departamento =====
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Modal, Vacio, btn, btnSec, inp, td, th } from '../components/ui'
import { dinero, num, uid } from '../utils'
import { DEPARTAMENTOS_EQUIPO } from '../plantillaPresupuesto'
import type { Equipo, EstadoEquipo } from '../types'

const equipoVacio = (departamento: string): Equipo => ({
  id: uid(),
  departamento,
  nombre: '',
  marcaModelo: '',
  propiedad: 'Rentado',
  proveedor: '',
  costo: 0,
  unidadCosto: 'por día',
  fechaInicio: '',
  fechaFin: '',
  responsable: '',
  estado: 'Por confirmar',
})

const ESTADOS: EstadoEquipo[] = ['Por confirmar', 'Confirmado', 'En set', 'Devuelto']
const COLOR_ESTADO: Record<EstadoEquipo, string> = {
  'Por confirmar': 'rojo',
  Confirmado: 'amarillo',
  'En set': 'verde',
  Devuelto: 'gris',
}

export default function Equipamiento() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Equipo | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)
  if (!p) return null

  const guardar = (eq: Equipo) => {
    if (esNuevo) agregar('equipos', eq)
    else actualizar('equipos', eq.id, eq)
    setEditando(null)
  }

  return (
    <>
      <Encabezado titulo="Equipamiento" subtitulo="Equipos del proyecto organizados por departamento">
        <button className={btn} onClick={() => { setEditando(equipoVacio(DEPARTAMENTOS_EQUIPO[0])); setEsNuevo(true) }}>
          + Agregar equipo
        </button>
      </Encabezado>

      {p.equipos.length === 0 && <Vacio mensaje="Aún no hay equipos registrados." />}

      {DEPARTAMENTOS_EQUIPO.map(dep => {
        const lista = p.equipos.filter(e => e.departamento === dep)
        if (lista.length === 0) return null
        return (
          <div key={dep} className="mb-6">
            <h2 className="font-semibold text-amber-300 mb-2">{dep}</h2>
            <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Equipo', 'Marca / Modelo', 'Propiedad', 'Proveedor', 'Costo', 'Fechas de renta', 'Responsable', 'Estado', ''].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.map(eq => (
                    <tr
                      key={eq.id}
                      className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                      onClick={() => { setEditando(eq); setEsNuevo(false) }}
                    >
                      <td className={td + ' font-semibold text-zinc-100'}>{eq.nombre || '—'}</td>
                      <td className={td}>{eq.marcaModelo}</td>
                      <td className={td}>{eq.propiedad}</td>
                      <td className={td}>{eq.proveedor}</td>
                      <td className={td + ' whitespace-nowrap'}>{eq.costo ? `${dinero(eq.costo)} ${eq.unidadCosto}` : '—'}</td>
                      <td className={td + ' text-xs text-zinc-400 whitespace-nowrap'}>
                        {eq.fechaInicio || '—'} → {eq.fechaFin || '—'}
                      </td>
                      <td className={td}>{eq.responsable}</td>
                      <td className={td}><Badge color={COLOR_ESTADO[eq.estado]}>{eq.estado}</Badge></td>
                      <td className={td}>
                        <button
                          onClick={ev => { ev.stopPropagation(); if (confirm(`¿Eliminar "${eq.nombre}"?`)) eliminar('equipos', eq.id) }}
                          className="text-zinc-500 hover:text-red-400" title="Eliminar">
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {editando && (
        <EditorEquipo inicial={editando} esNuevo={esNuevo} onGuardar={guardar} onCerrar={() => setEditando(null)} />
      )}
    </>
  )
}

// --- Editor de equipo (modal) ---
function EditorEquipo({
  inicial,
  esNuevo,
  onGuardar,
  onCerrar,
}: {
  inicial: Equipo
  esNuevo: boolean
  onGuardar: (eq: Equipo) => void
  onCerrar: () => void
}) {
  const [b, setB] = useState<Equipo>(inicial)
  const set = (patch: Partial<Equipo>) => setB(x => ({ ...x, ...patch }))

  return (
    <Modal titulo={esNuevo ? 'Nuevo equipo' : `Editar: ${b.nombre}`} onCerrar={onCerrar}>
      <div className="grid gap-3 md:grid-cols-2">
        <Campo etiqueta="Departamento">
          <select className={inp} value={b.departamento} onChange={e => set({ departamento: e.target.value })}>
            {DEPARTAMENTOS_EQUIPO.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Nombre del equipo">
          <input className={inp} value={b.nombre} onChange={e => set({ nombre: e.target.value })} placeholder="Cámara principal, kit de luces…" />
        </Campo>
        <Campo etiqueta="Marca / Modelo">
          <input className={inp} value={b.marcaModelo} onChange={e => set({ marcaModelo: e.target.value })} />
        </Campo>
        <Campo etiqueta="Propio o rentado">
          <select className={inp} value={b.propiedad} onChange={e => set({ propiedad: e.target.value as Equipo['propiedad'] })}>
            <option>Propio</option>
            <option>Rentado</option>
          </select>
        </Campo>
        {b.propiedad === 'Rentado' && (
          <>
            <Campo etiqueta="Proveedor de renta">
              <input className={inp} value={b.proveedor} onChange={e => set({ proveedor: e.target.value })} />
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo etiqueta="Costo de renta">
                <input type="number" className={inp} value={b.costo || ''} onChange={e => set({ costo: num(e.target.value) })} />
              </Campo>
              <Campo etiqueta="Unidad">
                <select className={inp} value={b.unidadCosto} onChange={e => set({ unidadCosto: e.target.value })}>
                  <option>por día</option>
                  <option>total</option>
                </select>
              </Campo>
            </div>
            <Campo etiqueta="Inicio de renta">
              <input type="date" className={inp} value={b.fechaInicio} onChange={e => set({ fechaInicio: e.target.value })} />
            </Campo>
            <Campo etiqueta="Fin de renta">
              <input type="date" className={inp} value={b.fechaFin} onChange={e => set({ fechaFin: e.target.value })} />
            </Campo>
          </>
        )}
        <Campo etiqueta="Responsable en set">
          <input className={inp} value={b.responsable} onChange={e => set({ responsable: e.target.value })} />
        </Campo>
        <Campo etiqueta="Estado">
          <select className={inp} value={b.estado} onChange={e => set({ estado: e.target.value as EstadoEquipo })}>
            {ESTADOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}
