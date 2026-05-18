const API = '/api';
let token = localStorage.getItem('cms_token') || '';
let user = JSON.parse(localStorage.getItem('cms_user') || 'null');

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function doLogin() {
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  try {
    const data = await api('POST', '/auth/login', { username, password });
    token = data.token;
    user = data.user;
    localStorage.setItem('cms_token', token);
    localStorage.setItem('cms_user', JSON.stringify(user));
    showDash();
    toast('Sesion iniciada');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function logout() {
  token = '';
  user = null;
  localStorage.removeItem('cms_token');
  localStorage.removeItem('cms_user');
  showLogin();
}

function showLogin() {
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('view-dash').classList.add('hidden');
}

function showDash() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-dash').classList.remove('hidden');
  document.getElementById('user-name').textContent = user?.username || '?';
  switchTab('posts');
  loadPosts();
  loadTaxonomies();
}

function switchTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  ['posts', 'editor', 'tax'].forEach(p => {
    document.getElementById('panel-' + p).classList.add('hidden');
  });
  document.getElementById('panel-' + name).classList.remove('hidden');
}

// Posts
async function loadPosts() {
  try {
    const data = await api('GET', '/posts?limit=50');
    const container = document.getElementById('posts-list');
    container.innerHTML = '';
    (data.posts || []).forEach(post => {
      const div = document.createElement('div');
      div.className = 'post-item';
      div.innerHTML = `
        <div>
          <div class="title">${esc(post.title)}</div>
          <div class="meta">${esc(post.slug)} · <span class="badge ${post.status}">${post.status}</span> · ${fmtDate(post.createdAt)}</div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn small" onclick="editPost('${post._id}')">Editar</button>
          <button class="btn small danger" onclick="deletePost('${post._id}')">Eliminar</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    toast('Error cargando posts: ' + e.message, 'error');
  }
}

function newPost() {
  document.getElementById('post-id').value = '';
  document.getElementById('editor-title').textContent = 'Nuevo post';
  document.getElementById('post-title').value = '';
  document.getElementById('post-slug').value = '';
  document.getElementById('post-status').value = 'draft';
  document.getElementById('post-excerpt').value = '';
  document.getElementById('post-content').value = JSON.stringify([
    { type: 'paragraph', text: '' }
  ], null, 2);
  document.getElementById('post-taxonomies').value = '';
  document.getElementById('post-meta').value = '';
  switchTab('editor');
}

async function editPost(id) {
  try {
    const post = await api('GET', '/posts/' + id);
    document.getElementById('post-id').value = post._id;
    document.getElementById('editor-title').textContent = 'Editar post';
    document.getElementById('post-title').value = post.title || '';
    document.getElementById('post-slug').value = post.slug || '';
    document.getElementById('post-status').value = post.status || 'draft';
    document.getElementById('post-excerpt').value = post.excerpt || '';
    document.getElementById('post-content').value = typeof post.content === 'string'
      ? post.content
      : JSON.stringify(post.content || [], null, 2);
    document.getElementById('post-taxonomies').value = (post.taxonomyIds || []).join(',');
    document.getElementById('post-meta').value = post.meta ? JSON.stringify(post.meta, null, 2) : '';
    switchTab('editor');
  } catch (e) {
    toast('Error cargando post: ' + e.message, 'error');
  }
}

async function savePost() {
  const id = document.getElementById('post-id').value;
  const body = {
    title: document.getElementById('post-title').value,
    slug: document.getElementById('post-slug').value || undefined,
    status: document.getElementById('post-status').value,
    excerpt: document.getElementById('post-excerpt').value,
    content: document.getElementById('post-content').value,
    taxonomyIds: document.getElementById('post-taxonomies').value
      .split(',').map(s => s.trim()).filter(Boolean),
  };
  const metaRaw = document.getElementById('post-meta').value.trim();
  if (metaRaw) {
    try { body.meta = JSON.parse(metaRaw); } catch {
      return toast('Meta JSON invalido', 'error');
    }
  }
  try {
    if (id) {
      await api('PATCH', '/posts/' + id, body);
      toast('Post actualizado');
    } else {
      await api('POST', '/posts', body);
      toast('Post creado');
    }
    switchTab('posts');
    loadPosts();
  } catch (e) {
    toast('Error guardando: ' + e.message, 'error');
  }
}

async function deletePost(id) {
  if (!confirm('Eliminar este post?')) return;
  try {
    await api('DELETE', '/posts/' + id);
    toast('Post eliminado');
    loadPosts();
  } catch (e) {
    toast('Error eliminando: ' + e.message, 'error');
  }
}

function cancelEdit() {
  switchTab('posts');
}

// Taxonomies
async function loadTaxonomies() {
  try {
    const data = await api('GET', '/taxonomies?limit=100');
    const container = document.getElementById('tax-list');
    container.innerHTML = '';
    (data.taxonomies || []).forEach(t => {
      const div = document.createElement('div');
      div.className = 'post-item';
      div.innerHTML = `
        <div>
          <div class="title">${esc(t.name)}</div>
          <div class="meta">${esc(t.slug)} · <span class="badge">${t.type}</span></div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn small danger" onclick="deleteTaxonomy('${t._id}')">Eliminar</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    toast('Error cargando taxonomias: ' + e.message, 'error');
  }
}

function newTaxonomy() {
  const name = prompt('Nombre de la taxonomia:');
  if (!name) return;
  const type = prompt('Tipo (category o tag):', 'category');
  if (!type) return;
  api('POST', '/taxonomies', { name, type })
    .then(() => { toast('Taxonomia creada'); loadTaxonomies(); })
    .catch(e => toast('Error: ' + e.message, 'error'));
}

async function deleteTaxonomy(id) {
  if (!confirm('Eliminar esta taxonomia?')) return;
  try {
    await api('DELETE', '/taxonomies/' + id);
    toast('Taxonomia eliminada');
    loadTaxonomies();
  } catch (e) {
    toast('Error eliminando: ' + e.message, 'error');
  }
}

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX');
}

// Auto-login si hay token
if (token && user) {
  showDash();
} else {
  showLogin();
}
