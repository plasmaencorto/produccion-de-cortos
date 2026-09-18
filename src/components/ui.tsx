// ===== Piezas de interfaz reutilizables y clases de estilo compartidas =====
import { useId, useState, type ReactNode } from 'react'
import logoPlasma from '../assets/logo-plasma.png'
import logoCopal from '../assets/logo-copal.svg'

// Colores de la casa (de los logotipos de Olor a Copal y Plasma en Corto)
export const ROSA = '#ec0e73'
export const TURQUESA = '#00b3c8'
export const AMARILLO = '#ffc20e'

// Greca escalonada, al modo de las grecas prehispánicas.
// Se usa como remate decorativo y para dar identidad a los documentos.
export function Greca({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={className} height="10" width="100%" aria-hidden="true">
      <defs>
        {/* el motivo se repite a lo ancho, sin estirarse */}
        <pattern id={`greca-${id}`} width="72" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 10 V6 H6 V2 H12 V6 H18 V10 Z" fill={ROSA} />
          <path d="M18 10 V6 H24 V2 H30 V6 H36 V10 Z" fill={TURQUESA} />
          <path d="M36 10 V6 H42 V2 H48 V6 H54 V10 Z" fill={AMARILLO} />
          <path d="M54 10 V6 H60 V2 H66 V6 H72 V10 Z" fill={TURQUESA} />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#greca-${id})`} />
    </svg>
  )
}

// Firma de la casa para los documentos impresos (hojas de llamado, reportes)
export function FirmaCasa() {
  return (
    <div className="mt-6 pt-3 border-t border-zinc-300 flex items-center justify-between gap-4">
      <p className="text-[10px] text-zinc-500 leading-tight">
        Documento generado con <b>Producción de Cortos</b>
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <img src={logoPlasma} alt="Plasma en Corto" className="h-7 w-auto" />
        <img src={logoCopal} alt="Olor a Copal" className="h-7 w-auto" />
      </div>
    </div>
  )
}

// Clases de estilo (tema oscuro)
export const inp =
  'w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-copal-500'
export const inpMini =
  'w-full bg-transparent border border-zinc-700/60 rounded px-1.5 py-1 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-copal-500'
export const btn =
  'inline-flex items-center gap-1.5 bg-copal-500 hover:bg-copal-400 text-zinc-950 font-semibold rounded-lg px-3 py-1.5 text-sm cursor-pointer disabled:opacity-40'
export const btnSec =
  'inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-1.5 text-sm cursor-pointer'
export const btnPeligro =
  'inline-flex items-center gap-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-800 text-red-300 rounded-lg px-3 py-1.5 text-sm cursor-pointer'
export const th =
  'text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-2 whitespace-nowrap'
export const td = 'px-2 py-1.5 text-sm text-zinc-200 align-top'
export const tarjeta = 'bg-zinc-900 border border-zinc-800 rounded-xl p-4'

// Clases para las vistas "papel" (hoja de llamado y reportes, listas para imprimir)
export const papel =
  'bg-white text-zinc-900 rounded-lg shadow-2xl p-8 max-w-4xl mx-auto overflow-x-auto print:shadow-none print:max-w-none print:p-0 print:rounded-none print:overflow-visible'
export const inpPapel =
  'w-full border border-zinc-300 rounded px-2 py-1 text-sm bg-white text-zinc-900 focus:outline-none focus:border-copal-500'
export const thPapel =
  'text-left text-[11px] font-bold uppercase tracking-wide border border-zinc-300 bg-zinc-100 px-2 py-1.5'
export const tdPapel = 'border border-zinc-300 px-2 py-1.5 text-sm align-top'

// Campo con etiqueta arriba
export function Campo({
  etiqueta,
  children,
  className = '',
}: {
  etiqueta: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-zinc-400 mb-1">{etiqueta}</span>
      {children}
    </label>
  )
}

// Encabezado de página con título y botones de acción
export function Encabezado({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string
  subtitulo?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{titulo}</h1>
        {subtitulo && <p className="text-sm text-zinc-400 mt-0.5">{subtitulo}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {children}
        <BotonRefrescar />
      </div>
    </div>
  )
}

// Botón para volver a cargar la pantalla en la que se está.
// Los datos ya se guardan solos, así que recargar no pierde nada.
export function BotonRefrescar() {
  const [girando, setGirando] = useState(false)
  return (
    <button
      type="button"
      title="Actualizar esta pantalla"
      aria-label="Actualizar esta pantalla"
      onClick={() => {
        setGirando(true)
        // deja que se vea el giro antes de recargar
        setTimeout(() => location.reload(), 450)
      }}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-copal-400 hover:border-copal-500 cursor-pointer shrink-0"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-4 h-4 ${girando ? 'animate-spin' : ''}`}
      >
        <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
        <polyline points="20.5 3.5 20.5 9 15 9" />
      </svg>
    </button>
  )
}

// Ventana modal
export function Modal({
  titulo,
  onCerrar,
  children,
  ancho = 'max-w-2xl',
}: {
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onCerrar}
    >
      <div
        className={`${ancho} w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl my-8`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="font-semibold text-copal-300">{titulo}</h2>
          <button onClick={onCerrar} className="text-zinc-400 hover:text-zinc-100 text-lg leading-none">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Etiqueta de color (estado, semáforo, etc.)
const COLORES: Record<string, string> = {
  verde: 'bg-emerald-500/15 text-emerald-300 border-emerald-700',
  amarillo: 'bg-yellow-500/15 text-yellow-300 border-yellow-700',
  rojo: 'bg-red-500/15 text-red-300 border-red-700',
  ambar: 'bg-copal-500/15 text-copal-300 border-copal-700',
  gris: 'bg-zinc-700/40 text-zinc-300 border-zinc-600',
}
export function Badge({ children, color = 'gris' }: { children: ReactNode; color?: string }) {
  return (
    <span
      className={`inline-block text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${COLORES[color] || COLORES.gris}`}
    >
      {children}
    </span>
  )
}

// Mensaje cuando una sección está vacía
export function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-800 rounded-xl">
      {mensaje}
    </div>
  )
}
