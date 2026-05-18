# gestor-leads

Dashboard local para prospección asistida de constructoras con webs simples en mercados hispanohablantes.

## Objetivo

Encontrar constructoras con presencia web floja, ver su sitio desde un tablero, detectar oportunidades y generar un mensaje comercial listo para usar, sin mandar nada automáticamente.

## Qué hace

- Busca constructoras por país y ciudad
- Toma resultados desde una base gratuita curada por país
- Extrae nombre, sitio y snippet
- Analiza cada web con heurísticas comerciales
- Calcula score y prioridad (`A`, `B`, `C`)
- Muestra preview del sitio dentro del dashboard
- Redacta un mensaje comercial sugerido
- Permite copiar el mensaje con un click

## Heurísticas de oportunidad

El score sube cuando la web:

- no tiene WhatsApp visible
- no tiene formulario claro
- no muestra bien proyectos/galería
- no ofrece brochure o PDF visible
- no muestra mapa/ubicación clara
- parece antigua o demasiado simple

## Stack

- Vite
- JavaScript vanilla
- Express
- jsdom

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`

## Uso

1. Levantar con `npm run dev`
2. Abrir `http://localhost:4173`
3. Elegir países, ciudad y cantidad
4. Revisar resultados, score, preview y mensaje
5. Abrir la web real o copiar el texto sugerido

## API local

- `GET /api/health`
- `POST /api/prospects/search`

## Vercel

El repo quedó preparado para Vercel con:

- `vercel.json` usando `npm run build`
- frontend estático servido desde `dist`
- funciones serverless en `api/`
  - `api/health.js`
  - `api/prospects/search.js`
- lógica compartida en `lib/prospecting.js`

Con eso, al importar el repo en Vercel no hace falta correr el servidor Express para producción.

## Notas

- No envía emails ni mensajes automáticamente.
- Algunas webs bloquean iframes; en ese caso se puede usar el botón `Abrir sitio`.
- Para evitar bloqueos `403` en Vercel, la búsqueda usa una base gratuita curada (`data/prospects-seed.json`) en lugar de depender de buscadores externos.
- Esa base se puede ampliar manualmente con más constructoras, ciudades y países sin costo.
