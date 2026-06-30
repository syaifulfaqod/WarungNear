module.exports = {
  apps: [
    {
      name: 'warungnear-backend',
      script: 'backend/src/app.js',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
