// pm2 process file — run with: pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'hoorshid-menu',
      script: 'server/index.js',
      cwd: __dirname + '/..',
      instances: 1, // SQLite — keep a single instance
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '300M',
    },
  ],
};
