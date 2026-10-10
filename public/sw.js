// ===== Funcionar sin internet =====
// Un rodaje pasa en ranchos, desiertos y bodegas donde no hay señal, y ahí es
// justo cuando se necesita la hoja de llamado. Esto guarda la app en el
// navegador la primera vez que se abre, para que después arranque sin conexión.
// Los proyectos nunca pasan por aquí: viven en localStorage, en el equipo.

const CACHE = 'cortos-v3'

self.addEventListener('install', e => {
  // Tomar el control sin esperar a que se cierren las pestañas viejas
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.add('./')))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // La página: primero la red, para que se vea la versión nueva apenas se publica;
  // si no hay internet, la guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone()
          caches.open(CACHE).then(c => c.put('./', copia))
          return res
        })
        .catch(() => caches.match('./').then(r => r || Response.error())),
    )
    return
  }

  // Los archivos (js, css, tipografías, imágenes) llevan el nombre con huella
  // digital: si cambia el contenido cambia el nombre, así que servirlos desde el
  // caché nunca entrega algo viejo.
  e.respondWith(
    caches.match(req).then(
      guardado =>
        guardado ||
        fetch(req).then(res => {
          if (res.ok) {
            const copia = res.clone()
            caches.open(CACHE).then(c => c.put(req, copia))
          }
          return res
        }),
    ),
  )
})
