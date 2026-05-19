/**
 * Migrate from Sanity to Headless CMS
 * Usage: node scripts/migrate-from-sanity.js <export.json>
 *
 * Sanity export format:
 * {
 *   "documents": [
 *     {
 *       "_type": "post",
 *       "_id": "...",
 *       "title": "...",
 *       "slug": { "current": "..." },
 *       "body": [Portable Text blocks],
 *       "excerpt": "...",
 *       "publishedAt": "2024-01-01T00:00:00Z",
 *       "mainImage": { "asset": { "url": "..." }, "alt": "..." },
 *       "categories": [{"_ref": "..."}],
 *       "tags": [{"_ref": "..."}],
 *       "author": { "_ref": "..." }
 *     }
 *   ]
 * }
 */
const fs = require('fs');
const path = require('path');
const { createPost } = require('../src/models/post');
const { createTaxonomy } = require('../src/models/taxonomy');
const { createUser } = require('../src/models/user');
const { flushAll } = require('../src/core/store');
const { portableTextToBlocks } = require('./portable-text-converter');

const exportFile = process.argv[2];
if (!exportFile) {
  console.error('Usage: node scripts/migrate-from-sanity.js <export.json>');
  process.exit(1);
}

if (!fs.existsSync(exportFile)) {
  console.error('File not found:', exportFile);
  process.exit(1);
}

function estimateReadTime(blocks) {
  const words = blocks.reduce((sum, b) => {
    const text = [b.text, ...(b.items || [])].filter(Boolean).join(' ');
    return sum + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.ceil(words / 200));
}

async function main() {
  const raw = fs.readFileSync(exportFile, 'utf8');
  const data = JSON.parse(raw);
  const docs = Array.isArray(data) ? data : (data.documents || []);

  console.log(`Loaded ${docs.length} documents from ${path.basename(exportFile)}\n`);

  // Step 1: Migrate authors → users
  console.log('--- Authors ---');
  const authors = docs.filter(d => d._type === 'author');
  const userMap = new Map(); // Sanity _id → cms _id
  for (const author of authors) {
    try {
      const user = await createUser({
        username: (author.slug?.current || author._id).replace(/[^a-z0-9_-]/gi, '-').slice(0, 32),
        email: author.email || `${author._id}@sanity.local`,
        password: 'change-me-' + Math.random().toString(36).slice(2, 10),
        displayName: author.name || 'Unknown',
        avatar: author.image?.asset?.url || null,
        bio: author.bio || '',
        role: 'editor',
      });
      userMap.set(author._id, user._id);
      console.log('  ✓ Author:', author.name || author._id);
    } catch (e) {
      console.warn('  ✗ Skipped author (duplicate?):', author._id, '—', e.message);
    }
  }

  // Step 2: Migrate categories → taxonomies
  console.log('\n--- Categories ---');
  const categories = docs.filter(d => d._type === 'category');
  const catMap = new Map();
  for (const cat of categories) {
    try {
      const tax = await createTaxonomy({
        name: cat.title,
        slug: cat.slug?.current || cat._id,
        type: 'category',
        description: cat.description || '',
      });
      catMap.set(cat._id, tax._id);
      console.log('  ✓ Category:', cat.title);
    } catch (e) {
      console.warn('  ✗ Skipped category:', cat._id, '—', e.message);
    }
  }

  // Step 3: Migrate tags → taxonomies
  console.log('\n--- Tags ---');
  const tags = docs.filter(d => d._type === 'tag');
  const tagMap = new Map();
  for (const tag of tags) {
    try {
      const tax = await createTaxonomy({
        name: tag.title || tag.name,
        slug: tag.slug?.current || tag._id,
        type: 'tag',
      });
      tagMap.set(tag._id, tax._id);
      console.log('  ✓ Tag:', tag.title || tag.name);
    } catch (e) {
      console.warn('  ✗ Skipped tag:', tag._id, '—', e.message);
    }
  }

  // Step 4: Migrate posts
  console.log('\n--- Posts ---');
  const posts = docs.filter(d => d._type === 'post');
  let migrated = 0;
  let skipped = 0;

  for (const post of posts) {
    try {
      const slug = post.slug?.current || post._id;
      const body = portableTextToBlocks(post.body || []);

      const taxonomyIds = [];
      (post.categories || []).forEach(c => {
        const id = catMap.get(c._ref || c._id);
        if (id) taxonomyIds.push(id);
      });
      (post.tags || []).forEach(t => {
        const id = tagMap.get(t._ref || t._id);
        if (id) taxonomyIds.push(id);
      });

      const authorId = post.author?._ref
        ? (userMap.get(post.author._ref) || null)
        : null;

      const featuredImage = post.mainImage?.asset?.url || post.mainImage?.src || null;

      await createPost({
        title: post.title,
        slug,
        content: JSON.stringify(body),
        excerpt: post.excerpt || '',
        status: 'published',
        authorId,
        taxonomyIds,
        featuredImage,
        locale: post.language || post.locale || 'es',
        publishedAt: post.publishedAt,
        meta: { readTime: estimateReadTime(body) },
      });
      migrated++;
      console.log('  ✓ Post:', post.title, `(${body.length} bloques, ~${estimateReadTime(body)} min)`);
    } catch (e) {
      skipped++;
      console.warn('  ✗ Skipped post:', post.title || post._id, '—', e.message);
    }
  }

  flushAll();

  console.log('\n=============================');
  console.log(`Authors:    ${userMap.size} migrados`);
  console.log(`Categories: ${catMap.size} migradas`);
  console.log(`Tags:       ${tagMap.size} migrados`);
  console.log(`Posts:      ${migrated} migrados, ${skipped} saltados`);
  console.log('=============================');
  console.log('\nSiguiente paso:');
  console.log('  npm run build && npm run deploy:cloudflare');
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
