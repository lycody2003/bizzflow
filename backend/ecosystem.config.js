
module.exports = {
  apps: [
    {
      name: 'bizzflow',

      script: 'src/server.ts',

      // Use tsx to execute TypeScript
      interpreter: './node_modules/.bin/tsx',

      // Application environment
      env: {
        NODE_ENV: 'development',
        PORT: 5050,
      },

      // Watch configuration
      watch: true,

      ignore_watch: [
        'node_modules',
        'dist',
        '.git',
        'coverage',
      ],

      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
}
