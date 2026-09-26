// ===== Pantalla inicial: Mis Proyectos =====
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Badge, Greca, btn, btnSec, inp, tarjeta } from '../components/ui'
import { descargarRespaldo, haceCuanto, necesitaRespaldo } from '../respaldo'
// Los logos se importan para que queden dentro del archivo suelto
// (el de doble clic) y no dependan de imágenes aparte
import logoPlasma from '../assets/logo-plasma.png'
import logoCopal from '../assets/logo-copal.svg'

const COLOR_ESTADO: Record<string, string> = {
  'En Preproducción': 'ambar',
  'En Rodaje': 'verde',
  'En Postproducción': 'amarillo',
  Entregado: 'gris',
}

export default function Proyectos() {
  const proyectos = useStore(s => s.proyectos)
  const crearProyecto = useStore(s => s.crearProyecto)
  const duplicarProyecto = useStore(s => s.duplicarProyecto)
  const eliminarProyecto = useStore(s => s.eliminarProyecto)
  const importarProyecto = useStore(s => s.importarProyecto)
  const respaldos = useStore(s => s.respaldos)
  const pospuestos = useStore(s => s.pospuestos)
  const [nombre, setNombre] = useState('')
  const nav = useNavigate()
  // ¿se está usando desde internet, o es el archivo abierto con doble clic?
  const enInternet = location.protocol !== 'file:'

  const crear = () => {
    const n = nombre.trim()
    if (!n) return
    const id = crearProyecto(n)
    setNombre('')
    nav(`/p/${id}`)
  }

  // Importa un respaldo .json exportado desde esta app
  const importar = async (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    try {
      const p = JSON.parse(await f.text())
      if (!p || typeof p.nombre !== 'string' || !Array.isArray(p.escenas)) throw new Error()
      importarProyecto(p)
    } catch {
      alert('El archivo no es un respaldo válido de proyecto')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="text-center py-10">
        <h1 className="titulo-casa text-4xl sm:text-5xl">
          <span className="bg-gradient-to-r from-rosa-500 via-rosa-400 to-copal-500 bg-clip-text text-transparent">
            Producción de Cortos
          </span>
        </h1>
        <p className="text-turquesa-300 mt-2 uppercase tracking-wide text-sm font-semibold">
          Desglose · Presupuesto · Plan de rodaje · Hojas de llamado
        </p>
        <Greca className="mt-6 max-w-xs mx-auto opacity-80" />
      </header>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <input
          className={inp + ' max-w-xs'}
          placeholder="Nombre del nuevo cortometraje…"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && crear()}
        />
        <button className={btn} onClick={crear}>
          + Crear proyecto
        </button>
        <label className={btnSec}>
          ⬆ Importar respaldo (.json)
          <input type="file" accept=".json" className="hidden" onChange={e => importar(e.target.files)} />
        </label>
      </div>

      {/* Cuando la app se usa por internet conviene aclarar dónde quedan los datos,
          porque cada quien los guarda en su propio navegador */}
      {enInternet && (
        <div className="max-w-2xl mx-auto mb-8 bg-copal-500/10 border border-copal-700/60 rounded-xl px-4 py-3 text-sm">
          <p className="text-copal-200 font-semibold mb-1">📍 Cómo se guardan tus proyectos</p>
          <p className="text-zinc-300">
            Todo se guarda <b>en este navegador y en este dispositivo</b> — nadie más ve tus proyectos, ni siquiera
            nosotros. Por eso: si vas a cambiar de computadora o de celular, usa el botón{' '}
            <b>⬇ Respaldo</b> de tu proyecto y luego <b>⬆ Importar respaldo</b> en el otro equipo. Haz respaldos de vez
            en cuando, como cuando guardas un archivo.
          </p>
        </div>
      )}

      {proyectos.length === 0 && (
        <p className="text-center text-zinc-500">Aún no tienes proyectos. ¡Crea el primero arriba! 🍿</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proyectos.map(p => (
          <div key={p.id} className={tarjeta + ' flex flex-col gap-2'}>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/p/${p.id}`} className="font-bold text-lg text-zinc-100 hover:text-copal-300">
                {p.nombre}
              </Link>
              <Badge color={COLOR_ESTADO[p.estado]}>{p.estado}</Badge>
            </div>
            <p className="text-xs text-zinc-400">
              {p.escenas.length} escenas · {p.diasRodaje.length} días de rodaje · {p.personas.length} personas
            </p>
            {p.director && <p className="text-xs text-zinc-500">Dir. {p.director}</p>}
            {necesitaRespaldo(p, respaldos[p.id], pospuestos[p.id]) ? (
              <p className="text-xs text-rosa-300">
                💾 {respaldos[p.id] ? `Último respaldo ${haceCuanto(respaldos[p.id])} — ya toca otro` : 'Sin respaldo todavía'}
              </p>
            ) : (
              <p className="text-xs text-zinc-500">💾 Último respaldo: {haceCuanto(respaldos[p.id])}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              <Link to={`/p/${p.id}`} className={btn + ' !px-2.5 !py-1 !text-xs'}>
                Abrir
              </Link>
              <button className={btnSec + ' !px-2.5 !py-1 !text-xs'} onClick={() => duplicarProyecto(p.id)}>
                Duplicar
              </button>
              <button className={btnSec + ' !px-2.5 !py-1 !text-xs'} onClick={() => descargarRespaldo(p)} title="Descargar respaldo JSON">
                ⬇ Respaldo
              </button>
              <button
                className={btnSec + ' !px-2.5 !py-1 !text-xs hover:!bg-red-900/50 hover:!text-red-300'}
                onClick={() => {
                  if (confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.\n\nTip: descarga un respaldo antes.`))
                    eliminarProyecto(p.id)
                }}
              >
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quién hace la herramienta */}
      <footer className="mt-16 pt-8 border-t border-zinc-800/80 flex flex-col items-center gap-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Una herramienta de</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <img
            src={logoPlasma}
            alt="Plasma en Corto — Centro Cinematográfico de la Laguna"
            className="h-16 sm:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
          <img
            src={logoCopal}
            alt="Olor a Copal"
            className="h-16 sm:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
        <p className="text-[11px] text-zinc-600 text-center">
          Hecha para quien produce cine en corto. Úsala libremente. 🎬
        </p>
      </footer>
    </div>
  )
}
