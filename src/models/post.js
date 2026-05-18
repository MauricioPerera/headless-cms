const { getCollection } = require('../core/store');
const { globalHooks } = require('../core/hooks');
const { findUserById } = require('./user');
const { findTaxonomyById } = require('./taxonomy');

const COLLECTION = 'posts';

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function getPostCollection() {
  const col = getCollection(COLLECTION);
  for (const def of [
    { field: 'slug', opts: { type: 'hash', unique: true } },
    { field: 'status', opts: { type: 'hash' } },
    { field: 'authorId', opts: { type: 'hash' } },
    { field: 'taxonomyIds', opts: { type: 'hash' } },
    { field: 'createdAt', opts: { type: 'sorted' } },
    { field: 'locale', opts: { type: 'hash' } },
  ]) {
    try {
      col.createIndex(def.field, def.opts);
    } catch (err) {
      if (err.message && !err.message.includes('already exists')) throw err;
    }
  }
  return col;
}

// Hooks

globalHooks.on('post.beforeInsert', async (ctx) => {
  const { doc } = ctx;
  if (!doc.title || typeof doc.title !== 'string') throw new Error('title is required');
  if (!doc.content) doc.content = '';

  doc.slug = doc.slug || slugify(doc.title);
  doc.status = doc.status || 'draft';
  const allowedStatus = ['draft', 'published', 'archived'];
  if (!allowedStatus.includes(doc.status)) throw new Error('invalid status');

  if (doc.authorId) {
    const author = findUserById(doc.authorId);
    if (!author) throw new Error('author not found');
  }

  if (doc.taxonomyIds) {
    if (!Array.isArray(doc.taxonomyIds)) doc.taxonomyIds = [doc.taxonomyIds];
    for (const tid of doc.taxonomyIds) {
      if (!findTaxonomyById(tid)) throw new Error(`taxonomy ${tid} not found`);
    }
  } else {
    doc.taxonomyIds = [];
  }

  doc.featuredImage = doc.featuredImage || null;
  doc.locale = doc.locale || 'es';
  
  doc.createdAt = new Date().toISOString();
  doc.updatedAt = doc.createdAt;
  if (doc.status === 'published' && !doc.publishedAt) doc.publishedAt = doc.createdAt;
  return ctx;
});

globalHooks.on('post.beforeUpdate', async (ctx) => {
  const { update } = ctx;
  const $set = update.$set || update;
  if ($set.slug) $set.slug = slugify($set.slug);
  if ($set.status === 'published' && !$set.publishedAt) $set.publishedAt = new Date().toISOString();
  $set.updatedAt = new Date().toISOString();
  return ctx;
});

async function createPost(doc) {
  const col = getPostCollection();
  const ctx = await globalHooks.run('post.beforeInsert', { doc });
  const inserted = col.insert(ctx.doc);
  await globalHooks.run('post.afterInsert', { doc: inserted });
  return inserted;
}

async function updatePost(filter, update) {
  const col = getPostCollection();
  const ctx = await globalHooks.run('post.beforeUpdate', { filter, update });
  const result = col.update(ctx.filter || filter, ctx.update || update);
  if (result > 0) {
    const updated = col.findOne(ctx.filter || filter);
    await globalHooks.run('post.afterUpdate', { filter, update, doc: updated });
  }
  return result;
}

function findPostById(id, { withAuthor = false, withTaxonomies = false } = {}) {
  const post = getPostCollection().findById(id);
  if (!post) return null;
  return resolvePostRelations(post, { withAuthor, withTaxonomies });
}

function findPostBySlug(slug, opts = {}) {
  const post = getPostCollection().findOne({ slug });
  if (!post) return null;
  return resolvePostRelations(post, opts);
}

function listPosts(filter = {}, opts = {}) {
  const col = getPostCollection();
  let cursor = col.find(filter);
  if (opts.limit) cursor = cursor.limit(opts.limit);
  if (opts.skip) cursor = cursor.skip(opts.skip);
  if (opts.sort) {
    const [field, order] = opts.sort.split(':');
    cursor = cursor.sort(field, order === 'asc' ? 1 : -1);
  }
  const posts = cursor.toArray();
  if (opts.withAuthor || opts.withTaxonomies) {
    return posts.map(p => resolvePostRelations(p, opts));
  }
  return posts;
}

function countPosts(filter = {}) {
  return getPostCollection().count(filter);
}

function removePostById(id) {
  return getPostCollection().removeById(id);
}

function resolvePostRelations(post, { withAuthor = false, withTaxonomies = false }) {
  const result = { ...post };
  if (withAuthor && post.authorId) {
    const author = findUserById(post.authorId);
    if (author) {
      const { passwordHash, ...safeAuthor } = author;
      result.author = safeAuthor;
    }
  }
  if (withTaxonomies && post.taxonomyIds && post.taxonomyIds.length) {
    result.taxonomies = post.taxonomyIds.map(id => findTaxonomyById(id)).filter(Boolean);
  }
  return result;
}

module.exports = {
  getPostCollection,
  createPost,
  updatePost,
  findPostById,
  findPostBySlug,
  listPosts,
  countPosts,
  removePostById,
  resolvePostRelations,
};

