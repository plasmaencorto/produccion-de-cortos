// ===== Desglose automático de guiones =====
// Lee un guion (PDF o texto) y detecta escenas, locaciones y personajes
// usando el formato estándar de guion (Celtx, Final Draft, etc.)

import type { IntExt, Momento, TipoLocacion } from './types'

// El lector de PDF pesa bastante, así que se carga solo cuando de verdad se
// sube un guion en PDF (así la app abre rápido, sobre todo desde el celular).
// El "worker" va incrustado para que funcione también sin internet.
type PdfJs = typeof import('pdfjs-dist')
let pdfjsCargado: Promise<PdfJs> | null = null

function cargarLectorPDF(): Promise<PdfJs> {
  if (!pdfjsCargado)
    pdfjsCargado = (async () => {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?raw'),
      ])
      pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
        new Blob([worker.default], { type: 'text/javascript' }),
      )
      return pdfjs
    })()
  return pdfjsCargado
}

// Extrae el texto de un PDF, reconstruyendo las líneas por su posición vertical
export async function extraerTextoPDF(archivo: File): Promise<string> {
  const pdfjs = await cargarLectorPDF()
  const doc = await pdfjs.getDocument({ data: await archivo.arrayBuffer() }).promise
  let texto = ''
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n)
    const contenido = await pagina.getTextContent()
    let yAnterior: number | null = null
    for (const item of contenido.items as { str: string; transform: number[] }[]) {
      if (!('str' in item)) continue
      const y = Math.round(item.transform[5])
      if (yAnterior !== null && Math.abs(y - yAnterior) > 3) texto += '\n'
      texto += item.str + ' '
      yAnterior = y
    }
    texto += '\n'
  }
  return texto
}

// ---- Analizador ----

export interface EscenaDetectada {
  encabezado: string
  numero: string // número que trae el guion (si viene numerado)
  intExt: IntExt
  locacion: string
  momento: Momento
  sinopsis: string
  personajes: string[]
  paginas: number
  notas: string // extras del encabezado: año, "un mes después", CONT'D…
}

export interface ResultadoGuion {
  titulo: string
  escenas: EscenaDetectada[]
  personajes: string[]
  locaciones: { nombre: string; tipo: TipoLocacion }[]
  numerado: boolean // ¿el guion ya traía números de escena?
}

// Quita acentos y pasa a mayúsculas, para comparar ("GERMÁN" = "GERMAN")
const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

// Palabras que indican el momento del día (se busca de la última parte hacia atrás)
const PALABRAS_MOMENTO: [RegExp, Momento][] = [
  [/\bD[IÍ]A\s*\/\s*NOCHE\b|\bNOCHE\s*\/\s*D[IÍ]A\b/, 'DÍA/NOCHE'],
  [/\bMEDIOD[IÍ]A\b/, 'DÍA'],
  [/\bATARDECER\b|\bCREP[UÚ]SCULO\b|\bPUESTA DE SOL\b|\bDUSK\b/, 'ATARDECER'],
  [/\bAMANECER\b|\bALBA\b|\bDAWN\b/, 'AMANECER'],
  [/\bMA[ÑN]ANA\b|\bMORNING\b/, 'MAÑANA'],
  [/\bATARDECER\b/, 'ATARDECER'],
  [/\bTARDE\b|\bAFTERNOON\b/, 'TARDE'],
  [/\bNOCHE\b|\bNIGHT\b|\bANOCHECER\b|\bMADRUGADA\b/, 'NOCHE'],
  [/\bD[IÍ]A\b|\bDAY\b/, 'DÍA'],
]

// Palabras que parecen nombres de personaje pero no lo son
const NO_PERSONAJE = new Set([
  'TODOS', 'TODAS', 'AMBOS', 'AMBAS', 'CORTE', 'FIN', 'MONTAJE', 'FLASHBACK',
  'CONTINUED', 'CONTINUACION', 'CONTINUACIÓN', 'CONTINUA', 'CONTINÚA', 'CUT', 'FADE',
  'DISSOLVE', 'INTERCUT', 'MORE', 'SUPER', 'TITULO', 'TÍTULO', 'INSERT', 'INSERTO',
  'CREDITOS', 'CRÉDITOS', 'VOZ', 'OFF', 'MISMO', 'MISMA',
])

// Reconoce INT / EXT / INTERIOR / EXTERIOR al inicio de un encabezado
const RE_INTEXT = /^(INT\.?\s*\/\s*EXT|EXT\.?\s*\/\s*INT|I\s*\/\s*E|INTERIOR|EXTERIOR|INT|EXT)\b/

// Separa la numeración de escena que algunos guiones ponen a los lados:
// "  1   EXT. PATIO. NOCHE (1977)   1  "  →  { numero: "1", resto: "EXT. PATIO. NOCHE (1977)" }
function limpiarNumeracion(linea: string): { numero: string; resto: string } {
  let s = linea.trim()
  let numero = ''
  const alInicio = s.match(/^(\d{1,4}[A-Za-z]?)[\s.):-]+(?=(INT|EXT|I\s*\/\s*E))/i)
  if (alInicio) {
    numero = alInicio[1]
    s = s.slice(alInicio[0].length).trim()
    // el mismo número suele repetirse al final de la línea
    const alFinal = s.match(/[\s.]+(\d{1,4}[A-Za-z]?)\s*$/)
    if (alFinal && sinAcentos(alFinal[1]) === sinAcentos(numero)) s = s.slice(0, alFinal.index).trim()
  }
  return { numero, resto: s }
}

const esEncabezado = (l: string) => {
  const { resto } = limpiarNumeracion(l)
  return resto.length > 4 && RE_INTEXT.test(resto) && resto === resto.toUpperCase()
}

// Ojo: no basta con que la línea termine en ":", porque muchos guiones escriben
// el nombre del personaje así ("CARMEN:"). Se busca la palabra de transición.
const esTransicion = (l: string) => {
  const t = l.trim()
  return (
    /^(CORTE|CUT|FADE|DISOLVENCIA|DISSOLVE|FUNDIDO|SMASH|MATCH|INTERCUT|MONTAJE|FLASHBACK|A NEGROS)\b/i.test(t) ||
    /^(FIN|THE END)\b[.:]?$/i.test(t)
  )
}

const esBasura = (l: string) =>
  /created using|celtx|final draft|writerduet|^p[áa]gina\b|^page\b/i.test(l) ||
  /^\(?(MORE|CONTINUED|CONTINÚA|CONTINUA)\)?\.?:?$/i.test(l.trim()) ||
  /^\d+[.)]?$/.test(l.trim())

// ¿Esta línea es el nombre de un personaje antes de su diálogo?
function nombreDeCue(l: string): string | null {
  const t = l.trim()
  if (!t || t.length > 45 || esEncabezado(t) || esTransicion(t) || esBasura(t)) return null
  if (/[.…]{2,}\s*$/.test(t)) return null // "AW..." es diálogo, no un personaje
  // el nombre puede traer acotaciones y dos puntos: "AMELIA: (CONT'D)", "GERMÁN:", "NORA (O.S.)"
  const nombre = t
    .replace(/\(.*?\)/g, ' ') // quita (CONT'D), (O.S.), (V.O.)…
    .replace(/[:：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (nombre.length < 2 || nombre.split(' ').length > 4) return null
  if (nombre !== nombre.toUpperCase()) return null
  if (!/^[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9\s.'’-]*$/.test(nombre)) return null
  if (!/[A-ZÁÉÍÓÚÑÜ]{2}/.test(nombre)) return null // debe tener letras, no solo signos
  if (NO_PERSONAJE.has(sinAcentos(nombre)) || NO_PERSONAJE.has(sinAcentos(nombre.split(' ')[0]))) return null
  return nombre
}

// Analiza el encabezado: tipo, locación, momento y notas extra
function parsearEncabezado(linea: string): {
  numero: string
  intExt: IntExt
  locacion: string
  momento: Momento | null
  notas: string
} {
  const { numero, resto } = limpiarNumeracion(linea)
  const m = resto.match(RE_INTEXT)!
  const marca = sinAcentos(m[0]).replace(/[\s.]/g, '')
  const intExt: IntExt =
    marca.includes('/') || marca === 'IE' ? 'INT/EXT' : marca.startsWith('EXT') ? 'EXT' : 'INT'

  // lo que sigue del INT./EXT., partido por puntos y guiones
  let cuerpo = resto.slice(m[0].length).replace(/^[\s.\-–—:]+/, '')
  const partes = cuerpo.split(/\s*[.\-–—]\s*/).map(s => s.trim()).filter(Boolean)

  // busca el momento del día de la última parte hacia atrás
  let momento: Momento | null = null
  let iMomento = -1
  for (let i = partes.length - 1; i >= 0 && !momento; i--) {
    const p = sinAcentos(partes[i])
    for (const [re, valor] of PALABRAS_MOMENTO)
      if (re.test(p)) {
        momento = valor
        iMomento = i
        break
      }
  }

  const extras: string[] = []
  let locacion: string
  if (iMomento >= 0) {
    locacion = partes.slice(0, iMomento).join(' – ')
    // "MISMO DÍA", "DÍA — UN MES DESPUÉS": guarda el texto completo si dice algo más
    if (sinAcentos(partes[iMomento]) !== sinAcentos(momento!)) extras.push(partes[iMomento])
    extras.push(...partes.slice(iMomento + 1))
  } else {
    locacion = partes.join(' – ')
  }
  if (!locacion) locacion = partes.join(' – ')

  // saca los paréntesis finales de la locación: "COMEDOR (CONT'D)" → "COMEDOR" + nota
  locacion = locacion
    .replace(/\(([^)]*)\)\s*$/g, (_, dentro) => {
      extras.push(dentro)
      return ''
    })
    .replace(/[\s–-]+$/, '')
    .trim()

  const notas = extras
    .map(s => s.replace(/^[(]|[)]$/g, '').trim())
    .filter(Boolean)
    .join(' · ')

  return { numero, intExt, locacion, momento, notas }
}

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Capitaliza nombres: "SET DE PODCAST" -> "Set de Podcast"
export function capitalizar(s: string): string {
  const menores = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'en', 'a', 'con'])
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && menores.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export function analizarGuion(texto: string): ResultadoGuion {
  const lineas = texto.split('\n').map(l => l.replace(/\s+/g, ' ').trim())

  // 1) Separar el guion en escenas por sus encabezados (INT./EXT.)
  const escenas: { encabezado: string; lineas: string[] }[] = []
  const previas: string[] = [] // líneas antes de la primera escena (título)
  let actual: { encabezado: string; lineas: string[] } | null = null
  for (const l of lineas) {
    if (esBasura(l)) continue
    if (esEncabezado(l)) {
      actual = { encabezado: l, lineas: [] }
      escenas.push(actual)
    } else if (actual) {
      actual.lineas.push(l)
    } else if (l) {
      previas.push(l)
    }
  }

  const titulo = capitalizar(
    previas.find(l => l.length > 1 && !/^(por|by|de)\b/i.test(l) && !/@/.test(l)) || '',
  )

  // 2) Reparto: nombres que aparecen como diálogo en todo el guion
  //    (se agrupan sin acentos, para que "GERMAN" y "GERMÁN" sean la misma persona)
  const repartoMap = new Map<string, string>()
  for (const esc of escenas) {
    let anteriorFueCue = false
    for (const l of esc.lineas) {
      if (!l.trim()) continue
      const nombre = nombreDeCue(l)
      // tras el nombre de un personaje viene su diálogo, no otro personaje
      const esCue: boolean = !!nombre && !anteriorFueCue
      anteriorFueCue = esCue
      if (!esCue) continue
      const clave = sinAcentos(nombre!)
      const previo = repartoMap.get(clave)
      // se queda con la versión acentuada, que suele ser la correcta
      if (!previo || (/[ÁÉÍÓÚÑÜ]/.test(nombre!) && !/[ÁÉÍÓÚÑÜ]/.test(previo)))
        repartoMap.set(clave, nombre!)
    }
  }
  const reparto = [...repartoMap.values()]

  // 3) Detalle por escena
  let momentoPrevio: Momento = 'DÍA'
  const detectadas: EscenaDetectada[] = escenas.map(esc => {
    const { numero, intExt, locacion, momento, notas } = parsearEncabezado(esc.encabezado)
    // si el encabezado no dice el momento (p. ej. "INT. SPA" o "CONT'D"), hereda el anterior
    const momentoFinal = momento ?? momentoPrevio
    momentoPrevio = momentoFinal

    const cuerpo = esc.lineas.filter(Boolean)
    const textoEscena = ' ' + sinAcentos(cuerpo.join(' ')) + ' '
    const personajes = reparto.filter(nombre =>
      new RegExp(`(^|[^A-ZÑ0-9])${escaparRegex(sinAcentos(nombre))}([^A-ZÑ0-9]|$)`).test(textoEscena),
    )

    // sinopsis: las primeras líneas de acción, unidas hasta el primer diálogo
    const accion: string[] = []
    for (const l of cuerpo) {
      if (nombreDeCue(l) || esTransicion(l)) break
      accion.push(l)
    }
    const sinopsis = (accion.join(' ') || cuerpo.find(l => !nombreDeCue(l) && l.length > 15) || '')
      .slice(0, 220)
      .trim()

    // páginas estimadas: ~55 líneas por página, redondeado a octavos
    const paginas = Math.max(0.125, Math.round((cuerpo.length / 55) * 8) / 8)
    return { encabezado: esc.encabezado, numero, intExt, locacion, momento: momentoFinal, sinopsis, personajes, paginas, notas }
  })

  // 4) Locaciones únicas (si aparece como INT y EXT, es Mixto)
  const locaciones: { nombre: string; tipo: TipoLocacion }[] = []
  for (const e of detectadas) {
    if (!e.locacion) continue
    const previa = locaciones.find(x => sinAcentos(x.nombre) === sinAcentos(e.locacion))
    const tipo: TipoLocacion = e.intExt === 'INT' ? 'Interior' : e.intExt === 'EXT' ? 'Exterior' : 'Mixto'
    if (!previa) locaciones.push({ nombre: e.locacion, tipo })
    else if (previa.tipo !== tipo) previa.tipo = 'Mixto'
  }

  const numerado = detectadas.length > 0 && detectadas.every(e => e.numero)

  return { titulo, escenas: detectadas, personajes: reparto, locaciones, numerado }
}
