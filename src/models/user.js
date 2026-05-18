const { getCollection } = require('../core/store');
const { globalHooks } = require('../core/hooks');
const { hashPassword } = require('../core/auth');

const COLLECTION = 'users';

function getUserCollection() {
  const col = getCollection(COLLECTION);
  // Asegurar indices unicos (ignorar si ya existen)
  for (const def of [
    { field: 'username', opts: { type: 'hash', unique: true } },
    { field: 'email', opts: { type: 'hash', unique: true } },
  ]) {
    try {
      col.createIndex(def.field, def.opts);
    } catch (err) {
      if (err.message && !err.message.includes('already exists')) throw err;
    }
  }
  return col;
}

// Hooks de seguridad

globalHooks.on('user.beforeInsert', async (ctx) => {
  const { doc } = ctx;
  if (!doc.username || typeof doc.username !== 'string') throw new Error('username is required');
  if (!doc.email || typeof doc.email !== 'string') throw new Error('email is required');
  if (!doc.password || typeof doc.password !== 'string') throw new Error('password is required');

  doc.username = doc.username.trim().toLowerCase();
  doc.email = doc.email.trim().toLowerCase();
  doc.displayName = doc.displayName || doc.username;
  doc.role = doc.role || 'subscriber';
  const allowedRoles = ['admin', 'editor', 'author', 'subscriber'];
  if (!allowedRoles.includes(doc.role)) throw new Error('invalid role');

  doc.passwordHash = await hashPassword(doc.password);
  delete doc.password;
  doc.createdAt = new Date().toISOString();
  doc.updatedAt = doc.createdAt;
  return ctx;
});

globalHooks.on('user.afterInsert', async (ctx) => {
  return ctx;
});

globalHooks.on('user.beforeUpdate', async (ctx) => {
  const { update } = ctx;
  const $set = update.$set || update;
  if ($set.email) $set.email = $set.email.trim().toLowerCase();
  if ($set.username) $set.username = $set.username.trim().toLowerCase();
  if ($set.password) {
    $set.passwordHash = await hashPassword($set.password);
    delete $set.password;
  }
  $set.updatedAt = new Date().toISOString();
  return ctx;
});

async function createUser(doc) {
  const col = getUserCollection();
  const ctx = await globalHooks.run('user.beforeInsert', { doc });
  const inserted = col.insert(ctx.doc);
  await globalHooks.run('user.afterInsert', { doc: inserted });
  return inserted;
}

async function updateUser(filter, update) {
  const col = getUserCollection();
  const ctx = await globalHooks.run('user.beforeUpdate', { filter, update });
  return col.update(ctx.filter || filter, ctx.update || update);
}

function findUserById(id) {
  return getUserCollection().findById(id);
}

function findUserByUsername(username) {
  return getUserCollection().findOne({ username: username.trim().toLowerCase() });
}

function findUserByEmail(email) {
  return getUserCollection().findOne({ email: email.trim().toLowerCase() });
}

function listUsers(filter = {}, opts = {}) {
  const col = getUserCollection();
  let cursor = col.find(filter);
  if (opts.limit) cursor = cursor.limit(opts.limit);
  if (opts.skip) cursor = cursor.skip(opts.skip);
  return cursor.toArray();
}

function countUsers(filter = {}) {
  return getUserCollection().count(filter);
}

module.exports = {
  getUserCollection,
  createUser,
  updateUser,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  listUsers,
  countUsers,
};
