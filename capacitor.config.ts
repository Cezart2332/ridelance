import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Aplicația mobilă RIDElance: dashboardurile PFA și SRL, fără onboarding și fără plăți.
 *
 * Conținutul e build-ul `npm run build:native` (vezi `src/native/platform.ts`). `appId` e
 * identitatea aplicației în Google Play și App Store și nu se mai poate schimba după prima publicare.
 */
const config: CapacitorConfig = {
  appId: 'ro.ridelance.app',
  appName: 'RIDElance',
  webDir: 'dist-native',
  ios: {
    // Pe tot ecranul, și sub bara de stare, și sub zona de jos: cu `always`, iOS lăsa acolo două
    // benzi negre. Spațiul pentru bare îl pune pagina, prin `--sat`/`--sab` (index.html).
    contentInset: 'never',
  },
  plugins: {
    SystemBars: {
      // Tot pe tot ecranul (`viewport-fit=cover` din index.html), cu marginile barelor date paginii
      // și ca variabile `--safe-area-inset-*` — pe WebView-urile mai vechi `env()` dă 0.
      insetsHandling: 'css',
    },
  },
}

export default config
