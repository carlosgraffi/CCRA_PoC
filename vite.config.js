import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000')
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3000'),
    middlewareMode: 'html',
    setupMiddleware: (app) => {
      // Add health check endpoint
      app.use('/', (req, res, next) => {
        if (req.url === '/') {
          res.setHeader('Content-Type', 'text/plain');
          res.end('OK');
          return;
        }
        next();
      });
    }
  }
});