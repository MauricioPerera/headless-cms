process.env.JWT_SECRET = 'test-secret-for-ci-only';

const app = require('../src/app');
const { createUser, findUserByUsername } = require('../src/models/user');
const { createTaxonomy } = require('../src/models/taxonomy');
const { createPost } = require('../src/models/post');
const { createWebhook, listWebhooks } = require('../src/models/webhook');
const { signToken } = require('../src/core/auth');

let server;
let baseUrl;
let adminToken;
let authorToken;

const results = [];

function ok(name) { results.push({ name, status: 'PASS' }); }
function fail(name, err) { results.push({ name, status: 'FAIL', error: err.message }); console.error(`  FAIL: ${name} => ${err.message}`); }

async function request(method, path, { body, token } = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  const text = await res.text();
  if (text) data = JSON.parse(text);
  return { status: res.status, data };
}

async function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || 'assertion'}: expected ${expected}, got ${actual}`);
}

async function runTests() {
  console.log('Cleaning DB...');
  const fs = require('fs');
  const path = require('path');
  const dbDir = path.resolve(__dirname, '../db');
  if (fs.existsSync(dbDir)) fs.rmSync(dbDir, { recursive: true, force: true });

  console.log('Starting test server...');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Seed users directamente
  const adminUser = await createUser({ username: 'admin2', email: 'admin2@example.com', password: 'admin123', displayName: 'Admin', role: 'admin' });
  adminToken = signToken({ _id: adminUser._id, username: adminUser.username, role: adminUser.role });

  const authorUser = await createUser({ username: 'author2', email: 'author2@example.com', password: 'author123', displayName: 'Author', role: 'author' });
  authorToken = signToken({ _id: authorUser._id, username: authorUser.username, role: authorUser.role });

  console.log('Running tests...\n');

  // Health
  try {
    const { status, data } = await request('GET', '/api/health');
    await assertEqual(status, 200, 'health status');
    await assertEqual(data.status, 'ok', 'health body');
    ok('Health check');
  } catch (e) { fail('Health check', e); }

  // Auth
  try {
    const { status, data } = await request('POST', '/api/auth/register', {
      body: { username: 'testuser', email: 'test@example.com', password: 'secret123', displayName: 'Test' }
    });
    await assertEqual(status, 201, 'register status');
    await assertEqual(data.user.username, 'testuser', 'register username');
    ok('Auth: register');
  } catch (e) { fail('Auth: register', e); }

  try {
    const { status, data } = await request('POST', '/api/auth/login', { body: { username: 'testuser', password: 'secret123' } });
    await assertEqual(status, 200, 'login status');
    await assertEqual(data.user.username, 'testuser', 'login username');
    ok('Auth: login');
  } catch (e) { fail('Auth: login', e); }

  try {
    const { status, data } = await request('POST', '/api/auth/login', { body: { username: 'testuser', password: 'wrong' } });
    await assertEqual(status, 401, 'bad login status');
    ok('Auth: bad login');
  } catch (e) { fail('Auth: bad login', e); }

  try {
    const { status } = await request('POST', '/api/auth/register', { body: { username: 'testuser', email: 'test@example.com', password: 'x' } });
    if (status !== 400 && status !== 409) throw new Error(`expected 400/409, got ${status}`);
    ok('Auth: duplicate registration');
  } catch (e) { fail('Auth: duplicate registration', e); }

  // Posts
  let postId;
  try {
    const { status, data } = await request('POST', '/api/posts', {
      token: adminToken,
      body: { title: 'Hello World', content: JSON.stringify([{ type: 'paragraph', text: 'First' }]), status: 'published', excerpt: 'excerpt' }
    });
    await assertEqual(status, 201, 'create post');
    postId = data._id;
    ok('Posts: create as admin');
  } catch (e) { fail('Posts: create as admin', e); }

  try {
    const { status, data } = await request('GET', '/api/posts?status=published');
    await assertEqual(status, 200, 'list posts');
    if (!Array.isArray(data.posts)) throw new Error('posts is not array');
    if (data.posts.length < 1) throw new Error('posts empty');
    ok('Posts: list published');
  } catch (e) { fail('Posts: list published', e); }

  try {
    const { status, data } = await request('GET', '/api/posts/hello-world');
    await assertEqual(status, 200, 'get by slug');
    await assertEqual(data.title, 'Hello World', 'slug title');
    ok('Posts: get by slug');
  } catch (e) { fail('Posts: get by slug', e); }

  try {
    const { status, data } = await request('GET', `/api/posts/${postId}?withAuthor=1`);
    await assertEqual(status, 200, 'get by id');
    if (!data.author) throw new Error('author missing');
    if (data.author.passwordHash) throw new Error('passwordHash leaked');
    ok('Posts: get by id with author');
  } catch (e) { fail('Posts: get by id with author', e); }

  try {
    const { status, data } = await request('PATCH', `/api/posts/${postId}`, { token: adminToken, body: { title: 'Updated' } });
    await assertEqual(status, 200, 'patch post');
    await assertEqual(data.title, 'Updated', 'updated title');
    ok('Posts: update as author');
  } catch (e) { fail('Posts: update as author', e); }

  try {
    const { status } = await request('POST', '/api/posts', { body: { title: 'Hack' } });
    await assertEqual(status, 401, 'unauth create');
    ok('Posts: reject unauth create');
  } catch (e) { fail('Posts: reject unauth create', e); }

  try {
    const create = await request('POST', '/api/posts', { token: adminToken, body: { title: 'ToDelete', content: '' } });
    const { status } = await request('DELETE', `/api/posts/${create.data._id}`, { token: adminToken });
    await assertEqual(status, 204, 'delete post');
    ok('Posts: delete');
  } catch (e) { fail('Posts: delete', e); }

  // Taxonomies
  let taxId;
  try {
    const { status, data } = await request('POST', '/api/taxonomies', {
      token: adminToken,
      body: { name: 'Software', type: 'category', description: 'Cat' }
    });
    await assertEqual(status, 201, 'create category');
    taxId = data._id;
    ok('Taxonomies: create category');
  } catch (e) { fail('Taxonomies: create category', e); }

  try {
    const { status, data } = await request('POST', '/api/taxonomies', {
      token: adminToken,
      body: { name: 'Node.js', type: 'tag' }
    });
    await assertEqual(status, 201, 'create tag');
    ok('Taxonomies: create tag');
  } catch (e) { fail('Taxonomies: create tag', e); }

  try {
    const { status, data } = await request('GET', '/api/taxonomies?type=category');
    await assertEqual(status, 200, 'list categories');
    if (!data.taxonomies.every(t => t.type === 'category')) throw new Error('mixed types');
    ok('Taxonomies: list categories');
  } catch (e) { fail('Taxonomies: list categories', e); }

  try {
    const { status, data } = await request('GET', '/api/taxonomies/software');
    await assertEqual(status, 200, 'get by slug');
    await assertEqual(data.name, 'Software', 'taxonomy name');
    ok('Taxonomies: get by slug');
  } catch (e) { fail('Taxonomies: get by slug', e); }

  try {
    const { status, data } = await request('PATCH', `/api/taxonomies/${taxId}`, { token: adminToken, body: { description: 'Updated' } });
    await assertEqual(status, 200, 'patch taxonomy');
    await assertEqual(data.description, 'Updated', 'updated desc');
    ok('Taxonomies: update');
  } catch (e) { fail('Taxonomies: update', e); }

  // Users
  try {
    const { status, data } = await request('GET', '/api/users', { token: adminToken });
    await assertEqual(status, 200, 'list users');
    if (!Array.isArray(data.users)) throw new Error('users not array');
    if (data.users.some(u => u.passwordHash)) throw new Error('passwordHash leaked');
    ok('Users: list as admin');
  } catch (e) { fail('Users: list as admin', e); }

  try {
    const { status } = await request('GET', '/api/users', { token: authorToken });
    await assertEqual(status, 403, 'list as author');
    ok('Users: reject author list');
  } catch (e) { fail('Users: reject author list', e); }

  try {
    const { status, data } = await request('GET', '/api/users/me', { token: adminToken });
    await assertEqual(status, 200, 'me status');
    await assertEqual(data.username, 'admin2', 'me username');
    if (data.passwordHash) throw new Error('passwordHash leaked in me');
    ok('Users: get me');
  } catch (e) { fail('Users: get me', e); }

  // Webhooks
  try {
    const { status, data } = await request('POST', '/api/webhooks', {
      token: adminToken,
      body: { url: 'https://httpbin.org/post', events: ['post.published'], secret: 'shh' }
    });
    await assertEqual(status, 201, 'create webhook');
    ok('Webhooks: create as admin');
  } catch (e) { fail('Webhooks: create as admin', e); }

  try {
    const { status, data } = await request('GET', '/api/webhooks', { token: adminToken });
    await assertEqual(status, 200, 'list webhooks');
    if (!Array.isArray(data.webhooks)) throw new Error('webhooks not array');
    if (data.webhooks.length < 1) throw new Error('webhooks empty');
    ok('Webhooks: list as admin');
  } catch (e) { fail('Webhooks: list as admin', e); }

  try {
    const { status } = await request('GET', '/api/webhooks', { token: authorToken });
    await assertEqual(status, 403, 'list as author');
    ok('Webhooks: reject author');
  } catch (e) { fail('Webhooks: reject author', e); }

  try {
    const whs = listWebhooks();
    const { status } = await request('DELETE', `/api/webhooks/${whs[0]._id}`, { token: adminToken });
    await assertEqual(status, 204, 'delete webhook');
    ok('Webhooks: delete');
  } catch (e) { fail('Webhooks: delete', e); }

  // Search (TF-IDF)
  // Seed a published post with identifiable content
  let searchPostId;
  try {
    const { status, data } = await request('POST', '/api/posts', {
      token: adminToken,
      body: {
        title: 'Introduccion a Cloudflare Workers',
        content: JSON.stringify([{ type: 'paragraph', text: 'Cloudflare Workers ejecuta JavaScript en el edge de la red.' }]),
        excerpt: 'Aprende sobre Cloudflare Workers y edge computing.',
        status: 'published',
        locale: 'es',
      },
    });
    await assertEqual(status, 201, 'search seed post');
    searchPostId = data._id;
    ok('Search: seed post for testing');
  } catch (e) { fail('Search: seed post for testing', e); }

  try {
    const { status, data } = await request('GET', '/api/search?q=cloudflare');
    await assertEqual(status, 200, 'search status');
    if (typeof data.results === 'undefined') throw new Error('results missing');
    if (typeof data.total !== 'number') throw new Error('total missing');
    if (data.total < 1) throw new Error('expected at least 1 result for "cloudflare"');
    if (!data.results[0].title) throw new Error('result missing title');
    ok('Search: returns results for known term');
  } catch (e) { fail('Search: returns results for known term', e); }

  try {
    const { status, data } = await request('GET', '/api/search?q=xyzzyquux999');
    await assertEqual(status, 200, 'search no-match status');
    await assertEqual(data.total, 0, 'no results for unknown term');
    ok('Search: returns empty for unknown term');
  } catch (e) { fail('Search: returns empty for unknown term', e); }

  try {
    const { status, data } = await request('GET', '/api/search?q=');
    await assertEqual(status, 200, 'search empty query');
    if (typeof data.results === 'undefined') throw new Error('results missing');
    ok('Search: handles empty query');
  } catch (e) { fail('Search: handles empty query', e); }

  // Search index invalidation
  try {
    // Update the post title to something new
    await request('PATCH', `/api/posts/${searchPostId}`, {
      token: adminToken,
      body: { title: 'Edge Computing con Vercel' },
    });
    // Search for new term — index must have been invalidated
    const { data } = await request('GET', '/api/search?q=vercel');
    if (data.total < 1) throw new Error('index not invalidated after update');
    ok('Search: index invalidated after PATCH');
  } catch (e) { fail('Search: index invalidated after PATCH', e); }

  try {
    // Delete the search post and verify index updates
    await request('DELETE', `/api/posts/${searchPostId}`, { token: adminToken });
    const { data } = await request('GET', '/api/search?q=vercel');
    if (data.total > 0) throw new Error('deleted post still appears in search');
    ok('Search: index invalidated after DELETE');
  } catch (e) { fail('Search: index invalidated after DELETE', e); }

  // Locale filtering
  let enPostId;
  try {
    const { status, data } = await request('POST', '/api/posts', {
      token: adminToken,
      body: { title: 'English Post', content: JSON.stringify([]), status: 'published', locale: 'en' },
    });
    await assertEqual(status, 201, 'en post create');
    enPostId = data._id;
    ok('Locale: create post with locale=en');
  } catch (e) { fail('Locale: create post with locale=en', e); }

  try {
    const { status, data } = await request('GET', '/api/posts?locale=en');
    await assertEqual(status, 200, 'locale filter status');
    if (!Array.isArray(data.posts)) throw new Error('posts not array');
    if (!data.posts.every(p => p.locale === 'en')) throw new Error('non-en posts returned');
    if (data.posts.length < 1) throw new Error('no en posts returned');
    ok('Locale: ?locale=en filters correctly');
  } catch (e) { fail('Locale: ?locale=en filters correctly', e); }

  try {
    const { status, data } = await request('GET', '/api/posts?locale=es');
    await assertEqual(status, 200, 'locale es status');
    if (!Array.isArray(data.posts)) throw new Error('posts not array');
    if (data.posts.some(p => p.locale === 'en')) throw new Error('en post leaked into es results');
    ok('Locale: ?locale=es excludes en posts');
  } catch (e) { fail('Locale: ?locale=es excludes en posts', e); }

  // Report
  console.log('\n--- RESULTS ---');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  results.forEach(r => console.log(`[${r.status}] ${r.name}`));
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  await new Promise((resolve) => server.close(resolve));
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
