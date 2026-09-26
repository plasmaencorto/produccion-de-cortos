// ===== Documentos legales =====
// Machotes que se llenan solos con los datos del proyecto: la cesión de
// derechos de imagen (elenco y equipo), la autorización de locación y el
// deal memo para contratar al crew.
// Sin estos papeles firmados, muchos festivales no aceptan el corto.
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Campo, Encabezado, FirmaCasa, Vacio, btn, btnSec, inp, papel, tarjeta } from '../components/ui'
import { dinero, hoyLocal, num } from '../utils'
import { dayOutOfDays, diasOrdenados, elenco, personasTotal, tarifaDiaria, tecnicos } from '../helpers'
import type { Locacion, Persona, Proyecto } from '../types'
import { Cabecera, D, Firma, fechaLarga } from '../components/documento'
import DealMemo from '../components/DealMemo'

type Tipo = 'imagen' | 'locacion' | 'crew'


export default function Documentos() {
  const p = useProyecto()
  const actualizar = useStore(s => s.actualizar)
  const [tipo, setTipo] = useState<Tipo>('imagen')
  // Datos comunes
  const [ciudad, setCiudad] = useState('Torreón, Coahuila')
  const [fecha, setFecha] = useState(hoyLocal())
  const [productora, setProductora] = useState('')
  if (!p) return null

  const responsable = productora || p.productor

  return (
    <>
      <Encabezado titulo="Documentos legales" subtitulo="Machotes que se llenan con los datos de tu proyecto, listos para imprimir y firmar">
        <button className={btn} onClick={() => window.print()}>🖨 Imprimir / PDF</button>
      </Encabezado>

      <div className="bg-copal-500/10 border border-copal-700/60 rounded-lg px-3 py-2 text-sm text-zinc-300 mb-4 print:hidden">
        ⚖️ Son <b>machotes de referencia</b> para cortometrajes con <b>fines culturales y educativos</b>; la cesión de
        imagen puede incluir además el uso comercial. No sustituyen la asesoría de un abogado: si tienes un caso
        especial, pide que los revisen.
      </div>

      <div className="flex flex-wrap gap-2 mb-4 print:hidden">
        {[
          { id: 'imagen' as const, nombre: '🎭 Cesión de derechos de imagen' },
          { id: 'locacion' as const, nombre: '🏠 Autorización de locación' },
          { id: 'crew' as const, nombre: '🎬 Deal memo del crew' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
              tipo === t.id
                ? 'bg-copal-500/20 border-copal-400 text-copal-300 font-semibold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      <div className={tarjeta + ' mb-4 grid gap-3 md:grid-cols-3 print:hidden'}>
        <Campo etiqueta="Ciudad donde se firma">
          <input className={inp} value={ciudad} onChange={e => setCiudad(e.target.value)} />
        </Campo>
        <Campo etiqueta="Fecha de firma">
          <input type="date" className={inp} value={fecha} onChange={e => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Productora o responsable de la producción">
          <input
            className={inp}
            value={productora}
            onChange={e => setProductora(e.target.value)}
            placeholder={p.productor || 'Nombre de la persona o empresa'}
          />
        </Campo>
      </div>

      {tipo === 'crew' ? (
        <DealMemo p={p} ciudad={ciudad} fecha={fecha} responsable={responsable} />
      ) : tipo === 'imagen' ? (
        <CesionImagen p={p} ciudad={ciudad} fecha={fecha} responsable={responsable}
          onFirmado={x => actualizar('personas', x.id, { contrato: 'Firmado' })} />
      ) : (
        <AutorizacionLocacion p={p} ciudad={ciudad} fecha={fecha} responsable={responsable}
          onFirmado={l => actualizar('locaciones', l.id, { permiso: 'Sí' })} />
      )}
    </>
  )
}

type Comunes = { p: Proyecto; ciudad: string; fecha: string; responsable: string }

// ============ CESIÓN DE DERECHOS DE IMAGEN ============
function CesionImagen({ p, ciudad, fecha, responsable, onFirmado }: Comunes & { onFirmado: (x: Persona) => void }) {
  const personas = [...elenco(p), ...tecnicos(p)]
  // Pago sugerido: si la tarifa es por día, se multiplica por los días que
  // le tocan según el Day Out of Days (los "hold" también se pagan)
  const pagoSugerido = (y?: Persona) => {
    if (!y) return 0
    const dias = dayOutOfDays(p).find(z => z.actor.id === y.id)?.pagados
    return tarifaDiaria(y) && dias ? tarifaDiaria(y) * dias : y.tarifa || 0
  }
  const [id, setId] = useState(personas[0]?.id ?? '')
  const [menor, setMenor] = useState(false)
  const [tutor, setTutor] = useState('')
  const [parentesco, setParentesco] = useState('madre / padre')
  const [gratuito, setGratuito] = useState(!pagoSugerido(personas[0]))
  const [monto, setMonto] = useState(pagoSugerido(personas[0]))
  const [vigencia, setVigencia] = useState('por tiempo indefinido')
  // Uso de la obra: cada producción elige si la cesión incluye la explotación comercial
  const [comercial, setComercial] = useState(false)
  const [porcentaje, setPorcentaje] = useState('')
  // La participación en ganancias es para quien interpreta; al equipo técnico por lo general no le aplica
  const [sinPorcentaje, setSinPorcentaje] = useState(personas[0]?.tipo === 'tecnico')
  const x = personas.find(y => y.id === id)

  if (personas.length === 0)
    return <Vacio mensaje="Primero registra a tu elenco y equipo en «Elenco y Equipo»; de ahí salen los nombres." />

  const elegir = (nuevo: string) => {
    setId(nuevo)
    const y = personas.find(z => z.id === nuevo)
    setMenor(false)
    setSinPorcentaje(y?.tipo === 'tecnico')
    setMonto(pagoSugerido(y))
    setGratuito(!pagoSugerido(y))
  }

  const quien = menor ? tutor : x?.nombre
  const funcion =
    x?.tipo === 'elenco' ? (
      <>interpretando el personaje de <D>{x.personaje}</D></>
    ) : (
      <>desempeñando la función de <D>{x?.rol}</D></>
    )
  const contraprestacion = gratuito ? (
    <>a título gratuito</>
  ) : (
    <>a cambio de una contraprestación total de <D>{monto ? dinero(monto) : ''}</D></>
  )

  return (
    <>
      <div className={tarjeta + ' mb-4 grid gap-3 md:grid-cols-4 print:hidden'}>
        <Campo etiqueta="¿Quién firma?" className="md:col-span-2">
          <select className={inp} value={id} onChange={e => elegir(e.target.value)}>
            {personas.map(y => (
              <option key={y.id} value={y.id}>
                {y.tipo === 'elenco' ? `🎭 ${y.personaje || 'Sin personaje'} — ${y.nombre}` : `🎬 ${y.rol || 'Equipo'} — ${y.nombre}`}
                {y.contrato === 'Firmado' ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Uso de la obra" className="md:col-span-2">
          <select className={inp} value={comercial ? 'comercial' : 'cultural'} onChange={e => setComercial(e.target.value === 'comercial')}>
            <option value="cultural">Cultural y educativo, sin fines de lucro</option>
            <option value="comercial">Cultural, educativo y comercial</option>
          </select>
        </Campo>
        {comercial && (
          <Campo etiqueta="Participación en ganancias (%)" className="md:col-span-2">
            <div className="flex items-center gap-3">
              <input
                className={inp + ' disabled:opacity-40'}
                value={sinPorcentaje ? '' : porcentaje}
                disabled={sinPorcentaje}
                onChange={e => setPorcentaje(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder={sinPorcentaje ? 'No aplica' : 'Déjalo vacío para llenarlo a mano en la firma'}
              />
              <label className="flex items-center gap-2 text-sm text-zinc-300 whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-copal-500"
                  checked={sinPorcentaje}
                  onChange={e => setSinPorcentaje(e.target.checked)}
                />
                No aplica
              </label>
            </div>
          </Campo>
        )}
        {comercial && (
          <p className="md:col-span-4 bg-red-900/20 border border-red-800/70 text-red-200 text-xs rounded-lg px-3 py-2">
            ⚠️ Con uso comercial, la persona debe saber desde el principio que el corto podría venderse. A quien actúa,
            la ley le da derecho a una parte de lo que gane (art. 117 bis de la Ley Federal del Derecho de Autor)
            {sinPorcentaje && x?.tipo === 'elenco' ? ', aunque aquí marques «No aplica»' : ''}. Revísalo con un abogado
            antes de firmar{menor ? ', sobre todo porque firma una persona menor de edad' : ''}.
          </p>
        )}
        <Campo etiqueta="Vigencia">
          <select className={inp} value={vigencia} onChange={e => setVigencia(e.target.value)}>
            <option>por tiempo indefinido</option>
            <option>por un plazo de 5 años</option>
            <option>por un plazo de 10 años</option>
          </select>
        </Campo>
        <div className="flex flex-col justify-end gap-1.5 text-sm text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={menor} onChange={e => setMenor(e.target.checked)} />
            Es menor de edad
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copal-500" checked={gratuito} onChange={e => setGratuito(e.target.checked)} />
            Participación gratuita
          </label>
        </div>
        {menor && (
          <>
            <Campo etiqueta="Nombre de la madre, padre o tutor" className="md:col-span-2">
              <input className={inp} value={tutor} onChange={e => setTutor(e.target.value)} />
            </Campo>
            <Campo etiqueta="Parentesco">
              <input className={inp} value={parentesco} onChange={e => setParentesco(e.target.value)} />
            </Campo>
          </>
        )}
        {!gratuito && (
          <Campo etiqueta="Pago total acordado">
            <input type="number" className={inp} value={monto || ''} onChange={e => setMonto(num(e.target.value))} />
          </Campo>
        )}
        {x && (
          <div className="md:col-span-4 flex items-center gap-3 text-sm">
            {x.contrato === 'Firmado' ? (
              <span className="text-emerald-400">✓ Ya está marcado como firmado en Elenco y Equipo</span>
            ) : (
              <button className={btnSec + ' !text-xs'} onClick={() => onFirmado(x)}>
                ✓ Ya lo firmó — marcar como «Firmado»
              </button>
            )}
          </div>
        )}
      </div>

      <div className={papel + ' text-[14px] leading-relaxed'}>
        <Cabecera p={p} titulo="Carta de cesión de derechos de imagen, voz e interpretación" />
        <p className="mb-3">
          En <D>{ciudad}</D>, a <D>{fechaLarga(fecha)}</D>, yo, <D>{quien}</D>,{' '}
          {menor ? (
            <>
              en mi carácter de <D>{parentesco}</D> y representante legal de la persona menor de edad <D>{x?.nombre}</D>,
            </>
          ) : (
            <>mayor de edad, por mi propio derecho,</>
          )}{' '}
          manifiesto lo siguiente:
        </p>
        <ol className="list-decimal pl-5 space-y-2 mb-6">
          <li>
            Que {menor ? 'la persona menor a mi cargo participa' : 'participo'} en el cortometraje titulado{' '}
            <D>«{p.nombre}»</D> (en adelante, «la Obra»), dirigido por <D>{p.director}</D> y producido por{' '}
            <D>{responsable}</D> (en adelante, «la Producción»), {funcion}.{' '}
            {comercial
              ? 'La Obra es una producción con fines culturales y educativos que, además, podrá explotarse comercialmente.'
              : 'La Obra es una producción con fines culturales y educativos, sin fines de lucro.'}
          </li>
          <li>
            Que autorizo a la Producción, de manera expresa y {contraprestacion}, a fijar, reproducir, editar, doblar,
            subtitular, comunicar públicamente, distribuir y poner a disposición del público la imagen, la voz, el nombre
            y la interpretación {menor ? 'de la persona menor' : 'míos'}, tal como queden registrados en la Obra, así como
            en fotografías fijas, material detrás de cámaras y material promocional de la misma.
          </li>
          <li>
            Que esta autorización comprende la exhibición de la Obra con fines culturales y educativos: festivales,
            muestras y concursos; salas de cine; funciones en escuelas, cineclubes, foros y espacios culturales; plataformas digitales y
            redes sociales; portafolios de quienes participaron; y la promoción de la Obra y de su equipo creativo, en
            cualquier formato, en todo el mundo y <D>{vigencia}</D>.
          </li>
          {comercial ? (
            <>
              <li>
                Que esta autorización comprende también la explotación comercial de la Obra: su venta, licencia o renta a
                plataformas digitales, televisoras, distribuidoras y exhibidores, y las funciones con cobro de entrada,
                por los mismos medios, territorio y vigencia señalados en el punto anterior.
              </li>
              {sinPorcentaje ? (
                <li>
                  Que por dicha explotación comercial no se pacta una participación en los ingresos, sin perjuicio de
                  los derechos que, en su caso, otorga la Ley Federal del Derecho de Autor. La Producción informará por
                  escrito de cualquier acuerdo de venta o licencia de la Obra.
                </li>
              ) : (
                <li>
                  Que, por dicha explotación comercial, {menor ? 'la persona menor a mi cargo recibirá' : 'recibiré'} una
                  participación del <D>{porcentaje ? `${porcentaje}%` : ''}</D> de los ingresos netos que obtenga la
                  Producción, conforme al artículo 117 bis de la Ley Federal del Derecho de Autor. La Producción
                  informará por escrito de cualquier acuerdo de venta o licencia de la Obra y de los ingresos que genere.
                </li>
              )}
            </>
          ) : (
            <li>
              Que esta autorización no incluye la explotación comercial de la Obra. Si en el futuro la Producción deseara
              venderla o explotarla con fines de lucro, deberá obtener una nueva autorización por escrito.
            </li>
          )}
          <li>
            Que la Producción se compromete a no utilizar dicha imagen o voz fuera del contexto de la Obra y su promoción,
            ni de forma que atente contra la dignidad o la reputación de quien la cede.
          </li>
          <li>
            Que reconozco que la Obra pertenece a la Producción, y que la presente autorización se otorga en términos de
            los artículos 87 y 116 a 118 de la Ley Federal del Derecho de Autor, conservando el derecho a ser
            mencionado(a) en los créditos de la Obra.
          </li>
          <li>
            Que los datos personales aquí contenidos se usarán únicamente para fines de esta producción, conforme a la
            Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
          </li>
        </ol>
        <div className="grid grid-cols-2 gap-8">
          <Firma
            titulo={menor ? `${parentesco || 'Madre, padre o tutor'} — autoriza` : 'Cede los derechos'}
            nombre={quien}
            detalle="Identificación oficial: ____________________"
          />
          <Firma titulo="Por la Producción" nombre={responsable} />
          {menor && <Firma titulo="Persona menor de edad (enterada)" nombre={x?.nombre} />}
          <Firma titulo="Testigo" />
        </div>
        <FirmaCasa />
      </div>
    </>
  )
}

// ============ AUTORIZACIÓN DE LOCACIÓN ============
function AutorizacionLocacion({ p, ciudad, fecha, responsable, onFirmado }: Comunes & { onFirmado: (l: Locacion) => void }) {
  const [id, setId] = useState(p.locaciones[0]?.id ?? '')
  const [caracter, setCaracter] = useState('propietario(a)')
  const [condiciones, setCondiciones] = useState('')
  const l = p.locaciones.find(y => y.id === id)

  if (p.locaciones.length === 0)
    return <Vacio mensaje="Primero registra tus locaciones en «Locaciones»; de ahí salen la dirección, el contacto y el costo." />

  // Días del plan de rodaje en esta locación
  const dias = diasOrdenados(p).filter(d => d.locacionId === id && d.fecha)
  const fechas = dias.map(d => fechaLarga(d.fecha)).join(', ')
  const horario = dias.length ? `${dias[0].horaInicio} a ${dias[0].horaFin} h` : ''
  const gente = Math.max(personasTotal(p), p.personas.length)

  return (
    <>
      <div className={tarjeta + ' mb-4 grid gap-3 md:grid-cols-3 print:hidden'}>
        <Campo etiqueta="Locación">
          <select className={inp} value={id} onChange={e => setId(e.target.value)}>
            {p.locaciones.map(y => (
              <option key={y.id} value={y.id}>
                {y.nombre}
                {y.permiso === 'Sí' ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Quien firma es…">
          <select className={inp} value={caracter} onChange={e => setCaracter(e.target.value)}>
            <option>propietario(a)</option>
            <option>arrendatario(a)</option>
            <option>representante legal</option>
            <option>administrador(a)</option>
          </select>
        </Campo>
        <Campo etiqueta="Condiciones especiales (opcional)">
          <input className={inp} value={condiciones} onChange={e => setCondiciones(e.target.value)} placeholder="No usar la cocina, no fumar…" />
        </Campo>
        {l && (
          <div className="md:col-span-3 flex flex-wrap items-center gap-3 text-sm">
            {l.permiso === 'Sí' ? (
              <span className="text-emerald-400">✓ El permiso ya está marcado como «Sí» en Locaciones</span>
            ) : (
              <button className={btnSec + ' !text-xs'} onClick={() => onFirmado(l)}>
                ✓ Ya la firmaron — marcar permiso como «Sí»
              </button>
            )}
            {!dias.length && (
              <span className="text-yellow-300 text-xs">
                Esta locación aún no tiene días en el Plan de Rodaje: las fechas quedarán en blanco para llenarlas a mano.
              </span>
            )}
          </div>
        )}
      </div>

      {l && (
        <div className={papel + ' text-[14px] leading-relaxed'}>
          <Cabecera p={p} titulo="Autorización para el uso de locación" />
          <p className="mb-3">
            En <D>{ciudad}</D>, a <D>{fechaLarga(fecha)}</D>, <D>{l.contactoNombre}</D>, en su carácter de{' '}
            <D>{caracter}</D> del inmueble conocido como <D>{l.nombre}</D>, ubicado en <D>{l.direccion}</D> (en
            adelante, «la Locación»), autoriza a <D>{responsable}</D>, responsable de la producción del cortometraje{' '}
            <D>«{p.nombre}»</D> (en adelante, «la Producción»), obra con fines culturales y educativos, sin fines de lucro, a
            ingresar y filmar en la Locación bajo las siguientes condiciones:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-6">
            <li>
              <b>Fechas y horario:</b> <D>{fechas}</D>, en un horario aproximado de <D>{horario}</D>, incluyendo el tiempo
              de preparación y de retiro del equipo.
            </li>
            <li>
              <b>Personas y equipo:</b> la Producción podrá ingresar con su elenco, equipo técnico, cámaras, iluminación,
              utilería y demás material de filmación, con un aproximado de <D>{gente || ''}</D> personas.
            </li>
            <li>
              <b>Contraprestación:</b>{' '}
              {l.costo ? (
                <>
                  <D>{dinero(l.costo)}</D> <D>{l.unidadCosto}</D>, en la forma y fechas que acuerden las partes.
                </>
              ) : (
                <>la presente autorización se otorga a título gratuito.</>
              )}
            </li>
            <li>
              <b>Cuidado del inmueble:</b> la Producción se compromete a proteger pisos, muros y mobiliario; a devolver
              la Locación en el mismo estado en que la recibió; y a responder por los daños que cause, los cuales se
              documentarán por escrito en el momento en que ocurran.
            </li>
            <li>
              <b>Imagen de la Locación:</b> la Producción podrá mostrar la Locación —su fachada, interiores y los
              elementos visibles en ella— en la Obra y en su material promocional, en exhibiciones con fines culturales
              y educativos por cualquier medio, en todo el mundo y por tiempo indefinido, sin revelar la dirección exacta salvo acuerdo de las partes. Para efectos de la
              ficción, podrá cambiarse el nombre o la apariencia del lugar.
            </li>
            <li>
              <b>Facultades:</b> quien firma declara tener facultades para otorgar esta autorización, y que no existe
              impedimento de terceros (condominio, arrendador, copropietarios u otros).
            </li>
            <li>
              <b>Contacto el día de rodaje:</b> <D>{l.contactoNombre}</D>, teléfono <D>{l.contactoTelefono}</D>.
            </li>
            {condiciones && (
              <li>
                <b>Condiciones especiales:</b> {condiciones}
              </li>
            )}
          </ol>
          <div className="grid grid-cols-2 gap-8">
            <Firma titulo={`Autoriza — ${caracter}`} nombre={l.contactoNombre} detalle="Identificación oficial: ____________________" />
            <Firma titulo="Por la Producción" nombre={responsable} />
          </div>
          <FirmaCasa />
        </div>
      )}
    </>
  )
}
