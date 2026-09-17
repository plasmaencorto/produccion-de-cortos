# 🎬 Producción de Cortos

Aplicación web para la gestión de producción de cortometrajes: desglose de guión,
presupuesto, plan de rodaje, hojas de llamado, elenco y equipo, locaciones,
equipamiento y reportes. Todo en español y todo se guarda en tu navegador
(localStorage) — no necesita internet ni servidor.

## ✨ Importar Guion (desglose automático)

En la sección **Importar Guion** puedes subir tu guion en PDF (Celtx, Final Draft,
etc.) o pegar el texto, y la app crea sola: las escenas del desglose (con INT/EXT,
locación, momento, sinopsis, personajes y páginas estimadas), las locaciones en el
catálogo, los personajes en el elenco, y partidas base del presupuesto.

Formatos de encabezado que reconoce:

- Con o sin numeración a los lados: `1   EXT. PATIO. NOCHE (1977)   1` o `INT. SALA. DÍA`
- `INT.` / `EXT.` / `INT/EXT` / `I/E` / `INTERIOR` / `EXTERIOR`
- Momentos: día, noche, tarde, mañana, mediodía, amanecer, atardecer, día/noche,
  "mismo día", "continuo"… Si el encabezado no lo dice (p. ej. `INT. SPA` o
  `(CONT'D)`), hereda el momento de la escena anterior.
- Lo extra del encabezado (el año, "un mes después", CONT'D) se guarda en las
  notas de la escena.
- Personajes con o sin dos puntos (`CARMEN:` o `CARMEN`), y une las variantes con
  y sin acento (`GERMAN` = `GERMÁN`).

Si el guion ya viene numerado, **se respeta esa numeración** en el desglose.

## 👥 Personal de la producción

Las cuentas de personal del presupuesto (1000–1600) llevan una columna **👤 Personas**
donde indicas a cuánta gente cubre cada línea. Con eso la app calcula el total de la
plantilla y lo muestra en el **Dashboard**, en el encabezado de cada cuenta del
**Presupuesto**, en el número de comidas de la **Hoja de Llamado**, y en el reporte
**Plantilla de personal** (comidas por día, radios y vans sugeridos), que es lo que se
usa para cotizar catering, comunicación y transporte.

Si una línea no tiene el dato capturado, se deduce del propio renglón (si la unidad es
de tiempo, se toma el multiplicador ×; si no, la cantidad) y se puede corregir a mano.

## 🧾 Control de Gastos

La sección **Control de Gastos** sigue los formatos de contabilidad de producción:
**solicitudes de recursos** (folio, cuenta presupuestal, subtotal + IVA, urgente,
estados Solicitada→Autorizada→Pagada→Comprobada), **comprobación de gastos**
(factura, deducible o no, botón para calcular el IVA 16%, ligado a su solicitud,
con total comprobado por cuenta) y **reporte de daños y pérdidas** (por día de
rodaje y locación). Todo exportable a CSV.

## 💰 Presupuesto profesional

El presupuesto usa el sistema de **cuentas numeradas de la industria mexicana**
(1000 personal de producción, 1100 casting, 1900 locaciones, etc., basado en los
machotes de gerencia de producción), con: cantidad × multiplicador (×) × tarifa,
IVA (16%) opcional por línea, y semáforo por cuenta. La **Hoja de Llamado** y el
**Reporte diario de producción** también siguen los machotes profesionales
(desayuno, listos para 1er tiro, sol/clima, hospital cercano, horarios reales del
día). El Plan de Rodaje avisa si una jornada excede los límites (12 h diurna /
10 h nocturna).

## Cómo usarla (fácil, sin Terminal)

Haz doble clic en el ícono **🎬 Producción de Cortos** del Escritorio. Se abre en tu
navegador y listo. (También puedes abrir directo `Produccion de Cortos.html` de esta
carpeta si algún día el ícono falla.)

> ⚠️ Nota técnica: el lanzador del Escritorio se rehízo el 2026-08-07 porque el
> anterior dejó de abrir en macOS 26 (error −10810). El truco es que ahora se genera
> con `osacompile` (AppleScript), cuyo ejecutable viene firmado por Apple; un bundle
> `.app` hecho a mano ya no arranca aunque se firme ad-hoc. Para recrearlo:
>
> ```
> osacompile -o "/Users/vanessaespinosa/Desktop/Producción de Cortos.app" lanzar.applescript
> cp icono.icns ".../Producción de Cortos.app/Contents/Resources/applet.icns"
> ```
>
> El lanzador viejo quedó guardado como `lanzador-viejo-no-funciona.app` en esta carpeta
> (de ahí sale el `icono.icns`).

⚠️ Usa siempre **ese mismo archivo y el mismo navegador**: los datos se guardan en el
navegador, ligados a ese archivo. No lo muevas de carpeta ni lo renombres, y haz
respaldos JSON seguido desde "Mis proyectos".

## Cómo usarla (modo desarrollo, con Terminal)

1. Abre la Terminal
2. Escribe:

```bash
cd "/Users/vanessaespinosa/App Cortometrajes"
npm run dev
```

3. Abre en tu navegador la dirección que aparece (normalmente http://localhost:5173)

Para detenerla: en la Terminal presiona `Ctrl + C`.

Ojo: el modo desarrollo y el archivo de doble clic guardan los datos por separado
(cada uno tiene su propio almacén en el navegador).

Después de cambiar el código, corre `npm run build` para regenerar
`Produccion de Cortos.html`.

## Cosas importantes

- **Guardado automático**: cada cambio se guarda al instante en el navegador.
- **Respaldo**: en "Mis proyectos" usa el botón **⬇ Respaldo** para descargar un
  archivo `.json` con todo el proyecto. Puedes volver a cargarlo con **⬆ Importar**.
  Haz respaldos seguido: si borras los datos del navegador, se pierde lo no respaldado.
- **PDF**: los botones "Imprimir / Guardar PDF" abren el diálogo de impresión;
  ahí elige "Guardar como PDF".
- **CSV**: los archivos CSV se abren directo en Excel o Numbers.
- **Modo solo lectura**: actívalo en la barra lateral antes de compartir la pantalla
  con el equipo, para que nadie cambie nada por accidente.

## Técnico

React 18 + TypeScript + Vite + Tailwind CSS 4 + Zustand + React Router + date-fns.
Persistencia en localStorage (llave `produccion-cortos`), lista para migrar a un
backend en el futuro: todo el estado vive en `src/store.ts`.
