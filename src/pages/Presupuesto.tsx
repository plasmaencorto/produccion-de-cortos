// ===== Presupuesto con cuentas numeradas, IVA y semáforo =====
// Formato del machote profesional: cantidad × multiplicador (×) × tarifa = subtotal (+ IVA 16%)
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProyecto, useStore } from '../store'
import { Encabezado, btnSec, inpMini, tarjeta, td, th } from '../components/ui'
import { aCSV, descargarArchivo, dinero, num, uid } from '../utils'
import {
  categoriasExtra,
  esCuentaDePersonal,
  estimadoLinea,
  ivaLinea,
  personasCategoria,
  personasLinea,
  personasTotal,
  semaforo,
  subcategoriasDe,
  totalesCategoria,
  totalesProyecto,
  totalLinea,
} from '../helpers'
import { PLANTILLA_PRESUPUESTO } from '../plantillaPresupuesto'
import type { Proyecto } from '../types'

export default function Presupuesto() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  if (!p) return null

  const tot = totalesProyecto(p)
  const dif = tot.estimado - tot.real
  // Categorías de proyectos viejos que no están en la plantilla nueva
  const extras = categoriasExtra(p, PLANTILLA_PRESUPUESTO)

  const agregarLinea = (categoria: string, subcategoria: string) =>
    agregar('presupuesto', {
      id: uid(),
      categoria,
      subcategoria,
      descripcion: '',
      cantidad: 1,
      unidad: 'días',
      por: 1,
      tarifa: 0,
      iva: false,
      real: 0,
      proveedor: '',
      notas: '',
    })

  const exportarCSV = () => {
    const filas: (string | number)[][] = [
      ['Cuenta', 'Subcuenta', 'Descripción', 'Cantidad', 'Unidad', '×', 'Personas', 'Tarifa', 'Subtotal', 'IVA', 'Total', 'Real', 'Diferencia', 'Proveedor', 'Notas / factura'],
      ...p.presupuesto.map(l => [
        l.categoria, l.subcategoria, l.descripcion, l.cantidad, l.unidad, l.por ?? 1, personasLinea(l), l.tarifa,
        estimadoLinea(l), ivaLinea(l), totalLinea(l), l.real, totalLinea(l) - l.real, l.proveedor, l.notas,
      ]),
      [],
      ['GRAN TOTAL', '', '', '', '', '', personasTotal(p), '', tot.subtotal, tot.iva, tot.estimado, tot.real, dif, '', ''],
    ]
    descargarArchivo('presupuesto.csv', aCSV(filas), 'text/csv;charset=utf-8', true)
  }

  return (
    <>
      <Encabezado titulo="Presupuesto" subtitulo="Cuentas numeradas estilo industria · cantidad × multiplicador × tarifa, con IVA opcional">
        <button className={btnSec} onClick={() => window.location.reload()}>🔄 Refrescar</button>
        <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV (Excel)</button>
        <Link className={btnSec} to={`/p/${p.id}/reportes?tipo=presupuesto`}>🖨 Imprimir / PDF</Link>
      </Encabezado>

      {/* Gran total */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Subtotal estimado</p>
          <p className="text-xl font-bold text-zinc-100">{dinero(tot.subtotal)}</p>
          <p className="text-[11px] text-zinc-500">+ IVA {dinero(tot.iva)}</p>
        </div>
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Total estimado (con IVA)</p>
          <p className="text-xl font-bold text-copal-300">{dinero(tot.estimado)}</p>
        </div>
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Total gastado</p>
          <p className="text-xl font-bold text-zinc-100">{dinero(tot.real)}</p>
        </div>
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Diferencia</p>
          <p className={`text-xl font-bold ${dif < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{dinero(dif)}</p>
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        👥 Personal contemplado en el presupuesto: <b className="text-zinc-300">{personasTotal(p)} personas</b>. Ajusta la
        columna 👤 en las cuentas de personal (1000–1600); ese número alimenta el catering, los radios y el transporte.
      </p>

      {PLANTILLA_PRESUPUESTO.map(c => (
        <Categoria key={c.categoria} p={p} categoria={c.categoria} subcategorias={c.subcategorias} onAgregar={agregarLinea} />
      ))}

      {extras.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-zinc-400 mb-2 mt-6">Otras partidas (de la versión anterior del presupuesto)</h2>
          {extras.map(cat => (
            <Categoria key={cat} p={p} categoria={cat} subcategorias={subcategoriasDe(p, cat)} onAgregar={agregarLinea} />
          ))}
        </>
      )}
    </>
  )
}

// --- Una cuenta plegable con su tabla de líneas ---
function Categoria({
  p,
  categoria,
  subcategorias,
  onAgregar,
}: {
  p: Proyecto
  categoria: string
  subcategorias: string[]
  onAgregar: (cat: string, sub: string) => void
}) {
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  // Las cuentas sin líneas empiezan cerradas para no saturar la pantalla
  const tieneLineas = p.presupuesto.some(l => l.categoria === categoria)
  const [abierta, setAbierta] = useState(tieneLineas)
  const t = totalesCategoria(p, categoria)
  const sem = semaforo(t.estimado, t.real)
  const punto = { verde: 'bg-emerald-400', amarillo: 'bg-yellow-400', rojo: 'bg-red-500' }[sem]
  // las cuentas de personal llevan además la columna de cuánta gente cubre cada línea
  const esPersonal = esCuentaDePersonal(categoria)
  const gente = personasCategoria(p, categoria)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setAbierta(!abierta)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-zinc-800/60 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-zinc-100 text-sm">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${punto}`} title={`Semáforo: ${sem}`} />
          {categoria}
        </span>
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {esPersonal && gente > 0 && <span className="text-copal-300/80 mr-2">👥 {gente}</span>}
          Total {dinero(t.estimado)} · Gastado {dinero(t.real)} <span className="ml-1">{abierta ? '▾' : '▸'}</span>
        </span>
      </button>

      {abierta && (
        <div className="overflow-x-auto border-t border-zinc-800">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr>
                {[
                  'Descripción', 'Cant.', 'Unidad', '×',
                  ...(esPersonal ? ['👤 Personas'] : []),
                  'Tarifa', 'Subtotal', 'IVA', 'Total', 'Real', 'Diferencia', 'Proveedor', 'Notas', '',
                ].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subcategorias.map(sub => {
                const lineas = p.presupuesto.filter(l => l.categoria === categoria && l.subcategoria === sub)
                return (
                  <Fragment key={sub}>
                    <tr className="bg-zinc-800/40">
                      <td colSpan={esPersonal ? 13 : 12} className="px-2 py-1 text-xs font-semibold text-copal-300/90">{sub}</td>
                      <td className="px-2 py-1 text-right">
                        <button onClick={() => onAgregar(categoria, sub)} className="text-copal-400 hover:text-copal-300 text-xs whitespace-nowrap">
                          + línea
                        </button>
                      </td>
                    </tr>
                    {lineas.map(l => {
                      const sub$ = estimadoLinea(l)
                      const iva$ = ivaLinea(l)
                      const total$ = sub$ + iva$
                      const d = total$ - (l.real || 0)
                      return (
                        <tr key={l.id} className="border-t border-zinc-800/50">
                          <td className={td + ' min-w-44'}>
                            <input className={inpMini} value={l.descripcion} placeholder="Descripción del gasto"
                              onChange={e => actualizar('presupuesto', l.id, { descripcion: e.target.value })} />
                          </td>
                          <td className={td + ' w-14'}>
                            <input type="number" className={inpMini} value={l.cantidad || ''}
                              onChange={e => actualizar('presupuesto', l.id, { cantidad: num(e.target.value) })} />
                          </td>
                          <td className={td + ' w-20'}>
                            <input className={inpMini} value={l.unidad} placeholder="días"
                              onChange={e => actualizar('presupuesto', l.id, { unidad: e.target.value })} />
                          </td>
                          <td className={td + ' w-14'} title="Multiplicador: p. ej. 2 personas × 5 días">
                            <input type="number" className={inpMini} value={l.por ?? 1}
                              onChange={e => actualizar('presupuesto', l.id, { por: num(e.target.value) })} />
                          </td>
                          {esPersonal && (
                            <td className={td + ' w-16'} title="¿A cuántas personas cubre esta línea? Se usa para catering, radios y transporte">
                              <input type="number" min={0} className={inpMini} value={personasLinea(l)}
                                onChange={e => actualizar('presupuesto', l.id, { personas: num(e.target.value) })} />
                            </td>
                          )}
                          <td className={td + ' w-24'}>
                            <input type="number" className={inpMini} value={l.tarifa || ''}
                              onChange={e => actualizar('presupuesto', l.id, { tarifa: num(e.target.value) })} />
                          </td>
                          <td className={td + ' text-right whitespace-nowrap text-zinc-300'}>{dinero(sub$)}</td>
                          <td className={td + ' whitespace-nowrap'} title="¿Esta línea causa IVA (16%)?">
                            <label className="flex items-center gap-1 cursor-pointer text-xs text-zinc-400">
                              <input type="checkbox" className="accent-copal-500" checked={!!l.iva}
                                onChange={e => actualizar('presupuesto', l.id, { iva: e.target.checked })} />
                              {l.iva ? dinero(iva$) : '—'}
                            </label>
                          </td>
                          <td className={td + ' text-right whitespace-nowrap font-medium text-zinc-100'}>{dinero(total$)}</td>
                          <td className={td + ' w-24'}>
                            <input type="number" className={inpMini} value={l.real || ''}
                              onChange={e => actualizar('presupuesto', l.id, { real: num(e.target.value) })} />
                          </td>
                          <td className={`${td} text-right whitespace-nowrap font-medium ${d < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {dinero(d)}
                          </td>
                          <td className={td + ' min-w-24'}>
                            <input className={inpMini} value={l.proveedor}
                              onChange={e => actualizar('presupuesto', l.id, { proveedor: e.target.value })} />
                          </td>
                          <td className={td + ' min-w-24'}>
                            <input className={inpMini} value={l.notas}
                              onChange={e => actualizar('presupuesto', l.id, { notas: e.target.value })} />
                          </td>
                          <td className={td}>
                            <button onClick={() => eliminar('presupuesto', l.id)} className="text-zinc-500 hover:text-red-400" title="Eliminar línea">
                              🗑
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}
              <tr className="border-t border-zinc-700 bg-zinc-800/60">
                <td className={td + ' font-semibold text-zinc-200 whitespace-nowrap'}>Total de la cuenta</td>
                {esPersonal ? (
                  <>
                    <td colSpan={3} />
                    <td className={td + ' font-bold text-copal-300 whitespace-nowrap'} title="Personas de esta cuenta">
                      👥 {gente}
                    </td>
                    <td />
                  </>
                ) : (
                  <td colSpan={4} />
                )}
                <td className={td + ' text-right font-bold text-zinc-100 whitespace-nowrap'}>{dinero(t.subtotal)}</td>
                <td className={td + ' text-right font-bold text-zinc-300 whitespace-nowrap'}>{dinero(t.iva)}</td>
                <td className={td + ' text-right font-bold text-copal-300 whitespace-nowrap'}>{dinero(t.estimado)}</td>
                <td className={td + ' text-right font-bold text-zinc-100 whitespace-nowrap'}>{dinero(t.real)}</td>
                <td className={`${td} text-right font-bold whitespace-nowrap ${t.estimado - t.real < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {dinero(t.estimado - t.real)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
