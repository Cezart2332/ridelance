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
    // Pagina nu se desenează sub bara de stare și sub zona de jos a iPhone-ului.
    contentInset: 'always',
  },
  plugins: {
    SystemBars: {
      // Pe Android WebView-ul primește marginile barelor de sistem, fără `viewport-fit=cover`.
      insetsHandling: 'native',
    },
  },
}

export default config
