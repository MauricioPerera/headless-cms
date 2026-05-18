/**
 * Sync Cloudflare KV to local db/
 * Usage: node scripts/sync-kv-to-db.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_DIR = path.resolve(__dirname, '../db');

function main() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  // List all keys with db: prefix
  const listOut = execSync(
    `npx wrangler kv list --prefix=db: --namespace-id=6d3726d54e2a4deab24ad11f7efca2df`,
    { encoding: 'utf8' }
  );
  const keys = JSON.parse(listOut);

  console.log(`Downloading ${keys.length} files from KV...`);

  for (const item of keys) {
    const key = item.name;
    if (!key.startsWith('db:')) continue;
    const filename = key.slice(3); // remove db: prefix
    const value = execSync(
      `npx wrangler kv key get "${key}" --namespace-id=6d3726d54e2a4deab24ad11f7efca2df --text`,
      { encoding: 'utf8' }
    );
    fs.writeFileSync(path.join(DB_DIR, filename), value);
    console.log(`  ${filename}`);
  }

  console.log('Done.');
}

main();
