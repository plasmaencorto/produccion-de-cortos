// ===== Importar Guion: sube un PDF o pega el texto y la app lo desglosa =====
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProyecto, useStore } from '../store'
import { Badge, Encabezado, btn, btnSec, inp, tarjeta, td, th } from '../components/ui'
import { uid } from '../utils'
import { analizarGuion, capitalizar, extraerTextoPDF, type ResultadoGuion } from '../guion'
import { CTA_CASTING, CTA_LOCACIONES } from '../plantillaPresupuesto'
import type { Escena, LineaPresupuesto, Locacion, Persona } from '../types'

export default function ImportarGuion() {
  const p = useProyecto()
  const mutarActivo = useStore(s => s.mutarActivo)
  const [texto, setTexto] = useState('')
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<ResultadoGuion | null>(null)
  const [importado, setImportado] = useState(false)
  // Qué crear al importar
  const [opciones, setOpciones] = useState({ locaciones: true, personajes: true, presupuesto: true })
  if (!p) return null

  const leerArchivo = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setError('')
    setResultado(null)
    setImportado(false)
    setCargando(true)
    try {
      const t = f.name.toLowerCase().endsWith('.pdf') ? await extraerTextoPDF(f) : await f.text()
      setTexto(t)
      setNombreArchivo(f.name)
      analizar(t)
    } catch {
      setError('No pude leer el archivo. Intenta con otro PDF o pega el texto del guion abajo.')
    } finally {
      setCargando(false)
    }
  }

  const analizar = (t = texto) => {
    setError('')
    setImportado(false)
    const res = analizarGuion(t)
    if (res.escenas.length === 0) {
      // muestra qué fue lo que se leyó, para saber si el PDF trae el texto o son imágenes
      const muestra = t.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3).join(' / ')
      setError(
        'No encontré escenas. El guion debe tener encabezados tipo "INT. SALA. DÍA" o "EXT. CALLE - NOCHE" (con o sin número de escena).' +
          (muestra
            ? ` Esto fue lo que leí al inicio del archivo: «${muestra.slice(0, 160)}…»`
            : ' El archivo no tiene texto legible: puede ser un PDF escaneado (fotos). En ese caso, pega el texto del guion aquí abajo.'),
      )
      setResultado(null)
      return
    }
    setResultado(res)
  }

  // Crea escenas, locaciones, personajes y partidas de presupuesto en el proyecto
  const importar = () => {
    if (!resultado) return
    mutarActivo(pr => {
      const nuevasLocaciones = [...pr.locaciones]
      const locPorNombre: Record<string, string> = {}
      if (opciones.locaciones)
        for (const l of resultado.locaciones) {
          const nombre = capitalizar(l.nombre)
          const existente = nuevasLocaciones.find(x => x.nombre.toUpperCase() === nombre.toUpperCase())
          if (existente) {
            locPorNombre[l.nombre] = existente.id
          } else {
            const nueva: Locacion = {
              id: uid(), nombre, direccion: '', tipo: l.tipo,
              contactoNombre: '', contactoTelefono: '', contactoCorreo: '',
              costo: 0, unidadCosto: 'por día', permiso: 'No', notas: 'Importada del guion', fotos: [],
            }
            nuevasLocaciones.push(nueva)
            locPorNombre[l.nombre] = nueva.id
          }
        }

      const nuevasPersonas = [...pr.personas]
      const perPorNombre: Record<string, string> = {}
      if (opciones.personajes)
        for (const nombre of resultado.personajes) {
          const personaje = capitalizar(nombre)
          const existente = nuevasPersonas.find(
            x => x.tipo === 'elenco' && x.personaje.toUpperCase() === personaje.toUpperCase(),
          )
          if (existente) {
            perPorNombre[nombre] = existente.id
          } else {
            const nueva: Persona = {
              id: uid(), tipo: 'elenco', nombre: '', personaje, categoria: 'Principal', rol: '',
              telefono: '', correo: '', tarifa: 0, unidadTarifa: 'por día',
              contrato: 'Sin confirmar', tallas: '', restricciones: '', notas: 'Importado del guion',
            }
            nuevasPersonas.push(nueva)
            perPorNombre[nombre] = nueva.id
          }
        }

      const base = pr.escenas.length
      const nuevasEscenas: Escena[] = resultado.escenas.map((e, i) => ({
        id: uid(),
        // respeta la numeración del guion si venía numerado
        numero: e.numero || String(base + i + 1),
        intExt: e.intExt,
        locacionId: locPorNombre[e.locacion] || '',
        locacionTexto: locPorNombre[e.locacion] ? '' : capitalizar(e.locacion),
        momento: e.momento,
        sinopsis: e.sinopsis,
        personajeIds: e.personajes.map(n => perPorNombre[n]).filter(Boolean),
        props: [], vestuario: '', maquillaje: '', vehiculos: '', sonido: '',
        notas: e.notas, paginas: e.paginas, estado: 'Sin filmar',
      }))

      // Partidas base de presupuesto: una por locación y una por personaje
      const nuevasLineas: LineaPresupuesto[] = []
      if (opciones.presupuesto) {
        const linea = (categoria: string, subcategoria: string, descripcion: string): LineaPresupuesto => ({
          id: uid(), categoria, subcategoria, descripcion,
          cantidad: 1, unidad: 'días', por: 1, tarifa: 0, iva: false, real: 0,
          proveedor: '', notas: 'Importado del guion',
        })
        for (const l of resultado.locaciones)
          if (!pr.presupuesto.some(x => x.descripcion === `Locación: ${capitalizar(l.nombre)}`))
            nuevasLineas.push(linea(CTA_LOCACIONES, 'Renta de locaciones', `Locación: ${capitalizar(l.nombre)}`))
        for (const n of resultado.personajes)
          if (!pr.presupuesto.some(x => x.descripcion === `Actor/Actriz: ${capitalizar(n)}`))
            nuevasLineas.push(linea(CTA_CASTING, 'Elenco principal', `Actor/Actriz: ${capitalizar(n)}`))
      }

      return {
        ...pr,
        nombre: pr.escenas.length === 0 && resultado.titulo ? resultado.titulo : pr.nombre,
        locaciones: nuevasLocaciones,
        personas: nuevasPersonas,
        escenas: [...pr.escenas, ...nuevasEscenas],
        presupuesto: [...pr.presupuesto, ...nuevasLineas],
      }
    })
    setImportado(true)
  }

  return (
    <>
      <Encabezado
        titulo="Importar Guion"
        subtitulo="Sube tu guion y la app crea solas las escenas, locaciones, personajes y partidas de presupuesto"
      />

      {/* Paso 1: subir o pegar */}
      <div className={tarjeta + ' mb-4'}>
        <h2 className="font-semibold text-zinc-200 mb-2">1️⃣ Sube tu guion (PDF o texto)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className={btn}>
            📄 Elegir archivo (.pdf o .txt)
            <input type="file" accept=".pdf,.txt,.fountain" className="hidden" onChange={e => leerArchivo(e.target.files)} />
          </label>
          {nombreArchivo && <span className="text-sm text-zinc-400">{nombreArchivo}</span>}
          {cargando && <span className="text-sm text-copal-300">Leyendo el guion…</span>}
        </div>
        <p className="text-xs text-zinc-500 mt-3 mb-1">…o pega aquí el texto del guion:</p>
        <textarea
          className={inp + ' font-mono !text-xs'}
          rows={6}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder={'INT. SALA. DÍA\n\nNORA entra y mira a los alumnos…\n\nNORA\nSu prueba final será única.'}
        />
        <button className={btnSec + ' mt-2'} onClick={() => analizar()} disabled={!texto.trim()}>
          🔍 Analizar guion
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      {/* Paso 2: revisar lo detectado */}
      {resultado && (
        <div className={tarjeta + ' mb-4'}>
          <h2 className="font-semibold text-zinc-200 mb-1">2️⃣ Revisa lo que encontré</h2>
          <p className="text-sm text-zinc-400 mb-3">
            {resultado.titulo && <>Guion: <b className="text-copal-300">{resultado.titulo}</b> · </>}
            {resultado.escenas.length} escenas · {resultado.personajes.length} personajes ·{' '}
            {resultado.locaciones.length} locaciones ·{' '}
            {resultado.escenas.reduce((t, e) => t + e.paginas, 0).toFixed(2)} páginas aprox.
            {resultado.numerado && <> · <span className="text-emerald-400">numeración del guion respetada ✓</span></>}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-xs text-zinc-500 mr-1">🎭 Personajes:</span>
            {resultado.personajes.map(x => <Badge key={x} color="ambar">{capitalizar(x)}</Badge>)}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs text-zinc-500 mr-1">📍 Locaciones:</span>
            {resultado.locaciones.map(x => <Badge key={x.nombre} color="verde">{capitalizar(x.nombre)} ({x.tipo})</Badge>)}
          </div>

          <div className="overflow-x-auto border border-zinc-800 rounded-lg">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['#', 'Escena', 'Momento', 'Sinopsis', 'Personajes', 'Pág.'].map(h => <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {resultado.escenas.map((e, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className={td + ' font-bold text-copal-300'}>{e.numero || i + 1}</td>
                    <td className={td + ' whitespace-nowrap'}>
                      {e.intExt}. {capitalizar(e.locacion) || '—'}
                      {e.notas && <span className="block text-[11px] text-zinc-500">{e.notas}</span>}
                    </td>
                    <td className={td}>{e.momento}</td>
                    <td className={td + ' max-w-72'}><span className="line-clamp-2 text-zinc-400 text-xs">{e.sinopsis}</span></td>
                    <td className={td + ' text-xs text-zinc-400 max-w-44'}>{e.personajes.map(capitalizar).join(', ')}</td>
                    <td className={td}>{e.paginas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paso 3: importar */}
      {resultado && !importado && (
        <div className={tarjeta}>
          <h2 className="font-semibold text-zinc-200 mb-2">3️⃣ Agregar al proyecto</h2>
          <div className="space-y-1.5 mb-3 text-sm text-zinc-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copal-500" checked={opciones.locaciones}
                onChange={e => setOpciones({ ...opciones, locaciones: e.target.checked })} />
              Crear las locaciones en el catálogo
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copal-500" checked={opciones.personajes}
                onChange={e => setOpciones({ ...opciones, personajes: e.target.checked })} />
              Crear los personajes en el elenco
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copal-500" checked={opciones.presupuesto}
                onChange={e => setOpciones({ ...opciones, presupuesto: e.target.checked })} />
              Crear partidas base en el presupuesto (elenco y locaciones, en $0 para que las llenes)
            </label>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Las escenas se agregan al Desglose de Guión{p.escenas.length > 0 && ' (ya tienes escenas: las nuevas se numeran a continuación)'}.
          </p>
          <button className={btn} onClick={importar}>✨ Importar todo al proyecto</button>
        </div>
      )}

      {importado && (
        <div className={tarjeta + ' border-emerald-700 bg-emerald-500/10'}>
          <p className="text-emerald-300 font-semibold mb-2">✅ ¡Listo! El guion quedó desglosado en el proyecto.</p>
          <div className="flex flex-wrap gap-2">
            <Link className={btnSec} to={`/p/${p.id}/desglose`}>📋 Ver el desglose</Link>
            <Link className={btnSec} to={`/p/${p.id}/personas`}>👥 Ver el elenco</Link>
            <Link className={btnSec} to={`/p/${p.id}/locaciones`}>📍 Ver locaciones</Link>
            <Link className={btnSec} to={`/p/${p.id}/presupuesto`}>💰 Ver presupuesto</Link>
          </div>
        </div>
      )}
    </>
  )
}
