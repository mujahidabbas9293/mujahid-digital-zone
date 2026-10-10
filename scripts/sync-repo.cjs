const { execSync } = require('child_process');

console.log('====================================================');
console.log('🔄 Starting Full Sync: Antigravity ⇄ GitHub ⇄ Vercel');
console.log('====================================================');

function runCmd(cmd, allowFail = false) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (err) {
    if (!allowFail) {
      console.error(`Command failed: ${cmd}\n`, err.stderr || err.message);
      throw err;
    }
    return '';
  }
}

try {
  // 1. Commit any local uncommitted changes first to avoid dirty working tree
  const status = runCmd('git status --porcelain', true);
  if (status) {
    console.log('📦 [1/5] Staging & committing local Antigravity changes...');
    runCmd('git add .');
    const msg = `Auto-Sync: Production update [${new Date().toISOString()}]`;
    runCmd(`git commit -m "${msg}"`);
    console.log('✅ Local changes committed.');
  } else {
    console.log('ℹ️ [1/5] Working tree clean. No pending local changes.');
  }

  // 2. Fetch latest commits from GitHub
  console.log('📡 [2/5] Fetching latest commits from GitHub origin/main...');
  runCmd('git fetch origin main');

  // 3. Synchronize GitHub updates into Antigravity
  console.log('📥 [3/5] Synchronizing remote GitHub updates into Antigravity...');
  try {
    runCmd('git pull --rebase origin main');
    console.log('✅ Local branch successfully synchronized with GitHub.');
  } catch (err) {
    console.warn('⚠️ Rebase merge conflict detected. Reverting to standard merge pull...');
    runCmd('git rebase --abort', true);
    runCmd('git pull origin main --no-reedit', true);
  }

  // 4. Build Validation
  console.log('⚡ [4/5] Validating production frontend build...');
  runCmd('node_modules\\.bin\\vite.cmd build');
  console.log('✅ Production build validation PASSED.');

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
