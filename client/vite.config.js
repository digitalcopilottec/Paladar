import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3000',
      // Arquivos enviados ficam no servidor, não em public/ — assim aparecem
      // sem precisar rebuildar o front.
      '/uploads': 'http://localhost:3000',
    },
  },
});
