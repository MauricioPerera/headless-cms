# API Endpoints Reference

Base URL: `http://localhost:3000/api`

## Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` | `{username, email, password, displayName?, role?}` | `{token, user}` |
| POST | `/auth/login` | `{username, password}` | `{token, user}` |

## Posts

| Method | Endpoint | Auth | Query params |
|--------|----------|------|--------------|
| GET | `/posts` | No | `status, authorId, taxonomyId, q, limit, skip, sort, withAuthor, withTaxonomies` |
| GET | `/posts/:idOrSlug` | No | `withAuthor, withTaxonomies` |
| POST | `/posts` | Yes (editor+) | -- |
| PATCH | `/posts/:id` | Yes (editor+) | -- |
| DELETE | `/posts/:id` | Yes (admin) | -- |

Post body fields: `title, content, excerpt, status, taxonomyIds, featuredImage, meta, slug`

## Pages

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/pages` | No |
| GET | `/pages/:idOrSlug` | No |
| POST | `/pages` | Yes (editor+) |
| PATCH | `/pages/:id` | Yes (editor+) |
| DELETE | `/pages/:id` | Yes (admin) |

Page body fields: `title, content, excerpt, slug`

## Taxonomies

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/taxonomies` | No |
| GET | `/taxonomies/:idOrSlug` | No |
| POST | `/taxonomies` | Yes (editor+) |
| PATCH | `/taxonomies/:id` | Yes (editor+) |
| DELETE | `/taxonomies/:id` | Yes (admin) |

## Users

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/users` | Yes (admin) | List all users |
| GET | `/users/me` | Yes | Current user profile |

## Webhooks

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/webhooks` | Yes (admin) |
| POST | `/webhooks` | Yes (admin) |
| DELETE | `/webhooks/:id` | Yes (admin) |

## Upload

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/upload` | Yes | `multipart/form-data` with field `image` |

## Health

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{status: "ok", timestamp}` |
