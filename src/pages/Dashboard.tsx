// ===== Dashboard: vista general del proyecto =====
import { Link } from 'react-router-dom'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, inp, tarjeta } from '../components/ui'
import { dinero, fechaBonita } from '../utils'
import {
  diasOrdenados,
  elenco,
  escenasEnVariosDias,
  escenasSinAsignar,
  nombreLocacion,
  numeroDia,
  personasTotal,
  plantillaPersonal,
  semaforo,
  tecnicos,
  totalesCategoria,
  totalesProyecto,
} from '../helpers'
import { PLANTILLA_PRESUPUESTO } from '../plantillaPresupuesto'
import type { EstadoProyecto } from '../types'

const ESTADOS: EstadoProyecto[] = ['En Preproducción', 'En Rodaje', 'En Postproducción', 'Entregado']

export default function Dashboard() {
  const p = useProyecto()
  const actualizar = useStore(s => s.actualizarActivo)
  if (!p) return null

  // Progreso de rodaje
  const filmadas = p.escenas.filter(e => e.estado !== 'Sin filmar').length
  const pct = p.escenas.length ? Math.round((filmadas / p.escenas.length) * 100) : 0

  // Presupuesto
  const tot = totalesProyecto(p)
  const dif = tot.estimado - tot.real

  // Próximos 7 días
  const hoy = new Date().toISOString().slice(0, 10)
  const en7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const proximos = diasOrdenados(p).filter(d => d.fecha && d.fecha >= hoy && d.fecha <= en7)

  // Alertas del proyecto
  const alertas: { texto: string; ruta: string }[] = []
  const sinAsignar = escenasSinAsignar(p)
  if (sinAsignar.length)
    alertas.push({ texto: `${sinAsignar.length} escena(s) sin asignar a un día de rodaje`, ruta: 'plan' })
  const dobles = escenasEnVariosDias(p)
  if (dobles.length)
    alertas.push({
      texto: `Escena(s) ${dobles.map(e => e.numero).join(', ')} asignada(s) a más de un día`,
      ruta: 'plan',
    })
  PLANTILLA_PRESUPUESTO.forEach(c => {
    const t = totalesCategoria(p, c.categoria)
    if ((t.estimado || t.real) && semaforo(t.estimado, t.real) === 'rojo')
      alertas.push({ texto: `Presupuesto en rojo: ${c.categoria}`, ruta: 'presupuesto' })
  })
  const sinConfirmar = elenco(p).filter(x => x.contrato === 'Sin confirmar')
  if (sinConfirmar.length)
    alertas.push({ texto: `${sinConfirmar.length} persona(s) del elenco sin confirmar`, ruta: 'personas' })

  // Personal: lo que contempla el presupuesto vs. lo que ya está en el directorio
  const gentePresupuesto = personasTotal(p)
  const plantilla = plantillaPersonal(p)
  const enDirectorio = p.personas.length
  const faltanPorRegistrar = gentePresupuesto - enDirectorio
  if (gentePresupuesto > 0 && faltanPorRegistrar > 0)
    alertas.push({
      texto: `El presupuesto contempla ${gentePresupuesto} personas y sólo tienes ${enDirectorio} en el directorio`,
      ruta: 'personas',
    })

  return (
    <>
      <Encabezado titulo={p.nombre} subtitulo="Panel general del proyecto">
        <select
          className={inp + ' !w-auto'}
          value={p.estado}
          onChange={e => actualizar({ estado: e.target.value as EstadoProyecto })}
        >
          {ESTADOS.map(x => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Encabezado>

      {/* Información general editable */}
      <div className={tarjeta + ' mb-4'}>
        <h2 className="font-semibold text-zinc-200 mb-3">Información general</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Campo etiqueta="Nombre del cortometraje">
            <input className={inp} value={p.nombre} onChange={e => actualizar({ nombre: e.target.value })} />
          </Campo>
          <Campo etiqueta="Director/a">
            <input className={inp} value={p.director} onChange={e => actualizar({ director: e.target.value })} />
          </Campo>
          <Campo etiqueta="Productor/a">
            <input className={inp} value={p.productor} onChange={e => actualizar({ productor: e.target.value })} />
          </Campo>
          <Campo etiqueta="1er Asistente de Dirección">
            <input className={inp} value={p.primerAD} onChange={e => actualizar({ primerAD: e.target.value })} />
          </Campo>
          <Campo etiqueta="Inicio de rodaje">
            <input type="date" className={inp} value={p.inicioRodaje} onChange={e => actualizar({ inicioRodaje: e.target.value })} />
          </Campo>
          <Campo etiqueta="Fin de rodaje">
            <input type="date" className={inp} value={p.finRodaje} onChange={e => actualizar({ finRodaje: e.target.value })} />
          </Campo>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Progreso de escenas */}
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">🎬 Progreso de rodaje</h2>
          <p className="text-3xl font-bold text-amber-400">
            {filmadas} <span className="text-base font-normal text-zinc-400">de {p.escenas.length} escenas filmadas</span>
          </p>
          <div className="h-3 bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: pct + '%' }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{pct}% completado</p>
        </div>

        {/* Resumen de presupuesto */}
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">💰 Presupuesto</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-zinc-400">Aprobado</p>
              <p className="text-lg font-bold text-zinc-100">{dinero(tot.estimado)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Gastado</p>
              <p className="text-lg font-bold text-zinc-100">{dinero(tot.real)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Diferencia</p>
              <p className={`text-lg font-bold ${dif < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{dinero(dif)}</p>
            </div>
          </div>
          <Link to={`/p/${p.id}/presupuesto`} className="block text-xs text-amber-400 hover:underline mt-3">
            Ver presupuesto completo →
          </Link>
        </div>

        {/* Personal de la producción (sale del presupuesto) */}
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">👥 Personal de la producción</h2>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-3xl font-bold text-amber-400">
                {gentePresupuesto} <span className="text-base font-normal text-zinc-400">personas en presupuesto</span>
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                En el directorio: {elenco(p).length} de elenco · {tecnicos(p).length} de equipo técnico
                {faltanPorRegistrar > 0 && (
                  <span className="text-yellow-300"> · faltan {faltanPorRegistrar} por registrar</span>
                )}
              </p>
            </div>
          </div>

          {plantilla.length === 0 ? (
            <p className="text-xs text-zinc-500 mt-3">
              Aún no hay personal capturado. Al llenar las cuentas de personal (1000–1600) del presupuesto, aquí verás
              cuánta gente lleva la producción.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                {plantilla.map(x => (
                  <li key={x.cuenta} className="flex justify-between gap-3 text-sm border-b border-zinc-800/60 py-0.5">
                    <span className="text-zinc-300 truncate">{x.cuenta}</span>
                    <b className="text-zinc-100 whitespace-nowrap">{x.personas}</b>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-zinc-500 mt-2">
                🍽 Sirve para pedir catering, radios y transporte. Ver el detalle en{' '}
                <Link to={`/p/${p.id}/reportes?tipo=personal`} className="text-amber-400 hover:underline">
                  Reportes → Plantilla de personal
                </Link>
                .
              </p>
            </>
          )}
        </div>

        {/* Próximos eventos */}
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">📅 Próximos 7 días</h2>
          {proximos.length === 0 && <p className="text-sm text-zinc-500">Sin días de rodaje esta semana.</p>}
          <ul className="space-y-2">
            {proximos.map(d => (
              <li key={d.id} className="flex items-center gap-2 text-sm">
                <Badge color="ambar">Día {numeroDia(p, d.id)}</Badge>
                <span className="text-zinc-300">{fechaBonita(d.fecha)}</span>
                <span className="text-zinc-500 text-xs truncate">
                  {nombreLocacion(p, d.locacionId)} · {d.escenaIds.length} escena(s)
                </span>
              </li>
            ))}
          </ul>
          <Link to={`/p/${p.id}/plan`} className="block text-xs text-amber-400 hover:underline mt-3">
            Ver plan de rodaje →
          </Link>
        </div>

        {/* Alertas */}
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">⚠️ Alertas</h2>
          {alertas.length === 0 && <p className="text-sm text-emerald-400">Todo en orden ✓</p>}
          <ul className="space-y-1.5">
            {alertas.map((a, i) => (
              <li key={i}>
                <Link to={`/p/${p.id}/${a.ruta}`} className="text-sm text-red-300 hover:text-red-200 hover:underline">
                  • {a.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
