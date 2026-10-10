import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'

/**
 * `--mode native` construiește aplicația mobilă (Capacitor), în `dist-native`.
 *
 * Adresa API-ului e obligatorie: pe telefon, căderea pe `localhost:5000` ar da o aplicație care se
 * deschide și nu se loghează niciodată, fără nicio eroare vizibilă la build.
 */
function nativeBuildEnv(mode: string) {
  if (mode !== 'native') return { isNative: false }
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (!env.VITE_API_BASE_URL) {
    throw new Error('Build-ul nativ cere VITE_API_BASE_URL (adresa publică a API-ului), de ex. în .env.native.local.')
  }
  return { isNative: true }
}

/**
 * Identificatorul build-ului: copt în bundle (`__APP_BUILD__`) și publicat în `/version.json`.
 * O filă deschisă îl compară cu cel de pe server și află așa de un deploy nou (`utils/appVersion`).
 */
const APP_BUILD = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { isNative } = nativeBuildEnv(mode)

  return {
  define: {
    __APP_BUILD__: JSON.stringify(APP_BUILD),
  },
  server: {
    // Buildurile .NET rescriu executabile blocate de Windows; nu sunt surse frontend.
    watch: { ignored: ['**/backend/**'] },
  },
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
    // `index.html` află de aici dacă e aplicația mobilă: ecranul de pornire static e doar al ei.
    {
      name: 'native-flag',
      transformIndexHtml: (html: string) =>
        html
          .replace('__NATIVE_APP__', isNative ? 'true' : 'false')
          .replace('__VIEWPORT_LOCK__', isNative ? ', maximum-scale=1.0, user-scalable=no' : ''),
    },
    {
      name: 'app-version',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: APP_BUILD }) })
      },
    },
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Worker-ul pdf.js vine din npm ca `.mjs`. Unele servere (nginx fără `.mjs` în mime.types,
        // WebView-ul aplicației mobile) îl trimit ca application/octet-stream, iar browserul refuză
        // modulul. Ca `.js` are tipul corect oriunde.
        assetFileNames: (asset) =>
          (asset.names[0] ?? '').endsWith('.mjs') ? 'assets/[name]-[hash].js' : 'assets/[name]-[hash][extname]',
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
              test: /node_modules\/motion/,
            },
            // Harta (1,8 MB) într-un chunk al ei, încărcat doar de ecranele care o folosesc.
            {
              name: 'vendor-mapbox',
              test: /node_modules\/mapbox-gl/,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 750,
    outDir: isNative ? 'dist-native' : 'dist',
  },
  }
})
