const { DocStore, FileStorageAdapter } = require('../../lib/js-doc-store');
const path = require('path');

const DB_DIR = path.resolve(__dirname, '../../db');

const store = new DocStore(new FileStorageAdapter(DB_DIR));

function getCollection(name) {
  return store.collection(name);
}

function flushAll() {
  store.flush();
}

module.exports = { store, getCollection, flushAll };
