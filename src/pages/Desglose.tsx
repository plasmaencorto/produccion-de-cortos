// ===== Desglose de Guión (Script Breakdown) =====
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Modal, Vacio, btn, btnSec, inp, td, th } from '../components/ui'
import { aCSV, descargarArchivo, num, uid } from '../utils'
import { elenco, nombreLocacion } from '../helpers'
import { colorDepartamento, conTransparencia } from '../departamentos'
import type { Escena, EstadoEscena, IntExt, Momento, Proyecto } from '../types'

const escenaVacia = (): Escena => ({
  id: uid(),
  numero: '',
  intExt: 'INT',
  locacionId: '',
  locacionTexto: '',
  momento: 'DÍA',
  sinopsis: '',
  personajeIds: [],
  props: [],
  vestuario: '',
  maquillaje: '',
  vehiculos: '',
  sonido: '',
  notas: '',
  paginas: 0,
  estado: 'Sin filmar',
})

const COLOR_ESTADO: Record<EstadoEscena, string> = { 'Sin filmar': 'gris', Filmada: 'ambar', Aprobada: 'verde' }
const ESTADOS: EstadoEscena[] = ['Sin filmar', 'Filmada', 'Aprobada']
const MOMENTOS: Momento[] = ['DÍA', 'NOCHE', 'TARDE', 'MAÑANA', 'AMANECER', 'ATARDECER', 'DÍA/NOCHE']
const INTEXT: IntExt[] = ['INT', 'EXT', 'INT/EXT']

export default function Desglose() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Escena | null>(null)
  const [esNueva, setEsNueva] = useState(false)
  // Filtros
  const [fLoc, setFLoc] = useState('')
  const [fPer, setFPer] = useState('')
  const [fEst, setFEst] = useState('')
  if (!p) return null

  const nombreEsc = (e: Escena) => nombreLocacion(p, e.locacionId, e.locacionTexto)
  const locacionesUsadas = [...new Set(p.escenas.map(nombreEsc).filter(Boolean))]

  const escenas = p.escenas.filter(
    e =>
      (!fLoc || nombreEsc(e) === fLoc) &&
      (!fPer || e.personajeIds.includes(fPer)) &&
      (!fEst || e.estado === fEst),
  )

  const guardar = (e: Escena) => {
    if (esNueva) agregar('escenas', e)
    else actualizar('escenas', e.id, e)
    setEditando(null)
  }

  const exportarCSV = () => {
    const filas: (string | number)[][] = [
      ['No.', 'INT/EXT', 'Locación', 'Momento', 'Sinopsis', 'Personajes', 'Props', 'Vestuario', 'Maquillaje/FX', 'Vehículos', 'Sonido', 'Páginas', 'Estado', 'Notas'],
      ...p.escenas.map(e => [
        e.numero,
        e.intExt,
        nombreEsc(e),
        e.momento,
        e.sinopsis,
        e.personajeIds.map(idp => p.personas.find(x => x.id === idp)?.personaje || '').filter(Boolean).join(' / '),
        e.props.join(' / '),
        e.vestuario,
        e.maquillaje,
        e.vehiculos,
        e.sonido,
        e.paginas,
        e.estado,
        e.notas,
      ]),
    ]
    descargarArchivo('desglose-guion.csv', aCSV(filas), 'text/csv;charset=utf-8', true)
  }

  return (
    <>
      <Encabezado titulo="Desglose de Guión" subtitulo="Cada fila es una escena con todos sus elementos">
        <button className={btn} onClick={() => { setEditando(escenaVacia()); setEsNueva(true) }}>
          + Nueva escena
        </button>
        <Link className={btnSec} to={`/p/${p.id}/guion`}>📥 Importar guion</Link>
        <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV</button>
        <Link className={btnSec} to={`/p/${p.id}/reportes?tipo=desglose`}>🖨 Imprimir / PDF</Link>
      </Encabezado>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4 print:hidden">
        <select className={inp + ' !w-auto'} value={fLoc} onChange={e => setFLoc(e.target.value)}>
          <option value="">Todas las locaciones</option>
          {locacionesUsadas.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className={inp + ' !w-auto'} value={fPer} onChange={e => setFPer(e.target.value)}>
          <option value="">Todos los personajes</option>
          {elenco(p).map(x => <option key={x.id} value={x.id}>{x.personaje || x.nombre}</option>)}
        </select>
        <select className={inp + ' !w-auto'} value={fEst} onChange={e => setFEst(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(x => <option key={x}>{x}</option>)}
        </select>
      </div>

      {p.escenas.length === 0 ? (
        <Vacio mensaje="Aún no hay escenas. Agrega la primera con el botón «+ Nueva escena»." />
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['No.', 'INT/EXT', 'Locación', 'Momento', 'Sinopsis', 'Personajes', 'Estado', ''].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {escenas.map(e => (
                <tr key={e.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => { setEditando(e); setEsNueva(false) }}>
                  <td className={td + ' font-bold text-copal-300 whitespace-nowrap'}>{e.numero || '—'}</td>
                  <td className={td}>{e.intExt}</td>
                  <td className={td}>{nombreEsc(e) || '—'}</td>
                  <td className={td}>{e.momento}</td>
                  <td className={td + ' max-w-72'}><span className="line-clamp-2 text-zinc-300">{e.sinopsis}</span></td>
                  <td className={td + ' max-w-48 text-xs text-zinc-400'}>
                    {e.personajeIds.map(idp => p.personas.find(x => x.id === idp)?.personaje || '').filter(Boolean).join(', ')}
                  </td>
                  <td className={td}><Badge color={COLOR_ESTADO[e.estado]}>{e.estado}</Badge></td>
                  <td className={td}>
                    <button
                      onClick={ev => { ev.stopPropagation(); if (confirm(`¿Eliminar la escena ${e.numero}?`)) eliminar('escenas', e.id) }}
                      className="text-zinc-500 hover:text-red-400" title="Eliminar escena">
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
        <EditorEscena
          p={p}
          inicial={editando}
          esNueva={esNueva}
          onGuardar={guardar}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  )
}

// --- Editor de escena (modal) ---
function EditorEscena({
  p,
  inicial,
  esNueva,
  onGuardar,
  onCerrar,
}: {
  p: Proyecto
  inicial: Escena
  esNueva: boolean
  onGuardar: (e: Escena) => void
  onCerrar: () => void
}) {
  const [b, setB] = useState<Escena>(inicial)
  const [propsTexto, setPropsTexto] = useState(inicial.props.join(', '))
  const set = (patch: Partial<Escena>) => setB(x => ({ ...x, ...patch }))

  const togglePersonaje = (idp: string) =>
    set({
      personajeIds: b.personajeIds.includes(idp)
        ? b.personajeIds.filter(x => x !== idp)
        : [...b.personajeIds, idp],
    })

  return (
    <Modal titulo={esNueva ? 'Nueva escena' : `Editar escena ${b.numero}`} onCerrar={onCerrar} ancho="max-w-3xl">
      <div className="grid gap-3 md:grid-cols-4">
        <Campo etiqueta="Número de escena">
          <input className={inp} value={b.numero} onChange={e => set({ numero: e.target.value })} placeholder="1, 2A…" />
        </Campo>
        <Campo etiqueta="INT / EXT">
          <select className={inp} value={b.intExt} onChange={e => set({ intExt: e.target.value as IntExt })}>
            {INTEXT.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Momento del día">
          <select className={inp} value={b.momento} onChange={e => set({ momento: e.target.value as Momento })}>
            {MOMENTOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select className={inp} value={b.estado} onChange={e => set({ estado: e.target.value as EstadoEscena })}>
            {ESTADOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Locación (del catálogo)" className="md:col-span-2">
          <select className={inp} value={b.locacionId} onChange={e => set({ locacionId: e.target.value })}>
            <option value="">— Sin locación del catálogo —</option>
            {p.locaciones.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="…o locación en texto libre" className="md:col-span-2">
          <input className={inp} value={b.locacionTexto} onChange={e => set({ locacionTexto: e.target.value })} placeholder="Casa de la abuela" />
        </Campo>
        <Campo etiqueta="Sinopsis breve de la escena" className="md:col-span-3">
          <textarea className={inp} rows={2} value={b.sinopsis} onChange={e => set({ sinopsis: e.target.value })} />
        </Campo>
        <Campo etiqueta="Páginas de guión">
          <input type="number" step="0.125" className={inp} value={b.paginas || ''} onChange={e => set({ paginas: num(e.target.value) })} />
        </Campo>
        <Campo etiqueta="Personajes que aparecen" className="md:col-span-4">
          {elenco(p).length === 0 ? (
            <p className="text-xs text-zinc-500">
              Primero registra el elenco en la sección <b>Elenco y Equipo</b> para poder seleccionarlo aquí.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {elenco(p).map(x => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => togglePersonaje(x.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    b.personajeIds.includes(x.id)
                      ? 'bg-copal-500/20 border-copal-400 text-copal-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {x.personaje || x.nombre}
                </button>
              ))}
            </div>
          )}
        </Campo>
        <CampoDepto etiqueta="Props / utilería (separados por coma)" depto="utilería">
          <input className={inp} value={propsTexto} onChange={e => setPropsTexto(e.target.value)} placeholder="pistola de utilería, maleta roja" />
        </CampoDepto>
        <CampoDepto etiqueta="Vestuario especial" depto="vestuario">
          <input className={inp} value={b.vestuario} onChange={e => set({ vestuario: e.target.value })} />
        </CampoDepto>
        <CampoDepto etiqueta="Maquillaje / FX especiales" depto="maquillaje">
          <input className={inp} value={b.maquillaje} onChange={e => set({ maquillaje: e.target.value })} />
        </CampoDepto>
        <CampoDepto etiqueta="Vehículos" depto="vehículo">
          <input className={inp} value={b.vehiculos} onChange={e => set({ vehiculos: e.target.value })} />
        </CampoDepto>
        <CampoDepto etiqueta="Efectos de sonido en set" depto="sonido">
          <input className={inp} value={b.sonido} onChange={e => set({ sonido: e.target.value })} />
        </CampoDepto>
        <Campo etiqueta="Notas adicionales" className="md:col-span-2">
          <input className={inp} value={b.notas} onChange={e => set({ notas: e.target.value })} />
        </Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button
          className={btn}
          onClick={() => onGuardar({ ...b, props: propsTexto.split(',').map(s => s.trim()).filter(Boolean) })}
        >
          Guardar escena
        </button>
      </div>
    </Modal>
  )
}

// Campo del desglose marcado con el color de su departamento,
// para ubicar de un vistazo qué le toca a cada área
function CampoDepto({
  etiqueta,
  depto,
  children,
}: {
  etiqueta: string
  depto: string
  children: React.ReactNode
}) {
  const color = colorDepartamento(depto)
  return (
    <label className="block md:col-span-2 border-l-2 pl-2" style={{ borderLeftColor: color }}>
      <span
        className="inline-block text-xs mb-1 px-1.5 rounded"
        style={{ color, backgroundColor: conTransparencia(color, 0.15) }}
      >
        {etiqueta}
      </span>
      {children}
    </label>
  )
}
