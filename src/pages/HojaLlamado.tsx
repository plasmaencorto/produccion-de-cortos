// ===== Hoja de Llamado (Call Sheet) =====
// Sigue el formato profesional de la industria: frente con locación,
// llamados, sets, catering, secuencias, elenco numerado y necesidades;
// reverso con todo el equipo técnico por departamento.
import { useState } from 'react'
import { COMIDAS, callSheetVacia, useProyecto, useStore } from '../store'
import { Encabezado, FirmaCasa, Vacio, btn, btnSec, inp, inpPapel, papel, tdPapel, thPapel } from '../components/ui'
import { fechaBonita, uid } from '../utils'
import { diasOrdenados, elenco, nombreLocacion, numeroDia, tecnicos } from '../helpers'
import { colorDepartamento } from '../departamentos'
import { buscarHospitales, type HospitalCercano } from '../hospitales'
import type { CallSheet, Escena, EstadoActor, LlamadoActor, Persona, Proyecto } from '../types'

const ESTADOS_ACTOR: { valor: EstadoActor; que: string }[] = [
  { valor: 'SW', que: 'Empieza a trabajar' },
  { valor: 'W', que: 'Trabaja' },
  { valor: 'SWF', que: 'Empieza y termina hoy' },
  { valor: 'F', que: 'Último día' },
  { valor: 'H', que: 'En espera (no se usa hoy)' },
]

const llamadoActorVacio = (): LlamadoActor => ({
  pickUp: '', enLocacion: '', onSet: '', estado: 'W', camarin: '', notas: '',
})

// El número con el que se identifica a cada personaje en toda la hoja
const idPersonaje = (p: Proyecto, personaId: string) => elenco(p).findIndex(x => x.id === personaId) + 1

export default function HojaLlamado() {
  const p = useProyecto()
  const setCallSheet = useStore(s => s.setCallSheet)
  const [diaSel, setDiaSel] = useState('')
  const [verReverso, setVerReverso] = useState(false)
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
  const totalPaginas = escenas.reduce((t, e) => t + (e.paginas || 0), 0)

  // Sets (los espacios que se ocupan hoy), sin repetir
  const sets = [...new Set(escenas.map(e => nombreLocacion(p, e.locacionId, e.locacionTexto)).filter(Boolean))]

  // Cabezas de producción que encabezan la hoja
  const cabezas = [
    ['Productor/a', p.productor],
    ['Director/a', p.director],
    ['1er AD', p.primerAD],
  ].filter(([, v]) => v)

  const setLlamadoActor = (pid: string, patch: Partial<LlamadoActor>) =>
    setCallSheet(dia.id, {
      llamadosActores: {
        ...cs.llamadosActores,
        [pid]: { ...llamadoActorVacio(), ...cs.llamadosActores[pid], ...patch },
      },
    })

  const setComida = (nombre: string, patch: Partial<{ personas: string; hora: string }>) => {
    const previa = cs.comidas[nombre] ?? { personas: '', hora: '' }
    setCallSheet(dia.id, { comidas: { ...cs.comidas, [nombre]: { ...previa, ...patch } } })
  }

  return (
    <>
      <Encabezado titulo="Hoja de Llamado" subtitulo="Formato de producción: frente y reverso, listos para imprimir">
        <select className={inp + ' !w-auto'} value={dia.id} onChange={e => setDiaSel(e.target.value)}>
          {dias.map(d => (
            <option key={d.id} value={d.id}>
              Día {numeroDia(p, d.id)} — {d.fecha || 'sin fecha'}
            </option>
          ))}
        </select>
        <button className={btnSec} onClick={() => setVerReverso(!verReverso)}>
          {verReverso ? '📄 Ver frente' : '🔄 Ver reverso (equipo)'}
        </button>
        <button className={btn} onClick={() => window.print()}>🖨 Imprimir / Guardar PDF</button>
      </Encabezado>

      {/* ================= FRENTE ================= */}
      <div className={papel + (verReverso ? ' hidden print:block' : '')}>
        {/* Encabezado: día, título y fecha */}
        <div className="bg-copal-400 text-zinc-900 px-4 py-2 flex flex-wrap items-center justify-between gap-3 rounded-t print:rounded-none">
          <div className="flex items-center gap-3">
            {p.logo && <img src={p.logo} alt="" className="h-11 w-auto shrink-0" />}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Hoja de llamado</p>
              <h2 className="text-2xl font-black leading-none uppercase">{p.nombre}</h2>
            </div>
          </div>
          <div className="text-right leading-tight">
            <p className="text-lg font-black">DÍA {n} DE {dias.length}</p>
            <p className="text-sm capitalize">{fechaBonita(dia.fecha)}</p>
          </div>
        </div>

        {/* Tres columnas: locación · llamados · sets y cabezas */}
        <div className="grid sm:grid-cols-3 border border-zinc-300 border-t-0 text-sm">
          {/* Locación */}
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-zinc-300">
            <p className={rotulo}>Locación</p>
            <p className="font-bold">{loc?.nombre || nombreLocacion(p, dia.locacionId) || 'Por definir'}</p>
            <p className="text-zinc-600 whitespace-pre-line">{loc?.direccion}</p>
            {loc?.direccion && (
              <a
                className="text-rosa-600 underline text-xs print:hidden"
                href={`https://maps.google.com/?q=${encodeURIComponent(loc.direccion)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver en el mapa →
              </a>
            )}
            <p className={rotulo + ' mt-3'}>Oficina de producción</p>
            <textarea
              className={inpPapel + ' !text-xs'}
              rows={2}
              value={cs.oficinaProduccion}
              onChange={e => setCallSheet(dia.id, { oficinaProduccion: e.target.value })}
              placeholder="Dirección y teléfono"
            />
          </div>

          {/* Llamados */}
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-zinc-300">
            <p className={rotulo}>––– Llamado –––</p>
            <label className="block text-xs mb-1">
              Desayuno de cortesía
              <input className={inpPapel} value={cs.desayuno}
                onChange={e => setCallSheet(dia.id, { desayuno: e.target.value })} placeholder="7:00–8:00 h" />
            </label>
            <label className="block text-xs mb-1">
              <b>Llamado general en locación</b>
              <input className={inpPapel + ' !text-lg !font-black'} value={cs.llamadoGeneral}
                onChange={e => setCallSheet(dia.id, { llamadoGeneral: e.target.value })} placeholder={dia.horaInicio} />
            </label>
            <label className="block text-xs">
              Listos para 1er tiro
              <input className={inpPapel + ' !font-bold'} value={cs.listosPrimerTiro}
                onChange={e => setCallSheet(dia.id, { listosPrimerTiro: e.target.value })} placeholder="9:00 h" />
            </label>
            <p className="text-[11px] text-zinc-500 mt-2">Jornada prevista: {dia.horaInicio} – {dia.horaFin}</p>
          </div>

          {/* Sets, cabezas y catering */}
          <div className="p-3">
            <p className={rotulo}>Sets del día</p>
            <p className="text-xs mb-2">{sets.join(' · ') || '—'}</p>

            {cabezas.length > 0 && (
              <table className="w-full text-xs mb-2">
                <tbody>
                  {cabezas.map(([puesto, quien]) => (
                    <tr key={puesto}>
                      <td className="pr-2 text-zinc-500 uppercase text-[10px]">{puesto}</td>
                      <td className="font-semibold">{quien}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p className={rotulo}>Catering · # personas · listo</p>
            <table className="w-full text-xs">
              <tbody>
                {COMIDAS.map(c => (
                  <tr key={c}>
                    <td className="text-zinc-600 pr-1 whitespace-nowrap">{c}</td>
                    <td className="w-12">
                      <input className={inpPapel + ' !text-xs !px-1'} value={cs.comidas[c]?.personas || ''}
                        onChange={e => setComida(c, { personas: e.target.value })} placeholder="—" />
                    </td>
                    <td className="w-16">
                      <input className={inpPapel + ' !text-xs !px-1'} value={cs.comidas[c]?.hora || ''}
                        onChange={e => setComida(c, { hora: e.target.value })} placeholder="hora" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-zinc-500 mt-1">
              Hoy en set: {elencoDia.length} de elenco + {crew.length} de equipo
            </p>
          </div>
        </div>

        {/* Sol, clima, hospital y emergencias */}
        <div className="grid sm:grid-cols-2 border border-zinc-300 border-t-0 text-xs">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-zinc-300 grid grid-cols-2 gap-2">
            <label>🌅 Salida del sol
              <input className={inpPapel} value={cs.salidaSol} onChange={e => setCallSheet(dia.id, { salidaSol: e.target.value })} placeholder="6:10" />
            </label>
            <label>🌇 Puesta del sol
              <input className={inpPapel} value={cs.puestaSol} onChange={e => setCallSheet(dia.id, { puestaSol: e.target.value })} placeholder="20:01" />
            </label>
            <label>🌡 Temp. mín.
              <input className={inpPapel} value={cs.tempMin} onChange={e => setCallSheet(dia.id, { tempMin: e.target.value })} placeholder="12°" />
            </label>
            <label>🌡 Temp. máx.
              <input className={inpPapel} value={cs.tempMax} onChange={e => setCallSheet(dia.id, { tempMax: e.target.value })} placeholder="28°" />
            </label>
            <label className="col-span-2">⛅ Clima
              <input className={inpPapel} value={cs.clima} onChange={e => setCallSheet(dia.id, { clima: e.target.value })} placeholder="Despejado (CONAGUA)" />
            </label>
          </div>
          <div className="p-3 grid gap-2">
            <CampoHospital
              valor={cs.hospital}
              direccionLocacion={loc?.direccion || ''}
              onCambio={v => setCallSheet(dia.id, { hospital: v })}
            />
            <label>🚑 Contactos de emergencia
              <textarea className={inpPapel} rows={2} value={cs.emergencias}
                onChange={e => setCallSheet(dia.id, { emergencias: e.target.value })}
                placeholder="Bomberos · Policía · Médico de producción" />
            </label>
          </div>
        </div>

        {/* Reglamento y notas preventivas */}
        <div className="border border-zinc-300 border-t-0 p-3 text-xs">
          <p className={rotulo}>Reglamento básico en set y notas preventivas del día</p>
          <textarea className={inpPapel} rows={2} value={cs.notasSeguridad}
            onChange={e => setCallSheet(dia.id, { notasSeguridad: e.target.value })}
            placeholder="Máx. 12 h de jornada diurna / 10 h nocturna · llevar ropa abrigadora · respetar las líneas de seguridad…" />
        </div>

        {/* Secuencias del día */}
        <h3 className={titulo3}>*** Secuencias para realizar ***</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sec.', 'I/E', 'Set', 'Descripción', 'Pgs.', 'D/N', 'Personajes'].map(h => (
                <th key={h} className={thPapel}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {escenas.map(e => (
              <tr key={e.id}>
                <td className={tdPapel + ' font-bold w-12'}>{e.numero}</td>
                <td className={tdPapel + ' w-14'}>{e.intExt}</td>
                <td className={tdPapel + ' whitespace-nowrap'}>{nombreLocacion(p, e.locacionId, e.locacionTexto)}</td>
                <td className={tdPapel}>{e.sinopsis}</td>
                <td className={tdPapel + ' w-14 text-right'}>{e.paginas || ''}</td>
                <td className={tdPapel + ' w-20'}>{e.momento}</td>
                <td className={tdPapel + ' w-24 font-semibold'}>
                  {e.personajeIds.map(id => idPersonaje(p, id)).filter(Boolean).sort((a, b) => a - b).join(', ')}
                </td>
              </tr>
            ))}
            {escenas.length === 0 && (
              <tr><td colSpan={7} className={tdPapel + ' text-center text-zinc-500'}>Sin escenas asignadas a este día</td></tr>
            )}
            <tr className="bg-zinc-100">
              <td className={tdPapel + ' font-black'} colSpan={4}>Total de páginas</td>
              <td className={tdPapel + ' text-right font-black'}>{totalPaginas.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}</td>
              <td className={tdPapel} colSpan={2} />
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-500 mt-1">El orden puede cambiar durante el rodaje.</p>

        {/* Elenco con llamados escalonados */}
        <h3 className={titulo3}>Elenco</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['ID', 'Actor / Actriz', 'Personaje', 'Pick up', 'En loc. (M/P/V)', 'On set', '# Sec.', 'Estado'].map(h => (
                <th key={h} className={thPapel}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elencoDia.length === 0 && (
              <tr><td colSpan={8} className={tdPapel + ' text-center text-zinc-500'}>Sin elenco en las escenas de este día</td></tr>
            )}
            {elencoDia.map(x => {
              const ll = { ...llamadoActorVacio(), ...cs.llamadosActores[x.id] }
              return (
                <tr key={x.id}>
                  <td className={tdPapel + ' font-black w-10 text-center'}>{idPersonaje(p, x.id)}</td>
                  <td className={tdPapel}>{x.nombre || '—'}</td>
                  <td className={tdPapel + ' font-semibold'}>{x.personaje}</td>
                  <td className={tdPapel + ' w-20'}>
                    <input className={inpPapel + ' !text-xs'} value={ll.pickUp}
                      onChange={e => setLlamadoActor(x.id, { pickUp: e.target.value })} placeholder="7:00" />
                  </td>
                  <td className={tdPapel + ' w-20'}>
                    <input className={inpPapel + ' !text-xs'} value={ll.enLocacion}
                      onChange={e => setLlamadoActor(x.id, { enLocacion: e.target.value })} placeholder="7:30" />
                  </td>
                  <td className={tdPapel + ' w-20'}>
                    <input className={inpPapel + ' !text-xs'} value={ll.onSet}
                      onChange={e => setLlamadoActor(x.id, { onSet: e.target.value })} placeholder="9:00" />
                  </td>
                  <td className={tdPapel + ' text-xs'}>
                    {escenas.filter(e => e.personajeIds.includes(x.id)).map(e => e.numero).join(', ')}
                  </td>
                  <td className={tdPapel + ' w-20'}>
                    <select className={inpPapel + ' !text-xs'} value={ll.estado}
                      onChange={e => setLlamadoActor(x.id, { estado: e.target.value as EstadoActor })}>
                      {ESTADOS_ACTOR.map(s => <option key={s.valor} value={s.valor}>{s.valor}</option>)}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-500 mt-1">
          {ESTADOS_ACTOR.map(s => `${s.valor} = ${s.que}`).join(' · ')} · M/P/V = maquillaje, peinado y vestuario
        </p>

        {/* Extras */}
        <ExtrasDelDia cs={cs} onCambio={v => setCallSheet(dia.id, { extras: v })} />

        {/* Necesidades, salidas del desglose de las escenas del día */}
        <Necesidades escenas={escenas} />

        {/* Logística del día */}
        <h3 className={titulo3}>Logística</h3>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <label className="block">
            <b>🅿️ Estacionamiento y base</b>
            <textarea className={inpPapel} rows={2} value={cs.estacionamiento}
              onChange={e => setCallSheet(dia.id, { estacionamiento: e.target.value })} />
          </label>
          <label className="block">
            <b>📻 Canales de radio</b>
            <textarea className={inpPapel} rows={2} value={cs.radios}
              onChange={e => setCallSheet(dia.id, { radios: e.target.value })}
              placeholder="1 Dirección · 2 Abierto · 3 Producción · 4 Maquillaje…" />
          </label>
          <label className="block">
            <b>📝 Notas de producción</b>
            <textarea className={inpPapel} rows={2} value={cs.notasProduccion}
              onChange={e => setCallSheet(dia.id, { notasProduccion: e.target.value })} />
          </label>
        </div>

        <p className="text-center font-black text-sm mt-4">*** Sean puntuales · Llamados específicos al reverso ***</p>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 mt-6 text-center text-xs">
          <div className="border-t border-zinc-400 pt-1">{p.primerAD || '—'}<br /><span className="text-zinc-500">1er AD</span></div>
          <div className="border-t border-zinc-400 pt-1">{p.productor || '—'}<br /><span className="text-zinc-500">Producción</span></div>
        </div>

        <FirmaCasa />
      </div>

      {/* ================= REVERSO: equipo técnico ================= */}
      <div className={papel + ' mt-6 print:mt-0 print:break-before-page' + (verReverso ? '' : ' hidden print:block')}>
        <div className="flex items-center justify-between border-b-2 border-zinc-300 pb-2 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Llamados por departamento</p>
            <h2 className="text-xl font-black uppercase">{p.nombre}</h2>
          </div>
          <p className="text-sm font-bold text-right">
            DÍA {n} DE {dias.length}
            <span className="block text-xs font-normal capitalize">{fechaBonita(dia.fecha)}</span>
          </p>
        </div>

        <CrewPorDepartamento
          crew={crew}
          llamados={cs.llamados}
          llamadoGeneral={cs.llamadoGeneral || dia.horaInicio}
          onCambio={(pid, hora) => {
            const previo = cs.llamados[pid] ?? { llamado: '', camarin: '' }
            setCallSheet(dia.id, { llamados: { ...cs.llamados, [pid]: { ...previo, llamado: hora } } })
          }}
        />

        <p className="text-[10px] text-zinc-500 mt-3">
          P/SS = por sí solo · P/D = por departamento · S/L = sin llamado
        </p>

        <FirmaCasa />
      </div>
    </>
  )
}

// Estilos que se repiten en la hoja
const rotulo = 'text-[10px] font-bold uppercase tracking-wider text-zinc-500'
const titulo3 = 'font-black uppercase text-sm mt-5 mb-1'

// --- Extras del día ---
function ExtrasDelDia({ cs, onCambio }: { cs: CallSheet; onCambio: (v: CallSheet['extras']) => void }) {
  const extras = cs.extras ?? []
  const set = (id: string, patch: Partial<CallSheet['extras'][0]>) =>
    onCambio(extras.map(x => (x.id === id ? { ...x, ...patch } : x)))

  return (
    <>
      <h3 className={titulo3}>
        Extras / atmósfera
        <button
          type="button"
          onClick={() => onCambio([...extras, { id: uid(), descripcion: '', cantidad: '', enLocacion: '', onSet: '', escenas: '' }])}
          className="ml-2 text-rosa-600 text-xs font-normal normal-case underline print:hidden"
        >
          + agregar
        </button>
      </h3>
      {extras.length === 0 ? (
        <p className="text-xs text-zinc-500 print:hidden">Sin extras este día.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>{['Descripción', 'Cantidad', 'En loc.', 'On set', '# Sec.', ''].map(h => <th key={h} className={thPapel}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {extras.map(x => (
              <tr key={x.id}>
                <td className={tdPapel}>
                  <input className={inpPapel + ' !text-xs'} value={x.descripcion}
                    onChange={e => set(x.id, { descripcion: e.target.value })} placeholder="Transeúntes" />
                </td>
                <td className={tdPapel + ' w-20'}>
                  <input className={inpPapel + ' !text-xs'} value={x.cantidad} onChange={e => set(x.id, { cantidad: e.target.value })} placeholder="10" />
                </td>
                <td className={tdPapel + ' w-20'}>
                  <input className={inpPapel + ' !text-xs'} value={x.enLocacion} onChange={e => set(x.id, { enLocacion: e.target.value })} placeholder="15:00" />
                </td>
                <td className={tdPapel + ' w-20'}>
                  <input className={inpPapel + ' !text-xs'} value={x.onSet} onChange={e => set(x.id, { onSet: e.target.value })} placeholder="16:00" />
                </td>
                <td className={tdPapel + ' w-20'}>
                  <input className={inpPapel + ' !text-xs'} value={x.escenas} onChange={e => set(x.id, { escenas: e.target.value })} placeholder="11" />
                </td>
                <td className={tdPapel + ' w-8 print:hidden'}>
                  <button type="button" onClick={() => onCambio(extras.filter(y => y.id !== x.id))} className="text-zinc-400 hover:text-red-500">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

// --- Lista de necesidades: sale sola del desglose de las escenas del día ---
function Necesidades({ escenas }: { escenas: Escena[] }) {
  const juntar = (saca: (e: Escena) => string[]) => {
    const vistos = new Set<string>()
    const lista: { escena: string; texto: string }[] = []
    for (const e of escenas)
      for (const t of saca(e)) {
        const limpio = t.trim()
        if (!limpio || vistos.has(limpio.toLowerCase())) continue
        vistos.add(limpio.toLowerCase())
        lista.push({ escena: e.numero, texto: limpio })
      }
    return lista
  }

  const columnas = [
    { titulo: 'Utilería / props', datos: juntar(e => e.props), depto: 'utilería' },
    { titulo: 'Vestuario', datos: juntar(e => [e.vestuario]), depto: 'vestuario' },
    { titulo: 'Maquillaje / FX', datos: juntar(e => [e.maquillaje]), depto: 'maquillaje' },
    { titulo: 'Vehículos', datos: juntar(e => [e.vehiculos]), depto: 'vehículo' },
    { titulo: 'Sonido en set', datos: juntar(e => [e.sonido]), depto: 'sonido' },
  ].filter(c => c.datos.length > 0)

  if (columnas.length === 0) return null

  return (
    <>
      <h3 className={titulo3}>Lista parcial de necesidades</h3>
      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        {columnas.map(c => (
          <div key={c.titulo} className="border-l-2 pl-2" style={{ borderLeftColor: colorDepartamento(c.depto) }}>
            <p className="font-bold uppercase text-[10px]" style={{ color: colorDepartamento(c.depto) }}>{c.titulo}</p>
            <ul>
              {c.datos.map((d, i) => (
                <li key={i} className="text-zinc-700">
                  <span className="text-zinc-400">sec {d.escena}:</span> {d.texto}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-500 mt-1">
        Sale del desglose de las escenas del día. *** Favor de revisar todos los requerimientos ***
      </p>
    </>
  )
}

// --- Reverso: el equipo agrupado por departamento ---
function CrewPorDepartamento({
  crew,
  llamados,
  llamadoGeneral,
  onCambio,
}: {
  crew: Persona[]
  llamados: CallSheet['llamados']
  llamadoGeneral: string
  onCambio: (personaId: string, hora: string) => void
}) {
  if (crew.length === 0)
    return <p className="text-sm text-zinc-500">Registra al equipo técnico en «Elenco y Equipo» y aquí saldrán sus llamados.</p>

  // agrupa por el color/familia de departamento que ya usa la app
  const grupos = new Map<string, Persona[]>()
  for (const x of crew) {
    const clave = x.rol || 'Sin departamento'
    const color = colorDepartamento(clave)
    const lista = grupos.get(color) || []
    lista.push(x)
    grupos.set(color, lista)
  }

  return (
    <div className="grid sm:grid-cols-2 gap-x-6">
      {[...grupos.entries()].map(([color, gente]) => (
        <div key={color} className="mb-3 break-inside-avoid">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Puesto', 'Nombre', 'Celular', 'Llamado'].map(h => (
                  <th key={h} className={thPapel} style={{ borderBottomColor: color, borderBottomWidth: 2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gente.map(x => (
                <tr key={x.id}>
                  <td className={tdPapel + ' text-xs font-semibold'} style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                    {x.rol || '—'}
                  </td>
                  <td className={tdPapel + ' text-xs'}>{x.nombre}</td>
                  <td className={tdPapel + ' text-xs whitespace-nowrap'}>{x.telefono}</td>
                  <td className={tdPapel + ' w-20'}>
                    <input
                      className={inpPapel + ' !text-xs'}
                      value={llamados[x.id]?.llamado || ''}
                      onChange={e => onCambio(x.id, e.target.value)}
                      placeholder={llamadoGeneral}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
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
      if (encontrados.length === 0) setError('No encontré hospitales registrados cerca. Escríbelo a mano.')
      setResultados(encontrados)
    } catch {
      setError('No se pudo consultar el mapa. Revisa tu internet o escríbelo a mano.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <label className="block">
      🏥 Hospital más cercano
      <textarea className={inpPapel} rows={2} value={valor} onChange={e => onCambio(e.target.value)}
        placeholder="Nombre y dirección del hospital" />

      <div className="print:hidden mt-1">
        {direccionLocacion ? (
          <button type="button" onClick={buscar} disabled={buscando} className={btnSec + ' !text-xs !py-0.5'}>
            {buscando ? '🔎 Buscando…' : '🔎 Buscar cercanos'}
          </button>
        ) : (
          <p className="text-[10px] text-zinc-500">Ponle dirección a la locación y aquí te busco los hospitales cercanos.</p>
        )}
        {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
        {resultados && resultados.length > 0 && (
          <div className="mt-1 border border-zinc-300 rounded divide-y divide-zinc-200 max-h-36 overflow-y-auto">
            {resultados.map((h, i) => (
              <button key={i} type="button"
                onClick={() => onCambio([h.nombre, h.direccion, h.telefono && `Tel. ${h.telefono}`].filter(Boolean).join(' · '))}
                className="w-full text-left px-2 py-1 hover:bg-zinc-100 text-[11px]">
                <b>{h.nombre}</b> <span className="text-zinc-500">a {h.distanciaKm} km</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  )
}
