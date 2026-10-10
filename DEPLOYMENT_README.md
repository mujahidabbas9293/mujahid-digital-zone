# Mujahid Digital Zone - Complete WhatsApp Automation & Moderation Platform

Welcome to the complete source code package of **Mujahid Digital Zone WhatsApp Bot & Moderation Console**.
This archive contains the entire production-ready application, including Frontend SPA, Backend Express Server, Baileys Automation Engine, Multi-Customer/Reseller Modules, and Deployment Infrastructure.

---

## 📋 Comprehensive 10-Step Production Deployment Guide

Follow these step-by-step instructions to deploy this project on any Linux VPS (Ubuntu/Debian), Docker, or Cloud Run instance:

### Step 1: Upload and Extract the Project
Upload the `mujahid-digital-zone-complete-website.zip` to your server (e.g., `/var/www/mujahid-digital-zone` or `/app`) and unzip it:
```bash
mkdir -p /var/www/mujahid-digital-zone
cd /var/www/mujahid-digital-zone
unzip mujahid-digital-zone-complete-website.zip
```

### Step 2: Install Node.js & Dependencies
Ensure Node.js v20+ or v22+ is installed, then install project dependencies:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment template to `.env` and fill in your desired configuration:
```bash
cp .env.example .env
nano .env
```
Ensure you configure:
- `PORT=3000`
- `NODE_ENV=production`
- `APP_URL=https://your-domain.com` (Your production domain or Cloud Run URL)

### Step 4: Storage & Permissions Setup
Create persistent folders for Baileys sessions and local database stores:
```bash
mkdir -p data/session data/customer_sessions data/uploads
chmod -R 755 data
```
Alternatively, run the included VPS automation script:
```bash
chmod +x vps-setup.sh vps-optimize.sh
./vps-setup.sh
```

### Step 5: Database Verification
The platform uses the JSON-based atomic multi-connection persistence engine (`data/bot_store.json`).
A clean default configuration is pre-configured and will automatically initialize on first launch.

### Step 6: Build the Frontend Client
Compile the high-performance React + Tailwind CSS client bundle:
```bash
npm run build
```
This generates the optimized production assets in `dist/`.

### Step 7: Start the Production Server
You can launch the server using any of the following standard production methods:
- **Direct Node execution:**
  ```bash
  npm start
  ```
- **PM2 Process Manager (Recommended for 24/7 VPS uptime):**
  ```bash
  npx pm2 start ecosystem.config.cjs
  npx pm2 save
  npx pm2 startup
  ```
- **Systemd Service:**
  Copy `whatsapp-backend.service` to `/etc/systemd/system/` and run `systemctl enable --now whatsapp-backend`.

### Step 8: Reverse Proxy & SSL Setup (Nginx)
Configure Nginx reverse proxy to forward traffic to `http://127.0.0.1:3000`:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Issue SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

### Step 9: Open the Platform
Open your browser and navigate to:
- **Owner / Admin Dashboard:** `https://your-domain.com/owner`
- **Reseller Portal:** `https://your-domain.com/reseller`
- **Customer Dashboard:** `https://your-domain.com/customer`

### Step 10: Complete First-Time Owner & WhatsApp Setup
1. In the **Owner Panel**, configure your Owner Number and Bot Display Name in **Settings**.
2. Go to **WhatsApp Center / Connection** and scan the authentic QR code using WhatsApp on your phone (Linked Devices).
3. The 24/7 auto-moderation engine and WhatsApp automation is now live!

---

## 🔒 Security Notice
This export was automatically sanitized. No active session keys, credentials, or private secrets were packaged.
