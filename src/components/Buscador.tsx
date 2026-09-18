// ===== Búsqueda global dentro del proyecto =====
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Proyecto } from '../types'

interface Resultado {
  tipo: string
  texto: string
  ruta: string
}

export default function Buscador({ proyecto }: { proyecto: Proyecto }) {
  const [q, setQ] = useState('')
  const t = q.trim().toLowerCase()
  const con = (s: string) => s.toLowerCase().includes(t)

  let resultados: Resultado[] = []
  if (t.length >= 2) {
    resultados = [
      ...proyecto.escenas
        .filter(e => con(e.numero) || con(e.sinopsis) || con(e.notas))
        .map(e => ({ tipo: 'Escena', texto: `Esc. ${e.numero} — ${e.sinopsis.slice(0, 40)}`, ruta: 'desglose' })),
      ...proyecto.personas
        .filter(x => con(x.nombre) || con(x.personaje) || con(x.rol))
        .map(x => ({ tipo: x.tipo === 'elenco' ? 'Elenco' : 'Técnico', texto: x.nombre, ruta: 'personas' })),
      ...proyecto.locaciones
        .filter(l => con(l.nombre) || con(l.direccion))
        .map(l => ({ tipo: 'Locación', texto: l.nombre, ruta: 'locaciones' })),
      ...proyecto.equipos
        .filter(eq => con(eq.nombre) || con(eq.marcaModelo))
        .map(eq => ({ tipo: 'Equipo', texto: eq.nombre, ruta: 'equipamiento' })),
      ...proyecto.presupuesto
        .filter(l => con(l.descripcion) || con(l.proveedor))
        .map(l => ({ tipo: 'Presupuesto', texto: l.descripcion || l.subcategoria, ruta: 'presupuesto' })),
      ...(proyecto.solicitudes ?? [])
        .filter(s => con(s.concepto) || con(s.proveedor) || con(s.folio))
        .map(s => ({ tipo: 'Solicitud', texto: `${s.folio} — ${s.concepto.slice(0, 35)}`, ruta: 'gastos' })),
      ...(proyecto.gastos ?? [])
        .filter(g => con(g.concepto) || con(g.proveedor) || con(g.factura))
        .map(g => ({ tipo: 'Gasto', texto: g.concepto || g.proveedor, ruta: 'gastos' })),
    ].slice(0, 12)
  }

  return (
    <div className="relative">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="🔍 Buscar en el proyecto…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-copal-500"
      />
      {t.length >= 2 && (
        <div className="absolute z-40 mt-1 w-72 max-h-80 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl">
          {resultados.length === 0 && <p className="p-3 text-xs text-zinc-400">Sin resultados</p>}
          {resultados.map((r, i) => (
            <Link
              key={i}
              to={`/p/${proyecto.id}/${r.ruta}`}
              onClick={() => setQ('')}
              className="block px-3 py-2 hover:bg-zinc-700 text-xs"
            >
              <span className="text-copal-400">{r.tipo}:</span>{' '}
              <span className="text-zinc-200">{r.texto}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
