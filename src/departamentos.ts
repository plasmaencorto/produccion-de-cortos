// ===== Color por departamento =====
// En los desgloses de producción cada departamento tiene su color, para
// ubicarlo de un vistazo. Aquí se agrupan por familia de trabajo, no uno
// por cuenta, para que los colores sigan siendo distinguibles entre sí.

export interface Familia {
  nombre: string
  color: string
}

const FAMILIAS: Record<string, Familia> = {
  direccion: { nombre: 'Dirección y producción', color: '#e6007e' }, // rosa de la casa
  casting: { nombre: 'Casting y elenco', color: '#ff6b3d' }, // naranja fuego
  fotografia: { nombre: 'Fotografía y cámara', color: '#00a39b' }, // turquesa de la casa
  iluminacion: { nombre: 'Iluminación y eléctrico', color: '#ffea00' }, // amarillo de la casa
  sonido: { nombre: 'Sonido', color: '#a78bfa' }, // morado
  arte: { nombre: 'Arte, vestuario y maquillaje', color: '#f472b6' }, // rosa claro
  locaciones: { nombre: 'Locaciones', color: '#4ade80' }, // verde
  transporte: { nombre: 'Transporte', color: '#38bdf8' }, // azul cielo
  alimentacion: { nombre: 'Alimentación y hospedaje', color: '#fb923c' }, // naranja claro
  post: { nombre: 'Postproducción', color: '#818cf8' }, // añil
  admin: { nombre: 'Administración y seguros', color: '#94a3b8' }, // gris azulado
  distribucion: { nombre: 'Festival y distribución', color: '#e879f9' }, // fucsia
}

// Qué familia le toca a cada cuenta del presupuesto (por su número)
const POR_CUENTA: [RegExp, keyof typeof FAMILIAS][] = [
  [/^1000|^1700|^1800/, 'direccion'],
  [/^1100/, 'casting'],
  [/^1200|^1300|^2000|^2100/, 'fotografia'],
  [/^1400|^4100/, 'sonido'],
  [/^1500|^1600/, 'arte'],
  [/^1900/, 'locaciones'],
  [/^2200|^2300/, 'transporte'],
  [/^2400|^2500/, 'alimentacion'],
  [/^2600|^4000/, 'post'],
  [/^3000|^3100/, 'admin'],
  [/^5000/, 'distribucion'],
]

// Y por nombre, para lo que no lleva número (equipos, roles del crew)
const POR_NOMBRE: [RegExp, keyof typeof FAMILIAS][] = [
  [/direcci[oó]n|producci[oó]n|productor|asistente de direcci[oó]n|script|continuista/i, 'direccion'],
  [/casting|elenco|actor|actriz|extra|reparto/i, 'casting'],
  [/c[aá]mara|fotograf[ií]a|foto|data|videoasist|dit/i, 'fotografia'],
  [/iluminaci[oó]n|el[eé]ctrico|gaffer|luces|tramoya|grip/i, 'iluminacion'],
  [/sonido|sonidista|micro/i, 'sonido'],
  [/arte|utiler[ií]a|vestuario|maquillaje|peinado|props/i, 'arte'],
  [/locaci[oó]n|locaciones|permiso/i, 'locaciones'],
  [/transporte|veh[ií]culo|gasolina|van|chofer/i, 'transporte'],
  [/aliment|catering|comida|hospedaje|hotel/i, 'alimentacion'],
  [/post|edici[oó]n|color|vfx|m[uú]sica|subt[ií]tul/i, 'post'],
  [/seguro|auditor[ií]a|contab|legal|administra/i, 'admin'],
  [/festival|distribuci[oó]n|prensa|publicidad/i, 'distribucion'],
]

const GRIS = '#71717a'

// Color para una cuenta del presupuesto o un departamento por su nombre
export function colorDepartamento(texto: string): string {
  const t = (texto || '').trim()
  for (const [re, familia] of POR_CUENTA) if (re.test(t)) return FAMILIAS[familia].color
  for (const [re, familia] of POR_NOMBRE) if (re.test(t)) return FAMILIAS[familia].color
  return GRIS
}

// Nombre del departamento (familia) de un puesto, o '' si no se reconoce
export function departamentoDe(texto: string): string {
  const t = (texto || '').trim()
  for (const [re, familia] of POR_NOMBRE) if (re.test(t)) return FAMILIAS[familia].nombre
  return ''
}

// Para pintar fondos suaves sin perder legibilidad
export const conTransparencia = (hex: string, alfa: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
}

// Lista para mostrar la leyenda de colores
export const familias = Object.values(FAMILIAS)
