// ===== Catálogo de Locaciones (con fotos) =====
import { useState } from 'react'
import { useProyecto, useStore } from '../store'
import { Badge, Campo, Encabezado, Modal, Vacio, btn, btnSec, inp, tarjeta } from '../components/ui'
import { archivoAImagen, dinero, num, uid } from '../utils'
import type { EstadoPermiso, Locacion, Proyecto, TipoLocacion } from '../types'

const locacionVacia = (): Locacion => ({
  id: uid(),
  nombre: '',
  direccion: '',
  tipo: 'Interior',
  contactoNombre: '',
  contactoTelefono: '',
  contactoCorreo: '',
  costo: 0,
  unidadCosto: 'por día',
  permiso: 'No',
  notas: '',
  fotos: [],
})

const TIPOS: TipoLocacion[] = ['Interior', 'Exterior', 'Mixto']
const PERMISOS: EstadoPermiso[] = ['Sí', 'No', 'En trámite']
const COLOR_PERMISO: Record<EstadoPermiso, string> = { Sí: 'verde', No: 'rojo', 'En trámite': 'amarillo' }

export default function Locaciones() {
  const p = useProyecto()
  const agregar = useStore(s => s.agregar)
  const actualizar = useStore(s => s.actualizar)
  const eliminar = useStore(s => s.eliminar)
  const [editando, setEditando] = useState<Locacion | null>(null)
  const [esNueva, setEsNueva] = useState(false)
  if (!p) return null

  const guardar = (l: Locacion) => {
    if (esNueva) agregar('locaciones', l)
    else actualizar('locaciones', l.id, l)
    setEditando(null)
  }

  const escenasDe = (id: string) => p.escenas.filter(e => e.locacionId === id).map(e => e.numero).join(', ')

  return (
    <>
      <Encabezado titulo="Locaciones" subtitulo="Catálogo de lugares de rodaje del proyecto">
        <button className={btn} onClick={() => { setEditando(locacionVacia()); setEsNueva(true) }}>
          + Nueva locación
        </button>
      </Encabezado>

      {p.locaciones.length === 0 ? (
        <Vacio mensaje="Aún no hay locaciones registradas." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.locaciones.map(l => (
            <div key={l.id} className={tarjeta + ' flex flex-col gap-2'}>
              {l.fotos[0] ? (
                <img src={l.fotos[0]} alt={l.nombre} className="w-full h-36 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-36 bg-zinc-800 rounded-lg flex items-center justify-center text-4xl">📍</div>
              )}
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-zinc-100">{l.nombre || 'Sin nombre'}</h2>
                <Badge color={COLOR_PERMISO[l.permiso]}>Permiso: {l.permiso}</Badge>
              </div>
              <p className="text-xs text-zinc-400">{l.tipo} · {l.direccion || 'Sin dirección'}</p>
              {l.costo > 0 && <p className="text-xs text-zinc-300">💰 {dinero(l.costo)} {l.unidadCosto}</p>}
              {escenasDe(l.id) && <p className="text-xs text-amber-300/80">🎬 Escenas: {escenasDe(l.id)}</p>}
              <div className="flex gap-1.5 mt-auto pt-2">
                <button className={btnSec + ' !px-2.5 !py-1 !text-xs'} onClick={() => { setEditando(l); setEsNueva(false) }}>
                  Editar
                </button>
                <button
                  className={btnSec + ' !px-2.5 !py-1 !text-xs hover:!bg-red-900/50 hover:!text-red-300'}
                  onClick={() => { if (confirm(`¿Eliminar la locación "${l.nombre}"?`)) eliminar('locaciones', l.id) }}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <EditorLocacion inicial={editando} esNueva={esNueva} onGuardar={guardar} onCerrar={() => setEditando(null)} p={p} />
      )}
    </>
  )
}

// --- Editor de locación (modal) ---
function EditorLocacion({
  inicial,
  esNueva,
  onGuardar,
  onCerrar,
}: {
  inicial: Locacion
  esNueva: boolean
  onGuardar: (l: Locacion) => void
  onCerrar: () => void
  p: Proyecto
}) {
  const [b, setB] = useState<Locacion>(inicial)
  const set = (patch: Partial<Locacion>) => setB(x => ({ ...x, ...patch }))

  // Agrega fotos comprimidas (para no llenar el almacenamiento del navegador)
  const agregarFotos = async (files: FileList | null) => {
    if (!files) return
    const nuevas: string[] = []
    for (const f of Array.from(files)) nuevas.push(await archivoAImagen(f))
    setB(x => ({ ...x, fotos: [...x.fotos, ...nuevas] }))
  }

  return (
    <Modal titulo={esNueva ? 'Nueva locación' : `Editar: ${b.nombre}`} onCerrar={onCerrar} ancho="max-w-3xl">
      <div className="grid gap-3 md:grid-cols-2">
        <Campo etiqueta="Nombre de la locación">
          <input className={inp} value={b.nombre} onChange={e => set({ nombre: e.target.value })} />
        </Campo>
        <Campo etiqueta="Tipo">
          <select className={inp} value={b.tipo} onChange={e => set({ tipo: e.target.value as TipoLocacion })}>
            {TIPOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Dirección completa" className="md:col-span-2">
          <input className={inp} value={b.direccion} onChange={e => set({ direccion: e.target.value })} />
        </Campo>
        <Campo etiqueta="Contacto del lugar (nombre)">
          <input className={inp} value={b.contactoNombre} onChange={e => set({ contactoNombre: e.target.value })} />
        </Campo>
        <Campo etiqueta="Teléfono del contacto">
          <input className={inp} value={b.contactoTelefono} onChange={e => set({ contactoTelefono: e.target.value })} />
        </Campo>
        <Campo etiqueta="Correo del contacto">
          <input className={inp} value={b.contactoCorreo} onChange={e => set({ contactoCorreo: e.target.value })} />
        </Campo>
        <Campo etiqueta="Permiso requerido">
          <select className={inp} value={b.permiso} onChange={e => set({ permiso: e.target.value as EstadoPermiso })}>
            {PERMISOS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Costo de renta">
          <input type="number" className={inp} value={b.costo || ''} onChange={e => set({ costo: num(e.target.value) })} />
        </Campo>
        <Campo etiqueta="Unidad del costo">
          <select className={inp} value={b.unidadCosto} onChange={e => set({ unidadCosto: e.target.value })}>
            <option>por día</option>
            <option>por jornada</option>
            <option>total</option>
          </select>
        </Campo>
        <Campo etiqueta="Notas de acceso, parqueo, restricciones" className="md:col-span-2">
          <textarea className={inp} rows={2} value={b.notas} onChange={e => set({ notas: e.target.value })} />
        </Campo>
        <Campo etiqueta="Fotos" className="md:col-span-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {b.fotos.map((f, i) => (
              <div key={i} className="relative">
                <img src={f} alt="" className="w-24 h-24 object-cover rounded-lg border border-zinc-700" />
                <button
                  onClick={() => set({ fotos: b.fotos.filter((_, j) => j !== i) })}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-none"
                  title="Quitar foto"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <label className={btnSec + ' !text-xs'}>
            📷 Agregar fotos
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => agregarFotos(e.target.files)} />
          </label>
          <p className="text-[11px] text-zinc-500 mt-1">Las fotos se comprimen y se guardan en el navegador; usa pocas por locación.</p>
        </Campo>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className={btnSec} onClick={onCerrar}>Cancelar</button>
        <button className={btn} onClick={() => onGuardar(b)}>Guardar</button>
      </div>
    </Modal>
  )
}
