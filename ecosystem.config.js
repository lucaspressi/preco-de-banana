module.exports = {
  apps: [
    {
      name: "preco-de-banana",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/preco-de-banana",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      error_file: "/var/log/preco-de-banana/err.log",
      out_file: "/var/log/preco-de-banana/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
