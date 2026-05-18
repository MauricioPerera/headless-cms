const fs = require('fs');
const path = require('path');

const CONFIG = {
  siteName: process.env.SITE_NAME || 'Mi Blog Headless',
  siteDescription: process.env.SITE_DESCRIPTION || 'Blog generado con Headless CMS',
  siteUrl: (process.env.SITE_URL || '').replace(/\/$/, '') + '/',
  siteOgImage: process.env.SITE_OG_IMAGE || '',
  postsPerPage: parseInt(process.env.POSTS_PER_PAGE, 10) || 5,
  basePath: process.env.BASE_PATH || '/',
};

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'db');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const STATIC_DIR = path.join(ROOT, 'static');
const DIST_DIR = path.join(ROOT, 'dist');

const { DocStore, FileStorageAdapter } = require('../lib/js-doc-store');
const store = new DocStore(new FileStorageAdapter(DB_DIR));

const postsCol = store.collection('posts');
const usersCol = store.collection('users');
const taxCol = store.collection('taxonomies');
const pagesCol = store.collection('pages');

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function rssDate(iso) {
  if (!iso) return '';
  return new Date(iso).toUTCString();
}

function buildDate() { return new Date().toUTCString(); }

function render(template, data) {
  let result = template;
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, inner) => {
    const val = data[key];
    if (!val) return '';
    if (Array.isArray(val)) {
      return val.length ? val.map(item => render(inner, { ...data, ...item })).join('') : '';
    }
    return render(inner, { ...data, ...val });
  });
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
  return result;
}

function loadTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf8');
}

function writeFile(dest, content) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function cleanDist() {
  if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function copyStatic() {
  if (!fs.existsSync(STATIC_DIR)) return;
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) copyRecursive(srcPath, destPath);
      else fs.copyFileSync(srcPath, destPath);
    }
  };
  copyRecursive(STATIC_DIR, DIST_DIR);
}

// Valida que una URL de embed sea segura (solo http/https)
function isSafeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function renderContent(contentJson) {
  try {
    const blocks = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
    if (!Array.isArray(blocks)) return escapeHtml(String(blocks));
    return blocks.map(block => {
      switch (block.type) {
        case 'paragraph': return `\u003cp\u003e${escapeHtml(block.text || '')}\u003c/p\u003e`;
        case 'heading': return `\u003ch2\u003e${escapeHtml(block.text || '')}\u003c/h2\u003e`;
        case 'heading3': return `\u003ch3\u003e${escapeHtml(block.text || '')}\u003c/h3\u003e`;
        case 'quote': return `\u003cblockquote\u003e\u003cp\u003e${escapeHtml(block.text || '')}\u003c/p\u003e\u003c/blockquote\u003e`;
        case 'code': return `\u003cpre\u003e\u003ccode\u003e${escapeHtml(block.text || '')}\u003c/code\u003e\u003c/pre\u003e`;
        case 'image': return `\u003cimg src="${escapeHtml(block.src || '')}" alt="${escapeHtml(block.alt || '')}"\u003e`;
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul';
          const items = (block.items || []).map(i => `\u003cli\u003e${escapeHtml(i)}\u003c/li\u003e`).join('');
          return `\u003c${tag}\u003e${items}\u003c/${tag}\u003e`;
        }
        case 'callout': {
          const title = block.title ? `\u003cdiv class="callout-title"\u003e${escapeHtml(block.title)}\u003c/div\u003e` : '';
          return `\u003cdiv class="callout"\u003e${title}\u003cp\u003e${escapeHtml(block.text || '')}\u003c/p\u003e\u003c/div\u003e`;
        }
        case 'divider': return '\u003chr class="divider"\u003e';
        case 'table': {
          const headers = (block.headers || []).map(h => `\u003cth\u003e${escapeHtml(h)}\u003c/th\u003e`).join('');
          const rows = (block.rows || []).map(row => {
            const cells = (row || []).map(c => `\u003ctd\u003e${escapeHtml(c)}\u003c/td\u003e`).join('');
            return `\u003ctr\u003e${cells}\u003c/tr\u003e`;
          }).join('');
          return `\u003ctable class="post-table"\u003e\u003cthead\u003e\u003ctr\u003e${headers}\u003c/tr\u003e\u003c/thead\u003e\u003ctbody\u003e${rows}\u003c/tbody\u003e\u003c/table\u003e`;
        }
        case 'embed': {
          if (!isSafeEmbedUrl(block.src)) {
            console.warn(`Embed URL no segura omitida: ${block.src}`);
            return `\u003c!-- embed omitido: URL no segura --\u003e`;
          }
          const src = escapeHtml(block.src);
          return `\u003cdiv class="embed-container"\u003e\u003ciframe src="${src}" allowfullscreen\u003e\u003c/iframe\u003e\u003c/div\u003e`;
        }
        default: return '';
      }
    }).join('\n');
  } catch {
    return escapeHtml(String(contentJson));
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/\u0026/g, '&amp;')
    .replace(/\u003c/g, '&lt;')
    .replace(/\u003e/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureIndexes(collection, indexDefs) {
  for (const def of indexDefs) {
    try {
      collection.createIndex(def.field, def.opts);
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        // ignorar
      } else {
        throw err; // no silenciar errores reales
      }
    }
  }
}

async function build() {
  console.log('Building static site...');

  if (!fs.existsSync(DB_DIR) || fs.readdirSync(DB_DIR).length === 0) {
    console.error('ERROR: No se encontro la base de datos en db/');
    console.error('Ejecuta primero: npm run seed');
    console.error('Luego commitea la carpeta db/ para que el deploy la incluya.');
    process.exit(1);
  }

  cleanDist();
  copyStatic();

  const publishedPosts = postsCol.find({ status: 'published' }).sort('publishedAt', -1).toArray();
  const allUsers = usersCol.find({}).toArray();
  const allTaxonomies = taxCol.find({}).toArray();
  const allPages = pagesCol.find({}).sort('createdAt', -1).toArray();

  const userMap = new Map(allUsers.map(u => [u._id, u]));
  const taxMap = new Map(allTaxonomies.map(t => [t._id, t]));

  const enrichedPosts = publishedPosts.map(post => {
    const author = userMap.get(post.authorId);
    const taxonomies = (post.taxonomyIds || []).map(id => taxMap.get(id)).filter(Boolean);
    const categories = taxonomies.filter(t => t.type === 'category');
    const tags = taxonomies.filter(t => t.type === 'tag');
    return {
      ...post,
      publishedDate: fmtDate(post.publishedAt || post.createdAt),
      rssDate: rssDate(post.publishedAt || post.createdAt),
      updatedAt: (post.updatedAt || post.createdAt).split('T')[0],
      content: renderContent(post.content),
      excerpt: escapeHtml(post.excerpt || ''),
      readTime: (post.meta && post.meta.readTime) ? post.meta.readTime : 5,
      featuredImage: post.featuredImage ? (typeof post.featuredImage === "string" ? { src: post.featuredImage, alt: post.title } : { src: post.featuredImage.src, alt: post.featuredImage.alt || post.title, caption: post.featuredImage.caption || "" }) : null,
      author: author ? { displayName: author.displayName || author.username } : null,
      categories: categories.map(t => ({ ...t, basePath: CONFIG.basePath })),
      tags: tags.map(t => ({ ...t, basePath: CONFIG.basePath })),
    };
  });

  const layoutTpl = loadTemplate('layout.html');
  const pageTpl = loadTemplate('page.html');
  const postTpl = loadTemplate('post.html');
  const indexTpl = loadTemplate('index.html');
  const taxonomyTpl = loadTemplate('taxonomy.html');
  const rssTpl = loadTemplate('rss.xml');
  const sitemapTpl = loadTemplate('sitemap.xml');

  // Posts
  for (const post of enrichedPosts) {
    const postHtml = render(postTpl, { ...post, basePath: CONFIG.basePath });
    const canonicalUrl = CONFIG.siteUrl + 'posts/' + post.slug + '.html';
    const ogImage = post.featuredImage ? post.featuredImage.src : CONFIG.siteOgImage;
    const fullHtml = render(layoutTpl, {
      title: post.title,
      description: post.excerpt,
      siteName: CONFIG.siteName,
      basePath: CONFIG.basePath,
      content: postHtml,
      pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
      canonicalUrl,
      ogTitle: post.title,
      ogDescription: post.excerpt,
      ogImage: ogImage || canonicalUrl,
      ogType: 'article',
    });
    writeFile(path.join(DIST_DIR, 'posts', `${post.slug}.html`), fullHtml);
  }
  console.log(`  Generated ${enrichedPosts.length} post pages`);

  // Index con paginacion
  const perPage = CONFIG.postsPerPage;
  const totalPages = Math.ceil(enrichedPosts.length / perPage) || 1;
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * perPage;
    const pagePosts = enrichedPosts.slice(start, start + perPage);
    const prevPage = page > 1 ? (page === 2 ? CONFIG.basePath : CONFIG.basePath + 'page/' + (page - 1) + '.html') : null;
    const nextPage = page < totalPages ? CONFIG.basePath + 'page/' + (page + 1) + '.html' : null;
    const pageHtml = render(indexTpl, {
      siteName: CONFIG.siteName,
      siteDescription: CONFIG.siteDescription,
      basePath: CONFIG.basePath,
      posts: pagePosts,
      currentPage: page,
      totalPages,
      prevPage,
      nextPage,
    });
    const pageFull = render(layoutTpl, {
      title: page === 1 ? 'Inicio' : `Pagina ${page}`,
      description: CONFIG.siteDescription,
      siteName: CONFIG.siteName,
      basePath: CONFIG.basePath,
      content: pageHtml,
      pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
      canonicalUrl: page === 1 ? CONFIG.siteUrl : CONFIG.siteUrl + 'page/' + page + '.html',
      ogTitle: CONFIG.siteName,
      ogDescription: CONFIG.siteDescription,
      ogImage: CONFIG.siteOgImage || CONFIG.siteUrl,
      ogType: 'website',
    });
    if (page === 1) {
      writeFile(path.join(DIST_DIR, 'index.html'), pageFull);
    } else {
      writeFile(path.join(DIST_DIR, 'page', `${page}.html`), pageFull);
    }
  }
  console.log(`  Generated ${totalPages} index pages`);

  // Taxonomias
  const categoryTaxes = allTaxonomies.filter(t => t.type === 'category');
  const tagTaxes = allTaxonomies.filter(t => t.type === 'tag');

  for (const tax of [...categoryTaxes, ...tagTaxes]) {
    const taxPosts = enrichedPosts.filter(p => (p.taxonomyIds || []).includes(tax._id));
    const taxHtml = render(taxonomyTpl, {
      taxonomyName: tax.name,
      taxonomyType: tax.type === 'category' ? 'Categoria' : 'Tag',
      taxonomyDescription: tax.description || '',
      basePath: CONFIG.basePath,
      posts: taxPosts.map(p => ({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        publishedDate: p.publishedDate,
        publishedAt: p.publishedAt,
      })),
    });
    const taxCanonical = CONFIG.siteUrl + (tax.type === 'category' ? 'categories/' : 'tags/') + tax.slug + '.html';
    const taxFull = render(layoutTpl, {
      title: tax.name,
      description: tax.description || `Posts en ${tax.name}`,
      siteName: CONFIG.siteName,
      basePath: CONFIG.basePath,
      content: taxHtml,
      pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
      canonicalUrl: taxCanonical,
      ogTitle: tax.name,
      ogDescription: tax.description || `Posts en ${tax.name}`,
      ogImage: CONFIG.siteOgImage || taxCanonical,
      ogType: 'website',
    });
    const subdir = tax.type === 'category' ? 'categories' : 'tags';
    writeFile(path.join(DIST_DIR, subdir, `${tax.slug}.html`), taxFull);
  }
  console.log(`  Generated ${categoryTaxes.length} category + ${tagTaxes.length} tag pages`);

  // Taxonomy index pages
  const catsListHtml = `
    \u003csection\u003e\u003ch1\u003eCategorias\u003c/h1\u003e\u003cdiv class="post-list"\u003e
      ${categoryTaxes.map(t => `\u003ca class="tag category" href="${CONFIG.basePath}categories/${t.slug}.html"\u003e${escapeHtml(t.name)}\u003c/a\u003e`).join(' ')}
    \u003c/div\u003e\u003c/section\u003e`;
  writeFile(path.join(DIST_DIR, 'categories', 'index.html'), render(layoutTpl, {
    title: 'Categorias', description: 'Todas las categorias', siteName: CONFIG.siteName, basePath: CONFIG.basePath, content: catsListHtml,
    pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
    canonicalUrl: CONFIG.siteUrl + 'categories/',
    ogTitle: 'Categorias',
    ogDescription: 'Todas las categorias',
    ogImage: CONFIG.siteOgImage || CONFIG.siteUrl,
    ogType: 'website',
  }));

  const tagsListHtml = `
    \u003csection\u003e\u003ch1\u003eTags\u003c/h1\u003e\u003cdiv class="post-list"\u003e
      ${tagTaxes.map(t => `\u003ca class="tag" href="${CONFIG.basePath}tags/${t.slug}.html"\u003e${escapeHtml(t.name)}\u003c/a\u003e`).join(' ')}
    \u003c/div\u003e\u003c/section\u003e`;
  writeFile(path.join(DIST_DIR, 'tags', 'index.html'), render(layoutTpl, {
    title: 'Tags', description: 'Todos los tags', siteName: CONFIG.siteName, basePath: CONFIG.basePath, content: tagsListHtml,
    pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
    canonicalUrl: CONFIG.siteUrl + 'tags/',
    ogTitle: 'Tags',
    ogDescription: 'Todos los tags',
    ogImage: CONFIG.siteOgImage || CONFIG.siteUrl,
    ogType: 'website',
  }));
  console.log('  Generated taxonomy index pages');
  // Pages
  for (const page of allPages) {
    const pageHtml = render(pageTpl, { ...page, basePath: CONFIG.basePath, content: renderContent(page.content) });
    const pageCanonical = CONFIG.siteUrl + page.slug + '.html';
    const fullHtml = render(layoutTpl, {
      title: page.title,
      description: page.excerpt || page.title,
      siteName: CONFIG.siteName,
      basePath: CONFIG.basePath,
      content: pageHtml,
      pages: allPages.map(p => ({ title: p.title, slug: p.slug, basePath: CONFIG.basePath })),
      canonicalUrl: pageCanonical,
      ogTitle: page.title,
      ogDescription: page.excerpt || page.title,
      ogImage: CONFIG.siteOgImage || pageCanonical,
      ogType: 'website',
    });
    writeFile(path.join(DIST_DIR, `${page.slug}.html`), fullHtml);
  }
  console.log(`  Generated ${allPages.length} page pages`);

  // RSS global
  const rssXml = render(rssTpl, {
    siteName: CONFIG.siteName,
    siteUrl: CONFIG.siteUrl,
    basePath: CONFIG.basePath,
    siteDescription: CONFIG.siteDescription,
    buildDate: buildDate(),
    posts: enrichedPosts.slice(0, 20).map(p => ({
      title: escapeHtml(p.title),
      slug: p.slug,
      excerpt: escapeHtml(p.excerpt),
      rssDate: p.rssDate,
      basePath: CONFIG.basePath,
    })),
  });
  writeFile(path.join(DIST_DIR, 'feed.xml'), rssXml);
  console.log('  Generated feed.xml');

  // RSS por taxonomia
  for (const tax of [...categoryTaxes, ...tagTaxes]) {
    const taxPosts = enrichedPosts.filter(p => (p.taxonomyIds || []).includes(tax._id));
    if (!taxPosts.length) continue;
    const subdir = tax.type === 'category' ? 'categories' : 'tags';
    const taxRss = render(rssTpl, {
      siteName: `${CONFIG.siteName} \u2014 ${tax.name}`,
      siteUrl: `${CONFIG.basePath}${subdir}/${tax.slug}.html`,
      basePath: CONFIG.basePath,
      siteDescription: `Posts en ${tax.name}`,
      buildDate: buildDate(),
      posts: taxPosts.slice(0, 20).map(p => ({
        title: escapeHtml(p.title),
        slug: p.slug,
        excerpt: escapeHtml(p.excerpt),
        rssDate: p.rssDate,
        basePath: CONFIG.basePath,
      })),
    });
    writeFile(path.join(DIST_DIR, subdir, `${tax.slug}.xml`), taxRss);
  }
  console.log('  Generated per-taxonomy RSS feeds');

  // Sitemap
  const sitemapXml = render(sitemapTpl, {
    siteUrl: CONFIG.siteUrl,
    buildDate: new Date().toISOString().split('T')[0],
    posts: enrichedPosts.map(p => ({ slug: p.slug, updatedAt: p.updatedAt })),
    taxonomies: allTaxonomies.map(t => ({
      type: t.type === 'category' ? 'categorie' : 'tag',
      slug: t.slug,
    })),
  });
  writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
  console.log('  Generated sitemap.xml');

  // JSON API
  fs.mkdirSync(path.join(DIST_DIR, 'api'), { recursive: true });
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'posts.json'), JSON.stringify({
    posts: enrichedPosts.map(p => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      author: p.author,
      categories: p.categories,
      tags: p.tags,
      meta: p.meta,
    })),
    total: enrichedPosts.length,
  }, null, 2));

  fs.writeFileSync(path.join(DIST_DIR, 'api', 'taxonomies.json'), JSON.stringify({
    taxonomies: allTaxonomies,
    total: allTaxonomies.length,
  }, null, 2));

  const searchIndex = enrichedPosts.map(p => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `${CONFIG.basePath}posts/${p.slug}.html`,
    tags: p.tags.map(t => t.name).join(' '),
  }));
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'search.json'), JSON.stringify(searchIndex, null, 2));
  console.log('  Generated JSON API + search index');

  console.log(`\nDone. Output: ${DIST_DIR}`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});


