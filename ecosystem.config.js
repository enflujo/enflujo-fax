module.exports = {
  apps: [
    {
      name: 'culito',
      script: './aplicaciones/culo/publico/programa.js',
      interpreter: '/home/enflujo/.nvm/versions/node/v20.10.0/bin/node',
      autorestart: true,
      restart_delay: 2000,
      max_memory_restart: '200M',
    },

    {
      name: 'camara',
      script: './camara/camara.py',
      interpreter: 'python3',
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '200M',
      kill_timeout: 5000,
      env: {
        FPS_CAMARA: '8',
        PUERTO_CAMARA: '4003',
      },
    },
  ],
};
