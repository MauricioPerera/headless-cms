const { getCollection } = require('../core/store');
const { globalHooks } = require('../core/hooks');

const COLLECTION = 'pages';

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

function getPageCollection() {
  const col = getCollection(COLLECTION);
  for (const def of [
    { field: 'slug', opts: { type: 'hash', unique: true } },
    { field: 'createdAt', opts: { type: 'sorted' } },
  ]) {
    try {
      col.createIndex(def.field, def.opts);
    } catch (err) {
      if (err.message && !err.message.includes('already exists')) throw err;
    }
  }
  return col;
}

globalHooks.on('page.beforeInsert', async (ctx) => {
  const { doc } = ctx;
  if (!doc.title || typeof doc.title !== 'string') throw new Error('title is required');
  if (!doc.content) doc.content = '';
  doc.slug = doc.slug || slugify(doc.title);
  doc.createdAt = new Date().toISOString();
  doc.updatedAt = doc.createdAt;
  return ctx;
});

globalHooks.on('page.beforeUpdate', async (ctx) => {
  const { update } = ctx;
  const $set = update.$set || update;
  if ($set.slug) $set.slug = slugify($set.slug);
  $set.updatedAt = new Date().toISOString();
  return ctx;
});

async function createPage(doc) {
  const col = getPageCollection();
  const ctx = await globalHooks.run('page.beforeInsert', { doc });
  const inserted = col.insert(ctx.doc);
  await globalHooks.run('page.afterInsert', { doc: inserted });
  return inserted;
}

async function updatePage(filter, update) {
  const col = getPageCollection();
  const ctx = await globalHooks.run('page.beforeUpdate', { filter, update });
  const result = col.update(ctx.filter || filter, ctx.update || update);
  if (result > 0) {
    const updated = col.findOne(ctx.filter || filter);
    await globalHooks.run('page.afterUpdate', { filter, update, doc: updated });
  }
  return result;
}

function findPageById(id) {
  return getPageCollection().findById(id);
}

function findPageBySlug(slug) {
  return getPageCollection().findOne({ slug });
}

function listPages(filter = {}, opts = {}) {
  const col = getPageCollection();
  let cursor = col.find(filter);
  if (opts.limit) cursor = cursor.limit(opts.limit);
  if (opts.skip) cursor = cursor.skip(opts.skip);
  if (opts.sort) {
    const [field, order] = opts.sort.split(':');
    cursor = cursor.sort(field, order === 'asc' ? 1 : -1);
  }
  return cursor.toArray();
}

function countPages(filter = {}) {
  return getPageCollection().count(filter);
}

function removePageById(id) {
  return getPageCollection().removeById(id);
}

module.exports = {
  getPageCollection,
  createPage,
  updatePage,
  findPageById,
  findPageBySlug,
  listPages,
  countPages,
  removePageById,
};
