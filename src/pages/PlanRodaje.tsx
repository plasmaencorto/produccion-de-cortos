// ===== Plan de Rodaje: días de rodaje con escenas arrastrables =====
import { useState } from 'react'
import { addDays, eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Vacio, btn, btnPeligro, btnSec, inp, tarjeta } from '../components/ui'
import { uid } from '../utils'
import { alertaJornada, diasOrdenados, escenasEnVariosDias, escenasSinAsignar, nombreLocacion, numeroDia } from '../helpers'
import type { DiaRodaje, Escena, Proyecto } from '../types'

// Lee los datos de la escena que se está arrastrando
const leerDrag = (ev: React.DragEvent): { escenaId: string; origen: string | null } | null => {
  try {
    return JSON.parse(ev.dataTransfer.getData('text/plain'))
  } catch {
    return null
  }
}

export default function PlanRodaje() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const mutarActivo = useStore(s => s.mutarActivo)
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista')
  if (!p) return null

  const dias = diasOrdenados(p)
  const sinAsignar = escenasSinAsignar(p)
  const dobles = new Set(escenasEnVariosDias(p).map(e => e.id))

  const agregarDia = () => {
    const ultima = dias.map(d => d.fecha).filter(Boolean).sort().at(-1)
    const fecha = ultima ? format(addDays(parseISO(ultima), 1), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    agregar('diasRodaje', {
      id: uid(),
      fecha,
      locacionId: '',
      escenaIds: [],
      paginas: '',
      horaInicio: '07:00',
      horaFin: '19:00',
      notas: '',
    })
  }

  // Mueve (o inserta) una escena a un día, quitándola del día de origen
  const moverEscena = (escenaId: string, origenId: string | null, destinoId: string, indice?: number) =>
    mutarActivo(pr => ({
      ...pr,
      diasRodaje: pr.diasRodaje.map(d => {
        let ids = [...d.escenaIds]
        if (d.id === origenId) ids = ids.filter(x => x !== escenaId)
        if (d.id === destinoId) {
          ids = ids.filter(x => x !== escenaId)
          const i = indice === undefined ? ids.length : Math.min(indice, ids.length)
          ids.splice(i, 0, escenaId)
        }
        return { ...d, escenaIds: ids }
      }),
    }))

  const quitarEscena = (diaId: string, escenaId: string) => {
    const d = p.diasRodaje.find(x => x.id === diaId)
    if (d) actualizar('diasRodaje', diaId, { escenaIds: d.escenaIds.filter(x => x !== escenaId) })
  }

  return (
    <>
      <Encabezado titulo="Plan de Rodaje" subtitulo="Arrastra escenas entre días para organizarlas">
        <button className={btnSec} onClick={() => setVista(vista === 'lista' ? 'calendario' : 'lista')}>
          {vista === 'lista' ? '📆 Ver calendario' : '📋 Ver lista'}
        </button>
        <button className={btn} onClick={agregarDia}>+ Agregar día de rodaje</button>
      </Encabezado>

      {dobles.size > 0 && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
          ⚠️ Hay escenas asignadas a más de un día:{' '}
          {escenasEnVariosDias(p).map(e => `Esc. ${e.numero}`).join(', ')}
        </div>
      )}

      {vista === 'calendario' ? (
        <Calendario p={p} dias={dias} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px] items-start">
          {/* Columna de días */}
          <div className="space-y-4">
            {dias.length === 0 && <Vacio mensaje="Aún no hay días de rodaje. Agrega el primero con el botón de arriba." />}
            {dias.map(d => (
              <TarjetaDia
                key={d.id}
                p={p}
                dia={d}
                numero={numeroDia(p, d.id)}
                dobles={dobles}
                onMover={moverEscena}
                onQuitar={quitarEscena}
              />
            ))}
          </div>

          {/* Escenas sin asignar */}
          <div className={tarjeta + ' sticky top-4'}>
            <h2 className="font-semibold text-zinc-200 mb-2 text-sm">🎬 Escenas sin asignar ({sinAsignar.length})</h2>
            {sinAsignar.length === 0 && <p className="text-xs text-zinc-500">Todas las escenas están asignadas ✓</p>}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {sinAsignar.map(e => (
                <div
                  key={e.id}
                  draggable
                  onDragStart={ev => ev.dataTransfer.setData('text/plain', JSON.stringify({ escenaId: e.id, origen: null }))}
                  className="bg-zinc-800/70 border border-zinc-700 rounded px-2 py-1.5 cursor-grab text-xs"
                  title="Arrastra esta escena a un día de rodaje"
                >
                  <span className="text-amber-300 font-semibold">Esc. {e.numero}</span>{' '}
                  <span className="text-zinc-400">{e.intExt} · {e.momento}</span>
                  <p className="text-zinc-400 truncate">{e.sinopsis}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// --- Tarjeta de un día de rodaje ---
function TarjetaDia({
  p,
  dia,
  numero,
  dobles,
  onMover,
  onQuitar,
}: {
  p: Proyecto
  dia: DiaRodaje
  numero: number
  dobles: Set<string>
  onMover: (escenaId: string, origen: string | null, destino: string, indice?: number) => void
  onQuitar: (diaId: string, escenaId: string) => void
}) {
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const escenas = dia.escenaIds.map(id => p.escenas.find(e => e.id === id)).filter(Boolean) as Escena[]

  return (
    <div
      className={tarjeta}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        const d = leerDrag(e)
        if (d) onMover(d.escenaId, d.origen, dia.id)
      }}
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-amber-400 font-bold text-lg">Día {numero}</span>
        <input
          type="date"
          className={inp + ' !w-auto'}
          value={dia.fecha}
          onChange={e => actualizar('diasRodaje', dia.id, { fecha: e.target.value })}
        />
        <span className="flex-1" />
        <button
          className={btnPeligro + ' !px-2 !py-1 !text-xs'}
          onClick={() => {
            if (confirm(`¿Eliminar el Día ${numero}? Las escenas volverán a "sin asignar".`)) eliminar('diasRodaje', dia.id)
          }}
        >
          🗑 Eliminar día
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-3">
        <Campo etiqueta="Locación principal">
          <select className={inp} value={dia.locacionId} onChange={e => actualizar('diasRodaje', dia.id, { locacionId: e.target.value })}>
            <option value="">— Elegir —</option>
            {p.locaciones.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Hora de inicio">
          <input type="time" className={inp} value={dia.horaInicio} onChange={e => actualizar('diasRodaje', dia.id, { horaInicio: e.target.value })} />
        </Campo>
        <Campo etiqueta="Hora de fin">
          <input type="time" className={inp} value={dia.horaFin} onChange={e => actualizar('diasRodaje', dia.id, { horaFin: e.target.value })} />
        </Campo>
        <Campo etiqueta="Páginas de guión">
          <input className={inp} value={dia.paginas} onChange={e => actualizar('diasRodaje', dia.id, { paginas: e.target.value })} placeholder="3 ½" />
        </Campo>
      </div>

      {/* Alerta de jornada laboral (reglas de sindicatos: máx. 12 h diurna / 10 h nocturna) */}
      {alertaJornada(dia.horaInicio, dia.horaFin) && (
        <p className="bg-red-900/30 border border-red-800 text-red-300 text-xs rounded px-2.5 py-1.5 mb-3">
          ⚠️ {alertaJornada(dia.horaInicio, dia.horaFin)}
        </p>
      )}

      {/* Escenas del día (arrastrables) */}
      <div className="space-y-1.5">
        {escenas.map((e, i) => (
          <div
            key={e.id}
            draggable
            onDragStart={ev => ev.dataTransfer.setData('text/plain', JSON.stringify({ escenaId: e.id, origen: dia.id }))}
            onDragOver={ev => ev.preventDefault()}
            onDrop={ev => {
              ev.stopPropagation()
              const d = leerDrag(ev)
              if (d) onMover(d.escenaId, d.origen, dia.id, i)
            }}
            className="flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded px-2 py-1.5 cursor-grab"
          >
            <span className="text-zinc-500">⠿</span>
            <span className="text-amber-300 font-semibold text-sm whitespace-nowrap">Esc. {e.numero}</span>
            <span className="text-xs text-zinc-400 whitespace-nowrap">{e.intExt} · {e.momento}</span>
            <span className="text-xs text-zinc-300 truncate flex-1">{e.sinopsis}</span>
            {dobles.has(e.id) && <Badge color="rojo">⚠ en 2+ días</Badge>}
            <button onClick={() => onQuitar(dia.id, e.id)} className="text-zinc-500 hover:text-red-400 text-xs" title="Quitar del día">
              ✕
            </button>
          </div>
        ))}
        {escenas.length === 0 && (
          <p className="text-xs text-zinc-500 border border-dashed border-zinc-700 rounded p-3 text-center">
            Arrastra escenas aquí, o usa el selector de abajo
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 mt-3">
        <select
          className={inp}
          value=""
          onChange={e => e.target.value && onMover(e.target.value, null, dia.id)}
        >
          <option value="">+ Agregar escena al día…</option>
          {p.escenas
            .filter(x => !dia.escenaIds.includes(x.id))
            .map(x => (
              <option key={x.id} value={x.id}>
                Esc. {x.numero} — {x.sinopsis.slice(0, 50)}
              </option>
            ))}
        </select>
        <input
          className={inp}
          value={dia.notas}
          onChange={e => actualizar('diasRodaje', dia.id, { notas: e.target.value })}
          placeholder="Notas especiales del día…"
        />
      </div>
    </div>
  )
}

// --- Vista de calendario semanal ---
function Calendario({ p, dias }: { p: Proyecto; dias: DiaRodaje[] }) {
  const conFecha = dias.filter(d => d.fecha)
  if (conFecha.length === 0)
    return <Vacio mensaje="Agrega días de rodaje con fecha para verlos en el calendario." />

  const inicio = startOfWeek(parseISO(conFecha[0].fecha), { weekStartsOn: 1 })
  const fin = endOfWeek(parseISO(conFecha[conFecha.length - 1].fecha), { weekStartsOn: 1 })
  const todos = eachDayOfInterval({ start: inicio, end: fin })
  const semanas: Date[][] = []
  for (let i = 0; i < todos.length; i += 7) semanas.push(todos.slice(i, i + 7))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs text-zinc-500 font-semibold py-1">{d}</div>
          ))}
        </div>
        {semanas.map((sem, i) => (
          <div key={i} className="grid grid-cols-7 gap-1 mb-1">
            {sem.map(fecha => {
              const f = format(fecha, 'yyyy-MM-dd')
              const dr = conFecha.find(d => d.fecha === f)
              return (
                <div
                  key={f}
                  className={`min-h-24 rounded-lg border p-1.5 ${
                    dr ? 'border-amber-600/60 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  <p className="text-[11px] text-zinc-500">{format(fecha, 'd MMM', { locale: es })}</p>
                  {dr && (
                    <>
                      <p className="text-xs font-bold text-amber-300">Día {numeroDia(p, dr.id)}</p>
                      <p className="text-[11px] text-zinc-300 truncate">{nombreLocacion(p, dr.locacionId) || 'Sin locación'}</p>
                      <p className="text-[11px] text-zinc-400">{dr.escenaIds.length} escena(s)</p>
                      <p className="text-[11px] text-zinc-500">{dr.horaInicio}–{dr.horaFin}</p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
