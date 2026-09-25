# Plan para poner la app en línea

## Fase 1 — Publicarla tal cual ✅ HECHA (25 de septiembre de 2026)

**En línea en https://cortos.plasmaencorto.com** (también responde
https://produccion-de-cortos.onrender.com). Repositorio
`plasmaencorto/produccion-de-cortos`, static site en Render, plan gratuito.
Cada `git push` a `main` vuelve a publicar.

Dos cosas que conviene recordar si algún día hay que rehacer el servicio:
Render **no lee este `render.yaml`** cuando el sitio se crea a mano desde el
panel — hay que escribir el Build Command `npm install && npm run build:web` y
el Publish Directory `dist-web`. Y el subdominio se resolvió con un CNAME en
Hostinger: `cortos` → `produccion-de-cortos.onrender.com` (Hostinger llama
**"Valor"** al campo destino).

### Cómo se planeó en su momento

La app ya está preparada: `npm run build:web` genera la carpeta `dist-web`, que es
un sitio web normal listo para subir. La carga inicial es de ~330 KB (98 KB
comprimidos) porque el lector de PDF se descarga aparte, solo cuando alguien
importa un guion.

**Cómo queda:** cada persona entra a la dirección, crea sus proyectos y estos se
guardan en el navegador de su propio dispositivo (`localStorage`). Nadie ve los
proyectos de nadie. La app avisa de esto en la pantalla de inicio y recuerda usar
el respaldo `.json`.

**Pasos para publicar (en Render, como Campus Plasma):**

1. Crear un repositorio nuevo en GitHub, p. ej. `plasmaencorto/produccion-de-cortos`.
2. En esta carpeta:
   ```
   git remote add origin git@github.com:plasmaencorto/produccion-de-cortos.git
   git push -u origin main
   ```
3. En Render → **New → Static Site** → conectar ese repositorio. El archivo
   `render.yaml` ya trae la configuración (build `npm install && npm run build:web`,
   carpeta `dist-web`, y las reglas de rutas y caché).
4. Opcional: apuntar un subdominio, p. ej. `cortos.plasmaencorto.com`.

De ahí en adelante, cada `git push` vuelve a publicar la versión nueva.

## Fase 2 — Cuentas y proyectos compartidos (planeada, sin empezar)

> **Estado al 25 de septiembre de 2026.** Vanessa la pidió con estas palabras:
> *"yo quiero que sea algo muy fácil, tipo así como la plataforma que tenemos de
> inscripciones, o sea, que entre sin hacer respaldo ni nada"*. Pidió leer el plan
> antes de arrancar. **Decisión ya tomada: las cuentas las da de alta ella**; no es
> registro abierto a internet.

### El problema, en una frase

Campus Plasma guarda los datos en un disco del servidor (`inscripciones.db` en
`/var/data`), por eso se entra desde cualquier aparato. Producción de Cortos es un
sitio estático: el servidor entrega la herramienta y los datos se quedan en el
navegador de cada quien. De ahí que haga falta respaldar para cambiar de equipo.

### Cómo se resolvería

Añadir un servidor en Python (mismo enfoque que Campus Plasma: biblioteca estándar
+ SQLite) que sirva el sitio ya compilado y exponga una API de proyectos.
**No se reescribe la app en Next.js**: las 12 pantallas y sus 5,638 líneas se
quedan como están, porque solo 14 archivos tocan el guardado y todos pasan por
`src/store.ts`. Se sustituye ahí el `persist` de Zustand por llamadas a la API.

Piezas, en el orden en que conviene hacerlas:

1. **Cuentas y sesión** — alta de usuarios desde un panel de administración,
   contraseñas cifradas, cookie de sesión. Que se pueda entrar.
2. **Proyectos en el servidor** — la API de lectura y escritura, y el cambio en
   `store.ts`. Que deje de existir el respaldo obligatorio.
3. **Invitaciones y permisos por proyecto** — editar / solo ver, por persona y por
   proyecto. Que el 1er AD vea el plan de rodaje en su celular.

### Cuatro cosas que hay que resolver sí o sí

- **Migrar lo que ya existe.** Lo guardado en `localStorage` no sube solo: hace
  falta un botón de "subir mi respaldo a mi cuenta" que acepte el `.json` de
  siempre. Se usa una vez y nunca más.
- **El archivo de doble clic sigue vivo.** `Produccion de Cortos.html` no puede
  tener cuentas (no tiene internet). Quedan dos modos —archivo suelto offline y
  sitio con cuenta— y eso hay que explicarlo dentro de la app para que no confunda.
- **Las fotos de locaciones.** Hoy van como dataURL comprimido dentro del proyecto
  (`utils.ts`, JPEG al 75%). En una base de datos eso pesa demasiado: hay que
  guardarlas como archivos aparte y dejar solo la referencia.
- **El costo.** Un disco en Render exige plan de pago: de gratuito a `starter`,
  ~7 USD al mes, el mismo que ya paga Campus Plasma. Está avisado y aceptado como
  condición para decidir.

### Notas del plan original


Lo que Vanessa necesita y la Fase 1 **no** resuelve: que el equipo de producción
(gente externa) entre al **mismo** proyecto, y que los proyectos no se pierdan al
cambiar de dispositivo.

### Qué hay que construir

1. **Backend con base de datos.** Reutilizar el patrón ya probado en Montero
   Castings: Next.js + Prisma + Postgres (en producción; SQLite en local) y
   autenticación propia con `jose` + `bcryptjs`.
2. **Registro e inicio de sesión** con correo y contraseña, más recuperación de
   contraseña por correo (ya hay SMTP de Hostinger configurado en Campus Plasma).
3. **Cambiar dónde se guardan los datos.** Aquí está la buena noticia: todas las
   pantallas leen y escriben a través de `src/store.ts`. Hay que sustituir el
   middleware `persist` de Zustand por llamadas a la API, manteniendo la misma
   forma del estado. Las ~20 pantallas no se tocan.
4. **Permisos por proyecto:** dueño / puede editar / solo lectura. La app ya tiene
   un "modo solo lectura", que serviría de base.
5. **Invitaciones**: el dueño invita por correo a su equipo a un proyecto.
6. **Fotos de locaciones**: hoy se guardan como texto dentro del proyecto
   (`dataURL`). Con backend conviene subirlas como archivos aparte.
7. **Migración**: quien ya tenga proyectos en su navegador debe poder subirlos con
   el respaldo `.json` que ya existe. Así nadie pierde lo hecho en la Fase 1.

### Lo que implica tener usuarios

- Aviso de privacidad y términos (Vanessa ya tiene uno para la escuela; se puede
  adaptar).
- Respaldos de la base de datos.
- Un costo mensual (Render: ~$7 USD el servicio + base de datos).

### Orden sugerido

1. Backend + registro/inicio de sesión (sin tocar la app todavía).
2. Guardar y leer proyectos desde el servidor.
3. Importar respaldos `.json` a la cuenta.
4. Invitaciones y permisos por proyecto.
5. Fotos como archivos.
6. Aviso de privacidad y publicación.
