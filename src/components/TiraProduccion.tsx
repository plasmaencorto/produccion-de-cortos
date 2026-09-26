// ===== Tira de producción (stripboard) =====
// La vista clásica del 1er AD: cada escena es una tira de color según
// INT/EXT y día/noche, y los días se separan con una barra negra.
// Se reacomoda arrastrando, igual que la lista del plan de rodaje.
import { fechaBonita } from '../utils'
import { nombreLocacion, numeroDia, numeroPersonaje, paginasEnOctavos } from '../helpers'
import type { DiaRodaje, Escena, Proyecto } from '../types'

// Colores estándar de la industria para las tiras
export const COLORES_TIRA = [
  { clave: 'int-dia', nombre: 'INT · Día', fondo: '#ffffff' },
  { clave: 'ext-dia', nombre: 'EXT · Día', fondo: '#fde047' },
  { clave: 'int-noche', nombre: 'INT · Noche', fondo: '#93c5fd' },
  { clave: 'ext-noche', nombre: 'EXT · Noche', fondo: '#86efac' },
  { clave: 'magica', nombre: 'Amanecer / Atardecer', fondo: '#fdba74' },
]

export function colorTira(e: Escena): string {
  const ext = e.intExt !== 'INT'
  if (e.momento === 'AMANECER' || e.momento === 'ATARDECER') return COLORES_TIRA[4].fondo
  if (e.momento === 'NOCHE') return ext ? COLORES_TIRA[3].fondo : COLORES_TIRA[2].fondo
  return ext ? COLORES_TIRA[1].fondo : COLORES_TIRA[0].fondo
}

type Arrastre = { escenaId: string; origen: string | null }

const leer = (ev: React.DragEvent): Arrastre | null => {
  try {
    return JSON.parse(ev.dataTransfer.getData('text/plain'))
  } catch {
    return null
  }
}

const paginasDe = (escenas: Escena[]) => escenas.reduce((t, e) => t + (e.paginas || 0), 0)

export default function TiraProduccion({
  p,
  dias,
  sinAsignar,
  onMover,
  onQuitar,
}: {
  p: Proyecto
  dias: DiaRodaje[]
  sinAsignar: Escena[]
  onMover: (escenaId: string, origen: string | null, destino: string, indice?: number) => void
  onQuitar: (diaId: string, escenaId: string) => void
}) {
  const escenasDe = (d: DiaRodaje) => d.escenaIds.map(id => p.escenas.find(e => e.id === id)).filter(Boolean) as Escena[]

  return (
    <div>
      {/* Leyenda de colores */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-[11px] text-zinc-400">
        {COLORES_TIRA.map(c => (
          <span key={c.clave} className="inline-flex items-center gap-1.5">
            <span className="w-4 h-3 rounded-sm border border-zinc-600" style={{ backgroundColor: c.fondo }} />
            {c.nombre}
          </span>
        ))}
        <span className="text-zinc-500">· Los números de la derecha son el elenco (como en la hoja de llamado)</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px] border border-zinc-700 rounded-lg overflow-hidden print:border-zinc-400">
          {dias.map(d => {
            const escenas = escenasDe(d)
            return (
              <div
                key={d.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  const a = leer(e)
                  if (a) onMover(a.escenaId, a.origen, d.id)
                }}
              >
                {escenas.map((e, i) => (
                  <Tira
                    key={e.id}
                    p={p}
                    e={e}
                    origen={d.id}
                    onDrop={a => onMover(a.escenaId, a.origen, d.id, i)}
                    onQuitar={() => onQuitar(d.id, e.id)}
                  />
                ))}
                {escenas.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-2 bg-zinc-900/60">Arrastra tiras aquí</p>
                )}
                {/* Barra negra de fin de día, como en la tira de papel */}
                <div className="bg-black text-white px-3 py-1.5 flex flex-wrap items-center gap-x-4 text-xs font-bold uppercase tracking-wide border-y border-zinc-700">
                  <span className="text-copal-400">Fin del día {numeroDia(p, d.id)}</span>
                  <span className="font-normal normal-case text-zinc-300 capitalize">{fechaBonita(d.fecha)}</span>
                  <span className="font-normal normal-case text-zinc-400">{nombreLocacion(p, d.locacionId)}</span>
                  <span className="flex-1" />
                  <span>{paginasEnOctavos(paginasDe(escenas)) || 0} pág.</span>
                  <span className="text-zinc-400 font-normal">{escenas.length} esc.</span>
                </div>
              </div>
            )
          })}

          {/* Escenas que aún no tienen día */}
          <div className="print:hidden">
            <div className="bg-zinc-800 text-zinc-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
              Sin programar ({sinAsignar.length})
            </div>
            <div
              className="min-h-10"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const a = leer(e)
                if (a?.origen) onQuitar(a.origen, a.escenaId)
              }}
            >
              {sinAsignar.map(e => (
                <Tira key={e.id} p={p} e={e} origen={null} />
              ))}
              {sinAsignar.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-2">
                  Todas las escenas tienen día ✓ — arrastra una tira aquí para sacarla del plan
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Una tira (una escena) ---
function Tira({
  p,
  e,
  origen,
  onDrop,
  onQuitar,
}: {
  p: Proyecto
  e: Escena
  origen: string | null
  onDrop?: (a: Arrastre) => void
  onQuitar?: () => void
}) {
  const reparto = e.personajeIds
    .map(id => numeroPersonaje(p, id))
    .filter(Boolean)
    .sort((a, b) => a - b)
  return (
    <div
      draggable
      onDragStart={ev => ev.dataTransfer.setData('text/plain', JSON.stringify({ escenaId: e.id, origen }))}
      onDragOver={ev => ev.preventDefault()}
      onDrop={ev => {
        if (!onDrop) return
        ev.stopPropagation()
        const a = leer(ev)
        if (a) onDrop(a)
      }}
      style={{ backgroundColor: colorTira(e) }}
      className="group grid grid-cols-[18px_52px_48px_minmax(120px,1.2fr)_88px_56px_minmax(160px,2fr)_90px_20px] items-center gap-2 px-2 py-1 text-[12px] text-zinc-900 border-b border-black/20 cursor-grab"
      title="Arrastra para cambiar el orden o el día"
    >
      <span className="text-zinc-500 print:invisible">⠿</span>
      <span className="font-black">Esc. {e.numero}</span>
      <span className="font-semibold">{e.intExt}</span>
      <span className="font-semibold uppercase truncate">{nombreLocacion(p, e.locacionId, e.locacionTexto) || '—'}</span>
      <span className="uppercase">{e.momento}</span>
      <span className="text-right tabular-nums">{paginasEnOctavos(e.paginas)}</span>
      <span className="truncate text-zinc-700">{e.sinopsis}</span>
      <span className="font-bold text-right tabular-nums">{reparto.join(', ')}</span>
      {onQuitar ? (
        <button
          onClick={onQuitar}
          className="text-zinc-500 hover:text-red-600 opacity-0 group-hover:opacity-100 print:hidden"
          title="Quitar del día"
        >
          ✕
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}
