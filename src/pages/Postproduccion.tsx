// ===== Postproducción =====
// Después del rodaje la película apenas empieza: edición, color, sonido,
// música, créditos y el master final. Aquí se sigue cada etapa con su
// responsable y fecha de entrega, y la lista de archivos finales.
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Badge, Encabezado, FirmaCasa, Vacio, btn, btnSec, inpMini, papel, tarjeta, tdPapel, thPapel } from '../components/ui'
import { dinero, fechaBonita, hoyLocal, sumarDias, uid } from '../utils'
import { ejercidoPorCuenta } from '../helpers'
import { PLANTILLA_PRESUPUESTO } from '../plantillaPresupuesto'
import type { Entregable, EstadoEtapa, EtapaPost, Proyecto } from '../types'

const ESTADOS: EstadoEtapa[] = ['Pendiente', 'En proceso', 'En revisión', 'Terminada']
const COLOR_ESTADO: Record<EstadoEtapa, string> = {
  Pendiente: 'gris',
  'En proceso': 'ambar',
  'En revisión': 'amarillo',
  Terminada: 'verde',
}
const BORDE_ESTADO: Record<EstadoEtapa, string> = {
  Pendiente: '#52525b',
  'En proceso': '#ffea00',
  'En revisión': '#facc15',
  Terminada: '#34d399',
}

// Flujo típico de la post de un cortometraje. [nombre, día de inicio, duración en días]
// contados desde el fin de rodaje; algunas etapas corren en paralelo.
const ETAPAS_SUGERIDAS: [string, number, number][] = [
  ['Respaldo e ingesta del material (DIT)', 0, 3],
  ['Edición: primer corte', 3, 14],
  ['Revisión con dirección y corte final (picture lock)', 17, 7],
  ['Efectos visuales y gráficos', 24, 10],
  ['Corrección de color', 24, 7],
  ['Edición de diálogos y diseño sonoro', 24, 14],
  ['Música (original o licencias)', 10, 28],
  ['Mezcla de sonido', 38, 5],
  ['Títulos, créditos y subtítulos', 31, 7],
  ['Masterización y exportación', 43, 3],
]

const ENTREGABLES_SUGERIDOS: [string, string][] = [
  ['Master de alta calidad', 'ProRes 422 HQ, 1080p o 4K'],
  ['Archivo para web y envíos', 'MP4 H.264'],
  ['Subtítulos en español', '.srt'],
  ['Subtítulos en inglés', '.srt'],
  ['Mezcla estéreo', 'WAV 48 kHz / 24 bits'],
  ['Stems de audio (diálogos, música, efectos) y M&E', 'WAV por separado'],
  ['Lista de música y licencias (cue sheet)', 'PDF'],
  ['Créditos finales revisados', 'Texto aprobado por todo el equipo'],
  ['Fotos fijas (stills) y póster', 'JPG alta resolución'],
  ['DCP (solo si lo pide una sala o festival)', 'DCP'],
  ['Respaldo final del proyecto y material', 'Dos discos, en lugares distintos'],
]

const atrasada = (e: EtapaPost) => !!e.entrega && e.entrega < hoyLocal() && e.estado !== 'Terminada'

export default function Postproduccion() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const mutarActivo = useStore(s => s.mutarActivo)
  const [paraImprimir, setParaImprimir] = useState(false)
  if (!p) return null

  const etapas = p.postproduccion ?? []
  const entregables = p.entregables ?? []
  const terminadas = etapas.filter(e => e.estado === 'Terminada').length
  const pct = etapas.length ? Math.round((terminadas / etapas.length) * 100) : 0
  const retrasadas = etapas.filter(atrasada)
  const proxima = etapas
    .filter(e => e.estado !== 'Terminada' && e.entrega)
    .sort((a, b) => a.entrega.localeCompare(b.entrega))[0]
  const listos = entregables.filter(x => x.listo).length

  // Presupuesto de las cuentas de post (4000 imagen y 4100 sonido y música)
  const cuentasPost = ejercidoPorCuenta(
    p,
    PLANTILLA_PRESUPUESTO.map(c => c.categoria),
  ).filter(x => /^4[01]00/.test(x.cuenta))
  const presPost = cuentasPost.reduce((t, x) => t + x.presupuestado, 0)
  const gastoPost = cuentasPost.reduce((t, x) => t + x.comprobado + x.comprometido, 0)

  const cargarEtapas = () => {
    const base = p.finRodaje || hoyLocal()
    mutarActivo(pr => ({
      ...pr,
      postproduccion: [
        ...(pr.postproduccion ?? []),
        ...ETAPAS_SUGERIDAS.map(([nombre, desde, dura]) => ({
          id: uid(),
          nombre,
          responsable: '',
          inicio: sumarDias(base, desde + 1),
          entrega: sumarDias(base, desde + dura),
          estado: 'Pendiente' as const,
          notas: '',
        })),
      ],
    }))
  }

  const cargarEntregables = () =>
    mutarActivo(pr => ({
      ...pr,
      entregables: [
        ...(pr.entregables ?? []),
        ...ENTREGABLES_SUGERIDOS.map(([nombre, formato]) => ({ id: uid(), nombre, formato, listo: false })),
      ],
    }))

  const nuevaEtapa = () =>
    agregar('postproduccion', {
      id: uid(),
      nombre: '',
      responsable: '',
      inicio: '',
      entrega: '',
      estado: 'Pendiente',
      notas: '',
    })

  return (
    <>
      <Encabezado titulo="Postproducción" subtitulo="Cada etapa con su responsable y su fecha de entrega, hasta el master final">
        <button className={btnSec} onClick={() => setParaImprimir(!paraImprimir)}>
          {paraImprimir ? '✏️ Volver a editar' : '📄 Vista para imprimir'}
        </button>
        {paraImprimir && <button className={btn} onClick={() => window.print()}>🖨 Imprimir / PDF</button>}
        {!paraImprimir && <button className={btn} onClick={nuevaEtapa}>+ Etapa</button>}
      </Encabezado>

      {paraImprimir ? (
        <HojaPost p={p} />
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className={tarjeta}>
              <p className="text-xs text-zinc-400">Avance de la post</p>
              <p className="text-2xl font-bold text-copal-400">{pct}%</p>
              <div className="h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-copal-500" style={{ width: pct + '%' }} />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">{terminadas} de {etapas.length} etapas terminadas</p>
            </div>
            <div className={tarjeta}>
              <p className="text-xs text-zinc-400">Próxima entrega</p>
              {proxima ? (
                <>
                  <p className="text-sm font-semibold text-zinc-100 mt-1 line-clamp-2">{proxima.nombre || 'Sin nombre'}</p>
                  <p className="text-[11px] text-zinc-400 capitalize">{fechaBonita(proxima.entrega)}</p>
                </>
              ) : (
                <p className="text-sm text-zinc-500 mt-1">—</p>
              )}
            </div>
            <div className={tarjeta}>
              <p className="text-xs text-zinc-400">Etapas atrasadas</p>
              <p className={`text-2xl font-bold ${retrasadas.length ? 'text-red-400' : 'text-emerald-400'}`}>
                {retrasadas.length}
              </p>
              <p className="text-[11px] text-zinc-500">{retrasadas.length ? 'ya pasó su fecha de entrega' : 'todo a tiempo'}</p>
            </div>
            <div className={tarjeta}>
              <p className="text-xs text-zinc-400">Presupuesto de post (4000 y 4100)</p>
              <p className="text-lg font-bold text-zinc-100">{dinero(presPost)}</p>
              <p className={`text-[11px] ${gastoPost > presPost ? 'text-red-400' : 'text-zinc-500'}`}>
                ejercido {dinero(gastoPost)}
              </p>
            </div>
          </div>

          {/* Etapas */}
          <h2 className="font-semibold text-zinc-200 mb-2">🎚 Etapas</h2>
          {etapas.length === 0 ? (
            <div className={tarjeta + ' text-center py-8 mb-6'}>
              <p className="text-zinc-400 text-sm mb-3">
                Aún no hay etapas. Puedes cargar el flujo típico de la post de un corto —con fechas sugeridas a partir del
                fin de rodaje— y luego ajustarlo.
              </p>
              <button className={btn} onClick={cargarEtapas}>✨ Cargar etapas sugeridas</button>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {etapas.map(e => (
                <FilaEtapa key={e.id} e={e} />
              ))}
            </div>
          )}

          {/* Entregables */}
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-semibold text-zinc-200">📦 Entregables finales</h2>
            {entregables.length > 0 && (
              <span className="text-xs text-zinc-400">{listos} de {entregables.length} listos</span>
            )}
          </div>
          {entregables.length === 0 ? (
            <div className={tarjeta + ' text-center py-8'}>
              <p className="text-zinc-400 text-sm mb-3">
                La lista de archivos que debes tener al terminar: master, subtítulos, stems de audio, respaldo…
              </p>
              <button className={btn} onClick={cargarEntregables}>✨ Cargar lista sugerida</button>
            </div>
          ) : (
            <ListaEntregables entregables={entregables} />
          )}
        </>
      )}
    </>
  )
}

// --- Una etapa (editable) ---
function FilaEtapa({ e }: { e: EtapaPost }) {
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const set = (patch: Partial<EtapaPost>) => actualizar('postproduccion', e.id, patch)
  const tarde = atrasada(e)
  return (
    <div
      className="bg-zinc-900 border border-zinc-800 border-l-4 rounded-lg p-3 grid gap-2 md:grid-cols-[minmax(200px,2fr)_1fr_130px_130px_130px_24px] items-center"
      style={{ borderLeftColor: tarde ? '#f87171' : BORDE_ESTADO[e.estado] }}
    >
      <div>
        <input
          className={inpMini + ' !text-sm font-semibold'}
          value={e.nombre}
          onChange={ev => set({ nombre: ev.target.value })}
          placeholder="Nombre de la etapa"
        />
        <input
          className={inpMini + ' mt-1 !text-zinc-400'}
          value={e.notas}
          onChange={ev => set({ notas: ev.target.value })}
          placeholder="Notas: versión actual, comentarios de la revisión…"
        />
      </div>
      <label className="text-[11px] text-zinc-500">
        Responsable
        <input className={inpMini} value={e.responsable} onChange={ev => set({ responsable: ev.target.value })} placeholder="Nombre" />
      </label>
      <label className="text-[11px] text-zinc-500">
        Inicio
        <input type="date" className={inpMini} value={e.inicio} onChange={ev => set({ inicio: ev.target.value })} />
      </label>
      <label className="text-[11px] text-zinc-500">
        Entrega {tarde && <span className="text-red-400 font-semibold">· atrasada</span>}
        <input type="date" className={inpMini} value={e.entrega} onChange={ev => set({ entrega: ev.target.value })} />
      </label>
      <label className="text-[11px] text-zinc-500">
        Estado
        <select className={inpMini} value={e.estado} onChange={ev => set({ estado: ev.target.value as EstadoEtapa })}>
          {ESTADOS.map(x => <option key={x} className="bg-zinc-900">{x}</option>)}
        </select>
      </label>
      <button
        onClick={() => confirm(`¿Eliminar la etapa «${e.nombre || 'sin nombre'}»?`) && eliminar('postproduccion', e.id)}
        className="text-zinc-500 hover:text-red-400 justify-self-end"
        title="Eliminar etapa"
      >
        🗑
      </button>
    </div>
  )
}

// --- Lista de entregables ---
function ListaEntregables({ entregables }: { entregables: Entregable[] }) {
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  return (
    <div className={tarjeta}>
      <div className="space-y-1.5">
        {entregables.map(x => (
          <div key={x.id} className={`flex items-center gap-2 ${x.listo ? 'opacity-60' : ''}`}>
            <input
              type="checkbox"
              className="accent-copal-500 w-4 h-4 shrink-0"
              checked={x.listo}
              onChange={ev => actualizar('entregables', x.id, { listo: ev.target.checked })}
            />
            <input
              className={inpMini + ` flex-[2] ${x.listo ? 'line-through' : ''}`}
              value={x.nombre}
              onChange={ev => actualizar('entregables', x.id, { nombre: ev.target.value })}
              placeholder="Archivo o material"
            />
            <input
              className={inpMini + ' flex-1 !text-zinc-400'}
              value={x.formato}
              onChange={ev => actualizar('entregables', x.id, { formato: ev.target.value })}
              placeholder="Formato"
            />
            <button onClick={() => eliminar('entregables', x.id)} className="text-zinc-500 hover:text-red-400 text-sm" title="Quitar">
              🗑
            </button>
          </div>
        ))}
      </div>
      <button
        className={btnSec + ' !text-xs !px-2.5 !py-1 mt-3'}
        onClick={() => agregar('entregables', { id: uid(), nombre: '', formato: '', listo: false })}
      >
        + Entregable
      </button>
    </div>
  )
}

// --- Hoja para imprimir (calendario de post + entregables) ---
function HojaPost({ p }: { p: Proyecto }) {
  const etapas = p.postproduccion ?? []
  const entregables = p.entregables ?? []
  if (!etapas.length && !entregables.length)
    return <Vacio mensaje="Aún no hay etapas ni entregables que imprimir." />
  return (
    <div className={papel}>
      <div className="border-b-2 border-zinc-300 pb-3 mb-5 flex items-center gap-3">
        {p.logo && <img src={p.logo} alt="" className="h-12 w-auto shrink-0" />}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">🎬 {p.nombre}</p>
          <h2 className="text-2xl font-black">Calendario de postproducción</h2>
        </div>
      </div>
      {etapas.length > 0 && (
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr>{['Etapa', 'Responsable', 'Inicio', 'Entrega', 'Estado', 'Notas'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {etapas.map(e => (
              <tr key={e.id} className={atrasada(e) ? 'bg-red-50' : ''}>
                <td className={tdPapel + ' font-semibold'}>{e.nombre}</td>
                <td className={tdPapel}>{e.responsable}</td>
                <td className={tdPapel + ' whitespace-nowrap'}>{e.inicio}</td>
                <td className={tdPapel + ' whitespace-nowrap'}>{e.entrega}</td>
                <td className={tdPapel + ' whitespace-nowrap'}>
                  <Badge color={COLOR_ESTADO[e.estado]}>{e.estado}</Badge>
                </td>
                <td className={tdPapel}>{e.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {entregables.length > 0 && (
        <>
          <h3 className="font-black uppercase text-sm mb-1">Entregables finales</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr>{['✓', 'Entregable', 'Formato'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {entregables.map(x => (
                <tr key={x.id}>
                  <td className={tdPapel + ' w-8 text-center'}>{x.listo ? '✓' : '☐'}</td>
                  <td className={tdPapel}>{x.nombre}</td>
                  <td className={tdPapel}>{x.formato}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <FirmaCasa />
    </div>
  )
}
