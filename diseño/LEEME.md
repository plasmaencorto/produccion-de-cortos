# Ícono de la app

`icono.png` (1024×1024) es el original; `icono.icns` es el que usa el
lanzador del Escritorio.

Sigue la identidad de plasmaencorto.com: tira de película en degradado
rosa → amarillo (como el título "CINEASTAS HECHOS A MANO") sobre fondo
negro, con la grequita turquesa del sitio.

## Para cambiarlo

1. Reemplaza `icono.png` por uno nuevo de 1024×1024.
2. Genera el .icns:
   ```
   mkdir icono.iconset
   for t in 16 32 128 256 512; do
     sips -z $t $t icono.png --out "icono.iconset/icon_${t}x${t}.png"
     sips -z $((t*2)) $((t*2)) icono.png --out "icono.iconset/icon_${t}x${t}@2x.png"
   done
   iconutil -c icns icono.iconset -o icono.icns
   ```
3. Cópialo al lanzador y vuelve a firmarlo:
   ```
   cp icono.icns "/Users/vanessaespinosa/Desktop/Producción de Cortos.app/Contents/Resources/applet.icns"
   xattr -cr "/Users/vanessaespinosa/Desktop/Producción de Cortos.app"
   codesign --force --deep --sign - "/Users/vanessaespinosa/Desktop/Producción de Cortos.app"
   killall Finder
   ```
4. Para la versión web, genera `public/favicon.png` (64), `public/apple-touch-icon.png` (180)
   y `public/icono-compartir.png` (1024) con `sips -z`.
