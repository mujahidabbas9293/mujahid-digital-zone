#!/bin/bash
# ==============================================================================
# VPS PRODUCTION SETUP & OPTIMIZATION SCRIPT FOR WHATSAPP BACKEND & SENDER
# ==============================================================================

set -e

echo "================================================================="
echo "⚡ Starting Production VPS Setup for WhatsApp Automation Backend"
echo "================================================================="

# 1. Clean up Orphan Processes
echo "🧹 [1/6] Terminating orphan Chromium, Chrome, and Puppeteer processes..."
pkill -9 -f "chromium" 2>/dev/null || true
pkill -9 -f "chrome" 2>/dev/null || true
pkill -9 -f "puppeteer" 2>/dev/null || true
echo "✅ Orphan browser processes terminated."

# 2. Session Directory Permissions & Storage Setup
echo "📂 [2/6] Configuring persistent WhatsApp session folders..."
DATA_DIR="/data"
SESSIONS_DIR="/data/whatsapp-sessions"
BACKUP_DIR="/data/whatsapp-sessions-backup"
UPLOADS_DIR="/data/whatsapp-uploads"
LOCAL_DATA="./data"
LOCAL_SESSIONS="./data/customer_sessions"
LOCAL_STORES="./data/customer_stores"

mkdir -p "$DATA_DIR" "$SESSIONS_DIR" "$BACKUP_DIR" "$UPLOADS_DIR" "$LOCAL_DATA" "$LOCAL_SESSIONS" "$LOCAL_STORES"
chmod -R 755 "$DATA_DIR" 2>/dev/null || true
chmod -R 755 "$LOCAL_DATA" 2>/dev/null || true
echo "✅ Persistent session directories configured with 755 permissions."

# 3. Install PM2 Globally
echo "🚀 [3/6] Checking and installing PM2 globally..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 2>/dev/null || npm install pm2
    echo "✅ PM2 installed successfully."
else
    echo "✅ PM2 is already installed ($(pm2 -v))."
fi

# 4. Configure PM2 Ecosystem with 512MB Memory Limit
echo "⚙️ [4/6] Generating PM2 ecosystem configuration (512MB Memory Limit)..."
cat << 'EOF' > ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'whatsapp-backend',
      script: 'server.ts',
      interpreter: 'node_modules/.bin/tsx',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=512'
      }
    }
  ]
};
EOF
echo "✅ ecosystem.config.cjs generated with 512MB memory limit and auto-restart policy."

if command -v pm2 &> /dev/null; then
    pm2 delete whatsapp-backend 2>/dev/null || true
    pm2 start ecosystem.config.cjs
    pm2 save || true
    echo "✅ PM2 process whatsapp-backend started with 512MB limit and saved."
fi

# 5. Startup Hook for Orphan Chromium Cleanup on Reboot
echo "🛡️ [5/6] Creating reboot/startup cleanup hook for orphan processes..."
CLEANUP_SCRIPT="/usr/local/bin/whatsapp-cleanup-orphans.sh"
cat << 'EOF' > "$CLEANUP_SCRIPT"
#!/bin/bash
pkill -9 -f "chromium" 2>/dev/null || true
pkill -9 -f "chrome" 2>/dev/null || true
pkill -9 -f "puppeteer" 2>/dev/null || true
exit 0
EOF
chmod +x "$CLEANUP_SCRIPT" 2>/dev/null || true

if [ -w "/etc/systemd/system" ]; then
cat << 'EOF' > /etc/systemd/system/whatsapp-orphan-cleanup.service
[Unit]
Description=Clean up orphan Chromium processes before WhatsApp backend starts
Before=whatsapp-backend.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/whatsapp-cleanup-orphans.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload 2>/dev/null || true
    systemctl enable whatsapp-orphan-cleanup.service 2>/dev/null || true
fi

# 6. Systemd Service Configuration (512MB Limit)
echo "🔧 [6/6] Generating Systemd service configuration..."
cat << 'EOF' > ./whatsapp-backend.service
[Unit]
Description=WhatsApp Production Backend Worker Service
After=network.target whatsapp-orphan-cleanup.service

[Service]
Type=simple
User=root
WorkingDirectory=/app
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=3s
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NODE_OPTIONS=--max-old-space-size=512
LimitNOFILE=65536
MemoryMax=512M

[Install]
WantedBy=multi-user.target
EOF

if [ -w "/etc/systemd/system" ]; then
    cp ./whatsapp-backend.service /etc/systemd/system/whatsapp-backend.service 2>/dev/null || true
    systemctl daemon-reload 2>/dev/null || true
    systemctl enable whatsapp-backend.service 2>/dev/null || true
fi

echo "================================================================="
echo "🎉 VPS Production Setup Completed Successfully!"
echo "================================================================="
