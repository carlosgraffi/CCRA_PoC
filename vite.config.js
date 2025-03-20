
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { resolve } from 'path';

const optimizedDataPlugin = () => {
  return {
    name: 'optimized-data-plugin',
    configureServer(server) {
      server.middlewares.use('/api/climate', (req, res, next) => {
        const match = req.url.match(/\/city-data\/([^\/]+)/);
        if (!match) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Invalid endpoint' }));
          return;
        }

        const cityName = match[1];
        const filePath = resolve('public/data', `${cityName}.json`);

        try {
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ 
              error: 'City data not found',
              city: cityName 
            }));
          }
        } catch (err) {
          console.error('Error serving city data:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    optimizedDataPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
});
