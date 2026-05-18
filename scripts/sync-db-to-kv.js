/**
 * Sync local db/ to Cloudflare KV
 * Usage: node scripts/sync-db-to-kv.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_DIR = path.resolve(__dirname, '../db');
const BULK_FILE = path.resolve(__dirname, '../.kv-bulk.json');

function main() {
  const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json'));
  const bulk = [];

  for (const file of files) {
    const key = `db:${file}`;
    const value = fs.readFileSync(path.join(DB_DIR, file), 'utf8');
    bulk.push({ key, value });
  }

  fs.writeFileSync(BULK_FILE, JSON.stringify(bulk));

  console.log(`Uploading ${bulk.length} files to KV...`);
  const out = execSync(`npx wrangler kv bulk ${BULK_FILE} --namespace-id=6d3726d54e2a4deab24ad11f7efca2df`, { encoding: 'utf8' });
  console.log(out);

  fs.unlinkSync(BULK_FILE);
  console.log('Done.');
}

main();
