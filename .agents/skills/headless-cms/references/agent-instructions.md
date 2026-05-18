# Agent Instructions for Headless CMS

## Goal
Help the user manage their Headless CMS blog: create/edit content, customize the site, fix issues, and deploy updates.

## Context
This is a Node.js CMS with:
- JSON document database (js-doc-store) in `db/`
- REST API at `localhost:3000`
- Static site generator output in `dist/`
- Admin panel at `localhost:3000/admin/`
- GitHub Pages deployment via GitHub Actions

## Default workflow

When the user asks to create or edit content:
1. Check if `db/` exists. If not, run `node scripts/seed-real.js`
2. Check if server is running (`curl http://localhost:3000/api/health`)
3. Use the API with authentication to create/edit content
4. After changes, run `npm run build` to regenerate `dist/`
5. Commit `db/` changes and push to trigger deployment

When the user asks to change the design:
1. Read `DESIGN.md` to understand the design system
2. Edit `static/assets/style.css` for styling
3. Edit `templates/*.html` for layout changes
4. Run `npm run build` to preview
5. Commit and push

When the user asks to fix something:
1. Use `references/project-triage.md` for diagnostics
2. Check `db/` state, API responses, or build output
3. Apply minimal fixes
4. Run `npm test` to verify

## Safety rules
- Always set `JWT_SECRET` before importing `src/models/*` in Node scripts
- Never run `npm run seed` in CI (it would overwrite content)
- Always commit `db/` after content changes
- Never revert `db/` changes unless explicitly asked
- Run `npm test` before pushing structural changes
- Keep edits scoped to the requested feature; avoid unrelated refactors
