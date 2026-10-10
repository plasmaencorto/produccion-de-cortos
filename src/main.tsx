import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Guardar la app para que abra sin internet (locaciones sin señal).
// Solo en el sitio: el archivo de doble clic ya es offline por naturaleza, y en
// file:// los service workers ni siquiera están permitidos.
if (location.protocol !== 'file:' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sin esto la app funciona igual, nada más que necesitando internet
    })
  })
}
