const { getCollection } = require('../core/store');
const { globalHooks } = require('../core/hooks');

const COLLECTION = 'taxonomies';

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

function getTaxonomyCollection() {
  const col = getCollection(COLLECTION);
  for (const def of [
    { field: 'slug', opts: { type: 'hash', unique: true } },
    { field: 'type', opts: { type: 'hash' } },
    { field: 'parentId', opts: { type: 'hash' } },
  ]) {
    try {
      col.createIndex(def.field, def.opts);
    } catch (err) {
      if (err.message && !err.message.includes('already exists')) throw err;
    }
  }
  return col;
}

globalHooks.on('taxonomy.beforeInsert', async (ctx) => {
  const { doc } = ctx;
  if (!doc.name || typeof doc.name !== 'string') throw new Error('name is required');
  doc.slug = doc.slug || slugify(doc.name);
  doc.type = doc.type || 'category';
  const allowedTypes = ['category', 'tag'];
  if (!allowedTypes.includes(doc.type)) throw new Error('invalid taxonomy type');
  if (doc.parentId) {
    const parent = findTaxonomyById(doc.parentId);
    if (!parent) throw new Error('parent taxonomy not found');
    if (parent.type !== doc.type) throw new Error('parent must be same type');
  }
  doc.createdAt = new Date().toISOString();
  doc.updatedAt = doc.createdAt;
  return ctx;
});

globalHooks.on('taxonomy.beforeUpdate', async (ctx) => {
  const { update } = ctx;
  const $set = update.$set || update;
  if ($set.slug) $set.slug = slugify($set.slug);
  $set.updatedAt = new Date().toISOString();
  return ctx;
});

async function createTaxonomy(doc) {
  const col = getTaxonomyCollection();
  const ctx = await globalHooks.run('taxonomy.beforeInsert', { doc });
  return col.insert(ctx.doc);
}

async function updateTaxonomy(filter, update) {
  const col = getTaxonomyCollection();
  const ctx = await globalHooks.run('taxonomy.beforeUpdate', { filter, update });
  return col.update(ctx.filter || filter, ctx.update || update);
}

function findTaxonomyById(id) {
  return getTaxonomyCollection().findById(id);
}

function findTaxonomyBySlug(slug) {
  return getTaxonomyCollection().findOne({ slug });
}

function listTaxonomies(filter = {}, opts = {}) {
  const col = getTaxonomyCollection();
  let cursor = col.find(filter);
  if (opts.limit) cursor = cursor.limit(opts.limit);
  if (opts.skip) cursor = cursor.skip(opts.skip);
  return cursor.toArray();
}

function countTaxonomies(filter = {}) {
  return getTaxonomyCollection().count(filter);
}

function removeTaxonomyById(id) {
  return getTaxonomyCollection().removeById(id);
}

module.exports = {
  getTaxonomyCollection,
  createTaxonomy,
  updateTaxonomy,
  findTaxonomyById,
  findTaxonomyBySlug,
  listTaxonomies,
  countTaxonomies,
  removeTaxonomyById,
};
