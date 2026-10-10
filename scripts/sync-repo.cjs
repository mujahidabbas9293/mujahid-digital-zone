const { execSync } = require('child_process');

console.log('====================================================');
console.log('🔄 Starting Full Sync: Antigravity ⇄ GitHub ⇄ Vercel');
console.log('====================================================');

function runCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (err) {
    console.error(`Command failed: ${cmd}\n`, err.stderr || err.message);
    throw err;
  }
}

try {
  // 1. Fetch latest changes from GitHub
  console.log('📡 [1/5] Fetching latest commits from GitHub origin/main...');
  runCmd('git fetch origin main');

  // 2. Safe Pull (GitHub -> Antigravity)
  console.log('📥 [2/5] Synchronizing remote GitHub updates into Antigravity...');
  try {
    runCmd('git pull --rebase origin main');
    console.log('✅ Local branch successfully synchronized with GitHub.');
  } catch (err) {
    console.warn('⚠️ Rebase merge conflict or error detected. Aborting rebase cleanly.');
    try { runCmd('git rebase --abort'); } catch (_) {}
  }

  // 3. Build Validation
  console.log('⚡ [3/5] Validating production frontend build...');
  runCmd('node_modules\\.bin\\vite.cmd build');
  console.log('✅ Production build validation PASSED.');

  // 4. Check for local uncommitted changes (Antigravity -> GitHub)
  const status = runCmd('git status --porcelain');
  if (status) {
    console.log('📦 [4/5] Staging & committing uncommitted Antigravity changes...');
    runCmd('git add .');
    const msg = `Auto-Sync: Production update [${new Date().toISOString()}]`;
    runCmd(`git commit -m "${msg}"`);
    console.log('✅ Local changes committed successfully.');
  } else {
    console.log('ℹ️ [4/5] Working tree clean. No local changes to commit.');
  }

  // 5. Push to GitHub (Triggers Vercel & Backend Cloud Auto-Deploy)
  console.log('🚀 [5/5] Pushing to GitHub (origin/main) to trigger live Vercel deployment...');
  runCmd('git push origin main');
  
  const latestHash = runCmd('git rev-parse --short HEAD');
  console.log('====================================================');
  console.log(`🎉 FULL SYNC COMPLETE! Latest Commit: ${latestHash}`);
  console.log('🚀 Vercel Live Deployment & Backend Cloud Deployment Triggered!');
  console.log('====================================================');

} catch (err) {
  console.error('❌ Sync workflow halted with error:', err.message);
  process.exit(1);
}
