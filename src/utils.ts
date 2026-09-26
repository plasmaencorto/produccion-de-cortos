// ===== Utilidades generales =====

// Genera un id único corto
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

// Convierte texto de un input a número (0 si no es válido)
export const num = (v: string) => {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

// Formatea cantidades como pesos mexicanos
export const dinero = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 2 })

// Descarga un archivo generado en el navegador
export function descargarArchivo(nombre: string, contenido: string, tipo: string, conBOM = false) {
  // El BOM ayuda a que Excel abra los CSV con acentos correctos
  const blob = new Blob([conBOM ? '﻿' + contenido : contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

// Convierte una matriz de filas a texto CSV
export const aCSV = (filas: (string | number)[][]) =>
  filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')

// "2026-07-07" -> "martes, 7 de julio de 2026"
export function fechaBonita(iso: string): string {
  if (!iso) return 'Sin fecha'
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Comprime una foto a JPEG pequeño para que quepa en localStorage
export async function archivoAImagen(file: File, maxLado = 900): Promise<string> {
  const bmp = await createImageBitmap(file)
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * escala)
  canvas.height = Math.round(bmp.height * escala)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.75)
}

// Fecha de hoy "aaaa-mm-dd" en la hora local (toISOString daría la de
// Greenwich, y en México por la noche saldría la fecha de mañana)
export function hoyLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Suma días a una fecha "aaaa-mm-dd"
export function sumarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(a, m - 1, d + dias)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
}

// Cantidad con letra, como en los documentos de contabilidad:
// 143000 -> "CIENTO CUARENTA Y TRES MIL PESOS 00/100 M.N."
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE']
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
  'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function menorDeMil(n: number): string {
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const r = n % 100
  const resto = r < 30 ? UNIDADES[r] : DECENAS[Math.floor(r / 10)] + (r % 10 ? ' Y ' + UNIDADES[r % 10] : '')
  return [CENTENAS[c], resto].filter(Boolean).join(' ')
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO'
  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: string[] = []
  if (millones) partes.push(millones === 1 ? 'UN MILLÓN' : enteroALetras(millones) + ' MILLONES')
  if (miles) partes.push(miles === 1 ? 'MIL' : menorDeMil(miles) + ' MIL')
  if (resto) partes.push(menorDeMil(resto))
  return partes.join(' ')
}

export function cantidadConLetra(monto: number): string {
  const entero = Math.floor(Math.max(0, monto))
  const centavos = Math.round((Math.max(0, monto) - entero) * 100)
  const letras = enteroALetras(entero)
  // "UN MILLÓN DE PESOS", "DOS MILLONES DE PESOS"
  const de = /MILL(ÓN|ONES)$/.test(letras) ? ' DE' : ''
  return `${letras}${de} ${entero === 1 ? 'PESO' : 'PESOS'} ${String(centavos).padStart(2, '0')}/100 M.N.`
}
