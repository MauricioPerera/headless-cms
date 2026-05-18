const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');

const app = require('../src/app');

let server;
let baseUrl;
let adminToken;
let authorToken;

before(async () => {
  const fs = require('fs');
  const path = require('path');
  const dbDir = path.resolve(__dirname, '../db');
  if (fs.existsSync(dbDir)) {
    fs.rmSync(dbDir, { recursive: true, force: true });
  }

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  global.request = async (method, path, { body, token } = {}) => {
    const url = `${baseUrl}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    const text = await res.text();
    if (text) data = JSON.parse(text);
    return { status: res.status, data };
  };

  await global.request('POST', '/api/auth/register', {
    body: { username: 'admin2', email: 'admin2@example.com', password: 'admin123', displayName: 'Admin', role: 'admin' }
  });
  const adminLogin = await global.request('POST', '/api/auth/login', {
    body: { username: 'admin2', password: 'admin123' }
  });
  adminToken = adminLogin.data.token;

  await global.request('POST', '/api/auth/register', {
    body: { username: 'author2', email: 'author2@example.com', password: 'author123', displayName: 'Author', role: 'author' }
  });
  const authorLogin = await global.request('POST', '/api/auth/login', {
    body: { username: 'author2', password: 'author123' }
  });
  authorToken = authorLogin.data.token;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Headless CMS Tests', { concurrency: 1 }, () => {
  describe('Health', () => {
    test('GET /api/health devuelve ok', async () => {
      const { status, data } = await global.request('GET', '/api/health');
      assert.strictEqual(status, 200);
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp);
    });
  });

  describe('Auth', () => {
    test('registro de usuario', async () => {
      const { status, data } = await global.request('POST', '/api/auth/register', {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'secret123',
          displayName: 'Test User'
        }
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(data.user.username, 'testuser');
      assert.strictEqual(data.user.email, 'test@example.com');
      assert.ok(!data.user.password);
      assert.ok(!data.user.passwordHash);
    });

    test('login exitoso', async () => {
      const { status, data } = await global.request('POST', '/api/auth/login', {
        body: { username: 'testuser', password: 'secret123' }
      });
      assert.strictEqual(status, 200);
      assert.ok(data.token);
      assert.strictEqual(data.user.username, 'testuser');
    });

    test('login con password incorrecto', async () => {
      const { status, data } = await global.request('POST', '/api/auth/login', {
        body: { username: 'testuser', password: 'wrongpass' }
      });
      assert.strictEqual(status, 401);
      assert.strictEqual(data.error, 'invalid_credentials');
    });

    test('registro duplicado devuelve conflicto', async () => {
      const { status } = await global.request('POST', '/api/auth/register', {
        body: { username: 'testuser', email: 'test@example.com', password: 'x' }
      });
      assert.ok(status === 400 || status === 409, `esperaba 400/409 pero fue ${status}`);
    });
  });

  describe('Posts', () => {
    let postId;

    test('crear post como admin', async () => {
      const { status, data } = await global.request('POST', '/api/posts', {
        token: adminToken,
        body: {
          title: 'Hello World',
          content: JSON.stringify([{ type: 'paragraph', text: 'First post' }]),
          status: 'published',
          excerpt: 'Hello excerpt'
        }
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(data.title, 'Hello World');
      assert.strictEqual(data.status, 'published');
      assert.ok(data.slug);
      assert.ok(data._id);
      postId = data._id;
    });

    test('listar posts publicados', async () => {
      const { status, data } = await global.request('GET', '/api/posts?status=published');
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(data.posts));
      assert.ok(data.posts.length >= 1);
      assert.ok(data.total >= 1);
    });

    test('obtener post por slug', async () => {
      const { status, data } = await global.request('GET', '/api/posts/hello-world');
      assert.strictEqual(status, 200);
      assert.strictEqual(data.title, 'Hello World');
    });

    test('obtener post por id con autor', async () => {
      const { status, data } = await global.request('GET', `/api/posts/${postId}?withAuthor=1`);
      assert.strictEqual(status, 200);
      assert.strictEqual(data.title, 'Hello World');
      assert.ok(data.author);
      assert.strictEqual(data.author.username, 'admin2');
      assert.ok(!data.author.passwordHash);
    });

    test('actualizar post como autor', async () => {
      const { status, data } = await global.request('PATCH', `/api/posts/${postId}`, {
        token: adminToken,
        body: { title: 'Hello World Updated' }
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(data.title, 'Hello World Updated');
    });

    test('no se puede crear post sin auth', async () => {
      const { status } = await global.request('POST', '/api/posts', {
        body: { title: 'Hacked' }
      });
      assert.strictEqual(status, 401);
    });

    test('eliminar post', async () => {
      const create = await global.request('POST', '/api/posts', {
        token: adminToken,
        body: { title: 'To Delete', content: '' }
      });
      const { status } = await global.request('DELETE', `/api/posts/${create.data._id}`, {
        token: adminToken
      });
      assert.strictEqual(status, 204);
    });
  });

  describe('Taxonomias', () => {
    let taxId;

    test('crear categoria', async () => {
      const { status, data } = await global.request('POST', '/api/taxonomies', {
        token: adminToken,
        body: { name: 'Software', type: 'category', description: 'Cat sobre software' }
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(data.name, 'Software');
      assert.strictEqual(data.type, 'category');
      taxId = data._id;
    });

    test('crear tag', async () => {
      const { status, data } = await global.request('POST', '/api/taxonomies', {
        token: adminToken,
        body: { name: 'Node.js', type: 'tag' }
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(data.name, 'Node.js');
    });

    test('listar taxonomias', async () => {
      const { status, data } = await global.request('GET', '/api/taxonomies?type=category');
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(data.taxonomies));
      assert.ok(data.taxonomies.every(t => t.type === 'category'));
    });

    test('obtener taxonomia por slug', async () => {
      const { status, data } = await global.request('GET', '/api/taxonomies/software');
      assert.strictEqual(status, 200);
      assert.strictEqual(data.name, 'Software');
    });

    test('actualizar taxonomia', async () => {
      const { status, data } = await global.request('PATCH', `/api/taxonomies/${taxId}`, {
        token: adminToken,
        body: { description: 'Updated desc' }
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(data.description, 'Updated desc');
    });
  });

  describe('Usuarios', () => {
    test('listar usuarios como admin', async () => {
      const { status, data } = await global.request('GET', '/api/users', { token: adminToken });
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(data.users));
      assert.ok(data.total >= 1);
      assert.ok(data.users.every(u => !u.passwordHash));
    });

    test('no se puede listar usuarios como author', async () => {
      const { status } = await global.request('GET', '/api/users', { token: authorToken });
      assert.strictEqual(status, 403);
    });

    test('obtener perfil propio', async () => {
      const { status, data } = await global.request('GET', '/api/users/me', { token: adminToken });
      assert.strictEqual(status, 200);
      assert.strictEqual(data.username, 'admin2');
      assert.ok(!data.passwordHash);
    });
  });
});
