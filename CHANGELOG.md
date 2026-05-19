# Changelog

## 2026-05-18 — Busqueda TF-IDF, admin robusto, hreflang, migracion Sanity

### Agregado

- **Busqueda TF-IDF con cache invalidable** (`src/core/search.js`, `src/api/routes/search.js`)
  - Indice singleton (`getOrBuildIndex`/`invalidateIndex`) que sobrevive entre requests sin reconstruirse.
  - `invalidateIndex()` se llama automaticamente despues de POST, PATCH y DELETE en `/api/posts`.
  - Resultado: busqueda rapida en lecturas, indice siempre fresco en escrituras.

- **Busqueda TF-IDF en el edge de Cloudflare** (`functions/_worker.js`)
  - Puerto en linea del algoritmo TF-IDF (coseno similaridad) para `/api/search` en el Worker ESM.
  - Ya no devuelve resultados planos; ranquea documentos por relevancia real.

- **Soporte de locale/idioma en posts** (`src/models/post.js`, `src/api/routes/posts.js`)
  - Campo `locale` en posts (`es`/`en` u otro BCP-47).
  - Filtro `?locale=` en `GET /api/posts` para separar contenido por idioma.
  - Generador estatico pasa `locale` y `defaultUrl` a todas las paginas para hreflang correcto.

- **Admin: cola offline y auto-guardado** (`public/admin/index.html`)
  - `enqueueOffline()` / `flushOfflineQueue()`: cambios guardados en localStorage cuando no hay red y enviados en cuanto `navigator.onLine` vuelve.
  - `startAutoSave()`: borrador guardado automaticamente cada 30 s via `setInterval`.
  - Banner `#offlineBanner` visible mientras el navegador esta sin conexion.
  - `#lastSynced` span actualizado tras cada guardado exitoso.

- **Admin: guards de navegacion y estado sin guardar** (`public/admin/index.html`)
  - `hasUnsavedChanges` / `markDirty()` / `markClean()` para rastrear ediciones pendientes.
  - `beforeunload` muestra dialogo nativo si hay cambios sin guardar.
  - Boton "Volver" pide confirmacion si el formulario esta sucio.

- **Migracion desde Sanity** (`scripts/migrate-from-sanity.js`, `scripts/portable-text-converter.js`, `MIGRATION.md`)
  - `migrate-from-sanity.js`: migra authors→users, categories/tags→taxonomies, posts con Portable Text.
  - `portable-text-converter.js`: convierte bloques Sanity a bloques CMS (paragraph, heading, heading3, list, code, quote, image).
  - Datos de prueba en `scripts/test-migration-fixture.json` (2 autores, 2 categorias, 3 tags, 3 posts).
  - `MIGRATION.md` con instrucciones paso a paso y tabla de mapeo de tipos.

### Corregido

- **showToast indefinido en admin** (`public/admin/index.html`)
  - Funcion `showToast(msg, type)` implementada; antes causaba `ReferenceError` al guardar.

- **`$('#taxSelect input:checked')` devolviendo un solo elemento** (`public/admin/index.html`)
  - Cambiado de `querySelector` a `querySelectorAll` para recoger todos los checkboxes marcados.

- **Listas de posts/paginas mostrando "No hay posts"** (`public/admin/index.html`)
  - API devuelve `{posts: [...], total: N}`; el codigo ahora extrae el array correctamente con `Array.isArray(data) ? data : (data.posts || [])`.

- **Selector `#locale` faltante en el formulario del editor** (`public/admin/index.html`)
  - `<select id="locale">` agregado al HTML del editor de posts (era referenciado en JS pero no existia en el DOM).

- **hreflang renderizando literalmente `{{locale}}`** (`scripts/build-static.js`, `templates/layout.html`)
  - `build-static.js` ahora pasa `locale` y `defaultUrl` en las 6 llamadas a `render(layoutTpl, {...})`.
  - Atributo `data-if="{{defaultUrl}}"` eliminado del template (el motor de plantillas no lo soporta y se renderizaba como texto).

- **Inyeccion de shell en git-sync** (`scripts/git-sync.js`)
  - `execSync('git commit -m "' + MSG + '"')` reemplazado por `execFileSync('git', ['commit', '-m', MSG])`.
  - Un mensaje de commit con metacaracteres ya no puede ejecutar comandos arbitrarios.

- **`store.flush()` indefinido en migracion** (`scripts/migrate-from-sanity.js`)
  - Cambiado a `flushAll()` que es el export correcto de `src/core/store.js`.

- **`await` de nivel superior en archivo CommonJS** (`scripts/migrate-from-sanity.js`)
  - Toda la logica de migracion envuelta en `async function main()` + `main().catch(...)`. Node 24 rechazaba el modulo con ERR_AMBIGUOUS_MODULE_SYNTAX.

- **Items de lista Sanity convertidos a parrafos** (`scripts/portable-text-converter.js`)
  - Nodos `block` con propiedad `listItem` ahora se acumulan en un bloque `list` correcto en lugar de caer al caso `paragraph`.

### Pruebas

- **33 tests** (antes 24): 9 tests nuevos cubriendo busqueda TF-IDF y filtrado por locale.
  - Busqueda: seed de post indexado, resultados para termino conocido, 0 resultados para termino desconocido, query vacia.
  - Invalidacion: indice se reconstruye despues de PATCH y DELETE.
  - Locale: crear post `en`, filtro `?locale=en` incluye, `?locale=es` excluye.

---

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
