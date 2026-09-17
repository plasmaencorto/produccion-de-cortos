# Plan para poner la app en línea

## Fase 1 — Publicarla tal cual (lista para hacerse)

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

## Fase 2 — Cuentas y proyectos compartidos (pendiente)

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
