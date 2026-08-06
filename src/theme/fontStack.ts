/**
 * Fontul platformei. Trăiește separat de teme fiindcă îl folosesc amândouă (produsul din
 * `src/main.tsx` și adminul din `adminTheme`), iar dacă e definit de două ori încep să difere.
 *
 * Fișierele vin din `@fontsource-variable/geist`, importat o singură dată în `src/main.tsx`.
 */
export const fontStack = [
  '"Geist Variable"',
  '"Geist"',
  '"SF Compact Display"',
  '"SF Pro Display"',
  '"SF Compact Text"',
  '"SF Pro Text"',
  '"SF Pro"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(', ')
