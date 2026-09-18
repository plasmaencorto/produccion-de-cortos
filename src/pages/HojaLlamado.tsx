// ===== Hoja de Llamado (Call Sheet) diaria, lista para imprimir =====
import { useState } from 'react'
import { callSheetVacia, useProyecto, useStore } from '../store'
import { Encabezado, FirmaCasa, Vacio, btn, btnSec, inp, inpPapel, papel, tdPapel, thPapel } from '../components/ui'
import { fechaBonita } from '../utils'
import { diasOrdenados, elenco, nombreLocacion, numeroDia, personasTotal, tecnicos } from '../helpers'
import { buscarHospitales, type HospitalCercano } from '../hospitales'
import type { CallSheet, Escena } from '../types'

export default function HojaLlamado() {
  const p = useProyecto()
  const setCallSheet = useStore(s => s.setCallSheet)
  const [diaSel, setDiaSel] = useState('')
  if (!p) return null

  const dias = diasOrdenados(p)
  const dia = p.diasRodaje.find(d => d.id === diaSel) ?? dias[0]

  if (!dia)
    return (
      <>
        <Encabezado titulo="Hoja de Llamado" subtitulo="Se genera automáticamente desde el plan de rodaje" />
        <Vacio mensaje="Primero crea días de rodaje en la sección Plan de Rodaje." />
      </>
    )

  const cs: CallSheet = { ...callSheetVacia(), ...p.callSheets[dia.id] }
  const escenas = dia.escenaIds.map(id => p.escenas.find(e => e.id === id)).filter(Boolean) as Escena[]
  const idsElenco = new Set(escenas.flatMap(e => e.personajeIds))
  const elencoDia = elenco(p).filter(x => idsElenco.has(x.id))
  const crew = tecnicos(p)
  const loc = p.locaciones.find(l => l.id === dia.locacionId)
  const n = numeroDia(p, dia.id)

  // Actualiza el llamado o camarín de una persona
  const setLl = (pid: string, campo: 'llamado' | 'camarin', valor: string) => {
    const previo = cs.llamados[pid] ?? { llamado: '', camarin: '' }
    setCallSheet(dia.id, { llamados: { ...cs.llamados, [pid]: { ...previo, [campo]: valor } } })
  }

  return (
    <>
      <Encabezado titulo="Hoja de Llamado" subtitulo="Selecciona el día; la hoja se llena sola con el plan de rodaje">
        <select className={inp + ' !w-auto'} value={dia.id} onChange={e => setDiaSel(e.target.value)}>
          {dias.map(d => (
            <option key={d.id} value={d.id}>
              Día {numeroDia(p, d.id)} — {d.fecha || 'sin fecha'}
            </option>
          ))}
        </select>
        <button className={btn} onClick={() => window.print()}>🖨 Imprimir / Guardar PDF</button>
      </Encabezado>

      {/* Hoja tipo papel (esto es lo que se imprime) */}
      <div className={papel}>
        {/* Encabezado de producción */}
        <div className="bg-copal-400 text-zinc-900 rounded-t px-4 py-3 flex flex-wrap items-center justify-between gap-3 print:rounded-none">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt="" className="h-12 w-auto shrink-0" />}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest">🎬 Producción</p>
              <h2 className="text-2xl font-black leading-tight">{p.nombre}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black">HOJA DE LLAMADO — DÍA {n} DE {dias.length}</p>
            <p className="text-sm capitalize">{fechaBonita(dia.fecha)}</p>
          </div>
        </div>

        <div className="border border-zinc-300 border-t-0 px-4 py-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase text-zinc-500">Llamado general</p>
            <input
              className={inpPapel + ' !text-xl !font-black'}
              value={cs.llamadoGeneral}
              onChange={e => setCallSheet(dia.id, { llamadoGeneral: e.target.value })}
              placeholder={dia.horaInicio}
            />
            <p className="text-xs text-zinc-500 mt-1">Jornada: {dia.horaInicio} – {dia.horaFin}</p>
            <label className="block text-xs mt-1">
              🥐 Desayuno:
              <input className={inpPapel + ' !inline-block !w-28 ml-1'} value={cs.desayuno}
                onChange={e => setCallSheet(dia.id, { desayuno: e.target.value })} placeholder="7:00–7:45" />
            </label>
            <label className="block text-xs mt-1">
              🎬 Listos para 1er tiro:
              <input className={inpPapel + ' !inline-block !w-24 ml-1'} value={cs.listosPrimerTiro}
                onChange={e => setCallSheet(dia.id, { listosPrimerTiro: e.target.value })} placeholder="9:00" />
            </label>
          </div>
          <div className="text-sm">
            <p><b>Director/a:</b> {p.director || '—'}</p>
            <p><b>Productor/a:</b> {p.productor || '—'}</p>
            <p><b>1er AD:</b> {p.primerAD || '—'}</p>
          </div>
          <div className="text-sm">
            <p className="font-bold">📍 {loc?.nombre || nombreLocacion(p, dia.locacionId) || 'Locación por definir'}</p>
            <p className="text-zinc-600">{loc?.direccion}</p>
            {loc?.direccion && (
              <a
                className="text-copal-600 underline text-xs print:hidden"
                href={`https://maps.google.com/?q=${encodeURIComponent(loc.direccion)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en Google Maps →
              </a>
            )}
          </div>
        </div>

        {/* Sol y clima (como en el machote profesional) */}
        <div className="border border-zinc-300 border-t-0 px-4 py-2 grid gap-3 sm:grid-cols-3 text-sm">
          <label className="text-xs">
            🌅 Salida del sol:
            <input className={inpPapel + ' !inline-block !w-20 ml-1'} value={cs.salidaSol}
              onChange={e => setCallSheet(dia.id, { salidaSol: e.target.value })} placeholder="6:10" />
            {'  '}🌇 Puesta:
            <input className={inpPapel + ' !inline-block !w-20 ml-1'} value={cs.puestaSol}
              onChange={e => setCallSheet(dia.id, { puestaSol: e.target.value })} placeholder="20:01" />
          </label>
          <label className="text-xs sm:col-span-2">
            ⛅ Clima previsto:
            <input className={inpPapel + ' !inline-block !w-64 ml-1'} value={cs.clima}
              onChange={e => setCallSheet(dia.id, { clima: e.target.value })} placeholder="Despejado, mín 12° / máx 28°" />
          </label>
        </div>

        {/* Elenco */}
        <h3 className="font-black uppercase text-sm mt-5 mb-1">Elenco</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Personaje', 'Actor / Actriz', 'Llamado', 'Camarín', 'Escenas'].map(h => (
                <th key={h} className={thPapel}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elencoDia.length === 0 && (
              <tr><td colSpan={5} className={tdPapel + ' text-center text-zinc-500'}>Sin elenco en las escenas de este día</td></tr>
            )}
            {elencoDia.map(x => (
              <tr key={x.id}>
                <td className={tdPapel + ' font-semibold'}>{x.personaje || '—'}</td>
                <td className={tdPapel}>{x.nombre}</td>
                <td className={tdPapel + ' w-24'}>
                  <input className={inpPapel} value={cs.llamados[x.id]?.llamado || ''} onChange={e => setLl(x.id, 'llamado', e.target.value)} placeholder="07:30" />
                </td>
                <td className={tdPapel + ' w-24'}>
                  <input className={inpPapel} value={cs.llamados[x.id]?.camarin || ''} onChange={e => setLl(x.id, 'camarin', e.target.value)} placeholder="1" />
                </td>
                <td className={tdPapel}>
                  {escenas.filter(e => e.personajeIds.includes(x.id)).map(e => e.numero).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Equipo técnico */}
        <h3 className="font-black uppercase text-sm mt-5 mb-1">Equipo técnico</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Rol', 'Nombre', 'Llamado'].map(h => (
                <th key={h} className={thPapel}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crew.length === 0 && (
              <tr><td colSpan={3} className={tdPapel + ' text-center text-zinc-500'}>Registra al equipo técnico en «Elenco y Equipo»</td></tr>
            )}
            {crew.map(x => (
              <tr key={x.id}>
                <td className={tdPapel + ' font-semibold'}>{x.rol || '—'}</td>
                <td className={tdPapel}>{x.nombre}</td>
                <td className={tdPapel + ' w-24'}>
                  <input className={inpPapel} value={cs.llamados[x.id]?.llamado || ''} onChange={e => setLl(x.id, 'llamado', e.target.value)} placeholder="07:00" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Escenas del día */}
        <h3 className="font-black uppercase text-sm mt-5 mb-1">Escenas del día</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Esc.', 'INT/EXT', 'Momento', 'Sinopsis', 'Elenco', 'Notas'].map(h => (
                <th key={h} className={thPapel}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {escenas.map(e => (
              <tr key={e.id}>
                <td className={tdPapel + ' font-bold'}>{e.numero}</td>
                <td className={tdPapel}>{e.intExt}</td>
                <td className={tdPapel}>{e.momento}</td>
                <td className={tdPapel}>{e.sinopsis}</td>
                <td className={tdPapel}>
                  {e.personajeIds.map(idp => p.personas.find(x => x.id === idp)?.personaje || '').filter(Boolean).join(', ')}
                </td>
                <td className={tdPapel}>{e.notas}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Logística */}
        <h3 className="font-black uppercase text-sm mt-5 mb-1">Logística</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <b>🅿️ Estacionamiento</b>
            <textarea className={inpPapel} rows={2} value={cs.estacionamiento} onChange={e => setCallSheet(dia.id, { estacionamiento: e.target.value })} />
          </label>
          <label className="block text-sm">
            <b>🍽 Catering (horario de comidas)</b>
            {/* Número de comidas del día: quién está llamado + lo que contempla el presupuesto */}
            <span className="block text-xs text-zinc-600 mb-0.5">
              👥 Comidas del día: <b>{elencoDia.length + crew.length}</b> ({elencoDia.length} elenco + {crew.length} equipo)
              {personasTotal(p) > 0 && <> · el presupuesto contempla <b>{personasTotal(p)}</b> personas</>}
            </span>
            <textarea className={inpPapel} rows={2} value={cs.catering} onChange={e => setCallSheet(dia.id, { catering: e.target.value })} />
          </label>
          <CampoHospital
            valor={cs.hospital}
            direccionLocacion={loc?.direccion || ''}
            onCambio={v => setCallSheet(dia.id, { hospital: v })}
          />
          <label className="block text-sm">
            <b>🚑 Contactos de emergencia</b>
            <textarea className={inpPapel} rows={2} value={cs.emergencias} onChange={e => setCallSheet(dia.id, { emergencias: e.target.value })} placeholder="Bomberos, policía, médico de producción…" />
          </label>
          <label className="block text-sm">
            <b>⚠️ Reglamento / notas de seguridad en set</b>
            <textarea className={inpPapel} rows={2} value={cs.notasSeguridad} onChange={e => setCallSheet(dia.id, { notasSeguridad: e.target.value })} placeholder="Máx. 12 h de jornada diurna / 10 h nocturna · protocolos del día" />
          </label>
          <label className="block text-sm">
            <b>📝 Notas de producción del día</b>
            <textarea className={inpPapel} rows={2} value={cs.notasProduccion} onChange={e => setCallSheet(dia.id, { notasProduccion: e.target.value })} />
          </label>
        </div>

        <FirmaCasa />
      </div>
    </>
  )
}

// --- Hospital más cercano, con búsqueda automática desde la locación ---
function CampoHospital({
  valor,
  direccionLocacion,
  onCambio,
}: {
  valor: string
  direccionLocacion: string
  onCambio: (v: string) => void
}) {
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<HospitalCercano[] | null>(null)
  const [error, setError] = useState('')

  const buscar = async () => {
    setError('')
    setResultados(null)
    setBuscando(true)
    try {
      const encontrados = await buscarHospitales(direccionLocacion)
      if (encontrados.length === 0)
        setError('No encontré hospitales registrados cerca. Escríbelo a mano.')
      setResultados(encontrados)
    } catch {
      setError('No se pudo consultar el mapa. Revisa tu internet o escríbelo a mano.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <label className="block text-sm">
      <b>🏥 Hospital más cercano</b>
      <textarea
        className={inpPapel}
        rows={2}
        value={valor}
        onChange={e => onCambio(e.target.value)}
        placeholder="Nombre y dirección del hospital"
      />

      <div className="print:hidden mt-1">
        {direccionLocacion ? (
          <button type="button" onClick={buscar} disabled={buscando} className={btnSec + ' !text-xs !py-1'}>
            {buscando ? '🔎 Buscando cerca de la locación…' : '🔎 Buscar hospitales cerca'}
          </button>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Ponle dirección a la locación del día (en Locaciones) y aquí podré buscarte los hospitales cercanos.
          </p>
        )}

        {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}

        {resultados && resultados.length > 0 && (
          <div className="mt-1.5 border border-zinc-300 rounded divide-y divide-zinc-200 max-h-48 overflow-y-auto">
            {resultados.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  onCambio([h.nombre, h.direccion, h.telefono && `Tel. ${h.telefono}`].filter(Boolean).join(' · '))
                }
                className="w-full text-left px-2 py-1.5 hover:bg-zinc-100 text-xs"
              >
                <span className="font-semibold">{h.nombre}</span>{' '}
                <span className="text-zinc-500">a {h.distanciaKm} km</span>
                {h.direccion && <span className="block text-zinc-500">{h.direccion}</span>}
              </button>
            ))}
            <p className="px-2 py-1 text-[10px] text-zinc-500 bg-zinc-50">
              Toca uno para usarlo. Datos de OpenStreetMap — confírmalos antes del rodaje.
            </p>
          </div>
        )}
      </div>
    </label>
  )
}
