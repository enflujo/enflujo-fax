module.exports = {
  apps: [
    {
      name: 'cara',
      script: 'serve',
      env: {
        PM2_SERVE_PATH: './aplicaciones/cara/publico',
        PM2_SERVE_PORT: 4001,
      },
    },

    {
      name: 'culo',
      script: 'yarn prender:servidor',
    },
  ],
};
