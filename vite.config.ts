import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = 5176;

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: '127.0.0.1', port, strictPort: true },
  preview: { host: '127.0.0.1', port: port + 1000, strictPort: true },
  build: { target: 'es2022' },
});
