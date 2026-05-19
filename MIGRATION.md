# Migrar desde Sanity

Este CMS puede importar contenido desde un export JSON de Sanity.

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

- **Portable Text**: se convierte a bloques planos. Texto enriquecido (negrita, links, etc.) se aplana a texto plano porque este CMS no soporta inline marks actualmente.
- **Imagenes**: Sanity usa un asset CDN propio. Las URLs del export se guardan tal cual en `featuredImage`. Si quieres migrar a almacenamiento local, descarga las imagenes primero.
- **GROQ**: no hay equivalente directo. Las queries se hacen via API REST con filtros tipo MongoDB (`?status=published`, `?locale=en`, `?q=busqueda`).
- **Revisions**: este CMS no tiene historial nativo. El historial es el git log de `db/`.

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
