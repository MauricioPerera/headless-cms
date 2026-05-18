/**
 * Git sync: commit db/ changes and push to origin
 * Usage: node scripts/git-sync.js [message]
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MSG = process.argv[2] || 'sync: auto-commit db/';

function main() {
  try {
    // Check if there are changes in db/
    const status = execSync('git status --porcelain db/', { cwd: ROOT, encoding: 'utf8' }).trim();
    if (!status) {
      console.log('No changes in db/ to sync.');
      return;
    }

    console.log('Changes detected in db/:', status.split('\n').length, 'files');

    execSync('git add db/', { cwd: ROOT });
    execSync(`git commit -m "${MSG}"`, { cwd: ROOT });
    execSync('git push origin master', { cwd: ROOT });

    console.log('Synced db/ to GitHub.');
  } catch (err) {
    console.error('Git sync failed:', err.message);
    process.exit(1);
  }
}

main();
