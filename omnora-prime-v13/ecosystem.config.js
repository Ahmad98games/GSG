// ecosystem.config.js — PM2 Production Configuration
// Optimized for Industrial PC deployments (Fanless, 8-16GB RAM)

module.exports = {
  apps: [
    {
      name: 'NOXIS-hub',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: process.cwd(),
      instances: 1,         // single instance — better-sqlite3 is NOT cluster-safe
      exec_mode: 'fork',    // NOT cluster — SQLite requires single process for WAL mode stability
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '1500M',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    }
  ]
}

