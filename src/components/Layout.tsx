// ===== Estructura general: barra lateral + contenido =====
import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import { useStore } from '../store'
import Buscador from './Buscador'
import { descargarRespaldo, haceCuanto, necesitaRespaldo } from '../respaldo'

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
  const ultimoRespaldo = useStore(s => (id ? s.respaldos[id] : undefined))
  const pospuesto = useStore(s => (id ? s.pospuestos[id] : undefined))
  const posponerRespaldo = useStore(s => s.posponerRespaldo)
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
            className="text-zinc-400 hover:text-copal-400 text-lg shrink-0"
            title="Mostrar / ocultar menú"
          >
            ☰
          </button>
          {abierto && (
            <Link to="/" className="text-copal-400 font-bold truncate hover:underline" title="Volver a mis proyectos">
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
                  isActive ? 'bg-copal-500/15 text-copal-300 font-semibold' : 'text-zinc-300 hover:bg-zinc-800'
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
              className="accent-copal-500"
            />
            {abierto && <span>Modo solo lectura</span>}
          </label>
          {abierto && (
            <>
              <p className="text-[11px] text-zinc-500">💾 Guardado automático activo</p>
              <button
                onClick={() => descargarRespaldo(proyecto)}
                className="text-[11px] text-zinc-400 hover:text-copal-300 cursor-pointer text-left"
                title="Descarga un archivo .json con todo el proyecto"
              >
                ⬇ Respaldar ahora <span className="text-zinc-600">· último: {haceCuanto(ultimoRespaldo)}</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {soloLectura && (
          <div className="bg-copal-500/15 text-copal-300 text-center text-sm py-1.5 print:hidden">
            🔒 Modo solo lectura: los cambios están desactivados
          </div>
        )}
        {necesitaRespaldo(proyecto, ultimoRespaldo, pospuesto) && (
          <div className="bg-rosa-500/10 border-b border-rosa-500/40 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm print:hidden">
            <p className="text-zinc-200 flex-1 min-w-60">
              💾 <b>Haz un respaldo de «{proyecto.nombre}».</b>{' '}
              <span className="text-zinc-400">
                {ultimoRespaldo
                  ? `El último fue ${haceCuanto(ultimoRespaldo)} y desde entonces hay cambios.`
                  : 'Aún no tiene ninguno.'}{' '}
                Tu trabajo vive solo en este navegador: si se borra el historial, el respaldo es lo que lo salva.
              </span>
            </p>
            <div className="flex gap-2">
              <button
                className="bg-rosa-500 hover:bg-rosa-400 text-white font-semibold rounded-lg px-3 py-1.5 text-sm cursor-pointer"
                onClick={() => descargarRespaldo(proyecto)}
              >
                ⬇ Descargar respaldo
              </button>
              <button
                className="text-zinc-400 hover:text-zinc-200 text-xs px-2 cursor-pointer"
                onClick={() => posponerRespaldo(proyecto.id, 1)}
              >
                Mañana
              </button>
            </div>
          </div>
        )}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
