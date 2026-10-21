# Shok Café-Bar · Bar Mode AR

Menú en realidad aumentada con three.js + MindAR. Se publica como sitio estático en Vercel.

## 1. Generar el archivo del marcador (obligatorio)
1. Abre https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Sube `assets/menu.jpg` (el menú impreso es el marcador) y pulsa **Start**.
3. Descarga `targets.mind` y guárdalo en `assets/targets.mind`.

## 2. Probar en local (opcional)
`npx serve .` y abre la URL con https (por ejemplo con `ngrok`), porque la cámara del celular exige https.

## 3. Publicar en Vercel
- Con GitHub: sube esta carpeta a un repositorio → vercel.com → *Add New Project* → importa el repo → *Deploy* (sin build command).
- Con CLI: `npm i -g vercel` y luego `vercel --prod` dentro de esta carpeta.

## 4. Usar
Abre el enlace de Vercel en el celular, pulsa **Activar Bar Mode**, permite la cámara y apunta al menú.
Los botones CAFÉ / COCTELES / SNACKS aparecen al detectar el menú.

Textos, precios y sonidos se editan en el bloque `CONTENIDO` de `index.html`.
