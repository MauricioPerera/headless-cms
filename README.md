# Headless CMS (js-doc-store)

CMS minimalista basado en [js-doc-store](https://github.com/MauricioPerera/js-doc-store), disenado para evitar los problemas arquitectonicos de WordPress. Incluye modo **API REST** (headless) y generador de **sitios estaticos** (SSG).

## Caracteristicas

- **Persistencia documental**: sin SQL, sin migraciones, sin JOINs costosos.
- **Autenticacion JWT**: registro, login, roles (admin, editor).
- **Gestion de contenido**: posts con estados (draft, published), taxonomias (categorias y tags), paginas estaticas.
- **Relaciones entre documentos**: referencias por ID con resolucion opcional.
- **Hooks async**: middleware para validacion, sanitizacion y disparo de webhooks.
- **Indices**: hash y sorted sobre campos clave.
- **Seguridad**: sin SQL injection, bcrypt, validacion en hooks, rate limiting, CORS configurable.
- **Generador estatico**: HTML, RSS, sitemap, JSON API estatica, busqueda client-side.
- **Theme oscuro**: toggle manual + deteccion de preferencia del sistema.
- **SEO completo**: Open Graph, Twitter Cards, Schema.org JSON-LD, breadcrumbs.
- **Paginacion**: index paginado con navegacion anterior/siguiente.
- **Imagenes**: featured images, imagenes inline en bloques, subida via API con multer.
- **Multi-autor**: avatar y bio por usuario, author card en posts.
- **Deploy automatico**: GitHub Actions a GitHub Pages en cada push a `master`.
- **Persistencia real**: la base de datos `db/` se commitea en el repo, no se regenera en CI.
- **Editor web**: panel administrativo en `http://localhost:3000/admin` para crear/editar posts y paginas.
- **Webhooks**: notificacion real a endpoints externos cuando un post se publica.

## Modos de uso

### 1. API REST (desarrollo / backend headless)

```bash
npm install
npm run seed   # solo la primera vez
JWT_SECRET=tu-secreto npm start
```

API en `http://localhost:3000`.

| Metodo | Endpoint | Descripcion | Rol minimo |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Registrar usuario | -- |
| POST | `/api/auth/login` | Iniciar sesion | -- |
| GET | `/api/posts` | Listar posts (filtros, paginacion, relaciones) | -- |
| GET | `/api/posts/:idOrSlug` | Obtener post | -- |
| POST | `/api/posts` | Crear post | editor |
| PATCH | `/api/posts/:id` | Actualizar post | editor |
| DELETE | `/api/posts/:id` | Eliminar post | admin |
| GET | `/api/pages` | Listar paginas | -- |
| GET | `/api/pages/:idOrSlug` | Obtener pagina | -- |
| POST | `/api/pages` | Crear pagina | editor |
| PATCH | `/api/pages/:id` | Actualizar pagina | editor |
| DELETE | `/api/pages/:id` | Eliminar pagina | admin |
| GET | `/api/users` | Listar usuarios | admin |
| GET | `/api/users/me` | Perfil actual | autenticado |
| GET | `/api/taxonomies` | Listar taxonomias | -- |
| POST | `/api/taxonomies` | Crear taxonomia | editor |
| GET | `/api/webhooks` | Listar webhooks | admin |
| POST | `/api/webhooks` | Crear webhook | admin |
| DELETE | `/api/webhooks/:id` | Eliminar webhook | admin |
| POST | `/api/upload` | Subir imagen | autenticado |

**Rate limiting**:
- Global: 100 peticiones/minuto por IP.
- Auth (`/api/auth/*`): 10 peticiones/15 minutos por IP. Despues de superar el limite, bloqueo de 30 minutos.

### 2. Editor web

Al iniciar `npm start`, visita `http://localhost:3000/admin` para acceder al panel administrativo.

Permite:
- Iniciar sesion con usuario y contrasena
- Tabs **Posts** y **Paginas** para alternar entre tipos de contenido
- Listar, crear, editar y eliminar posts y paginas
- Editor visual de bloques: parrafo, heading, imagen, code, cita, lista, divisor
- Subir imagenes via drag & drop o click (max 5MB)
- Asignar featured image, taxonomias y estado de publicacion

### 3. Sitio estatico (SSG)

```bash
npm run build       # genera dist/ desde la db/ existente
npm run serve       # preview local en localhost:4000
```

**Importante**: `npm run build` requiere que exista la carpeta `db/` con datos. Si no existe, te indicara que ejecutes `npm run seed` primero.

La carpeta `dist/` contiene:

```
dist/
  index.html
  page/2.html              # Paginacion
  posts/
    slug-del-post.html
  categories/
    tecnologia.html
    tecnologia.xml         # RSS por categoria
    index.html
  tags/
    javascript.html
    javascript.xml         # RSS por tag
    index.html
  acerca-de.html           # Paginas estaticas
  contacto.html
  feed.xml                 # RSS global
  sitemap.xml
  api/
    posts.json
    taxonomies.json
    search.json            # Indice para busqueda client-side
  assets/
    style.css              # Tema claro/oscuro responsive
    app.js                 # Busqueda + toggle de tema
    images/                # Imagenes subidas via upload
```

### 4. Webhooks

Los webhooks se disparan automaticamente cuando un post cambia a `status: 'published'` (tanto en creacion como en actualizacion).

Para configurar un webhook:

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-servidor.com/revalidate",
    "events": ["post.published"],
    "secret": "clave-secreta-para-verificar"
  }'
```

Payload enviado al webhook:

```json
{
  "event": "post.published",
  "payload": { /* post completo */ },
  "timestamp": "2026-05-18T19:00:00.000Z"
}
```

Headers incluidos:
- `Content-Type: application/json`
- `X-Webhook-Secret`: si se configuro secret

Los fallos de entrega son silenciosos (no interrumpen la operacion del post) y se loggean en la consola del servidor.

## Bloques de contenido soportados

El campo `content` de un post o pagina es un array JSON de bloques:

```json
[
  { "type": "paragraph", "text": "Texto normal." },
  { "type": "heading", "text": "Titulo de seccion" },
  { "type": "heading3", "text": "Subtitulo" },
  { "type": "image", "src": "https://...", "alt": "Descripcion" },
  { "type": "code", "text": "const x = 1;" },
  { "type": "quote", "text": "Cita importante." },
  { "type": "list", "items": ["A", "B", "C"], "ordered": false },
  { "type": "callout", "title": "Nota", "text": "Informacion util." },
  { "type": "divider" },
  { "type": "table", "headers": ["A", "B"], "rows": [["1", "2"]] },
  { "type": "embed", "src": "https://youtube.com/watch?v=..." }
]
```

## SEO y metadatos

El generador estatico produce automaticamente:

- **Open Graph**: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:site_name`
- **Twitter Cards**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Schema.org JSON-LD**: `BlogPosting` (posts), `WebSite` (index), `CollectionPage` (taxonomias), `WebPage` (paginas)
- **Breadcrumbs**: navegacion HTML con microdata `BreadcrumbList`
- **Canonical URL**: en todas las paginas

Configura `SITE_OG_IMAGE` en GitHub Actions para una imagen por defecto cuando un post no tiene `featuredImage`.

## Paginacion

Por defecto se muestran 5 posts por pagina. Configurable via variable de entorno `POSTS_PER_PAGE`.

- Pagina 1: `index.html`
- Pagina 2: `page/2.html`
- Pagina N: `page/N.html`

Navegacion con "Anterior" y "Siguiente" en cada pagina.

## Paginas estaticas

Ademas de posts, puedes crear paginas estaticas como "Acerca de", "Contacto", etc.:

```bash
curl -X POST http://localhost:3000/api/pages \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Acerca de",
    "slug": "acerca-de",
    "content": [{"type":"paragraph","text":"Sobre mi..."}],
    "excerpt": "Sobre este blog"
  }'
```

Las paginas aparecen automaticamente en la navegacion del sitio y se generan como `dist/{slug}.html`.

## Imagenes

### Featured image

En el campo `featuredImage` de un post (string URL u objeto):

```json
{
  "featuredImage": "https://ejemplo.com/foto.jpg"
}
```

O con alt y caption:

```json
{
  "featuredImage": {
    "src": "https://ejemplo.com/foto.jpg",
    "alt": "Descripcion",
    "caption": "Pie de foto"
  }
}
```

Se muestra arriba del titulo en el post individual y como thumbnail en las cards del index.

### Subida de imagenes

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $token" \
  -F "image=@mi-foto.jpg"
```

Respuesta:

```json
{
  "url": "/assets/images/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg"
}
```

Las imagenes subidas se guardan en `static/assets/images/` y se copian a `dist/assets/images/` en el build.

## Multi-autor

Los usuarios pueden tener `avatar` (URL de imagen) y `bio` (texto corto):

```json
{
  "username": "mauricio",
  "displayName": "Mauricio Perera",
  "avatar": "https://images.unsplash.com/...",
  "bio": "Desarrollador full-stack...",
  "role": "admin"
}
```

El generador estatico muestra una **author card** al final de cada post con foto, nombre y biografia.

## Deploy automatico a GitHub Pages

### Paso 1: Settings > Pages > Source: GitHub Actions

### Paso 2: Configurar variables y secretos

En **Settings > Secrets and variables > Actions**:

**Secrets**:
- `JWT_SECRET`: string largo aleatorio (32+ caracteres)

**Variables**:
- `SITE_URL`: URL completa del sitio
- `BASE_PATH`: path del repo (ej. `/headless-cms/`)
- `SITE_OG_IMAGE`: URL de imagen por defecto para Open Graph (opcional)
- `POSTS_PER_PAGE`: numero de posts por pagina (default: 5, opcional)

| Tipo de repo | Ejemplo de repo | `SITE_URL` | `BASE_PATH` |
|--------------|-----------------|------------|-------------|
| **Usuario** | `mauricioperera.github.io` | `https://mauricioperera.github.io/` | `/` |
| **Proyecto** | `headless-cms` | `https://mauricioperera.github.io/headless-cms/` | `/headless-cms/` |

Si tu repo es de **proyecto** (cualquier nombre distinto a tu usuario), usa `BASE_PATH=/nombre-del-repo/` y `SITE_URL=https://tuusuario.github.io/nombre-del-repo/`.

Si tu repo se llama exactamente como tu usuario (`tuusuario.github.io`), usa `BASE_PATH=/` y `SITE_URL=https://tuusuario.github.io/`.

**Sin estas variables, los feeds RSS y los links internos apuntaran a una URL de ejemplo y estaran rotos.**

### Paso 3: Hacer push

```bash
git init
git add .
git commit -m "Headless CMS con contenido persistente"
git branch -M master
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin master
```

Cada push a `master` ejecuta automaticamente:
1. `npm ci`
2. `npm run build` (sobre la `db/` que commiteaste)
3. Despliegue a GitHub Pages

Puedes ver el progreso en la pestana **Actions** de tu repositorio.

**El workflow NO ejecuta `npm run seed`**. Esto garantiza que tu contenido no se sobrescriba en cada deploy.

## Flujo de trabajo con persistencia

Para un blog real, la base de datos `db/` **se incluye en el repositorio**. Esto significa que tu contenido persiste entre builds y deploys.

### Crear contenido localmente

```bash
npm run seed        # solo la primera vez para datos iniciales
JWT_SECRET=tu-secreto npm start   # levanta API + editor web en localhost:3000
```

Visita `http://localhost:3000/admin` para usar el editor web, o usa curl/Postman contra la API REST.

Cada cambio que hagas via editor o API se guarda automaticamente en `db/`. Cuando termines:

```bash
git add db/
git commit -m "Nuevos posts y taxonomias"
git push origin master
```

El workflow de GitHub Actions detectara el push, ejecutara `npm run build` sobre tu `db/` commiteada, y desplegara el sitio actualizado.

### Si no tienes db/ commiteada

Si clonas el repo en otra maquina y no hay `db/`:

```bash
npm run seed        # regenera contenido demo
# O restaura db/ desde un backup
```

## Deploy en otras plataformas

### Cloudflare Pages

En [dash.cloudflare.com](https://dash.cloudflare.com):

- **Build command**: `npm run build`
- **Build output directory**: `dist`

O con Wrangler:

```bash
npm run build
npx wrangler pages deploy dist
```

### Netlify

```bash
npm run build
netlify deploy --dir=dist --prod
```

### Vercel (static)

```bash
npm run build
npx vercel --prod dist
```

O `vercel.json`:

```json
{
  "version": 2,
  "outputDirectory": "dist"
}
```

## Pruebas

```bash
npm test
```

24 tests: health, auth, posts, paginas, taxonomias, usuarios, webhooks, permisos.

## Actualizar js-doc-store

Si la libreria original se actualiza:

```bash
npm run update:jsdocstore
```

Esto descarga la version mas reciente desde GitHub y la coloca en `lib/js-doc-store.js`.

## Arquitectura

```
src/
  core/
    store.js      # DocStore + FileStorageAdapter
    hooks.js      # Sistema de hooks async
    auth.js       # bcrypt + JWT
  models/
    user.js       # Usuarios con validacion, avatar y bio
    post.js       # Posts con relaciones + hooks afterUpdate
    page.js       # Paginas estaticas
    taxonomy.js   # Categorias y tags
    webhook.js    # Endpoints externos + trigger real en hooks
  api/
    middleware/
      auth.js     # Verificacion JWT + roles
      error.js    # Manejo de errores
      rate-limit.js # Rate limiting por IP
    routes/
      auth.js
      posts.js
      pages.js
      users.js
      taxonomies.js
      webhooks.js
      upload.js   # Subida de imagenes con multer

db/               # Base de datos documental (persistida en repo)
templates/        # Templates HTML para SSG
static/assets/    # CSS, JS e imagenes frontend
public/admin/     # Editor web administrativo
.github/workflows/
  deploy.yml      # Workflow de GitHub Actions
scripts/
  seed-real.js    # Datos de prueba realistas
  build-static.js # Generador de sitio estatico
  serve-static.js # Servidor de preview
  test-simple.js  # Bateria de pruebas
```

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md).

## Problemas de WordPress que se evitan

1. **SQL Injection**: no hay SQL. Las queries son filtros de objetos JS.
2. **Esquema rigido**: documentos JSON flexibles, sin ALTER TABLE.
3. **Meta queries costosas**: no hay tabla EAV; metadatos son propiedades nativas.
4. **JOINs complejos**: relaciones por referencia y denormalizacion.
5. **Migraciones**: el esquema es flexible por diseno.
6. **Backend obligatorio**: con SSG, puedes publicar en cualquier hosting estatico gratuito.
7. **Plugins inseguros**: la arquitectura de hooks async permite sandboxing futuro.
8. **Sobrescritura accidental de contenido**: el workflow de CI nunca ejecuta seed, protege tu db/.
9. **Fuerza bruta en login**: rate limiting de 10 intentos/15 min por IP.
10. **Revalidacion manual de frontend**: los webhooks automatizan la notificacion a tu frontend cuando cambia el contenido.
