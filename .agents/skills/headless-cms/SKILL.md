---
name: headless-cms
description: "Use when working with the Headless CMS project: creating or editing posts/pages/taxonomies via API or scripts, building static sites, managing the js-doc-store database, modifying templates/CSS/JS, running tests, or deploying to GitHub Pages."
compatibility: "Node.js 20+. Filesystem-based agent with PowerShell/bash + curl. Uses js-doc-store as JSON document database."
---

# Headless CMS Skill

## When to use

Use this skill when you need to:

- Create, update, or delete content (posts, pages, taxonomies)
- Generate or preview the static site (SSG)
- Modify templates, CSS, JavaScript, or the admin panel
- Run tests or validate the API
- Deploy changes to GitHub Pages
- Troubleshoot build errors, seed issues, or database state
- Add new features to the CMS core (hooks, models, routes)

## Project layout

```
headless-cms/
  src/
    core/
      store.js        # DocStore instance (db/)
      hooks.js        # HookSystem (async middleware)
      auth.js         # JWT + bcrypt
    models/
      post.js         # Posts with hooks + slugify
      page.js         # Static pages (Acerca de, Contacto)
      user.js         # Users with roles + avatar/bio
      taxonomy.js     # Categories and tags
      webhook.js      # Webhooks + triggerWebhooks()
    api/
      middleware/     # auth, error, rate-limit
      routes/         # auth, posts, pages, users, taxonomies, webhooks, upload
  db/                 # JSON document DB (committed to repo)
  templates/          # HTML templates for SSG
    layout.html       # Base layout (header, nav, breadcrumbs, footer)
    index.html        # Homepage post cards
    post.html         # Single post + author card
    page.html         # Static page
    taxonomy.html     # Category/tag listing
    rss.xml           # RSS feed
    sitemap.xml       # XML sitemap
  static/assets/      # Frontend assets
    style.css         # Theme (light/dark)
    app.js            # Search + theme toggle
    manifest.json     # PWA manifest
    service-worker.js # PWA service worker
    icons/            # PWA icons
  public/admin/       # Web admin panel
    index.html        # Admin SPA (JS only, no build step)
  scripts/
    seed-real.js      # Realistic seed data (5 posts, 2 pages, 4 categories, 10 tags)
    build-static.js   # SSG entrypoint
    serve-static.js   # Preview server (localhost:4000)
    test-simple.js    # 24 HTTP tests
  .github/workflows/
    deploy.yml        # CI/CD to GitHub Pages
  DESIGN.md           # Design system spec (tokens + rationale)
```

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `JWT_SECRET` | Yes (in production) | -- | JWT signing key (fails startup if missing) |
| `PORT` | No | 3000 | API server port |
| `NODE_ENV` | No | -- | Set to `production` for CORS warning |
| `CORS_ORIGIN` | No | * | Comma-separated allowed origins |
| `SITE_URL` | No (CI only) | https://... | Full site URL for SSG |
| `BASE_PATH` | No (CI only) | / | Subpath for GitHub Pages project repos |
| `SITE_NAME` | No (CI only) | Mi Blog Headless | Site title for SSG |
| `SITE_DESCRIPTION` | No (CI only) | Blog generado... | Meta description |
| `SITE_OG_IMAGE` | No (CI only) | -- | Default Open Graph image URL |
| `POSTS_PER_PAGE` | No (CI only) | 5 | Homepage pagination size |

## Authentication

The CMS uses JWT with bcrypt. Default seeded users:

| Username | Password | Role |
|----------|----------|------|
| mauricio | admin123 | admin |
| ana | editor123 | editor |

Get a token:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mauricio","password":"admin123"}'
```

Use the token in subsequent requests:

```bash
export TOKEN="eyJhbG..."
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/posts
```

## Content management

### Create a post via API

```bash
curl -s -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Post",
    "content": "[{\"type\":\"paragraph\",\"text\":\"Hello world.\"}]",
    "excerpt": "Short description",
    "status": "published",
    "taxonomyIds": [],
    "featuredImage": "https://example.com/image.jpg",
    "meta": { "readTime": 5 }
  }'
```

### Create a page via API

```bash
curl -s -X POST http://localhost:3000/api/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "About",
    "slug": "about",
    "content": "[{\"type\":\"paragraph\",\"text\":\"About me.\"}]",
    "excerpt": "About this site"
  }'
```

### Create taxonomy via API

```bash
curl -s -X POST http://localhost:3000/api/taxonomies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "JavaScript", "type": "tag"}'
```

### Upload an image

```bash
curl -s -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Returns: `{ "url": "/assets/images/1234567890-abc123.jpg", "filename": "..." }`

## Database operations

The database lives in `db/` as JSON files. It is committed to the repo.

### Seed realistic data

```bash
# Removes existing db/ and creates demo content
node scripts/seed-real.js
```

### Inspect current state

```bash
# List all posts
node -e "const {listPosts}=require('./src/models/post'); console.log(listPosts())"

# List all pages
node -e "const {listPages}=require('./src/models/page'); console.log(listPages())"

# List all users
node -e "const {listUsers}=require('./src/models/user'); console.log(listUsers().map(u=>({username:u.username,role:u.role})))"

# Find a post by slug
node -e "const {findPostBySlug}=require('./src/models/post'); console.log(findPostBySlug('my-post-slug'))"
```

**Note**: `JWT_SECRET` must be set when importing `src/models/*` because `auth.js` is loaded transitively.

```bash
# Example with JWT_SECRET
JWT_SECRET=dummy node -e "const {listPosts}=require('./src/models/post'); console.log(listPosts().map(p=>p.title))"
```

### Reset database

```bash
# Remove all db files
rm -rf db/*

# Re-seed
node scripts/seed-real.js
```

## Static site generation (SSG)

### Build

```bash
npm run build
```

Requirements:
- `db/` must exist (run `node scripts/seed-real.js` if missing)
- Output goes to `dist/`

### Preview locally

```bash
npm run serve   # localhost:4000
```

### Build output structure

```
dist/
  index.html               # Homepage (page 1)
  page/2.html              # Page 2+
  posts/                   # Individual post pages
  pages/                   # Static pages (slug.html)
  categories/              # Category listings
  tags/                    # Tag listings
  feed.xml                 # Global RSS
  sitemap.xml              # Sitemap
  api/
    posts.json
    taxonomies.json
    search.json            # Client-side search index
  assets/
    style.css
    app.js
    manifest.json
    service-worker.js
    icons/
    images/                # Uploaded images copied here
```

## Testing

```bash
npm test
```

Runs 24 tests covering: health, auth, posts, pages, taxonomies, users, webhooks, permissions.

## Admin panel

The admin is a zero-build SPA at `public/admin/index.html`.

Access: `http://localhost:3000/admin/`

Features:
- Login with JWT (persisted in localStorage)
- Tabs: Posts / Pages
- Block editor: paragraph, heading, image, code, quote, list, divider
- Image upload via drag & drop
- Taxonomy selection via checkboxes
- Status toggle (draft / published)

## Template editing

Templates use a micro-templating engine with `{{var}}` and `{{#array}}...{{/array}}`.

Key files:
- `templates/layout.html` — Base layout, add meta tags / links here
- `templates/index.html` — Homepage cards
- `templates/post.html` — Single post view
- `templates/page.html` — Static page view
- `templates/taxonomy.html` — Category/tag listing
- `static/assets/style.css` — All styling
- `static/assets/app.js` — Search + theme toggle

### Adding a new template variable

1. Add the variable to the template HTML
2. Pass it in `scripts/build-static.js` when calling `render(template, data)`

## Styling guidelines (from DESIGN.md)

- Background: `#fafafa` (light), `#0f0f1a` (dark)
- Surface: `#ffffff` (light), `#181825` (dark)
- Text: `#1a1a2e` (light), `#e8e8ef` (dark)
- Accent: `#2563eb` (light), `#60a5fa` (dark)
- Border radius: 16px for cards, 10px for buttons, 999px for tags
- Font stack: system fonts (no external font loading)
- Shadows: soft layered shadows (never pure black)

## Deployment

### GitHub Pages (default)

1. Ensure `Settings > Pages > Source` is set to **GitHub Actions**
2. Configure variables in `Settings > Secrets and variables > Actions > Variables`:
   - `SITE_URL`
   - `BASE_PATH`
   - `SITE_OG_IMAGE` (optional)
   - `POSTS_PER_PAGE` (optional)
3. Configure secret:
   - `JWT_SECRET`
4. Push to `master` — workflow auto-deploys

### Other platforms

Cloudflare Pages / Netlify / Vercel:
- Build command: `npm run build`
- Output directory: `dist`

## Webhooks

Webhooks fire automatically when a post becomes `published`.

Create:

```bash
curl -s -X POST http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/hook","events":["post.published"],"secret":"my-secret"}'
```

Payload delivered: `{ event, payload: <post>, timestamp }`

## Common troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ERROR: No se encontro la base de datos en db/` | `db/` missing | Run `node scripts/seed-real.js` |
| `JWT_SECRET no esta configurado` | Missing env var | `export JWT_SECRET=...` |
| `Unique constraint violated: username` | Seed run twice without clearing | `rm -rf db/* && node scripts/seed-real.js` |
| Admin blank / JS error | Corrupted template literals in admin | Check `public/admin/index.html` for escaped backticks (`\``) or `\${` |
| Links broken on GitHub Pages | Missing `BASE_PATH` / `SITE_URL` | Set in GitHub Actions Variables |
| Build takes > 1s | Large db or many images | Normal — check `db/` size |

## Do's and Don'ts for agents

### Do
- Always set `JWT_SECRET` when running Node scripts that import `src/models/*`
- Clear `db/*` before re-seeding to avoid unique constraint errors
- Commit `db/` after content changes so CI builds the updated site
- Use the API for bulk operations, the admin for quick edits
- Test with `npm test` before pushing

### Don't
- Don't edit `db/*.json` files directly unless you understand the index format
- Don't run `npm run seed` in CI (the workflow intentionally skips it)
- Don't use `git checkout -- db/` to reset — use `rm -rf db/* && node scripts/seed-real.js`
- Don't add external font dependencies — the system font stack is intentional
- Don't break the template literal syntax in `public/admin/index.html`
