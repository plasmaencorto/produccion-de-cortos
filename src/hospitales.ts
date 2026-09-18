// ===== Búsqueda de hospitales cercanos a una locación =====
// Usa los servicios abiertos de OpenStreetMap (gratuitos, sin necesidad de
// darse de alta): Nominatim convierte la dirección en coordenadas y Overpass
// busca los hospitales alrededor. Requiere internet.

export interface HospitalCercano {
  nombre: string
  direccion: string
  telefono: string
  distanciaKm: number
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const OVERPASS = 'https://overpass-api.de/api/interpreter'

// Dirección escrita → coordenadas
export async function coordenadasDe(direccion: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(direccion)}`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('No se pudo ubicar la dirección')
  const datos = (await r.json()) as { lat: string; lon: string }[]
  if (!datos.length) return null
  return { lat: parseFloat(datos[0].lat), lon: parseFloat(datos[0].lon) }
}

// Distancia en línea recta entre dos puntos (fórmula del semiverseno)
function distanciaKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10
}

interface ElementoOSM {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Arma la dirección con las partes que traiga el mapa
function direccionDe(t: Record<string, string>): string {
  const partes = [
    [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
    t['addr:neighbourhood'] || t['addr:suburb'],
    t['addr:city'] || t['addr:town'],
  ].filter(Boolean)
  return partes.join(', ')
}

// Hospitales y clínicas alrededor de un punto
export async function hospitalesCerca(
  lat: number,
  lon: number,
  radioKm = 10,
): Promise<HospitalCercano[]> {
  const radio = Math.round(radioKm * 1000)
  const consulta = `[out:json][timeout:25];
(
  node["amenity"~"^(hospital|clinic)$"](around:${radio},${lat},${lon});
  way["amenity"~"^(hospital|clinic)$"](around:${radio},${lat},${lon});
);
out center tags 40;`
  const r = await fetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(consulta) })
  if (!r.ok) throw new Error('No se pudo consultar el mapa de hospitales')
  const { elements = [] } = (await r.json()) as { elements: ElementoOSM[] }

  const vistos = new Set<string>()
  return elements
    .map(el => {
      const t = el.tags || {}
      const p = el.center || { lat: el.lat!, lon: el.lon! }
      if (!t.name || p.lat === undefined) return null
      return {
        nombre: t.name,
        direccion: direccionDe(t),
        telefono: t.phone || t['contact:phone'] || '',
        distanciaKm: distanciaKm(lat, lon, p.lat, p.lon),
      }
    })
    .filter((h): h is HospitalCercano => {
      if (!h) return false
      const clave = h.nombre.toLowerCase()
      if (vistos.has(clave)) return false // el mismo hospital puede venir repetido
      vistos.add(clave)
      return true
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
    .slice(0, 6)
}

// Busca a partir de una dirección escrita, en un solo paso
export async function buscarHospitales(direccion: string): Promise<HospitalCercano[]> {
  const punto = await coordenadasDe(direccion)
  if (!punto) return []
  return hospitalesCerca(punto.lat, punto.lon)
}
