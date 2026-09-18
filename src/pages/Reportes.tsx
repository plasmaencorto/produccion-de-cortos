// ===== Reportes imprimibles (PDF vía imprimir) y exportables a CSV =====
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProyecto, useStore } from '../store'
import { Encabezado, FirmaCasa, Greca, Vacio, btn, btnSec, inp, papel, tdPapel, thPapel } from '../components/ui'
import { aCSV, descargarArchivo, dinero, fechaBonita } from '../utils'
import {
  categoriasExtra,
  diasOrdenados,
  elenco,
  escenasSinAsignar,
  estimadoLinea,
  ivaLinea,
  nombreLocacion,
  numeroDia,
  personasTotal,
  plantillaPersonal,
  reporteDia,
  tecnicos,
  totalesCategoria,
  totalesProyecto,
  totalLinea,
} from '../helpers'
import { PLANTILLA_PRESUPUESTO } from '../plantillaPresupuesto'
import type { DiaRodaje, Escena, Proyecto, ReporteDia } from '../types'

const TIPOS = [
  { id: 'presupuesto', nombre: '💰 Presupuesto' },
  { id: 'desglose', nombre: '📋 Breakdown completo' },
  { id: 'diario', nombre: '🎬 Reporte diario de rodaje' },
  { id: 'contactos', nombre: '👥 Lista de contactos' },
  { id: 'personal', nombre: '🍽 Plantilla de personal' },
  { id: 'plan', nombre: '📅 Plan de rodaje resumido' },
]

export default function Reportes() {
  const p = useProyecto()
  const [params] = useSearchParams()
  const [tipo, setTipo] = useState(params.get('tipo') || 'presupuesto')
  const [diaSel, setDiaSel] = useState('')
  if (!p) return null

  const dias = diasOrdenados(p)
  const dia = p.diasRodaje.find(d => d.id === diaSel) ?? dias[0]

  // Exportaciones CSV según el reporte elegido
  const exportarCSV = () => {
    if (tipo === 'presupuesto') {
      const tot = totalesProyecto(p)
      const cats = [...PLANTILLA_PRESUPUESTO.map(c => c.categoria), ...categoriasExtra(p, PLANTILLA_PRESUPUESTO)]
      descargarArchivo(
        'reporte-presupuesto.csv',
        aCSV([
          ['Cuenta', 'Subtotal', 'IVA', 'Total', 'Real', 'Diferencia'],
          ...cats.map(cat => {
            const t = totalesCategoria(p, cat)
            return [cat, t.subtotal, t.iva, t.estimado, t.real, t.estimado - t.real]
          }),
          ['GRAN TOTAL', tot.subtotal, tot.iva, tot.estimado, tot.real, tot.estimado - tot.real],
        ]),
        'text/csv;charset=utf-8',
        true,
      )
    } else if (tipo === 'personal') {
      const dias = p.diasRodaje.length || 1
      descargarArchivo(
        'plantilla-de-personal.csv',
        aCSV([
          ['Cuenta', 'Personas', 'Comidas por día de rodaje', `Comidas en ${dias} día(s) de rodaje`],
          ...plantillaPersonal(p).map(x => [x.cuenta, x.personas, x.personas, x.personas * dias]),
          ['TOTAL', personasTotal(p), personasTotal(p), personasTotal(p) * dias],
        ]),
        'text/csv;charset=utf-8',
        true,
      )
    } else if (tipo === 'contactos') {
      descargarArchivo(
        'contactos.csv',
        aCSV([
          ['Tipo', 'Nombre', 'Personaje / Rol', 'Teléfono', 'Correo'],
          ...p.personas.map(x => [
            x.tipo === 'elenco' ? 'Elenco' : 'Técnico',
            x.nombre,
            x.tipo === 'elenco' ? x.personaje : x.rol,
            x.telefono,
            x.correo,
          ]),
        ]),
        'text/csv;charset=utf-8',
        true,
      )
    }
  }

  return (
    <>
      <Encabezado titulo="Reportes" subtitulo="Elige un reporte y usa «Imprimir / Guardar PDF» para exportarlo">
        {tipo === 'diario' && dias.length > 0 && (
          <select className={inp + ' !w-auto'} value={dia?.id || ''} onChange={e => setDiaSel(e.target.value)}>
            {dias.map(d => (
              <option key={d.id} value={d.id}>
                Día {numeroDia(p, d.id)} — {d.fecha || 'sin fecha'}
              </option>
            ))}
          </select>
        )}
        {(tipo === 'presupuesto' || tipo === 'contactos' || tipo === 'personal') && (
          <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV</button>
        )}
        <button className={btn} onClick={() => window.print()}>🖨 Imprimir / Guardar PDF</button>
      </Encabezado>

      {/* Selector de reporte */}
      <div className="flex flex-wrap gap-2 mb-5 print:hidden">
        {TIPOS.map(t => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              tipo === t.id
                ? 'bg-copal-500/20 border-copal-500 text-copal-300 font-semibold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      <div className={papel}>
        <CabeceraReporte p={p} titulo={TIPOS.find(t => t.id === tipo)?.nombre.replace(/^\S+\s/, '') || ''} />
        {tipo === 'presupuesto' && <ReportePresupuesto p={p} />}
        {tipo === 'desglose' && <ReporteDesglose p={p} />}
        {tipo === 'diario' && (dia ? <ReporteDiario p={p} dia={dia} /> : <p className="text-zinc-500">Primero crea días de rodaje.</p>)}
        {tipo === 'contactos' && <ReporteContactos p={p} />}
        {tipo === 'personal' && <ReportePersonal p={p} />}
        {tipo === 'plan' && <ReportePlan p={p} />}
        <FirmaCasa />
      </div>
    </>
  )
}

function CabeceraReporte({ p, titulo }: { p: Proyecto; titulo: string }) {
  return (
    <div className="pb-3 mb-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          {p.logo && <img src={p.logo} alt="" className="h-12 w-auto shrink-0" />}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">🎬 {p.nombre}</p>
            <h2 className="text-2xl font-black">{titulo}</h2>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Generado el {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <Greca />
    </div>
  )
}

// --- Reporte de presupuesto: resumen por cuenta + detalle (con IVA) ---
function ReportePresupuesto({ p }: { p: Proyecto }) {
  const tot = totalesProyecto(p)
  const cats = [...PLANTILLA_PRESUPUESTO.map(c => c.categoria), ...categoriasExtra(p, PLANTILLA_PRESUPUESTO)]
  return (
    <>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr>{['Cuenta', 'Subtotal', 'IVA', 'Total', 'Real', 'Diferencia'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {cats.map(cat => {
            const t = totalesCategoria(p, cat)
            const d = t.estimado - t.real
            if (!t.estimado && !t.real) return null // omite cuentas vacías en el reporte
            return (
              <tr key={cat}>
                <td className={tdPapel + ' font-semibold'}>{cat}</td>
                <td className={tdPapel + ' text-right'}>{dinero(t.subtotal)}</td>
                <td className={tdPapel + ' text-right'}>{dinero(t.iva)}</td>
                <td className={tdPapel + ' text-right font-semibold'}>{dinero(t.estimado)}</td>
                <td className={tdPapel + ' text-right'}>{dinero(t.real)}</td>
                <td className={`${tdPapel} text-right font-semibold ${d < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{dinero(d)}</td>
              </tr>
            )
          })}
          <tr className="bg-copal-100">
            <td className={tdPapel + ' font-black'}>GRAN TOTAL</td>
            <td className={tdPapel + ' text-right font-black'}>{dinero(tot.subtotal)}</td>
            <td className={tdPapel + ' text-right font-black'}>{dinero(tot.iva)}</td>
            <td className={tdPapel + ' text-right font-black'}>{dinero(tot.estimado)}</td>
            <td className={tdPapel + ' text-right font-black'}>{dinero(tot.real)}</td>
            <td className={`${tdPapel} text-right font-black ${tot.estimado - tot.real < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {dinero(tot.estimado - tot.real)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Detalle por línea */}
      {p.presupuesto.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Subcuenta', 'Descripción', 'Cant.', '×', 'Tarifa', 'Subtotal', 'IVA', 'Total', 'Real', 'Proveedor'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {p.presupuesto.map(l => (
              <tr key={l.id}>
                <td className={tdPapel}>{l.subcategoria}</td>
                <td className={tdPapel}>{l.descripcion}</td>
                <td className={tdPapel + ' text-right'}>{l.cantidad} {l.unidad}</td>
                <td className={tdPapel + ' text-right'}>{l.por ?? 1}</td>
                <td className={tdPapel + ' text-right'}>{dinero(l.tarifa)}</td>
                <td className={tdPapel + ' text-right'}>{dinero(estimadoLinea(l))}</td>
                <td className={tdPapel + ' text-right'}>{dinero(ivaLinea(l))}</td>
                <td className={tdPapel + ' text-right font-semibold'}>{dinero(totalLinea(l))}</td>
                <td className={tdPapel + ' text-right'}>{dinero(l.real)}</td>
                <td className={tdPapel}>{l.proveedor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

// --- Breakdown completo: todas las escenas con sus elementos ---
function ReporteDesglose({ p }: { p: Proyecto }) {
  if (p.escenas.length === 0) return <p className="text-zinc-500">No hay escenas en el desglose.</p>
  const dato = (etiqueta: string, valor: string) =>
    valor ? (
      <p className="text-sm">
        <b>{etiqueta}:</b> {valor}
      </p>
    ) : null
  return (
    <div className="space-y-4">
      {p.escenas.map(e => (
        <div key={e.id} className="border border-zinc-300 rounded p-3 break-inside-avoid">
          <p className="font-black">
            ESC. {e.numero} · {e.intExt} · {nombreLocacion(p, e.locacionId, e.locacionTexto) || 'Sin locación'} · {e.momento}
            <span className="float-right text-xs font-normal text-zinc-500">{e.estado}{e.paginas ? ` · ${e.paginas} pág.` : ''}</span>
          </p>
          {e.sinopsis && <p className="text-sm italic text-zinc-600 mt-1">{e.sinopsis}</p>}
          <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
            {dato('Personajes', e.personajeIds.map(id => p.personas.find(x => x.id === id)?.personaje || '').filter(Boolean).join(', '))}
            {dato('Props', e.props.join(', '))}
            {dato('Vestuario', e.vestuario)}
            {dato('Maquillaje / FX', e.maquillaje)}
            {dato('Vehículos', e.vehiculos)}
            {dato('Sonido en set', e.sonido)}
            {dato('Notas', e.notas)}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Reporte diario de producción: horarios reales + avance de escenas ---
// (basado en el machote profesional de reporte de producción)
function ReporteDiario({ p, dia }: { p: Proyecto; dia: DiaRodaje }) {
  const setReporteDiario = useStore(s => s.setReporteDiario)
  const r = reporteDia(p, dia.id)
  const escenas = dia.escenaIds.map(id => p.escenas.find(e => e.id === id)).filter(Boolean) as Escena[]
  const filmadas = escenas.filter(e => e.estado !== 'Sin filmar')
  const paginasDia = escenas.reduce((t, e) => t + (e.paginas || 0), 0)
  const totalFilmadas = p.escenas.filter(e => e.estado !== 'Sin filmar').length
  const pendientes = escenasSinAsignar(p).length
  const n = numeroDia(p, dia.id)

  const HORARIOS: { campo: keyof ReporteDia; etiqueta: string }[] = [
    { campo: 'llamado', etiqueta: 'Llamado general' },
    { campo: 'primeraToma', etiqueta: '1a toma' },
    { campo: 'corteComer', etiqueta: 'Corte a comer' },
    { campo: 'regresoComer', etiqueta: 'Regreso' },
    { campo: 'primeraTomaRegreso', etiqueta: '1a toma regreso' },
    { campo: 'corteSet', etiqueta: 'Corte en set' },
    { campo: 'corteLocacion', etiqueta: 'Corte locación' },
  ]

  return (
    <>
      <p className="mb-3">
        <b>Día {n} de {p.diasRodaje.length}</b> — <span className="capitalize">{fechaBonita(dia.fecha)}</span> ·{' '}
        {nombreLocacion(p, dia.locacionId) || 'Sin locación'} · plan {dia.horaInicio}–{dia.horaFin}
      </p>

      {/* Horarios reales del día */}
      <h4 className="font-black uppercase text-xs mb-1">Horarios reales</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {HORARIOS.map(h => (
          <label key={h.campo} className="text-xs">
            {h.etiqueta}
            <input
              className="w-full border border-zinc-300 rounded px-2 py-1 text-sm bg-white"
              value={r[h.campo]}
              onChange={e => setReporteDiario(dia.id, { [h.campo]: e.target.value } as Partial<ReporteDia>)}
              placeholder="00:00"
            />
          </label>
        ))}
      </div>

      {/* Avance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm mb-4">
        <div className="border border-zinc-300 rounded p-2"><b>{escenas.length}</b><br />escenas del día</div>
        <div className="border border-zinc-300 rounded p-2"><b>{filmadas.length}</b><br />filmadas / aprobadas</div>
        <div className="border border-zinc-300 rounded p-2"><b>{paginasDia.toFixed(2)}</b><br />páginas del día</div>
        <div className="border border-zinc-300 rounded p-2"><b>{totalFilmadas} / {p.escenas.length}</b><br />avance total{pendientes ? ` (${pendientes} sin asignar)` : ''}</div>
      </div>

      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>{['Esc.', 'Set', 'Sinopsis', 'Pág.', 'Estado'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {escenas.map(e => (
            <tr key={e.id}>
              <td className={tdPapel + ' font-bold w-14'}>{e.numero}</td>
              <td className={tdPapel + ' whitespace-nowrap'}>{e.intExt}. {nombreLocacion(p, e.locacionId, e.locacionTexto)}</td>
              <td className={tdPapel}>{e.sinopsis}</td>
              <td className={tdPapel + ' w-14 text-right'}>{e.paginas || ''}</td>
              <td className={tdPapel + ' w-28'}>{e.estado}</td>
            </tr>
          ))}
          {escenas.length === 0 && (
            <tr><td colSpan={5} className={tdPapel + ' text-center text-zinc-500'}>Sin escenas asignadas a este día</td></tr>
          )}
        </tbody>
      </table>
      <label className="block text-sm">
        <b>Notas del día (tomas, incidencias, pendientes):</b>
        <textarea
          className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm bg-white mt-1"
          rows={5}
          value={r.notas}
          onChange={e => setReporteDiario(dia.id, { notas: e.target.value })}
          placeholder="Escribe aquí las notas del día…"
        />
      </label>
    </>
  )
}

// --- Lista de contactos ---
function ReporteContactos({ p }: { p: Proyecto }) {
  if (p.personas.length === 0) return <p className="text-zinc-500">No hay personas registradas.</p>
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>{['Tipo', 'Nombre', 'Personaje / Rol', 'Teléfono', 'Correo'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {p.personas.map(x => (
          <tr key={x.id}>
            <td className={tdPapel}>{x.tipo === 'elenco' ? 'Elenco' : 'Técnico'}</td>
            <td className={tdPapel + ' font-semibold'}>{x.nombre}</td>
            <td className={tdPapel}>{x.tipo === 'elenco' ? x.personaje : x.rol}</td>
            <td className={tdPapel}>{x.telefono}</td>
            <td className={tdPapel}>{x.correo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// --- Plantilla de personal: cuánta gente lleva la producción ---
// (sirve para cotizar catering, radios, transporte y seguros)
function ReportePersonal({ p }: { p: Proyecto }) {
  const plantilla = plantillaPersonal(p)
  const total = personasTotal(p)
  const dias = p.diasRodaje.length
  if (total === 0)
    return (
      <p className="text-zinc-500">
        Aún no hay personal capturado en el presupuesto. Llena las cuentas de personal (1000–1600) y aquí verás la
        plantilla completa.
      </p>
    )
  return (
    <>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            {['Cuenta / departamento', 'Personas', 'Comidas por día', dias ? `Comidas en ${dias} día(s)` : 'Comidas totales'].map(h => (
              <th key={h} className={thPapel}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plantilla.map(x => (
            <tr key={x.cuenta}>
              <td className={tdPapel + ' font-semibold'}>{x.cuenta}</td>
              <td className={tdPapel + ' text-right'}>{x.personas}</td>
              <td className={tdPapel + ' text-right'}>{x.personas}</td>
              <td className={tdPapel + ' text-right'}>{x.personas * (dias || 1)}</td>
            </tr>
          ))}
          <tr className="bg-copal-100">
            <td className={tdPapel + ' font-black'}>TOTAL</td>
            <td className={tdPapel + ' text-right font-black'}>{total}</td>
            <td className={tdPapel + ' text-right font-black'}>{total}</td>
            <td className={tdPapel + ' text-right font-black'}>{total * (dias || 1)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="border border-zinc-300 rounded p-2 text-center">
          <p className="text-xs text-zinc-500">Radios / walkies sugeridos</p>
          <p className="text-lg font-bold">{Math.ceil(total * 0.6)}</p>
          <p className="text-[11px] text-zinc-500">≈ 60% del equipo</p>
        </div>
        <div className="border border-zinc-300 rounded p-2 text-center">
          <p className="text-xs text-zinc-500">Vans de 8 plazas</p>
          <p className="text-lg font-bold">{Math.ceil(total / 8)}</p>
          <p className="text-[11px] text-zinc-500">si todos se transportan</p>
        </div>
        <div className="border border-zinc-300 rounded p-2 text-center">
          <p className="text-xs text-zinc-500">En el directorio</p>
          <p className="text-lg font-bold">{p.personas.length}</p>
          <p className="text-[11px] text-zinc-500">
            {elenco(p).length} elenco · {tecnicos(p).length} técnicos
          </p>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        Las cifras de radios y vans son sugerencias de cálculo rápido; ajústalas según tu producción.
      </p>
    </>
  )
}

// --- Plan de rodaje resumido ---
function ReportePlan({ p }: { p: Proyecto }) {
  const dias = diasOrdenados(p)
  if (dias.length === 0) return <p className="text-zinc-500">No hay días de rodaje.</p>
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>{['Jornada', 'Fecha', 'Locación', 'Horario', 'Escenas', 'Páginas', 'Notas'].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {dias.map(d => (
          <tr key={d.id}>
            <td className={tdPapel + ' font-bold whitespace-nowrap'}>Día {numeroDia(p, d.id)}</td>
            <td className={tdPapel + ' capitalize'}>{fechaBonita(d.fecha)}</td>
            <td className={tdPapel}>{nombreLocacion(p, d.locacionId)}</td>
            <td className={tdPapel + ' whitespace-nowrap'}>{d.horaInicio}–{d.horaFin}</td>
            <td className={tdPapel}>
              {d.escenaIds.map(id => p.escenas.find(e => e.id === id)?.numero).filter(Boolean).join(', ')}
            </td>
            <td className={tdPapel}>{d.paginas}</td>
            <td className={tdPapel}>{d.notas}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
