// ===== Control de Gastos =====
// Basado en los formatos de contabilidad de producción:
// solicitudes de recursos, comprobación de gastos y daños/pérdidas
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Modal, Vacio, btn, btnSec, inp, tarjeta, td, th } from '../components/ui'
import { aCSV, descargarArchivo, dinero, num, uid } from '../utils'
import { IVA, diasOrdenados, numeroDia } from '../helpers'
import { PLANTILLA_PRESUPUESTO } from '../plantillaPresupuesto'
import type { Dano, EstadoSolicitud, Gasto, Proyecto, Solicitud } from '../types'

type Tab = 'solicitudes' | 'gastos' | 'danos'

const ESTADOS_SOLICITUD: EstadoSolicitud[] = ['Solicitada', 'Autorizada', 'Pagada', 'Comprobada']
const COLOR_SOLICITUD: Record<EstadoSolicitud, string> = {
  Solicitada: 'gris',
  Autorizada: 'amarillo',
  Pagada: 'ambar',
  Comprobada: 'verde',
}
const CUENTAS = ['Por definir', ...PLANTILLA_PRESUPUESTO.map(c => c.categoria)]

// Totales
const ivaSolicitud = (s: Solicitud) => (s.iva ? (s.subtotal || 0) * IVA : 0)
const totalSolicitud = (s: Solicitud) => (s.subtotal || 0) + ivaSolicitud(s)
const totalGasto = (g: Gasto) => (g.importe || 0) + (g.iva || 0)

const hoy = () => new Date().toISOString().slice(0, 10)

const solicitudVacia = (folio: string): Solicitud => ({
  id: uid(), folio, fecha: hoy(), departamento: 'Producción', solicitante: '', proveedor: '',
  concepto: '', cuenta: 'Por definir', subtotal: 0, iva: false, urgente: false,
  comprobar: true, estado: 'Solicitada', notas: '',
})
const gastoVacio = (): Gasto => ({
  id: uid(), fecha: hoy(), cuenta: 'Por definir', proveedor: '', concepto: '', factura: '',
  deducible: true, importe: 0, iva: 0, solicitudId: '', notas: '',
})
const danoVacio = (): Dano => ({
  id: uid(), fecha: hoy(), diaId: '', locacionId: '', descripcion: '', valor: 0, comentarios: '',
})

export default function Gastos() {
  const p = useProyecto()
  const [tab, setTab] = useState<Tab>('solicitudes')
  if (!p) return null

  // Colecciones (con protección para proyectos guardados antes de este módulo)
  const solicitudes = p.solicitudes ?? []
  const gastos = p.gastos ?? []
  const danos = p.danos ?? []

  const totSolicitado = solicitudes.reduce((t, s) => t + totalSolicitud(s), 0)
  const totComprobado = gastos.reduce((t, g) => t + totalGasto(g), 0)
  const totDanos = danos.reduce((t, d) => t + (d.valor || 0), 0)

  const TABS: { id: Tab; nombre: string }[] = [
    { id: 'solicitudes', nombre: `📨 Solicitudes de recursos (${solicitudes.length})` },
    { id: 'gastos', nombre: `🧾 Comprobación de gastos (${gastos.length})` },
    { id: 'danos', nombre: `💥 Daños y pérdidas (${danos.length})` },
  ]

  return (
    <>
      <Encabezado
        titulo="Control de Gastos"
        subtitulo="Solicita recursos, comprueba gastos con factura y registra daños — como en los formatos del gerente de producción"
      />

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Solicitado (con IVA)</p>
          <p className="text-xl font-bold text-zinc-100">{dinero(totSolicitado)}</p>
        </div>
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Comprobado</p>
          <p className="text-xl font-bold text-copal-300">{dinero(totComprobado)}</p>
        </div>
        <div className={tarjeta + ' text-center'}>
          <p className="text-xs text-zinc-400">Daños y pérdidas</p>
          <p className={`text-xl font-bold ${totDanos > 0 ? 'text-red-400' : 'text-zinc-100'}`}>{dinero(totDanos)}</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-t-lg text-sm font-semibold border-b-2 ${
              tab === t.id ? 'text-copal-300 border-copal-400 bg-zinc-900' : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {tab === 'solicitudes' && <TablaSolicitudes p={p} solicitudes={solicitudes} />}
      {tab === 'gastos' && <TablaGastos p={p} gastos={gastos} solicitudes={solicitudes} />}
      {tab === 'danos' && <TablaDanos p={p} danos={danos} />}
    </>
  )
}

// ============ SOLICITUDES ============
function TablaSolicitudes({ p, solicitudes }: { p: Proyecto; solicitudes: Solicitud[] }) {
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Solicitud | null>(null)
  const [esNueva, setEsNueva] = useState(false)

  const guardar = (s: Solicitud) => {
    if (esNueva) agregar('solicitudes', s)
    else actualizar('solicitudes', s.id, s)
    setEditando(null)
  }

  const exportarCSV = () =>
    descargarArchivo(
      'solicitudes-de-recursos.csv',
      aCSV([
        ['Folio', 'Fecha', 'Departamento', 'Solicitado por', 'Proveedor', 'Concepto', 'Cuenta', 'Subtotal', 'IVA', 'Total', 'Urgente', 'A comprobar', 'Estado', 'Notas'],
        ...solicitudes.map(s => [
          s.folio, s.fecha, s.departamento, s.solicitante, s.proveedor, s.concepto, s.cuenta,
          s.subtotal, ivaSolicitud(s), totalSolicitud(s), s.urgente ? 'Sí' : 'No', s.comprobar ? 'Sí' : 'No', s.estado, s.notas,
        ]),
      ]),
      'text/csv;charset=utf-8',
      true,
    )

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className={btn} onClick={() => { setEditando(solicitudVacia(`S-${String(solicitudes.length + 1).padStart(2, '0')}`)); setEsNueva(true) }}>
          + Nueva solicitud
        </button>
        <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV</button>
      </div>

      {solicitudes.length === 0 ? (
        <Vacio mensaje="Aún no hay solicitudes de recursos. Aquí pides el dinero antes de gastarlo (transferencias a proveedores, viáticos, compras…)." />
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Folio', 'Fecha', 'Concepto', 'Cuenta', 'Proveedor', 'Subtotal', 'IVA', 'Total', 'Estado', ''].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(s => (
                <tr key={s.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => { setEditando(s); setEsNueva(false) }}>
                  <td className={td + ' font-bold text-copal-300 whitespace-nowrap'}>
                    {s.folio} {s.urgente && <span title="Urgente">⚡</span>}
                  </td>
                  <td className={td + ' whitespace-nowrap'}>{s.fecha}</td>
                  <td className={td + ' max-w-64'}><span className="line-clamp-2">{s.concepto || '—'}</span></td>
                  <td className={td + ' text-xs text-zinc-400 whitespace-nowrap'}>{s.cuenta.split('·')[0].trim()}</td>
                  <td className={td}>{s.proveedor}</td>
                  <td className={td + ' text-right whitespace-nowrap'}>{dinero(s.subtotal)}</td>
                  <td className={td + ' text-right whitespace-nowrap text-zinc-400'}>{s.iva ? dinero(ivaSolicitud(s)) : '—'}</td>
                  <td className={td + ' text-right whitespace-nowrap font-semibold'}>{dinero(totalSolicitud(s))}</td>
                  <td className={td}><Badge color={COLOR_SOLICITUD[s.estado]}>{s.estado}</Badge></td>
                  <td className={td}>
                    <button onClick={ev => { ev.stopPropagation(); if (confirm(`¿Eliminar la solicitud ${s.folio}?`)) eliminar('solicitudes', s.id) }}
                      className="text-zinc-500 hover:text-red-400" title="Eliminar">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && <EditorSolicitud inicial={editando} esNueva={esNueva} onGuardar={guardar} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function EditorSolicitud({ inicial, esNueva, onGuardar, onCerrar }: {
  inicial: Solicitud; esNueva: boolean; onGuardar: (s: Solicitud) => void; onCerrar: () => void
}) {
  const [b, setB] = useState(inicial)
  const set = (patch: Partial<Solicitud>) => setB(x => ({ ...x, ...patch }))
  return (
    <Modal titulo={esNueva ? 'Nueva solicitud de recursos' : `Solicitud ${b.folio}`} onCerrar={onCerrar}>
      <div className="grid gap-3 md:grid-cols-3">
        <Campo etiqueta="Folio"><input className={inp} value={b.folio} onChange={e => set({ folio: e.target.value })} /></Campo>
        <Campo etiqueta="Fecha"><input type="date" className={inp} value={b.fecha} onChange={e => set({ fecha: e.target.value })} /></Campo>
        <Campo etiqueta="Departamento"><input className={inp} value={b.departamento} onChange={e => set({ departamento: e.target.value })} /></Campo>
        <Campo etiqueta="Solicitado por"><input className={inp} value={b.solicitante} onChange={e => set({ solicitante: e.target.value })} /></Campo>
        <Campo etiqueta="Proveedor / a nombre de" className="md:col-span-2"><input className={inp} value={b.proveedor} onChange={e => set({ proveedor: e.target.value })} /></Campo>
        <Campo etiqueta="Concepto (qué se va a pagar)" className="md:col-span-3">
          <textarea className={inp} rows={2} value={b.concepto} onChange={e => set({ concepto: e.target.value })} placeholder="Expendables de producción, renta de luces, viáticos…" />
        </Campo>
        <Campo etiqueta="Cuenta presupuestal" className="md:col-span-2">
          <select className={inp} value={b.cuenta} onChange={e => set({ cuenta: e.target.value })}>
            {CUENTAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Subtotal (sin IVA)"><input type="number" className={inp} value={b.subtotal || ''} onChange={e => set({ subtotal: num(e.target.value) })} /></Campo>
        <div className="md:col-span-3 flex flex-wrap gap-5 text-sm text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={b.iva} onChange={e => set({ iva: e.target.checked })} />
            Causa IVA (16%) {b.iva && <span className="text-zinc-400">→ total {dinero(totalSolicitud(b))}</span>}
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={b.urgente} onChange={e => set({ urgente: e.target.checked })} />
            ⚡ Urgente
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={b.comprobar} onChange={e => set({ comprobar: e.target.checked })} />
            Gastos a comprobar
          </label>
        </div>
        <Campo etiqueta="Estado">
          <select className={inp} value={b.estado} onChange={e => set({ estado: e.target.value as EstadoSolicitud })}>
            {ESTADOS_SOLICITUD.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Notas" className="md:col-span-2"><input className={inp} value={b.notas} onChange={e => set({ notas: e.target.value })} /></Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}

// ============ COMPROBACIÓN DE GASTOS ============
function TablaGastos({ p, gastos, solicitudes }: { p: Proyecto; gastos: Gasto[]; solicitudes: Solicitud[] }) {
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Gasto | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)

  const guardar = (g: Gasto) => {
    if (esNuevo) agregar('gastos', g)
    else actualizar('gastos', g.id, g)
    setEditando(null)
  }

  const deducibles = gastos.filter(g => g.deducible).reduce((t, g) => t + totalGasto(g), 0)
  const noDeducibles = gastos.filter(g => !g.deducible).reduce((t, g) => t + totalGasto(g), 0)
  // Total ejercido por cuenta presupuestal (como el resumen de solicitudes del machote)
  const porCuenta = [...new Set(gastos.map(g => g.cuenta))].map(c => ({
    cuenta: c,
    total: gastos.filter(g => g.cuenta === c).reduce((t, g) => t + totalGasto(g), 0),
  }))

  const exportarCSV = () =>
    descargarArchivo(
      'comprobacion-de-gastos.csv',
      aCSV([
        ['Fecha', 'Cuenta', 'Proveedor', 'Concepto', 'Factura', 'Deducible', 'Importe', 'IVA', 'Total', 'Solicitud', 'Notas'],
        ...gastos.map(g => [
          g.fecha, g.cuenta, g.proveedor, g.concepto, g.factura, g.deducible ? 'Sí' : 'No',
          g.importe, g.iva, totalGasto(g), solicitudes.find(s => s.id === g.solicitudId)?.folio || '', g.notas,
        ]),
      ]),
      'text/csv;charset=utf-8',
      true,
    )

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className={btn} onClick={() => { setEditando(gastoVacio()); setEsNuevo(true) }}>+ Registrar gasto</button>
        <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV</button>
        <span className="text-xs text-zinc-400 self-center">
          Deducibles: <b className="text-emerald-400">{dinero(deducibles)}</b> · No deducibles:{' '}
          <b className="text-yellow-300">{dinero(noDeducibles)}</b>
        </span>
      </div>

      {gastos.length === 0 ? (
        <Vacio mensaje="Aún no hay gastos comprobados. Aquí registras cada ticket o factura ya gastado, ligado a su cuenta del presupuesto." />
      ) : (
        <>
          <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl mb-4">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Fecha', 'Cuenta', 'Proveedor', 'Concepto', 'Factura', 'Deducible', 'Importe', 'IVA', 'Total', ''].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                    onClick={() => { setEditando(g); setEsNuevo(false) }}>
                    <td className={td + ' whitespace-nowrap'}>{g.fecha}</td>
                    <td className={td + ' text-xs text-zinc-400 whitespace-nowrap'}>{g.cuenta.split('·')[0].trim()}</td>
                    <td className={td}>{g.proveedor}</td>
                    <td className={td + ' max-w-56'}><span className="line-clamp-2">{g.concepto || '—'}</span></td>
                    <td className={td + ' text-xs'}>{g.factura}</td>
                    <td className={td}><Badge color={g.deducible ? 'verde' : 'amarillo'}>{g.deducible ? 'Sí' : 'No'}</Badge></td>
                    <td className={td + ' text-right whitespace-nowrap'}>{dinero(g.importe)}</td>
                    <td className={td + ' text-right whitespace-nowrap text-zinc-400'}>{dinero(g.iva)}</td>
                    <td className={td + ' text-right whitespace-nowrap font-semibold'}>{dinero(totalGasto(g))}</td>
                    <td className={td}>
                      <button onClick={ev => { ev.stopPropagation(); if (confirm('¿Eliminar este gasto?')) eliminar('gastos', g.id) }}
                        className="text-zinc-500 hover:text-red-400" title="Eliminar">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total ejercido por cuenta */}
          <div className={tarjeta}>
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">Total comprobado por cuenta presupuestal</h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {porCuenta.map(c => (
                <p key={c.cuenta} className="text-sm text-zinc-300 flex justify-between gap-3 border-b border-zinc-800/60 py-1">
                  <span className="truncate">{c.cuenta}</span>
                  <b className="whitespace-nowrap">{dinero(c.total)}</b>
                </p>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              💡 Tip: usa estos totales para llenar la columna "Real" del Presupuesto, cuenta por cuenta.
            </p>
          </div>
        </>
      )}

      {editando && (
        <EditorGasto inicial={editando} esNuevo={esNuevo} solicitudes={solicitudes} onGuardar={guardar} onCerrar={() => setEditando(null)} />
      )}
    </>
  )
}

function EditorGasto({ inicial, esNuevo, solicitudes, onGuardar, onCerrar }: {
  inicial: Gasto; esNuevo: boolean; solicitudes: Solicitud[]; onGuardar: (g: Gasto) => void; onCerrar: () => void
}) {
  const [b, setB] = useState(inicial)
  const set = (patch: Partial<Gasto>) => setB(x => ({ ...x, ...patch }))
  return (
    <Modal titulo={esNuevo ? 'Registrar gasto' : 'Editar gasto'} onCerrar={onCerrar}>
      <div className="grid gap-3 md:grid-cols-3">
        <Campo etiqueta="Fecha"><input type="date" className={inp} value={b.fecha} onChange={e => set({ fecha: e.target.value })} /></Campo>
        <Campo etiqueta="Cuenta presupuestal" className="md:col-span-2">
          <select className={inp} value={b.cuenta} onChange={e => set({ cuenta: e.target.value })}>
            {CUENTAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Proveedor"><input className={inp} value={b.proveedor} onChange={e => set({ proveedor: e.target.value })} /></Campo>
        <Campo etiqueta="Concepto" className="md:col-span-2"><input className={inp} value={b.concepto} onChange={e => set({ concepto: e.target.value })} /></Campo>
        <Campo etiqueta="No. de factura / ticket"><input className={inp} value={b.factura} onChange={e => set({ factura: e.target.value })} /></Campo>
        <Campo etiqueta="Importe (sin IVA)"><input type="number" className={inp} value={b.importe || ''} onChange={e => set({ importe: num(e.target.value) })} /></Campo>
        <Campo etiqueta="IVA del comprobante">
          <div className="flex gap-1">
            <input type="number" className={inp} value={b.iva || ''} onChange={e => set({ iva: num(e.target.value) })} />
            <button type="button" className={btnSec + ' !px-2 whitespace-nowrap'} title="Calcular 16% del importe"
              onClick={() => set({ iva: Math.round((b.importe || 0) * IVA * 100) / 100 })}>
              16%
            </button>
          </div>
        </Campo>
        <div className="md:col-span-2 flex items-center gap-5 text-sm text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={b.deducible} onChange={e => set({ deducible: e.target.checked })} />
            Deducible (con factura)
          </label>
          <span className="text-zinc-400">Total: <b className="text-zinc-100">{dinero(totalGasto(b))}</b></span>
        </div>
        <Campo etiqueta="Solicitud relacionada">
          <select className={inp} value={b.solicitudId} onChange={e => set({ solicitudId: e.target.value })}>
            <option value="">— Ninguna —</option>
            {solicitudes.map(s => <option key={s.id} value={s.id}>{s.folio} — {s.concepto.slice(0, 30)}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Notas" className="md:col-span-3"><input className={inp} value={b.notas} onChange={e => set({ notas: e.target.value })} /></Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}

// ============ DAÑOS Y PÉRDIDAS ============
function TablaDanos({ p, danos }: { p: Proyecto; danos: Dano[] }) {
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Dano | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)

  const guardar = (d: Dano) => {
    if (esNuevo) agregar('danos', d)
    else actualizar('danos', d.id, d)
    setEditando(null)
  }

  const exportarCSV = () =>
    descargarArchivo(
      'danos-y-perdidas.csv',
      aCSV([
        ['Fecha', 'Día de rodaje', 'Locación', 'Descripción de los hechos', 'Valor aproximado', 'Comentarios'],
        ...danos.map(d => [
          d.fecha,
          d.diaId ? `Día ${numeroDia(p, d.diaId)}` : '',
          p.locaciones.find(l => l.id === d.locacionId)?.nombre || '',
          d.descripcion, d.valor, d.comentarios,
        ]),
      ]),
      'text/csv;charset=utf-8',
      true,
    )

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className={btn} onClick={() => { setEditando(danoVacio()); setEsNuevo(true) }}>+ Registrar daño</button>
        <button className={btnSec} onClick={exportarCSV}>⬇ Exportar CSV</button>
      </div>

      {danos.length === 0 ? (
        <Vacio mensaje="Sin daños ni pérdidas registrados (¡ojalá siga así! 🤞). Aquí se anota cualquier equipo dañado o cosa rota en locación." />
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-xl">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Fecha', 'Día de rodaje', 'Locación', 'Descripción', 'Valor aprox.', 'Comentarios', ''].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {danos.map(d => (
                <tr key={d.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => { setEditando(d); setEsNuevo(false) }}>
                  <td className={td + ' whitespace-nowrap'}>{d.fecha}</td>
                  <td className={td + ' whitespace-nowrap'}>{d.diaId ? `Día ${numeroDia(p, d.diaId)}` : '—'}</td>
                  <td className={td}>{p.locaciones.find(l => l.id === d.locacionId)?.nombre || '—'}</td>
                  <td className={td + ' max-w-72'}><span className="line-clamp-2">{d.descripcion}</span></td>
                  <td className={td + ' text-right whitespace-nowrap text-red-300 font-semibold'}>{dinero(d.valor)}</td>
                  <td className={td + ' text-xs text-zinc-400 max-w-48'}><span className="line-clamp-2">{d.comentarios}</span></td>
                  <td className={td}>
                    <button onClick={ev => { ev.stopPropagation(); if (confirm('¿Eliminar este registro?')) eliminar('danos', d.id) }}
                      className="text-zinc-500 hover:text-red-400" title="Eliminar">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && <EditorDano p={p} inicial={editando} esNuevo={esNuevo} onGuardar={guardar} onCerrar={() => setEditando(null)} />}
    </>
  )
}

function EditorDano({ p, inicial, esNuevo, onGuardar, onCerrar }: {
  p: Proyecto; inicial: Dano; esNuevo: boolean; onGuardar: (d: Dano) => void; onCerrar: () => void
}) {
  const [b, setB] = useState(inicial)
  const set = (patch: Partial<Dano>) => setB(x => ({ ...x, ...patch }))
  return (
    <Modal titulo={esNuevo ? 'Registrar daño o pérdida' : 'Editar daño'} onCerrar={onCerrar}>
      <div className="grid gap-3 md:grid-cols-3">
        <Campo etiqueta="Fecha"><input type="date" className={inp} value={b.fecha} onChange={e => set({ fecha: e.target.value })} /></Campo>
        <Campo etiqueta="Día de rodaje">
          <select className={inp} value={b.diaId} onChange={e => set({ diaId: e.target.value })}>
            <option value="">— Fuera de rodaje —</option>
            {diasOrdenados(p).map(d => (
              <option key={d.id} value={d.id}>Día {numeroDia(p, d.id)} — {d.fecha || 'sin fecha'}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Locación">
          <select className={inp} value={b.locacionId} onChange={e => set({ locacionId: e.target.value })}>
            <option value="">— Sin locación —</option>
            {p.locaciones.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Descripción de los hechos" className="md:col-span-3">
          <textarea className={inp} rows={2} value={b.descripcion} onChange={e => set({ descripcion: e.target.value })}
            placeholder="Ej. Una lámpara se cayó y se rompió el fresnel…" />
        </Campo>
        <Campo etiqueta="Valor aproximado"><input type="number" className={inp} value={b.valor || ''} onChange={e => set({ valor: num(e.target.value) })} /></Campo>
        <Campo etiqueta="Comentarios (¿ya se reportó?, ¿lo cubre el seguro?)" className="md:col-span-2">
          <input className={inp} value={b.comentarios} onChange={e => set({ comentarios: e.target.value })} />
        </Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}
