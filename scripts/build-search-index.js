const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'db');
const DIST_DIR = path.join(ROOT, 'dist');

const { DocStore, FileStorageAdapter } = require('../lib/js-doc-store');
const store = new DocStore(new FileStorageAdapter(DB_DIR));

const { buildIndex } = require('../src/core/search');

function writeFile(dest, content) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function main() {
  const postsCol = store.collection('posts');
  const posts = postsCol.find({ status: 'published' }).toArray();
  const indexData = buildIndex(posts);

  // Strip functions / circular refs; keep only serializable data
  const payload = {
    idf: indexData.idf,
    magnitudes: indexData.magnitudes,
    docs: indexData.docs,
    index: indexData.index,
  };

  const outPath = path.join(DIST_DIR, 'api', 'search-index.json');
  writeFile(outPath, JSON.stringify(payload, null, 2));
  console.log(`  Generated search-index.json (${posts.length} posts, ${Object.keys(payload.idf).length} terms)`);
}

main();