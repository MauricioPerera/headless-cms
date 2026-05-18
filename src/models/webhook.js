const { getCollection } = require('../core/store');
const { globalHooks } = require('../core/hooks');

const COLLECTION = 'webhooks';

function getWebhookCollection() {
  const col = getCollection(COLLECTION);
  try {
    col.createIndex('url', { type: 'hash', unique: true });
  } catch (err) {
    if (err.message && !err.message.includes('already exists')) throw err;
  }
  return col;
}

function createWebhook(doc) {
  const col = getWebhookCollection();
  if (!doc.url || typeof doc.url !== 'string') throw new Error('url is required');
  if (!doc.events || !Array.isArray(doc.events)) doc.events = ['post.published'];
  doc.createdAt = new Date().toISOString();
  return col.insert(doc);
}

function listWebhooks(filter = {}) {
  return getWebhookCollection().find(filter).toArray();
}

function removeWebhookById(id) {
  return getWebhookCollection().removeById(id);
}

// Handler de hooks que dispara webhooks
async function triggerWebhooks(event, payload) {
  const webhooks = listWebhooks({ events: { $contains: event } });
  if (!webhooks.length) return;

  const results = await Promise.allSettled(
    webhooks.map(async (wh) => {
      try {
        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(wh.secret ? { 'X-Webhook-Secret': wh.secret } : {}),
          },
          body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
        });
        return { url: wh.url, status: res.status, ok: res.ok };
      } catch (err) {
        return { url: wh.url, error: err.message };
      }
    })
  );

  // Log de fallos silenciosos
  results.forEach((r, i) => {
    if (r.status === 'rejected' || !r.value?.ok) {
      console.warn(`Webhook fallo: ${webhooks[i].url}`, r.value?.error || r.value?.status);
    }
  });
}

// Suscribir a hooks de post
// Nota: globalHooks.run('post.afterInsert') ya se llama en createPost()
// Pero debemos asegurarnos de que exista un listener

globalHooks.on('post.afterInsert', async (ctx) => {
  const post = ctx.doc;
  if (post.status === 'published') {
    await triggerWebhooks('post.published', post);
  }
  return ctx;
});

globalHooks.on('post.afterUpdate', async (ctx) => {
  const post = ctx.doc || ctx.updated;
  if (post && post.status === 'published') {
    await triggerWebhooks('post.published', post);
  }
  return ctx;
});

module.exports = {
  getWebhookCollection,
  createWebhook,
  listWebhooks,
  removeWebhookById,
  triggerWebhooks,
};
