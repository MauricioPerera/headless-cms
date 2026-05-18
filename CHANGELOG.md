# Changelog

## 2026-05-18 — SEO avanzado, paginacion, multi-autor, paginas estaticas

### Agregado

- **SEO Meta Tags + Open Graph** (`templates/layout.html`, `scripts/build-static.js`)
  - Tags: canonical, og:title, og:description, og:url, og:image, og:type, og:site_name
  - Twitter Cards: twitter:card, twitter:title, twitter:description, twitter:image
  - Variable `SITE_OG_IMAGE` para imagen por defecto cuando un post no tiene featuredImage.

- **Schema.org JSON-LD** (`scripts/build-static.js`)
  - Posts: `BlogPosting` con headline, description, image, author (Person), publisher (Organization)
  - Index: `WebSite`
  - Taxonomias: `CollectionPage`
  - Paginas estaticas: `WebPage`

- **Breadcrumbs** (`templates/layout.html`, `static/assets/style.css`)
  - Navegacion visual HTML con microdata `BreadcrumbList` en posts, taxonomias y paginas.

- **Paginacion** (`scripts/build-static.js`, `templates/index.html`)
  - Variable `POSTS_PER_PAGE` (default 5).
  - Genera `index.html` (pagina 1) + `page/2.html`, `page/3.html`, etc.
  - Navegacion anterior/siguiente con contador de pagina.

- **Paginas estaticas** (`src/models/page.js`, `src/api/routes/pages.js`, `templates/page.html`)
  - Nuevo modelo `page.js` con hooks beforeInsert/beforeUpdate.
  - API REST `/api/pages` con CRUD completo.
  - Template `page.html` para renderizado.
  - Navegacion dinamica en layout: las paginas aparecen automaticamente en el menu.
  - Seed incluye "Acerca de" y "Contacto".

- **Imagenes destacadas e inline** (`src/models/post.js`, `templates/post.html`, `templates/index.html`)
  - Campo `featuredImage` en posts (string u objeto `{ src, alt, caption }`).
  - Renderiza en post individual (`<figure class="featured-image">`) y cards del index (`<div class="post-card-image">`).
  - Bloque `type: "image"` ya soportado en contenido inline.

- **Multi-autor en frontend** (`src/models/user.js`, `templates/post.html`, `static/assets/style.css`)
  - Campos `avatar` (URL) y `bio` (texto) en modelo de usuario.
  - Author card al final de cada post: foto circular, nombre, bio.
  - Seed con avatares de ejemplo (Unsplash) para Mauricio y Ana.

- **Subida de imagenes** (`src/api/routes/upload.js`, `public/admin/index.html`)
  - Endpoint `POST /api/upload` con multer (max 5MB, solo imagenes).
  - Guarda en `static/assets/images/` con nombre unico (`timestamp-random.ext`).
  - Admin: drag & drop + click para subir, con preview inmediato.

- **Admin web con tabs** (`public/admin/index.html`)
  - Tabs "Posts" / "Paginas" en el dashboard.
  - Editor de paginas simplificado (sin taxonomias ni featuredImage).
  - Boton "+ Nuevo" detecta tab activa para crear post o pagina.
  - Editor de bloques visual: agregar/mover/cambiar tipo/eliminar bloques.

- **Webhooks reales** (`src/models/webhook.js`)
  - `triggerWebhooks()` hace `fetch()` POST real con headers `X-Webhook-Secret`.
  - Disparo automatico en `post.afterInsert` y `post.afterUpdate` cuando `status === 'published'`.

## 2026-05-18 — Correcciones de seguridad y robustez

### Corregido

1. **JWT_SECRET obligatorio** (`src/core/auth.js`)
   - Antes: fallback hardcodeado `cms-dev-secret-change-in-production`.
   - Ahora: la aplicacion falla al arrancar si `JWT_SECRET` no esta definido.

2. **ReDoS en busqueda** (`src/api/routes/posts.js`)
   - Antes: parametro `q` pasado directamente a `$regex`.
   - Ahora: `escapeRegex()` escapa metacaracteres antes de construir el filtro.

3. **XSS via embed** (`scripts/build-static.js`)
   - Antes: cualquier URL en `block.src` se inyectaba en `src` del iframe.
   - Ahora: `isSafeEmbedUrl()` valida protocolo `http:` o `https:`.

4. **createIndex silencioso** (`src/models/*.js`)
   - Antes: try/catch generico ignoraba cualquier error.
   - Ahora: solo se ignora "already exists"; otros errores se propagan.

5. **CORS wildcard en produccion** (`src/app.js`)
   - Antes: `cors()` sin configuracion.
   - Ahora: restringible via `CORS_ORIGIN`.

6. **Dependencia vendorizada** (`package.json`)
   - `npm run update:jsdocstore` descarga la version mas reciente.

## 2026-05-18 — Rate limiting + Editor web inicial

### Agregado

- **Rate limiting**: 100 req/min global, 10 intentos/15 min en auth, bloqueo 30 min.
- **Editor web**: login, CRUD de posts y taxonomias, edicion JSON de bloques.

## 2026-05-18 — Version inicial

- CMS headless con js-doc-store
- API REST (Express + JWT)
- Generador estatico (HTML, RSS, sitemap, JSON API, busqueda client-side)
- Theme oscuro con toggle
- Bloques de contenido: paragraph, heading, heading3, quote, code, image, list, callout, divider, table, embed
- Deploy automatico a GitHub Pages
- Base de datos documental commiteada en el repo
