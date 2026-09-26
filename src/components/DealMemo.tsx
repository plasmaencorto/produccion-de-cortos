// ===== Deal memo del crew =====
// Tomado del machote profesional de contabilidad de producción (fullconta.xlsx):
// hoja 1 con la información del contratado, el puesto y los importes por etapa;
// hoja 2 con las consideraciones especiales (obra por encargo, confidencialidad,
// prestación de servicios). Los datos personales, fiscales y bancarios NO se
// guardan en la app: quedan con raya para llenarse a mano.
import { useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { Campo, FirmaCasa, Vacio, btnSec, inp, papel, tarjeta, tdPapel, thPapel } from './ui'
import { Cabecera, Firma, fechaLarga } from './documento'
import { cantidadConLetra, dinero, num } from '../utils'
import { diasOrdenados, tecnicos } from '../helpers'
import { departamentoDe } from '../departamentos'
import type { Persona, Proyecto } from '../types'

type Etapa = { semanas: number; porSemana: number; inicia: string; termina: string }
const etapaVacia = (): Etapa => ({ semanas: 0, porSemana: 0, inicia: '', termina: '' })

const PERIODOS_PAGO = ['Semanal', 'Catorcenal', 'Quincenal', 'Mensual', 'Pago único al terminar', 'Anticipo y finiquito']

// Semanas (redondeadas hacia arriba) entre dos fechas
function semanasEntre(a: string, b: string): number {
  if (!a || !b) return 0
  const dias = (Date.parse(b) - Date.parse(a)) / 86400000 + 1
  return dias > 0 ? Math.ceil(dias / 7) : 0
}

// Fila de la hoja de información: etiqueta a la izquierda, dato a la derecha
function Fila({ etiqueta, children, colSpan = 1 }: { etiqueta: string; children?: ReactNode; colSpan?: number }) {
  return (
    <>
      <td className={thPapel + ' !normal-case !font-semibold w-44 align-top'}>{etiqueta}</td>
      <td className={tdPapel + ' h-8'} colSpan={colSpan}>{children}</td>
    </>
  )
}

function Seccion({ titulo }: { titulo: string }) {
  return (
    <tr>
      <td colSpan={4} className="bg-zinc-800 text-white text-[11px] font-black uppercase tracking-widest px-2 py-1">
        {titulo}
      </td>
    </tr>
  )
}

export default function DealMemo({
  p,
  ciudad,
  fecha,
  responsable,
}: {
  p: Proyecto
  ciudad: string
  fecha: string
  responsable: string
}) {
  const actualizar = useStore(s => s.actualizar)
  const crew = tecnicos(p)

  // Fechas del proyecto para sugerir los periodos
  const dias = diasOrdenados(p).filter(d => d.fecha)
  const inicioRodaje = p.inicioRodaje || dias[0]?.fecha || ''
  const finRodaje = p.finRodaje || dias.at(-1)?.fecha || ''
  const post = p.postproduccion ?? []
  const inicioPost = post.map(e => e.inicio).filter(Boolean).sort()[0] || ''
  const finPost = post.map(e => e.entrega).filter(Boolean).sort().at(-1) || ''

  const sugerir = (x?: Persona) => {
    const porSemana = x && /semana/i.test(x.unidadTarifa) ? x.tarifa || 0 : 0
    const porDia = x && /d[ií]a|jornada/i.test(x.unidadTarifa) ? x.tarifa || 0 : 0
    return {
      prep: etapaVacia(),
      rodaje: { semanas: semanasEntre(inicioRodaje, finRodaje), porSemana, inicia: inicioRodaje, termina: finRodaje },
      post: { ...etapaVacia(), inicia: inicioPost, termina: finPost },
      porDia,
      diasPorDia: porDia ? dias.length : 0,
    }
  }

  const [id, setId] = useState(crew[0]?.id ?? '')
  const x = crew.find(y => y.id === id)
  const [creditos, setCreditos] = useState(crew[0]?.nombre ?? '')
  const [actividad, setActividad] = useState('')
  const [sinPago, setSinPago] = useState(!crew[0]?.tarifa)
  const [importes, setImportes] = useState(() => sugerir(crew[0]))
  const [periodoPago, setPeriodoPago] = useState('Pago único al terminar')
  const [cajaChica, setCajaChica] = useState(false)
  const [autoriza, setAutoriza] = useState('Productor/a')

  if (crew.length === 0)
    return <Vacio mensaje="Primero registra a tu equipo técnico en «Elenco y Equipo»; de ahí salen el nombre, el puesto y la tarifa." />

  const elegir = (nuevo: string) => {
    const y = crew.find(z => z.id === nuevo)
    setId(nuevo)
    setCreditos(y?.nombre ?? '')
    setSinPago(!y?.tarifa)
    setImportes(sugerir(y))
    setActividad('')
  }

  const setEtapa = (clave: 'prep' | 'rodaje' | 'post', patch: Partial<Etapa>) =>
    setImportes(i => ({ ...i, [clave]: { ...i[clave], ...patch } }))

  const etapas: { clave: 'prep' | 'rodaje' | 'post'; nombre: string }[] = [
    { clave: 'prep', nombre: 'Preparación' },
    { clave: 'rodaje', nombre: 'Rodaje' },
    { clave: 'post', nombre: 'Post / entrega' },
  ]
  const totalEtapa = (e: Etapa) => (e.semanas || 0) * (e.porSemana || 0)
  const totalPorDia = importes.porDia * importes.diasPorDia
  const total = etapas.reduce((t, e) => t + totalEtapa(importes[e.clave]), 0) + totalPorDia

  // Periodo de contratación: de la primera a la última fecha capturada
  const fechas = etapas.flatMap(e => [importes[e.clave].inicia, importes[e.clave].termina]).filter(Boolean).sort()
  const periodo = fechas.length ? `Del ${fechaLarga(fechas[0])} al ${fechaLarga(fechas.at(-1)!)}` : ''

  const departamento = departamentoDe(x?.rol ?? '')

  return (
    <>
      {/* Datos para llenar el deal memo */}
      <div className={tarjeta + ' mb-4 grid gap-3 md:grid-cols-4 print:hidden'}>
        <Campo etiqueta="¿A quién se contrata?" className="md:col-span-2">
          <select className={inp} value={id} onChange={e => elegir(e.target.value)}>
            {crew.map(y => (
              <option key={y.id} value={y.id}>
                {y.rol || 'Sin puesto'} — {y.nombre}
                {y.contrato === 'Firmado' ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Nombre en créditos">
          <input className={inp} value={creditos} onChange={e => setCreditos(e.target.value)} />
        </Campo>
        <Campo etiqueta="Autoriza (cargo)">
          <input className={inp} value={autoriza} onChange={e => setAutoriza(e.target.value)} />
        </Campo>
        <Campo etiqueta="Descripción de la actividad o entregable" className="md:col-span-4">
          <input
            className={inp}
            value={actividad}
            onChange={e => setActividad(e.target.value)}
            placeholder={`Funciones de ${x?.rol || 'su puesto'} durante la preparación, el rodaje y la entrega del cortometraje`}
          />
        </Campo>

        <label className="md:col-span-4 flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" className="accent-copal-500" checked={sinPago} onChange={e => setSinPago(e.target.checked)} />
          Colaboración sin pago (es común en cortos escolares; el deal memo igual deja claro el puesto, los créditos y
          los compromisos)
        </label>

        {!sinPago && (
          <div className="md:col-span-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-[11px] text-zinc-400 uppercase">
                  <th className="text-left py-1">Etapa</th>
                  <th className="text-left">Semanas</th>
                  <th className="text-left">Importe por semana</th>
                  <th className="text-left">Inicia</th>
                  <th className="text-left">Termina</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {etapas.map(({ clave, nombre }) => {
                  const e = importes[clave]
                  return (
                    <tr key={clave}>
                      <td className="py-1 pr-2 text-zinc-300">{nombre}</td>
                      <td className="pr-2 w-20">
                        <input type="number" className={inp} value={e.semanas || ''} onChange={ev => setEtapa(clave, { semanas: num(ev.target.value) })} />
                      </td>
                      <td className="pr-2 w-32">
                        <input type="number" className={inp} value={e.porSemana || ''} onChange={ev => setEtapa(clave, { porSemana: num(ev.target.value) })} />
                      </td>
                      <td className="pr-2">
                        <input type="date" className={inp} value={e.inicia} onChange={ev => setEtapa(clave, { inicia: ev.target.value })} />
                      </td>
                      <td className="pr-2">
                        <input type="date" className={inp} value={e.termina} onChange={ev => setEtapa(clave, { termina: ev.target.value })} />
                      </td>
                      <td className="text-right text-zinc-200 whitespace-nowrap">{dinero(totalEtapa(e))}</td>
                    </tr>
                  )
                })}
                <tr>
                  <td className="py-1 pr-2 text-zinc-300">Por día</td>
                  <td className="pr-2">
                    <input type="number" className={inp} value={importes.diasPorDia || ''} placeholder="días"
                      onChange={ev => setImportes(i => ({ ...i, diasPorDia: num(ev.target.value) }))} />
                  </td>
                  <td className="pr-2">
                    <input type="number" className={inp} value={importes.porDia || ''} placeholder="por día"
                      onChange={ev => setImportes(i => ({ ...i, porDia: num(ev.target.value) }))} />
                  </td>
                  <td colSpan={2} className="text-xs text-zinc-500">
                    Para quien cobra por jornada (sugerido: los días de rodaje del plan)
                  </td>
                  <td className="text-right text-zinc-200 whitespace-nowrap">{dinero(totalPorDia)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1 text-copal-300" colSpan={5}>Total contrato</td>
                  <td className="text-right text-copal-300 whitespace-nowrap">{dinero(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <Campo etiqueta="Periodos de pago">
          <select className={inp} value={periodoPago} onChange={e => setPeriodoPago(e.target.value)}>
            {PERIODOS_PAGO.map(o => <option key={o}>{o}</option>)}
          </select>
        </Campo>
        <label className="flex items-end gap-2 text-sm text-zinc-300 cursor-pointer pb-2">
          <input type="checkbox" className="accent-copal-500" checked={cajaChica} onChange={e => setCajaChica(e.target.checked)} />
          Administra caja chica
        </label>
        {x && (
          <div className="md:col-span-2 flex items-end text-sm pb-1">
            {x.contrato === 'Firmado' ? (
              <span className="text-emerald-400">✓ Ya está marcado como firmado en Elenco y Equipo</span>
            ) : (
              <button className={btnSec + ' !text-xs'} onClick={() => actualizar('personas', x.id, { contrato: 'Firmado' })}>
                ✓ Ya lo firmó — marcar como «Firmado»
              </button>
            )}
          </div>
        )}
        <p className="md:col-span-4 text-xs text-zinc-500">
          🔒 Los datos personales, fiscales y bancarios (RFC, domicilio, CLABE, tipo de sangre…) no se guardan en la app:
          salen con raya para que la persona los llene a mano.
        </p>
      </div>

      {/* ===== Hoja 1: información ===== */}
      <div className={papel + ' text-[13px]'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Cabecera p={p} titulo="Deal memo · Hoja de información" />
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">1 de 2</p>
        </div>
        <p className="mb-3 text-sm">
          <b>{responsable || 'Casa productora'}</b> · Proyecto: <b>«{p.nombre}»</b>
        </p>

        <table className="w-full border-collapse mb-4">
          <tbody>
            <Seccion titulo="Datos del contratado" />
            <tr><Fila etiqueta="Nombre / razón social">{x?.nombre}</Fila><Fila etiqueta="Representante legal / agente" /></tr>
            <tr><Fila etiqueta="Nacionalidad" /><Fila etiqueta="Fecha de nacimiento" /></tr>
            <tr><Fila etiqueta="R.F.C." /><Fila etiqueta="Beneficiario (nombre y celular)" /></tr>
            <tr><Fila etiqueta="Domicilio (calle y número)" colSpan={3} /></tr>
            <tr><Fila etiqueta="Colonia" /><Fila etiqueta="Municipio" /></tr>
            <tr><Fila etiqueta="Ciudad" /><Fila etiqueta="Código postal" /></tr>
            <tr><Fila etiqueta="Teléfono(s) y celular">{x?.telefono}</Fila><Fila etiqueta="E-mail | IMDb">{x?.correo}</Fila></tr>

            <Seccion titulo="Datos para comprobante fiscal" />
            <tr><Fila etiqueta="Nombre o razón social" /><Fila etiqueta="Representante legal" /></tr>
            <tr><Fila etiqueta="Domicilio fiscal" colSpan={3} /></tr>

            <Seccion titulo="Datos de producción" />
            <tr><Fila etiqueta="Puesto">{x?.rol}</Fila><Fila etiqueta="Departamento">{departamento}</Fila></tr>
            <tr><Fila etiqueta="Nombre en créditos">{creditos}</Fila><Fila etiqueta="Periodo de contratación">{periodo}</Fila></tr>
            <tr>
              <Fila etiqueta="Descripción de la actividad o entregable" colSpan={3}>
                {actividad || `Funciones de ${x?.rol || 'su puesto'} durante la preparación, el rodaje y la entrega del cortometraje.`}
              </Fila>
            </tr>
          </tbody>
        </table>

        {/* Importes por etapa, como en el machote */}
        {sinPago ? (
          <p className="border border-zinc-300 rounded px-3 py-2 mb-4 text-sm">
            <b>Importe:</b> colaboración sin pago. Quien firma participa de manera voluntaria y recibirá el crédito
            correspondiente en la Obra.
          </p>
        ) : (
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr>
                {['Partida presupuestal', 'Semanas', 'Importe por semana', 'Total', 'Inicia', 'Termina'].map(h => (
                  <th key={h} className={thPapel}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {etapas.map(({ clave, nombre }) => {
                const e = importes[clave]
                return (
                  <tr key={clave}>
                    <td className={tdPapel + ' font-semibold'}>Importe {nombre.toLowerCase()}</td>
                    <td className={tdPapel + ' text-right'}>{e.semanas || ''}</td>
                    <td className={tdPapel + ' text-right'}>{e.porSemana ? dinero(e.porSemana) : ''}</td>
                    <td className={tdPapel + ' text-right'}>{totalEtapa(e) ? dinero(totalEtapa(e)) : ''}</td>
                    <td className={tdPapel}>{fechaLarga(e.inicia)}</td>
                    <td className={tdPapel}>{fechaLarga(e.termina)}</td>
                  </tr>
                )
              })}
              <tr>
                <td className={tdPapel + ' font-semibold'}>Importe por día</td>
                <td className={tdPapel + ' text-right'}>{importes.diasPorDia ? `${importes.diasPorDia} días` : ''}</td>
                <td className={tdPapel + ' text-right'}>{importes.porDia ? dinero(importes.porDia) : ''}</td>
                <td className={tdPapel + ' text-right'}>{totalPorDia ? dinero(totalPorDia) : ''}</td>
                <td className={tdPapel} colSpan={2} />
              </tr>
              <tr className="bg-copal-100">
                <td className={tdPapel + ' font-black'}>Total contrato</td>
                <td className={tdPapel + ' text-right font-black'} colSpan={3}>{dinero(total)}</td>
                <td className={tdPapel + ' text-xs font-semibold'} colSpan={2}>{cantidadConLetra(total)}</td>
              </tr>
            </tbody>
          </table>
        )}

        <table className="w-full border-collapse mb-4">
          <tbody>
            {!sinPago && (
              <>
                <Seccion titulo="Datos bancarios" />
                <tr><Fila etiqueta="Banco" /><Fila etiqueta="CLABE" /></tr>
                <tr><Fila etiqueta="Titular de la cuenta" /><Fila etiqueta="Periodos de pago">{periodoPago}</Fila></tr>
              </>
            )}
            <Seccion titulo="Salud y emergencias" />
            <tr><Fila etiqueta="En caso de accidente contactar a" /><Fila etiqueta="Parentesco y teléfono" /></tr>
            <tr><Fila etiqueta="Alergias" /><Fila etiqueta="Dieta alimentaria" /></tr>
            <tr><Fila etiqueta="Padecimientos / enfermedades" /><Fila etiqueta="Tipo de sangre" /></tr>
            <tr><Fila etiqueta="Comentarios / observaciones" colSpan={3} /></tr>
            <tr>
              <Fila etiqueta="Administra caja chica">{cajaChica ? 'Sí' : 'No'}</Fila>
              <Fila etiqueta="Documentos que se adjuntan">
                <span className="text-xs font-normal">
                  ☐ Identificación oficial ☐ Comprobante de domicilio{!sinPago && ' ☐ Constancia fiscal ☐ Opinión 32-D ☐ Estado de cuenta'}
                </span>
              </Fila>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8">
          <Firma titulo="Nombre y firma del contratado" nombre={x?.nombre} />
          <Firma titulo={`Autoriza — ${autoriza}`} nombre={responsable} />
        </div>
        <p className="text-[11px] text-zinc-500 mt-4">
          Nota: las condiciones particulares de contratación se formalizarán a través del contrato respectivo. {ciudad},{' '}
          {fechaLarga(fecha)}.
        </p>
      </div>

      {/* ===== Hoja 2: consideraciones especiales ===== */}
      <div className={papel + ' text-[14px] leading-relaxed mt-6 break-before-page'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Cabecera p={p} titulo="Deal memo · Consideraciones especiales" />
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">2 de 2</p>
        </div>
        <div className="space-y-3 mb-8">
          <p>
            Confirmo que la información personal aquí descrita es real y verdadera. Asimismo, acepto y doy mi
            consentimiento a las condiciones de contratación que aquí se me ofrecen, sin que medie dolo o mala fe, por
            lo que me comprometo a firmar el contrato respectivo para formalizar este acto.
          </p>
          <p>
            Hasta la firma de dicho contrato, se entenderá que el servicio realizado por mi parte será considerado como
            obra por encargo, en términos del artículo 83 de la Ley Federal del Derecho de Autor, reconociéndoseme el
            crédito como <b>{creditos || x?.nombre}</b>, <b>{x?.rol}</b>, en la obra cinematográfica{' '}
            <b>«{p.nombre}»</b>.
          </p>
          {cajaChica && (
            <p>
              Bajo ninguna circunstancia se debe utilizar la caja chica para el pago de servicios, mano de obra, alquiler
              o depósitos; estos elementos no serán reembolsados.
            </p>
          )}
          <p>
            Por medio de la presente manifiesto mi conocimiento y aceptación de que toda la información que reciba —como
            historias, guiones, ideas, entrevistas, lugares, personajes reales o de ficción, información financiera,
            legal o presupuestaria, planes de trabajo, marcas, nombres de alianzas, productores asociados, personal y
            contrataciones— en relación directa o indirecta con el proyecto para el que se solicitan mis servicios, la
            deberé guardar como confidencial, por lo que no la divulgaré a terceros salvo que medie autorización por
            escrito de la Producción.
          </p>
          <p>
            Acepto que cuento con los medios, aptitudes y facultades para desempeñar el servicio para el que se me
            contrata, por lo que manifiesto que nuestra relación es estrictamente una prestación de servicios de carácter
            civil, sin subordinación de carácter laboral.
          </p>
        </div>
        <div className="max-w-sm mx-auto">
          <Firma titulo="Nombre y firma del contratado" nombre={x?.nombre} />
        </div>
        <FirmaCasa />
      </div>
    </>
  )
}
