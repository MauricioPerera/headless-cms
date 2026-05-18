# Headless CMS (js-doc-store)

CMS minimalista basado en [js-doc-store](https://github.com/MauricioPerera/js-doc-store), disenado para evitar los problemas arquitectonicos de WordPress. Incluye modo **API REST** (headless) y generador de **sitios estaticos** (SSG).

## Caracteristicas

- **Persistencia documental**: sin SQL, sin migraciones, sin JOINs costosos.
- **Autenticacion JWT**: registro, login, roles (admin, editor, author, subscriber).
- **Gestion de contenido**: posts con estados (draft, published, archived), taxonomias (categorias y tags).
- **Relaciones entre documentos**: referencias por ID con resolucion opcional.
- **Hooks async**: middleware para validacion, sanitizacion y auditoria.
- **Indices**: hash y sorted sobre campos clave.
- **Seguridad**: sin SQL injection, bcrypt, validacion en hooks, rate limiting.
- **Generador estatico**: HTML, RSS, sitemap, JSON API estatica, busqueda client-side.
- **Theme oscuro**: toggle manual + deteccion de preferencia del sistema.
- **Bloques de contenido**: paragraph, heading, heading3, quote, code, image, list, callout, divider, table, embed.
- **Deploy automatico**: GitHub Actions a GitHub Pages en cada push a `main`.
- **Persistencia real**: la base de datos `db/` se commitea en el repo, no se regenera en CI.
- **Editor web**: panel administrativo en `http://localhost:3000/` para crear/editar posts sin Postman.

## Modos de uso

### 1. API REST (desarrollo / backend headless)

```bash
npm install
npm run seed   # solo la primera vez
JWT_SECRET=tu-secreto npm start
```

API en `http://localhost:3000`.

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesion |
| GET | `/api/posts` | Listar posts (filtros, paginacion, relaciones) |
| GET | `/api/posts/:idOrSlug` | Obtener post |
| POST | `/api/posts` | Crear post (autenticado) |
| PATCH | `/api/posts/:id` | Actualizar post |
| DELETE | `/api/posts/:id` | Eliminar post |
| GET | `/api/users` | Listar usuarios (admin/editor) |
| GET | `/api/users/me` | Perfil actual |
| GET | `/api/taxonomies` | Listar taxonomias |
| POST | `/api/taxonomies` | Crear taxonomia (admin/editor) |

**Rate limiting**:
- Global: 100 peticiones/minuto por IP.
- Auth (`/api/auth/*`): 10 peticiones/15 minutos por IP. Despues de superar el limite, bloqueo de 30 minutos.

### 2. Editor web

Al iniciar `npm start`, visita `http://localhost:3000/` para acceder al panel administrativo.

Permite:
- Iniciar sesion con usuario y contraseña
- Listar, crear, editar y eliminar posts
- Gestionar taxonomias (categorias y tags)
- Editar contenido como JSON de bloques

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
  posts/
    slug-del-post.html
  categories/
    tecnologia.html
    tecnologia.xml        # RSS por categoria
    index.html
  tags/
    javascript.html
    javascript.xml        # RSS por tag
    index.html
  feed.xml                # RSS global
  sitemap.xml
  api/
    posts.json
    taxonomies.json
    search.json           # Indice para busqueda client-side
  assets/
    style.css             # Tema claro/oscuro responsive
    app.js                # Busqueda + toggle de tema
```

## Bloques de contenido soportados

El campo `content` de un post es un array JSON de bloques:

```json
[
  { "type": "paragraph", "text": "Texto normal." },
  { "type": "heading", "text": "Titulo de seccion" },
  { "type": "heading3", "text": "Subtitulo" },
  { "type": "quote", "text": "Una cita inspiradora." },
  { "type": "code", "text": "console.log('hola');" },
  { "type": "image", "src": "./img.png", "alt": "Descripcion" },
  { "type": "list", "ordered": false, "items": ["Uno", "Dos", "Tres"] },
  { "type": "callout", "title": "Nota", "text": "Informacion importante." },
  { "type": "divider" },
  { "type": "table", "headers": ["A", "B"], "rows": [["1", "2"], ["3", "4"]] },
  { "type": "embed", "src": "https://www.youtube.com/embed/XXXX" }
]
```

## Theme oscuro

El sitio estatico incluye un toggle de tema en la barra de navegacion. Detecta la preferencia del sistema (`prefers-color-scheme`) y la guarda en `localStorage`.

## Deploy automatico a GitHub Pages

### Paso 1: Configurar Pages en el repo

1. Ve a **Settings → Pages** en tu repositorio de GitHub.
2. En **Source**, selecciona **GitHub Actions**.

### Paso 2: Configurar Secrets y Variables de Actions

Antes de hacer push, configura los siguientes valores en **Settings → Secrets and variables → Actions**.

#### Secrets (valores sensibles)

| Secret | Requerido | Descripcion |
|--------|-----------|-------------|
| `JWT_SECRET` | **Si** | Clave para firmar tokens JWT (minimo 32 caracteres aleatorios). **Obligatoria**: sin ella la API no arranca. |

#### Variables (no sensibles)

| Variable | Requerido | Ejemplo | Descripcion |
|----------|-----------|---------|-------------|
| `SITE_NAME` | Opcional | `Mi Blog Headless` | Titulo del sitio |
| `SITE_DESCRIPTION` | Opcional | `Blog sobre desarrollo` | Meta descripcion |
| `SITE_URL` | **Si** | `https://mauricioperera.github.io/` | URL completa del sitio. Ver tabla de ejemplos abajo. |
| `BASE_PATH` | **Si** | `/` | Path relativo. Ver tabla de ejemplos abajo. |

**Importante**: `SITE_URL` y `BASE_PATH` dependen del tipo de repositorio. Elige la fila que corresponda a tu caso:

| Tipo de repo | Nombre del repo | `SITE_URL` | `BASE_PATH` |
|--------------|-----------------|------------|-------------|
| **Usuario / Organizacion** | `mauricioperera.github.io` | `https://mauricioperera.github.io/` | `/` |
| **Proyecto** | `headless-cms` | `https://mauricioperera.github.io/headless-cms/` | `/headless-cms/` |

Si tu repo es de **proyecto** (cualquier nombre distinto a tu usuario), usa `BASE_PATH=/nombre-del-repo/` y `SITE_URL=https://tuusuario.github.io/nombre-del-repo/`.

Si tu repo se llama exactamente como tu usuario (`tuusuario.github.io`), usa `BASE_PATH=/` y `SITE_URL=https://tuusuario.github.io/`.

**Sin estas variables, los feeds RSS y los links internos apuntaran a una URL de ejemplo y estaran rotos.**

### Paso 3: Hacer push

```bash
git init
git add .
git commit -m "Headless CMS con contenido persistente"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Cada push a `main` ejecuta automaticamente:
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

Visita `http://localhost:3000/` para usar el editor web, o usa curl/Postman contra la API REST.

Cada cambio que hagas via editor o API se guarda automaticamente en `db/`. Cuando termines:

```bash
git add db/
git commit -m "Nuevos posts y taxonomias"
git push origin main
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

20 tests: health, auth, posts, taxonomias, usuarios, permisos.

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
    user.js       # Usuarios con validacion
    post.js       # Posts con relaciones
    taxonomy.js   # Categorias y tags
  api/
    middleware/
      auth.js     # Verificacion JWT
      error.js    # Manejo de errores
      rate-limit.js # Rate limiting por IP
    routes/
      auth.js
      posts.js
      users.js
      taxonomies.js

db/               # Base de datos documental (persistida en repo)
templates/        # Templates HTML para SSG
static/assets/    # CSS y JS frontend
public/           # Editor web administrativo
  index.html
  editor.js
.github/workflows/
  deploy.yml      # Workflow de GitHub Actions
scripts/
  seed.js         # Datos de prueba (solo primera vez)
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
