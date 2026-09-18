// ===== Pantalla de rescate =====
// Si algo falla al dibujar la app, en vez de quedarse en blanco se muestra
// este mensaje con la opción de descargar un respaldo de los datos.
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { btn, btnSec } from './ui'
import { descargarArchivo } from '../utils'

interface Props {
  children: ReactNode
}
interface Estado {
  error: Error | null
}

export default class Rescate extends Component<Props, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fallo en la app:', error, info)
  }

  // Descarga todo lo guardado, pase lo que pase
  respaldar = () => {
    const datos = localStorage.getItem('produccion-cortos') || '{}'
    const fecha = new Date().toISOString().slice(0, 10)
    descargarArchivo(`respaldo-produccion-cortos-${fecha}.json`, datos, 'application/json')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-copal-400 mb-2">🎬 Algo se atoró</h1>
          <p className="text-zinc-300 text-sm mb-4">
            La app no pudo mostrar esta pantalla, pero <b>tus proyectos siguen guardados</b>. Antes que nada, descarga un
            respaldo para tenerlo a salvo; luego intenta volver al inicio.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button className={btn} onClick={this.respaldar}>
              ⬇ Descargar respaldo
            </button>
            <button
              className={btnSec}
              onClick={() => {
                location.hash = '#/'
                location.reload()
              }}
            >
              ↩ Volver al inicio
            </button>
          </div>
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer">Ver detalle técnico (por si me lo quieres mandar)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">{error.message}</pre>
          </details>
        </div>
      </div>
    )
  }
}
