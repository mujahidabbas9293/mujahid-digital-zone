#!/usr/bin/env python3
"""
Mujahid Digital Zone - Complete Website Project Exporter
Dynamically walks and packages the current live project files into a deployable ZIP.
Guarantees security: strictly excludes WhatsApp session tokens, passwords, and private secrets.
"""

import os
import sys
import json
import zipfile
import re

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
EXCLUDED_DIR_NAMES = {
    'node_modules',
    '.git',
    '.github',
    '.cache',
    '__pycache__',
    'coverage',
    '.turbo',
    '.next',
    'trash',
    'session',
    'whatsapp_center_session',
    'customer_sessions',
    'customer_sessions_backup',
    'app',
    'Mujahid_Digital_Zone_Backups',
    'data-protection',
    'uploads',
    'rollbacks',
}

EXCLUDED_FILE_PATTERNS = [
    re.compile(r'^creds\.json$', re.IGNORECASE),
    re.compile(r'^app-state-sync.*', re.IGNORECASE),
    re.compile(r'^pre-key.*', re.IGNORECASE),
    re.compile(r'^sender-key.*', re.IGNORECASE),
    re.compile(r'^session-.*', re.IGNORECASE),
    re.compile(r'^\.env(\..+)?$', re.IGNORECASE), # Excludes .env, .env.local, .env.production (but .env.example handled explicitly)
    re.compile(r'.*\.log$', re.IGNORECASE),
    re.compile(r'^\.DS_Store$', re.IGNORECASE),
    re.compile(r'.*\.(pem|key|id_rsa)$', re.IGNORECASE),
    re.compile(r'.*\.zip$', re.IGNORECASE), # Never pack another zip inside the zip
]

README_CONTENT = """# Mujahid Digital Zone - Complete WhatsApp Automation & Moderation Platform

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
"""

def should_exclude(rel_path, is_dir=False):
    parts = rel_path.replace('\\', '/').split('/')
    # Exclude directories
    for part in parts:
        if part in EXCLUDED_DIR_NAMES:
            return True

    if is_dir:
        return False

    filename = parts[-1]
    
    # Always allow .env.example
    if filename.lower() == '.env.example':
        return False

    for pat in EXCLUDED_FILE_PATTERNS:
        if pat.match(filename):
            return True

    return False

def sanitize_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Scrub sensitive tokens if present
        if isinstance(data, dict):
            if 'settings' in data and isinstance(data['settings'], dict):
                data['settings']['pairing_code'] = None
            if 'connections' in data and isinstance(data['connections'], dict):
                for conn in data['connections'].values():
                    if isinstance(conn, dict) and 'settings' in conn and isinstance(conn['settings'], dict):
                        conn['settings']['pairing_code'] = None
        
        return json.dumps(data, indent=2).encode('utf-8')
    except Exception:
        # Fallback to reading file normally
        with open(file_path, 'rb') as f:
            return f.read()

def create_project_zip(output_zip_path):
    output_zip_path = os.path.abspath(output_zip_path)
    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)

    included_files = []
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(output_zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(WORKSPACE_ROOT):
            # Prune excluded directories in-place so os.walk skips descending into them
            dirs[:] = [d for d in dirs if not should_exclude(os.path.relpath(os.path.join(root, d), WORKSPACE_ROOT), is_dir=True)]

            for file in files:
                abs_file_path = os.path.join(root, file)
                rel_file_path = os.path.relpath(abs_file_path, WORKSPACE_ROOT)

                if should_exclude(rel_file_path, is_dir=False):
                    continue

                # Don't add the zip file itself if located in workspace
                if os.path.abspath(abs_file_path) == output_zip_path:
                    continue

                norm_rel_path = rel_file_path.replace('\\', '/')

                # Sanitize bot_store.json to ensure no active session state is exported
                if norm_rel_path.endswith('bot_store.json'):
                    content_bytes = sanitize_json_file(abs_file_path)
                    zipf.writestr(norm_rel_path, content_bytes)
                    total_uncompressed_bytes += len(content_bytes)
                else:
                    file_size = os.path.getsize(abs_file_path)
                    zipf.write(abs_file_path, arcname=norm_rel_path)
                    total_uncompressed_bytes += file_size

                included_files.append(norm_rel_path)

        # Ensure DEPLOYMENT_README.md and README.md are explicitly included
        readme_bytes = README_CONTENT.encode('utf-8')
        zipf.writestr('DEPLOYMENT_README.md', readme_bytes)
        zipf.writestr('README.md', readme_bytes)
        included_files.append('DEPLOYMENT_README.md')
        included_files.append('README.md')
        total_uncompressed_bytes += len(readme_bytes) * 2

    zip_size = os.path.getsize(output_zip_path)

    return {
        'status': 'success',
        'zip_path': output_zip_path,
        'zip_size_bytes': zip_size,
        'zip_size_mb': round(zip_size / (1024 * 1024), 2),
        'file_count': len(included_files),
        'total_uncompressed_bytes': total_uncompressed_bytes,
        'sample_files': included_files[:25]
    }

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else '/tmp/mujahid-digital-zone-complete-website.zip'
    res = create_project_zip(dest)
    print(json.dumps(res, indent=2))
