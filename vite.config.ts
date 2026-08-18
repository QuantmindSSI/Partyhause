import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['partyhaus-icon.svg', 'placeholder.svg', 'robots.txt'],
      manifest: {
        name: 'PartyHause',
        short_name: 'PartyHause',
        description: 'Create unforgettable events with friends. Manage guest lists, send invitations, track RSVPs, and create lasting memories.',
        theme_color: '#6366F1',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/partyhaus-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, _options) => {
          // Return JSON (not HTML) when the local API server is unreachable.
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err.message);
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'API server unreachable. Start it with: npm run server' }));
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        // Split stable vendor code from app code so app deploys don't bust
        // the (large, rarely-changing) vendor caches. Page code is split per
        // route via React.lazy in src/App.tsx.
        manualChunks(id: string) {
          // Lazy-only vendors get their own chunks so they never ride along
          // in the eager 'vendor' bundle. These rules run FIRST so a
          // package's commonjs-proxy virtual modules (\0-prefixed but still
          // containing the package path) stay in the same chunk as the
          // package — otherwise the proxy lands in eager vendor and drags
          // the lazy chunk into the entry graph.
          if (id.includes('@azure/msal-browser')) return 'msal-vendor';
          if (id.includes('sanitize-html') || id.includes('htmlparser2') || id.includes('domhandler') || id.includes('domutils') || id.includes('dom-serializer') || id.includes('/entities/')) {
            return 'sanitize-vendor';
          }
          if (id.includes('jsqr')) return 'qr-vendor';
          // Rollup/Vite shared helper modules (preload helper, commonjs
          // helpers) are used by many chunks — pin them to eager vendor.
          if (id.startsWith('\0') || id.includes('commonjsHelpers') || id.includes('vite/preload-helper')) {
            return 'vendor';
          }
          if (!id.includes('node_modules')) return undefined;
          // Eager vendors, split for cache stability across deploys.
          if (id.includes('react-router')) return 'router-vendor';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }
          if (id.includes('framer-motion')) return 'motion-vendor';
          if (id.includes('@radix-ui')) return 'radix-vendor';
          if (id.includes('date-fns')) return 'date-vendor';
          return 'vendor';
        },
      }
    },
    chunkSizeWarningLimit: 700,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ]
  },
})
