# Changelog

## 2026-05-18 — Correcciones de seguridad y robustez

### Corregido

1. **JWT_SECRET obligatorio** (`src/core/auth.js`)
   - Antes: fallback hardcodeado `cms-dev-secret-change-in-production`.
   - Ahora: la aplicacion falla al arrancar si `JWT_SECRET` no esta definido.
   - Impacto: evita deploys en produccion con secreto predecible.

2. **ReDoS en busqueda** (`src/api/routes/posts.js`)
   - Antes: el parametro `q` se pasaba directamente a `$regex` sin sanitizar.
   - Ahora: `escapeRegex()` escapa todos los metacaracteres regex antes de construir el filtro.
   - Impacto: un atacante ya no puede enviar una regex deliberadamente lenta.

3. **XSS via embed** (`scripts/build-static.js`)
   - Antes: cualquier URL en `block.src` se inyectaba en el atributo `src` del iframe.
   - Ahora: `isSafeEmbedUrl()` valida que sea `http:` o `https:` antes de renderizar. URLs maliciosas se omiten con un warning.
   - Impacto: evita `javascript:` y otras URLs arbitrarias en iframes.

4. **createIndex silencioso** (`src/models/*.js`)
   - Antes: `try/catch` genérico ignoraba cualquier error de indice.
   - Ahora: solo se ignora el error "already exists"; cualquier otro error se propaga.
   - Impacto: errores reales de indices ya no se ocultan.

5. **CORS wildcard en produccion** (`src/app.js`)
   - Antes: `cors()` sin configuracion aceptaba cualquier origen.
   - Ahora: en produccion se puede restringir via `CORS_ORIGIN`. En desarrollo sigue siendo permisivo.
   - Impacto: la API REST en produccion puede restringirse a dominios especificos.

6. **Dependencia vendorizada** (`package.json`)
   - Antes: `lib/js-doc-store.js` solo se actualizaba manualmente.
   - Ahora: `npm run update:jsdocstore` descarga la version mas reciente desde GitHub.
   - Impacto: flujo de actualizacion documentado.

## 2026-05-18 — Version inicial

- CMS headless con js-doc-store
- API REST (Express + JWT)
- Generador estatico (HTML, RSS, sitemap, JSON API, busqueda client-side)
- Theme oscuro con toggle
- Bloques de contenido: paragraph, heading, heading3, quote, code, image, list, callout, divider, table, embed
- Deploy automatico a GitHub Pages
- Base de datos documental commiteada en el repo
