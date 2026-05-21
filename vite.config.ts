import type { InlineConfig } from 'vite'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { VitePWA } from 'vite-plugin-pwa'

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
          ],
        },
      },
    },
    chunkSizeWarningLimit: 750,
  },
})
