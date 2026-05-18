/**
 * Git sync: commit db/ changes and push to origin
 * Usage: node scripts/git-sync.js [message]
 */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MSG = process.argv[2] || 'sync: auto-commit db/';

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function main() {
  try {
    const status = git('status', '--porcelain', 'db/').trim();
    if (!status) {
      console.log('No changes in db/ to sync.');
      return;
    }

    console.log('Changes detected in db/:', status.split('\n').length, 'files');

    git('add', 'db/');
    git('commit', '-m', MSG);
    git('push', 'origin', 'master');

    console.log('Synced db/ to GitHub.');
  } catch (err) {
    console.error('Git sync failed:', err.message);
    process.exit(1);
  }
}

main();
