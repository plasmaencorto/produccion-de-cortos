// ===== Estructura general: barra lateral + contenido =====
import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { useStore } from '../store'
import Buscador from './Buscador'

const SECCIONES = [
  { ruta: '', icono: '🎬', nombre: 'Dashboard' },
  { ruta: 'guion', icono: '📥', nombre: 'Importar Guion' },
  { ruta: 'desglose', icono: '📋', nombre: 'Desglose de Guión' },
  { ruta: 'presupuesto', icono: '💰', nombre: 'Presupuesto' },
  { ruta: 'gastos', icono: '🧾', nombre: 'Control de Gastos' },
  { ruta: 'plan', icono: '📅', nombre: 'Plan de Rodaje' },
  { ruta: 'llamado', icono: '📣', nombre: 'Hoja de Llamado' },
  { ruta: 'personas', icono: '👥', nombre: 'Elenco y Equipo' },
  { ruta: 'locaciones', icono: '📍', nombre: 'Locaciones' },
  { ruta: 'equipamiento', icono: '🎥', nombre: 'Equipamiento' },
  { ruta: 'reportes', icono: '📊', nombre: 'Reportes' },
]

export default function Layout() {
  const { id } = useParams()
  const proyecto = useStore(s => s.proyectos.find(p => p.id === id))
  const setActivo = useStore(s => s.setActivo)
  const soloLectura = useStore(s => s.soloLectura)
  const setSoloLectura = useStore(s => s.setSoloLectura)
  // En celular el menú arranca recogido, para que quepa el contenido;
  // en computadora arranca abierto
  const enCelular = () => typeof window !== 'undefined' && window.innerWidth < 768
  const [abierto, setAbierto] = useState(() => !enCelular())

  // Mantiene sincronizado el proyecto activo con la URL
  useEffect(() => {
    if (proyecto) setActivo(proyecto.id)
  }, [proyecto?.id]) // eslint-disable-line

  if (!proyecto) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen">
      <aside
        className={`${abierto ? 'w-64' : 'w-14'} shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all print:hidden sticky top-0 h-screen overflow-y-auto`}
      >
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={() => setAbierto(!abierto)}
            className="text-zinc-400 hover:text-amber-400 text-lg shrink-0"
            title="Mostrar / ocultar menú"
          >
            ☰
          </button>
          {abierto && (
            <Link to="/" className="text-amber-400 font-bold truncate hover:underline" title="Volver a mis proyectos">
              🎬 {proyecto.nombre}
            </Link>
          )}
        </div>
        {abierto && (
          <div className="px-3 pb-2">
            <Buscador proyecto={proyecto} />
          </div>
        )}
        <nav className="flex-1 px-2 space-y-0.5">
          {SECCIONES.map(s => (
            <NavLink
              key={s.ruta}
              to={s.ruta === '' ? `/p/${proyecto.id}` : `/p/${proyecto.id}/${s.ruta}`}
              end={s.ruta === ''}
              title={s.nombre}
              // en celular, al elegir sección el menú se recoge solo
              onClick={() => enCelular() && setAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded px-2.5 py-2 text-sm ${
                  isActive ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
                }`
              }
            >
              <span>{s.icono}</span>
              {abierto && <span className="truncate">{s.nombre}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <label
            className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
            title="Activa este modo para compartir la pantalla sin riesgo de cambios accidentales"
          >
            <input
              type="checkbox"
              checked={soloLectura}
              onChange={e => setSoloLectura(e.target.checked)}
              className="accent-amber-500"
            />
            {abierto && <span>Modo solo lectura</span>}
          </label>
          {abierto && <p className="text-[11px] text-zinc-500">💾 Guardado automático activo</p>}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {soloLectura && (
          <div className="bg-amber-500/15 text-amber-300 text-center text-sm py-1.5 print:hidden">
            🔒 Modo solo lectura: los cambios están desactivados
          </div>
        )}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
