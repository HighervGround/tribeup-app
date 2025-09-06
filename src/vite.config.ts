import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/components': resolve(__dirname, './components'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/store': resolve(__dirname, './store'),
      '@/styles': resolve(__dirname, './styles'),
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Automatically open browser
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['motion', 'lucide-react'],
          'state-vendor': ['zustand', 'immer'],
        },
      },
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
  },
  css: {
    devSourcemap: true,
  },
  // PWA support
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});