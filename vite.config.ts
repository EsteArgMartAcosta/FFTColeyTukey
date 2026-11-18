import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  base: '/FFTColeyTukey/',
  publicDir: '../public',
  build: {
    target: 'es2022',
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
});
