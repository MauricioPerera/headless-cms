const { DocStore, FileStorageAdapter } = require('../../lib/js-doc-store');
const path = require('path');

const DB_DIR = path.resolve(__dirname, '../../db');

// Default: file-based storage for local dev and SSG
let adapter = new FileStorageAdapter(DB_DIR);

// Cloudflare KV mode: when running in a Worker, set CMS_USE_KV=true
// and provide the KV binding as CMS_DB in the environment.
if (process.env.CMS_USE_KV === 'true') {
  // In Workers runtime, the KV binding is passed via env, not process.env.
  // This branch is for Node.js simulation or future Worker entry point.
  // For actual Workers usage, instantiate DocStore with CloudflareKVAdapter directly.
  console.warn('[store] CMS_USE_KV is set but KV binding must be injected from the Worker context.');
}

const store = new DocStore(adapter);

function getCollection(name) {
  return store.collection(name);
}

function flushAll() {
  store.flush();
}

// Helper for Worker runtime entry point
function createKVStore(kvBinding, prefix = 'db:') {
  const { CloudflareKVAdapter } = require('../../lib/js-doc-store');
  const kvAdapter = new CloudflareKVAdapter(kvBinding, prefix);
  return new DocStore(kvAdapter);
}

module.exports = { store, getCollection, flushAll, createKVStore };
