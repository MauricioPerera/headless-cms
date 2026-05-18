/**
 * Cloudflare Pages Functions — advanced mode worker
 * Serves static assets + JSON API from KV-backed data
 * Search uses TF-IDF cosine similarity (ported from src/core/search.js)
 */

// ---------- TF-IDF (ported from src/core/search.js) ----------

const STOP_WORDS = new Set([
  'el','la','de','que','y','en','un','ser','se','no','haber','por','con','su','para','como',
  'estar','tener','lo','le','todo','pero','mas','hacer','o','poder','decir','este','ir','otro',
  'ese','si','me','ya','ver','porque','dar','cuando','el','muy','sin','vez','mucho','saber',
  'que','sobre','mi','alguno','mismo','yo','tambien','hasta','a','e','i','u',
]);

function removeAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function tokenize(text) {
  if (!text) return [];
  const normalized = removeAccents(text).toLowerCase();
  return normalized.split(/[^a-z0-9ñ]+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function getPostText(post) {
  const parts = [post.title || '', post.excerpt || ''];
  if (post.content) {
    try {
      const blocks = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          if (b && b.text) parts.push(b.text);
          if (b && b.alt) parts.push(b.alt);
        }
      }
    } catch {}
  }
  return parts.join(' ');
}

function tfidfSearch(posts, query, limit = 10) {
  if (!query || !query.trim()) return { results: [], total: 0 };

  const qTokens = tokenize(query);
  if (!qTokens.length) return { results: [], total: 0 };

  // Build per-doc token frequencies
  const docs = [];
  const docTokens = [];
  for (const post of posts) {
    if (post.status !== 'published') continue;
    const tokens = tokenize(getPostText(post));
    docs.push({ _id: post._id, slug: post.slug, title: post.title, excerpt: post.excerpt });
    docTokens.push(tokens);
  }

  const N = docs.length;
  if (!N) return { results: [], total: 0 };

  // IDF: how rare is each term across docs
  const df = {};
  for (const tokens of docTokens) {
    const seen = new Set(tokens);
    for (const t of seen) df[t] = (df[t] || 0) + 1;
  }
  const idf = (term) => Math.log((N + 1) / ((df[term] || 0) + 1)) + 1;

  // TF-IDF vectors and cosine similarity with query
  const qTf = {};
  for (const t of qTokens) qTf[t] = (qTf[t] || 0) + 1;

  const qMag = Math.sqrt(
    Object.entries(qTf).reduce((sum, [t, c]) => {
      const v = (1 + Math.log(c)) * idf(t);
      return sum + v * v;
    }, 0)
  ) || 1;

  const scored = [];
  for (let d = 0; d < docs.length; d++) {
    const tokens = docTokens[d];
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;

    let dot = 0;
    let mag = 0;
    for (const [t, c] of Object.entries(tf)) {
      const v = (1 + Math.log(c)) * idf(t);
      mag += v * v;
      if (qTf[t]) dot += v * (1 + Math.log(qTf[t])) * idf(t);
    }

    const score = dot / (qMag * (Math.sqrt(mag) || 1));
    if (score > 0) scored.push({ ...docs[d], score });
  }

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit);
  return { results, total: scored.length };
}

// ---------- Worker ----------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { CMS_DB } = env;

    // Static assets (HTML, CSS, JS, images)
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', mode: 'kv' }), { headers });
    }

    if (url.pathname === '/api/posts') {
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      const published = posts.filter(p => p.status === 'published');
      return new Response(JSON.stringify({ posts: published, total: published.length }), { headers });
    }

    if (url.pathname.startsWith('/api/posts/')) {
      const slug = url.pathname.replace('/api/posts/', '').replace(/\.json$/, '');
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      const post = posts.find(p => p.slug === slug && p.status === 'published');
      if (!post) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(post), { headers });
    }

    if (url.pathname === '/api/taxonomies') {
      const tax = await CMS_DB.get('db:taxonomies.docs.json', 'json') || [];
      return new Response(JSON.stringify(tax), { headers });
    }

    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      const { results, total } = tfidfSearch(posts, q, limit);
      return new Response(JSON.stringify({ query: q, results, total }), { headers });
    }

    return new Response('Not found', { status: 404 });
  },
};
