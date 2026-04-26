import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'HashTap',
        short_name: 'HashTap',
        description: 'QR sipariş ve ödeme',
        theme_color: '#FF6B3D',
        background_color: '#FAFBFC',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '64x64 192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/hashtap': {
        target: 'http://localhost:8069',
        changeOrigin: true,
      },
      '/web': {
        target: 'http://localhost:8069',
        changeOrigin: true,
      },
    },
  },
});
