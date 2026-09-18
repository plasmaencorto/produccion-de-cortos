// ===== Directorio de Elenco y Equipo Técnico =====
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Modal, Vacio, btn, btnSec, inp, td, th } from '../components/ui'
import { dinero, num, uid } from '../utils'
import { colorDepartamento, conTransparencia } from '../departamentos'
import type { EstadoContrato, Persona, Proyecto, TipoPersona } from '../types'

const personaVacia = (tipo: TipoPersona): Persona => ({
  id: uid(),
  tipo,
  nombre: '',
  personaje: '',
  categoria: 'Principal',
  rol: '',
  telefono: '',
  correo: '',
  tarifa: 0,
  unidadTarifa: 'por día',
  contrato: 'Sin confirmar',
  tallas: '',
  restricciones: '',
  notas: '',
})

const CONTRATOS: EstadoContrato[] = ['Sin confirmar', 'Confirmado', 'Firmado']
const COLOR_CONTRATO: Record<EstadoContrato, string> = { 'Sin confirmar': 'rojo', Confirmado: 'amarillo', Firmado: 'verde' }
const CATEGORIAS = ['Principal', 'Secundario', 'Extra']
const UNIDADES = ['por día', 'por proyecto', 'por hora']

export default function Personas() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [tab, setTab] = useState<TipoPersona>('elenco')
  const [editando, setEditando] = useState<Persona | null>(null)
  const [esNueva, setEsNueva] = useState(false)
  if (!p) return null

  const lista = p.personas.filter(x => x.tipo === tab)

  const guardar = (x: Persona) => {
    if (esNueva) agregar('personas', x)
    else actualizar('personas', x.id, x)
    setEditando(null)
  }

  // Escenas donde aparece una persona del elenco (desde el desglose)
  const escenasDe = (id: string) =>
    p.escenas.filter(e => e.personajeIds.includes(id)).map(e => e.numero).join(', ')

  return (
    <>
      <Encabezado titulo="Elenco y Equipo Técnico" subtitulo="Directorio de personas del proyecto">
        <button className={btn} onClick={() => { setEditando(personaVacia(tab)); setEsNueva(true) }}>
          + Agregar {tab === 'elenco' ? 'actor/actriz' : 'técnico'}
        </button>
      </Encabezado>

      {/* Pestañas */}
      <div className="flex gap-1 mb-4">
        {(['elenco', 'tecnico'] as TipoPersona[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold border-b-2 ${
              tab === t ? 'text-copal-300 border-copal-400 bg-zinc-900' : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            {t === 'elenco' ? '🎭 Elenco' : '🎥 Equipo Técnico'} ({p.personas.filter(x => x.tipo === t).length})
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vacio mensaje={`Aún no hay personas en ${tab === 'elenco' ? 'el elenco' : 'el equipo técnico'}.`} />
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {(tab === 'elenco'
                  ? ['Nombre', 'Personaje', 'Tipo', 'Contacto', 'Tarifa', 'Contrato', 'Escenas', '']
                  : ['Nombre', 'Rol / Departamento', 'Contacto', 'Tarifa', 'Contrato', 'Notas', '']
                ).map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(x => (
                <tr
                  key={x.id}
                  className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => { setEditando(x); setEsNueva(false) }}
                >
                  <td className={td + ' font-semibold text-zinc-100'}>{x.nombre || '—'}</td>
                  {tab === 'elenco' ? (
                    <>
                      <td className={td + ' text-copal-300'}>{x.personaje}</td>
                      <td className={td}>{x.categoria}</td>
                    </>
                  ) : (
                    <td className={td}>
                      {x.rol ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            color: colorDepartamento(x.rol),
                            backgroundColor: conTransparencia(colorDepartamento(x.rol), 0.15),
                          }}
                        >
                          {x.rol}
                        </span>
                      ) : '—'}
                    </td>
                  )}
                  <td className={td + ' text-xs text-zinc-400'}>
                    {x.telefono && <p>📞 {x.telefono}</p>}
                    {x.correo && <p>✉️ {x.correo}</p>}
                  </td>
                  <td className={td + ' whitespace-nowrap'}>{x.tarifa ? `${dinero(x.tarifa)} ${x.unidadTarifa}` : '—'}</td>
                  <td className={td}><Badge color={COLOR_CONTRATO[x.contrato]}>{x.contrato}</Badge></td>
                  <td className={td + ' text-xs text-zinc-400 max-w-40'}>
                    {tab === 'elenco' ? escenasDe(x.id) : <span className="line-clamp-2">{x.notas}</span>}
                  </td>
                  <td className={td}>
                    <button
                      onClick={ev => { ev.stopPropagation(); if (confirm(`¿Eliminar a ${x.nombre}?`)) eliminar('personas', x.id) }}
                      className="text-zinc-500 hover:text-red-400" title="Eliminar">
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <EditorPersona p={p} inicial={editando} esNueva={esNueva} onGuardar={guardar} onCerrar={() => setEditando(null)} />
      )}
    </>
  )
}

// --- Editor de persona (modal) ---
function EditorPersona({
  p,
  inicial,
  esNueva,
  onGuardar,
  onCerrar,
}: {
  p: Proyecto
  inicial: Persona
  esNueva: boolean
  onGuardar: (x: Persona) => void
  onCerrar: () => void
}) {
  const [b, setB] = useState<Persona>(inicial)
  const set = (patch: Partial<Persona>) => setB(x => ({ ...x, ...patch }))
  const esElenco = b.tipo === 'elenco'
  const escenas = p.escenas.filter(e => e.personajeIds.includes(b.id)).map(e => e.numero).join(', ')

  return (
    <Modal
      titulo={esNueva ? (esElenco ? 'Nuevo actor / actriz' : 'Nuevo técnico') : `Editar: ${b.nombre}`}
      onCerrar={onCerrar}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Campo etiqueta="Nombre completo">
          <input className={inp} value={b.nombre} onChange={e => set({ nombre: e.target.value })} />
        </Campo>
        {esElenco ? (
          <>
            <Campo etiqueta="Personaje que interpreta">
              <input className={inp} value={b.personaje} onChange={e => set({ personaje: e.target.value })} />
            </Campo>
            <Campo etiqueta="Tipo">
              <select className={inp} value={b.categoria} onChange={e => set({ categoria: e.target.value })}>
                {CATEGORIAS.map(x => <option key={x}>{x}</option>)}
              </select>
            </Campo>
          </>
        ) : (
          <Campo etiqueta="Rol / Departamento">
            <input className={inp} value={b.rol} onChange={e => set({ rol: e.target.value })} placeholder="Director de fotografía, sonidista, gaffer…" />
          </Campo>
        )}
        <Campo etiqueta="Teléfono">
          <input className={inp} value={b.telefono} onChange={e => set({ telefono: e.target.value })} />
        </Campo>
        <Campo etiqueta="Correo">
          <input className={inp} value={b.correo} onChange={e => set({ correo: e.target.value })} />
        </Campo>
        <Campo etiqueta="Tarifa / cachet">
          <input type="number" className={inp} value={b.tarifa || ''} onChange={e => set({ tarifa: num(e.target.value) })} />
        </Campo>
        <Campo etiqueta="Unidad de la tarifa">
          <select className={inp} value={b.unidadTarifa} onChange={e => set({ unidadTarifa: e.target.value })}>
            {UNIDADES.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Estado de contrato">
          <select className={inp} value={b.contrato} onChange={e => set({ contrato: e.target.value as EstadoContrato })}>
            {CONTRATOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        {esElenco && (
          <>
            <Campo etiqueta="Tallas de vestuario y notas de maquillaje">
              <input className={inp} value={b.tallas} onChange={e => set({ tallas: e.target.value })} />
            </Campo>
            <Campo etiqueta="Restricciones (alergias, condiciones físicas)">
              <input className={inp} value={b.restricciones} onChange={e => set({ restricciones: e.target.value })} />
            </Campo>
          </>
        )}
        <Campo etiqueta="Notas" className="md:col-span-2">
          <input className={inp} value={b.notas} onChange={e => set({ notas: e.target.value })} />
        </Campo>
      </div>
      {esElenco && !esNueva && (
        <p className="text-xs text-zinc-500 mt-3">
          🎬 Aparece en las escenas: <span className="text-zinc-300">{escenas || 'ninguna todavía (se marca en el Desglose de Guión)'}</span>
        </p>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}
