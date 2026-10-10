import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const DeployView: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const setupCommands = `# 1. Update OS and install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential

# 2. Install PM2 process manager
sudo npm install -g pm2

# 3. Clone repository and install dependencies
cd /var/www
git clone <YOUR_REPO_URL> whatsapp-bot
cd whatsapp-bot
npm install

# 4. Build frontend assets and launch via PM2
npm run build
pm2 start "npm start" --name "mdz-whatsapp-bot"
pm2 save
pm2 startup`;

  const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "mdz-dual-whatsapp-engine",
      script: "tsx",
      args: "server.ts",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=8192"
      },
      watch: false,
      max_memory_restart: "4G",
      restart_delay: 4000
    }
  ]
};`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">VPS Production Deployment & PM2 Setup</h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete self-contained guide for deploying Mujahid Digital Zone Bot + WhatsApp Center on Ubuntu 22.04 / Debian VPS with 32 GB RAM high-performance concurrent execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">VPS Specifications</div>
          <div className="text-base font-bold text-white mt-1">1 vCPU · 32 GB RAM</div>
          <div className="text-[11px] text-emerald-400 mt-1">High-performance dual engine allocation</div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Node.js Runtime</div>
          <div className="text-base font-bold text-white mt-1">Node 20+ LTS & PM2</div>
          <div className="text-[11px] text-emerald-400 mt-1">Auto-restarts on crash or reboot</div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="text-slate-400 text-xs">Concurrent Persistence</div>
          <div className="text-base font-bold text-white mt-1">Dual Isolated Sessions</div>
          <div className="text-[11px] text-emerald-400 mt-1">Main Session + Center Session</div>
        </div>
      </div>

      {/* Setup Commands */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Bash Deployment Script (Ubuntu/Debian)</span>
          </h3>
          <button
            onClick={() => copyToClipboard(setupCommands, 'setup')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
          >
            {copied === 'setup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'setup' ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
          {setupCommands}
        </pre>
      </div>

      {/* PM2 Ecosystem File */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>ecosystem.config.cjs (PM2 Spec)</span>
          </h3>
          <button
            onClick={() => copyToClipboard(ecosystemConfig, 'eco')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
          >
            {copied === 'eco' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'eco' ? 'Copied!' : 'Copy Config'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
          {ecosystemConfig}
        </pre>
      </div>
    </div>
  );
};
