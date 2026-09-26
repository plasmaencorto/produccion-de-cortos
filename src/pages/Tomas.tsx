// ===== Lista de Tomas (shot list) =====
// Dentro de cada escena, las tomas que dirección y fotografía planean:
// plano, ángulo, movimiento y lente. En set se van palomeando.
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Encabezado, FirmaCasa, Vacio, btn, btnSec, inp, inpMini, papel, tarjeta, tdPapel, th, thPapel } from '../components/ui'
import { aCSV, descargarArchivo, uid } from '../utils'
import { diasOrdenados, nombreLocacion, numeroDia } from '../helpers'
import type { Escena, Proyecto, Toma } from '../types'

// Sugerencias (se puede escribir cualquier otra cosa)
const PLANOS = [
  'Gran plano general',
  'Plano general',
  'Plano de conjunto',
  'Plano americano',
  'Plano medio',
  'Plano medio corto',
  'Primer plano',
  'Primerísimo primer plano',
  'Plano detalle',
  'Inserto',
  'Plano secuencia',
  'Two shot',
  'Sobre el hombro',
]
const ANGULOS = ['Normal', 'Picado', 'Contrapicado', 'Cenital', 'Nadir', 'Holandés', 'Subjetivo']
const MOVIMIENTOS = [
  'Fijo',
  'Paneo',
  'Tilt',
  'Dolly in',
  'Dolly out',
  'Travelling',
  'Grúa',
  'Steadicam / gimbal',
  'Cámara en mano',
  'Zoom',
  'Dron',
]

const tomasDe = (e: Escena) => e.tomas ?? []

// Siguiente número de toma: 1A, 1B, 1C…
function siguienteNumero(e: Escena): string {
  const n = tomasDe(e).length
  const letra = n < 26 ? String.fromCharCode(65 + n) : String(n + 1)
  return `${e.numero}${letra}`
}

export default function Tomas() {
  const p = useProyecto()
  const actualizar = useStore(s => s.actualizar)
  const [filtro, setFiltro] = useState('') // '' = todas; si no, id del día de rodaje
  const [paraImprimir, setParaImprimir] = useState(false)
  if (!p) return null

  const dias = diasOrdenados(p)
  const dia = dias.find(d => d.id === filtro)
  const escenas = dia
    ? (dia.escenaIds.map(id => p.escenas.find(e => e.id === id)).filter(Boolean) as Escena[])
    : p.escenas

  const todas = escenas.flatMap(tomasDe)
  const filmadas = todas.filter(t => t.filmada).length

  // Guarda la lista de tomas de una escena. Si ya se filmaron todas,
  // la escena pasa sola a "Filmada" (para el avance del rodaje)
  const guardarTomas = (e: Escena, tomas: Toma[]) => {
    const completa = tomas.length > 0 && tomas.every(t => t.filmada)
    actualizar('escenas', e.id, {
      tomas,
      ...(completa && e.estado === 'Sin filmar' ? { estado: 'Filmada' as const } : {}),
    })
  }

  const exportarCSV = () =>
    descargarArchivo(
      'lista-de-tomas.csv',
      aCSV([
        ['Escena', 'Toma', 'Plano', 'Ángulo', 'Movimiento', 'Lente', 'Descripción', 'Notas', 'Filmada'],
        ...escenas.flatMap(e =>
          tomasDe(e).map(t => [e.numero, t.numero, t.plano, t.angulo, t.movimiento, t.lente, t.descripcion, t.notas, t.filmada ? 'Sí' : 'No']),
        ),
      ]),
      'text/csv;charset=utf-8',
      true,
    )

  return (
    <>
      <Encabezado titulo="Lista de Tomas" subtitulo="Las tomas de cada escena: plano, ángulo, movimiento y lente">
        <select className={inp + ' !w-auto'} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="">Todas las escenas</option>
          {dias.map(d => (
            <option key={d.id} value={d.id}>
              Día {numeroDia(p, d.id)} — {d.fecha || 'sin fecha'}
            </option>
          ))}
        </select>
        <button className={btnSec} onClick={() => setParaImprimir(!paraImprimir)}>
          {paraImprimir ? '✏️ Volver a editar' : '📄 Vista para imprimir'}
        </button>
        {paraImprimir && <button className={btn} onClick={() => window.print()}>🖨 Imprimir / PDF</button>}
        <button className={btnSec} onClick={exportarCSV}>⬇ CSV</button>
      </Encabezado>

      {p.escenas.length === 0 ? (
        <Vacio mensaje="Primero agrega escenas en el Desglose de Guión (o importa tu guion)." />
      ) : escenas.length === 0 ? (
        <Vacio mensaje="Este día aún no tiene escenas asignadas en el Plan de Rodaje." />
      ) : paraImprimir ? (
        <HojaTomas p={p} escenas={escenas} titulo={dia ? `Día ${numeroDia(p, dia.id)} — ${dia.fecha}` : 'Todas las escenas'} />
      ) : (
        <>
          <p className="text-sm text-zinc-400 mb-4 print:hidden">
            {todas.length === 0
              ? 'Agrega las tomas de cada escena con «+ Toma». Al palomear todas, la escena se marca como filmada.'
              : `${filmadas} de ${todas.length} tomas filmadas`}
          </p>
          <datalist id="planos">{PLANOS.map(x => <option key={x} value={x} />)}</datalist>
          <datalist id="angulos">{ANGULOS.map(x => <option key={x} value={x} />)}</datalist>
          <datalist id="movimientos">{MOVIMIENTOS.map(x => <option key={x} value={x} />)}</datalist>
          <div className="space-y-4">
            {escenas.map(e => (
              <EscenaTomas key={e.id} p={p} e={e} onGuardar={t => guardarTomas(e, t)} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

// --- Tomas de una escena (editable) ---
function EscenaTomas({ p, e, onGuardar }: { p: Proyecto; e: Escena; onGuardar: (t: Toma[]) => void }) {
  const tomas = tomasDe(e)
  const hechas = tomas.filter(t => t.filmada).length
  const set = (id: string, patch: Partial<Toma>) => onGuardar(tomas.map(t => (t.id === id ? { ...t, ...patch } : t)))
  const agregar = () => {
    const anterior = tomas.at(-1)
    onGuardar([
      ...tomas,
      {
        id: uid(),
        numero: siguienteNumero(e),
        plano: '',
        angulo: 'Normal',
        movimiento: 'Fijo',
        lente: anterior?.lente ?? '', // casi siempre se repite el lente de la toma anterior
        descripcion: '',
        notas: '',
        filmada: false,
      },
    ])
  }

  return (
    <div className={tarjeta}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <span className="text-copal-400 font-bold">Esc. {e.numero}</span>
        <span className="text-xs text-zinc-400">
          {e.intExt} · {nombreLocacion(p, e.locacionId, e.locacionTexto) || 'Sin locación'} · {e.momento}
        </span>
        <span className="text-xs text-zinc-500 truncate flex-1 min-w-40">{e.sinopsis}</span>
        {tomas.length > 0 && (
          <span className={`text-xs ${hechas === tomas.length ? 'text-emerald-400' : 'text-zinc-400'}`}>
            {hechas}/{tomas.length} filmadas
          </span>
        )}
      </div>

      {tomas.length > 0 && (
        <div className="overflow-x-auto mb-2">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['✓', 'Toma', 'Plano', 'Ángulo', 'Movimiento', 'Lente', 'Descripción', 'Notas', ''].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tomas.map(t => (
                <tr key={t.id} className={`border-b border-zinc-800/60 ${t.filmada ? 'opacity-60' : ''}`}>
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      className="accent-copal-500 w-4 h-4"
                      checked={t.filmada}
                      onChange={ev => set(t.id, { filmada: ev.target.checked })}
                      title="Marcar como filmada"
                    />
                  </td>
                  <td className="px-1 py-1 w-16">
                    <input className={inpMini + ' font-bold'} value={t.numero} onChange={ev => set(t.id, { numero: ev.target.value })} />
                  </td>
                  <td className="px-1 py-1 w-44">
                    <input className={inpMini} list="planos" value={t.plano} onChange={ev => set(t.id, { plano: ev.target.value })} placeholder="Plano medio" />
                  </td>
                  <td className="px-1 py-1 w-32">
                    <input className={inpMini} list="angulos" value={t.angulo} onChange={ev => set(t.id, { angulo: ev.target.value })} />
                  </td>
                  <td className="px-1 py-1 w-36">
                    <input className={inpMini} list="movimientos" value={t.movimiento} onChange={ev => set(t.id, { movimiento: ev.target.value })} />
                  </td>
                  <td className="px-1 py-1 w-20">
                    <input className={inpMini} value={t.lente} onChange={ev => set(t.id, { lente: ev.target.value })} placeholder="35mm" />
                  </td>
                  <td className="px-1 py-1">
                    <input className={inpMini} value={t.descripcion} onChange={ev => set(t.id, { descripcion: ev.target.value })} placeholder="Qué se ve en la toma" />
                  </td>
                  <td className="px-1 py-1 w-40">
                    <input className={inpMini} value={t.notas} onChange={ev => set(t.id, { notas: ev.target.value })} />
                  </td>
                  <td className="px-1 py-1 w-6">
                    <button
                      onClick={() => onGuardar(tomas.filter(x => x.id !== t.id))}
                      className="text-zinc-500 hover:text-red-400"
                      title="Eliminar toma"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className={btnSec + ' !text-xs !px-2.5 !py-1'} onClick={agregar}>
        + Toma
      </button>
    </div>
  )
}

// --- Hoja para imprimir ---
function HojaTomas({ p, escenas, titulo }: { p: Proyecto; escenas: Escena[]; titulo: string }) {
  return (
    <div className={papel}>
      <div className="border-b-2 border-zinc-300 pb-3 mb-5 flex items-center gap-3">
        {p.logo && <img src={p.logo} alt="" className="h-12 w-auto shrink-0" />}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">🎬 {p.nombre}</p>
          <h2 className="text-2xl font-black">Lista de tomas</h2>
          <p className="text-sm text-zinc-600">{titulo}</p>
        </div>
      </div>
      {escenas.map(e => (
        <div key={e.id} className="mb-5 break-inside-avoid">
          <p className="font-black mb-1">
            ESC. {e.numero} · {e.intExt} · {nombreLocacion(p, e.locacionId, e.locacionTexto) || 'Sin locación'} · {e.momento}
          </p>
          {e.sinopsis && <p className="text-sm italic text-zinc-600 mb-1">{e.sinopsis}</p>}
          {tomasDe(e).length === 0 ? (
            <p className="text-sm text-zinc-500">Sin tomas planeadas.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['✓', 'Toma', 'Plano', 'Ángulo', 'Movimiento', 'Lente', 'Descripción', 'Notas'].map(h => (
                    <th key={h} className={thPapel}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tomasDe(e).map(t => (
                  <tr key={t.id}>
                    <td className={tdPapel + ' w-8 text-center'}>{t.filmada ? '✓' : '☐'}</td>
                    <td className={tdPapel + ' font-bold w-14'}>{t.numero}</td>
                    <td className={tdPapel}>{t.plano}</td>
                    <td className={tdPapel}>{t.angulo}</td>
                    <td className={tdPapel}>{t.movimiento}</td>
                    <td className={tdPapel + ' w-16'}>{t.lente}</td>
                    <td className={tdPapel}>{t.descripcion}</td>
                    <td className={tdPapel}>{t.notas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
      <FirmaCasa />
    </div>
  )
}
