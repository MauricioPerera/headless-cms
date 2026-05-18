# Project Triage Guide

Quick diagnostics for the Headless CMS.

## 1. Is the server running?

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

## 2. Is the database present?

```bash
ls db/
```

Should contain: `posts.docs.json`, `users.docs.json`, `taxonomies.docs.json`, `pages.docs.json` (if seeded with v2+)

If missing:
```bash
node scripts/seed-real.js
```

## 3. Is JWT configured?

```bash
node -e "require('./src/app')"
```

If it throws `JWT_SECRET no esta configurado`, set it:
```bash
export JWT_SECRET=your-secret-here   # Linux/Mac
$env:JWT_SECRET="your-secret"        # PowerShell
```

## 4. Can I create content?

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"mauricio","password":"admin123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).token))")

# 2. Create post
curl -s -X POST http://localhost:3000/api/posts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"Test","content":"[]","excerpt":"test","status":"draft","taxonomyIds":[]}'
```

## 5. Is the admin panel working?

Open `http://localhost:3000/admin/` in browser.

If blank: check browser console for JS errors. Common issue: escaped backticks (`\``) in `public/admin/index.html`.

Fix:
```bash
python -c "
with open('public/admin/index.html','r') as f: c=f.read()
c=c.replace('\\`','`').replace('\\\${','\${')
with open('public/admin/index.html','w') as f: f.write(c)
"
```

## 6. Does the static build work?

```bash
npm run build
```

If `ERROR: No se encontro la base de datos`: seed first.

If it succeeds, check `dist/index.html` exists.

## 7. Are GitHub Actions deploying?

```bash
gh run list --limit 5
```

Check for failures. Common issues:
- Missing `JWT_SECRET` in GitHub Secrets
- Missing `SITE_URL` / `BASE_PATH` in GitHub Variables
- Workflow file references branch `main` instead of `master` (this repo uses `master`)

## 8. Is the PWA working?

Check in browser DevTools > Application > Service Workers.
Should show `service-worker.js` registered.

Check DevTools > Application > Manifest for `manifest.json` parsed correctly.
