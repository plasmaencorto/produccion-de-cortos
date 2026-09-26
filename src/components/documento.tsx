// ===== Piezas comunes de los documentos para firmar =====
import type { ReactNode } from 'react'
import type { Proyecto } from '../types'

// "2026-10-05" -> "5 de octubre de 2026"
export function fechaLarga(iso: string): string {
  if (!iso) return ''
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Un dato del documento: si falta, deja la raya para llenarlo a mano
export function D({ children }: { children: ReactNode }) {
  const vacio = children === '' || children === undefined || children === null
  return vacio ? (
    <span className="inline-block min-w-32 border-b border-zinc-500">&nbsp;</span>
  ) : (
    <b>{children}</b>
  )
}

export function Firma({ titulo, nombre, detalle }: { titulo: string; nombre?: string; detalle?: string }) {
  return (
    <div className="text-center text-sm break-inside-avoid">
      <div className="h-14" />
      <div className="border-t border-zinc-800 pt-1 font-semibold">{nombre || ' '}</div>
      <div className="text-xs text-zinc-600">{titulo}</div>
      {detalle && <div className="text-xs text-zinc-500 mt-0.5">{detalle}</div>}
    </div>
  )
}

export function Cabecera({ p, titulo }: { p: Proyecto; titulo: string }) {
  return (
    <div className="border-b-2 border-zinc-300 pb-3 mb-5 flex items-center gap-3">
      {p.logo && <img src={p.logo} alt="" className="h-12 w-auto shrink-0" />}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">🎬 {p.nombre}</p>
        <h2 className="text-xl font-black uppercase">{titulo}</h2>
      </div>
    </div>
  )
}
