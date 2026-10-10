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
