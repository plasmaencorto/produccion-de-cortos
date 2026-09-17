import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Hay dos formas de empacar la app:
//
//  1) ARCHIVO SUELTO (por defecto): todo queda dentro de un solo index.html
//     que se abre con doble clic, sin internet ni Terminal.
//     → npm run build
//
//  2) SITIO WEB: archivos separados, que cargan más rápido en internet
//     porque el navegador los guarda en caché.
//     → npm run build:web   (usa WEB=1)
const paraWeb = process.env.WEB === '1'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(paraWeb ? [] : [viteSingleFile()])],
  build: {
    outDir: paraWeb ? 'dist-web' : 'dist',
    // En la versión web sí conviene partir el código en trozos:
    // el lector de guiones en PDF (pesado) se descarga solo cuando se usa
    chunkSizeWarningLimit: 2000,
  },
})
