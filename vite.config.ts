import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { ServerResponse } from 'node:http'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon-16x16.png',
        'icons/favicon-32x32.png',
        'icons/favicon-48x48.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-192.png',
        'icons/icon-maskable-512.png',
        'robots.txt'
      ],
      manifest: {
        name: 'PartyHause',
        short_name: 'PartyHause',
        description: 'Create unforgettable events with friends. Manage guest lists, send invitations, track RSVPs, and create lasting memories.',
        theme_color: '#FF5233', // coral-500, the brand anchor. Was #6366F1 indigo, which matched nothing in the app.
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['privacy.html', 'terms.html', 'support.html'],
        navigateFallbackDenylist: [/^\/(?:privacy|terms|support)\.html$/],
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
            // `res` is a ServerResponse for normal HTTP requests but a raw Socket
            // for upgrade/websocket traffic. Only the former can carry a status
            // line, so writing a JSON error to a Socket would corrupt the stream.
            if (!(res instanceof ServerResponse)) {
              res.destroy();
              return;
            }
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
            // A module and its commonjs proxy MUST land in the same chunk.
            //
            // react and react-dom are CommonJS, so Rollup emits virtual
            // modules like `\0/…/node_modules/react/index.js?commonjs-proxy`
            // alongside the real ones. A blanket `id.startsWith('\0')` rule
            // sent every proxy to `vendor` while the real module went to
            // `react-vendor`, producing exactly what Rollup then warned about:
            //
            //   Circular chunk: react-vendor -> vendor -> react-vendor
            //
            // That cycle is not cosmetic. It breaks module initialisation
            // order, so React was still undefined when a dependency evaluated
            // `React.useLayoutEffect` at module top level, and the app died on
            // load with "Cannot read properties of undefined (reading
            // 'useLayoutEffect')". The build exits 0, because Rollup treats it
            // as a warning.
            //
            // The fix is to classify by the underlying package path for every
            // module, virtual or not. Stripping the marker first means a proxy
            // always resolves to the same chunk as the code it proxies.
            const path = id.startsWith('\0') ? id.slice(1) : id;

            // Shared Rollup/Vite helpers are deliberately NOT pinned.
            //
            // Pinning them to `vendor` was the remaining half of the cycle:
            // react is CommonJS, so react-vendor depends on commonjsHelpers in
            // vendor, while vendor's own packages import React back out of
            // react-vendor. Returning undefined lets Rollup hoist the helpers
            // into a chunk every dependant can reach without a cycle, which is
            // what its placement algorithm exists to do.
            if (path.includes('commonjsHelpers') || path.includes('vite/preload-helper')) {
              return undefined;
            }

            if (!path.includes('node_modules')) return undefined;

            // Lazy-only vendors, kept out of the eager bundle so they are not
            // dragged into the entry graph.
            if (path.includes('@azure/msal-browser')) return 'msal-vendor';
            if (path.includes('sanitize-html') || path.includes('htmlparser2') || path.includes('domhandler') || path.includes('domutils') || path.includes('dom-serializer') || path.includes('/entities/')) {
              return 'sanitize-vendor';
            }
            if (path.includes('jsqr')) return 'qr-vendor';

            // Eager vendors, split for cache stability across deploys.
            if (path.includes('/node_modules/react-router')) return 'router-vendor';
            // Anchored to `node_modules/` so only the real packages match.
            // `/react-dom/` on its own also matched @floating-ui/react-dom,
            // which pulled that package into react-vendor while its own
            // dependencies (@floating-ui/dom, @floating-ui/core) stayed in
            // vendor. That was the other half of the cycle, and floating-ui is
            // the module that reads React.useLayoutEffect at import time, so
            // it is what actually threw when the ordering broke.
            if (
              path.includes('/node_modules/react/') ||
              path.includes('/node_modules/react-dom/') ||
              path.includes('/node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }
            if (path.includes('framer-motion')) return 'motion-vendor';
            if (path.includes('@radix-ui')) return 'radix-vendor';
            if (path.includes('date-fns')) return 'date-vendor';
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
