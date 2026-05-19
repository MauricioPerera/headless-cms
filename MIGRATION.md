# Migrar desde Sanity

Este CMS puede importar contenido desde un export JSON de Sanity.

> **Probado con**: Node.js 18+. El script usa CommonJS (`require()`); no renombrar a `.mjs`.

## Paso 1: Exportar desde Sanity

En tu proyecto Sanity, ejecuta:

```bash
sanity dataset export production ./sanity-export.tar.gz
# Extrae el tar.gz y obtendras un ndjson o JSON
```

O usa la API REST/GROQ para exportar documentos especificos:

```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  "https://TU_PROYECTO.api.sanity.io/v2021-06-07/data/query/production?query=*[_type%20in%20%5B%22post%22%2C%22author%22%2C%22category%22%2C%22tag%22%5D]" \
  > sanity-export.json
```

El formato esperado es un array de documentos bajo `documents`:

```json
{
  "documents": [
    { "_type": "author", "_id": "...", "name": "...", "slug": { "current": "..." }, "image": { "asset": { "url": "..." } } },
    { "_type": "category", "_id": "...", "title": "...", "slug": { "current": "..." } },
    { "_type": "tag", "_id": "...", "name": "...", "slug": { "current": "..." } },
    {
      "_type": "post",
      "_id": "...",
      "title": "...",
      "slug": { "current": "..." },
      "body": [ /* Portable Text blocks */ ],
      "excerpt": "...",
      "publishedAt": "2024-01-01T00:00:00Z",
      "mainImage": { "asset": { "url": "..." }, "alt": "..." },
      "categories": [{ "_ref": "..." }],
      "tags": [{ "_ref": "..." }],
      "author": { "_ref": "..." }
    }
  ]
}
```

## Paso 2: Importar al Headless CMS

```bash
npm run migrate:sanity -- ./ruta/a/sanity-export.json
```

Esto crea:
- Usuarios (editores) desde `author`
- Taxonomias (`category` → categorias, `tag` → tags)
- Posts con bloques de contenido convertidos

## Paso 2b: Probar con datos de ejemplo

El repositorio incluye un fixture con 10 documentos (2 autores, 2 categorias, 3 tags, 3 posts):

```bash
# Limpia la db antes de migrar para evitar colisiones
Remove-Item -Recurse -Force db   # PowerShell
# rm -rf db                      # bash/macOS

node scripts/migrate-from-sanity.js scripts/test-migration-fixture.json
```

Salida esperada:

```
Loaded 10 documents from test-migration-fixture.json

--- Authors ---
  ✓ Author: Mauricio Perera
  ✓ Author: Ana García

--- Categories ---
  ✓ Category: Tecnología
  ✓ Category: Cloudflare

--- Tags ---
  ✓ Tag: JavaScript
  ✓ Tag: Node.js
  ✓ Tag: Edge Computing

--- Posts ---
  ✓ Post: Introducción a Cloudflare Workers (10 bloques, ~1 min)
  ✓ Post: Node.js vs Deno vs Bun en 2024 (6 bloques, ~1 min)
  ✓ Post: Post con autor inexistente (test de robustez) (1 bloques, ~1 min)

=============================
Authors:    2 migrados
Categories: 2 migradas
Tags:       3 migrados
Posts:      3 migrados, 0 saltados
=============================
```

El tercer post tiene un `_ref` de autor inexistente; el script asigna `authorId: null` y continua sin fallar.

## Paso 3: Verificar y desplegar

```bash
npm run build
npm run deploy:cloudflare
```

## Mapeo de tipos

| Sanity | Headless CMS |
|--------|-------------|
| `author` | `user` (rol editor) |
| `category` | `taxonomy` (type: category) |
| `tag` | `taxonomy` (type: tag) |
| `post` | `post` |
| Portable Text | Bloques JSON (`paragraph`, `heading`, `heading3`, `image`, `code`, `quote`) |
| `mainImage.asset.url` | `featuredImage` (URL directa) |
| `slug.current` | `slug` |

## Notas importantes

- **Portable Text**: se convierte a bloques planos. El conversor maneja `paragraph`, `heading` (h1/h2), `heading3` (h3/h4), `blockquote`, `code`, `image` y listas (bullet y numeradas). Texto enriquecido con marks inline (negrita, links) se aplana a texto plano porque el CMS no soporta marks actualmente.
- **Listas**: nodos Sanity con `listItem: "bullet"` o `listItem: "number"` se agrupan en un solo bloque `{type:"list", items:[...], ordered:bool}`.
- **Imagenes**: Sanity usa un asset CDN propio. Las URLs del export se guardan tal cual en `featuredImage`. Para migrar a almacenamiento local, descarga las imagenes primero con `wget`/`curl` y actualiza las URLs.
- **GROQ**: no hay equivalente directo. Las queries se hacen via API REST con filtros (`?status=published`, `?locale=en`, `?q=busqueda`).
- **Revisions**: este CMS no tiene historial nativo. El historial es el git log de `db/`.
- **Passwords temporales**: los autores migrados reciben una password aleatoria (`change-me-XXXXXXXX`). Cambialas via `PATCH /api/users/:id` antes de usar el panel de administracion.

## Limitaciones

| Feature Sanity | Estado en Headless CMS |
|----------------|------------------------|
| Real-time colaboracion | No (single-user por archivo JSON) |
| Studio visual | Admin web basico (HTML vanilla) |
| GROQ | Queries REST simples |
| Portable Text marks (links, negrita) | Aplana a texto plano |
| Asset pipeline (transformaciones de imagen) | URLs directas |
| Custom input components | No (campos fijos) |

Para la mayoria de blogs personales y sitios de contenido, la funcionalidad basica cubre el 90% de los casos de uso.
