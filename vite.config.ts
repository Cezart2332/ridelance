import type { InlineConfig } from 'vite'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/** Vite 8 uses Rolldown; vite-plugin-pwa still sets rollup input — mirror it for the SW build */
function configureServiceWorkerBuild(inlineConfig: InlineConfig) {
  const swEntry =
    typeof inlineConfig.build?.rollupOptions?.input === 'string'
      ? inlineConfig.build.rollupOptions.input
      : 'src/sw.js'

  inlineConfig.build = {
    ...inlineConfig.build,
    rolldownOptions: {
      input: swEntry,
      output: {
        codeSplitting: false,
        entryFileNames: 'sw.mjs',
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'es-toolkit/compat/range': path.resolve('src/compat-shims/range.ts'),
      'es-toolkit/compat/get': path.resolve('src/compat-shims/get.ts'),
      'es-toolkit/compat/omit': path.resolve('src/compat-shims/omit.ts'),
      'es-toolkit/compat/maxBy': path.resolve('src/compat-shims/maxBy.ts'),
      'es-toolkit/compat/sumBy': path.resolve('src/compat-shims/sumBy.ts'),
      'es-toolkit/compat/sortBy': path.resolve('src/compat-shims/sortBy.ts'),
      'es-toolkit/compat/throttle': path.resolve('src/compat-shims/throttle.ts'),
      'es-toolkit/compat/last': path.resolve('src/compat-shims/last.ts'),
      'es-toolkit/compat/minBy': path.resolve('src/compat-shims/minBy.ts'),
      'es-toolkit/compat/isPlainObject': path.resolve('src/compat-shims/isPlainObject.ts'),
      'es-toolkit/compat/uniqBy': path.resolve('src/compat-shims/uniqBy.ts'),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      integration: {
        configureCustomSWViteBuild: configureServiceWorkerBuild,
      },
      injectManifest: {
        /**
         * Harta stă în afara precache-ului.
         *
         * `mapbox-gl` are 1,8 MB și e folosit de două ecrane. Precachat, îl descarcă la
         * instalarea PWA-ului oricine, inclusiv de pe date mobile, ca să nu-l atingă niciodată.
         * Se încarcă la cerere, ca orice alt chunk lazy, și e oricum cache-uit de browser după.
         *
         * Numele vin din grupul `vendor-mapbox` de mai jos, nu din cel ales de bundler. Lista
         * enumera înainte numele componentelor, dar chunk-ul partajat se numește după unul dintre
         * modulele lui — deci un fișier nou lângă hartă îl rebotează și scoate tăcut cei 1,8 MB
         * de sub excludere. Un grup numit explicit nu se poate redenumi singur.
         */
        globIgnores: ['**/vendor-mapbox-*.js', '**/vendor-mapbox-*.css'],
      },
      manifest: {
        name: 'Ridelance',
        short_name: 'Ridelance',
        description: 'Ridelance - înrolare și management PFA pentru șoferi Uber și Bolt din România.',
        theme_color: '#5CCBF5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|scheduler|react-router|react-redux|redux|@reduxjs)/,
            },
            {
              name: 'vendor-mui-core',
              test: /node_modules\/(@mui\/material|@mui\/icons-material|@emotion)/,
            },
            {
              name: 'vendor-mui-x',
              test: /node_modules\/@mui\/x-/,
            },
            {
              name: 'vendor-motion',
              test: /node_modules\/(motion|lenis|@studio-freight)/,
            },
            // Numit explicit ca să aibă un nume stabil: `globIgnores` de mai sus îl ține în
            // afara precache-ului, iar o excludere pe un nume pe care îl alege bundlerul se
            // rupe la prima refactorizare.
            {
              name: 'vendor-mapbox',
              test: /node_modules\/mapbox-gl/,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 750,
  },
})
