import SsrBoost from '@lomray/vite-ssr-boost/plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: { outDir: '../build' },
  plugins: [SsrBoost(), react()],
});
