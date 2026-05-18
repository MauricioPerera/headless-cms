/**
 * Cloudflare Pages Functions — advanced mode worker
 * Serves static assets + JSON API from KV-backed data
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { CMS_DB } = env;

    // Static assets (HTML, CSS, JS, images)
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    // API routes
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', mode: 'kv' });
    }

    if (url.pathname === '/api/posts') {
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      // Filter published only for public API
      const published = posts.filter(p => p.status === 'published');
      return Response.json({ posts: published, total: published.length });
    }

    if (url.pathname.startsWith('/api/posts/')) {
      const slug = url.pathname.replace('/api/posts/', '').replace('.json', '');
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      const post = posts.find(p => p.slug === slug && p.status === 'published');
      if (!post) return new Response('Not found', { status: 404 });
      return Response.json(post);
    }

    if (url.pathname === '/api/taxonomies') {
      const tax = await CMS_DB.get('db:taxonomies.docs.json', 'json') || [];
      return Response.json(tax);
    }

    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const posts = await CMS_DB.get('db:posts.docs.json', 'json') || [];
      const term = q.toLowerCase();
      const results = posts
        .filter(p => p.status === 'published')
        .filter(p => {
          const text = `${p.title} ${p.excerpt || ''}`.toLowerCase();
          return text.includes(term);
        })
        .slice(0, 10);
      return Response.json({ query: q, results, total: results.length });
    }

    return new Response('Not found', { status: 404 });
  }
};
