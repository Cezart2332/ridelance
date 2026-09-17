/**
 * Aplicația mobilă (Capacitor) e același cod ca site-ul, construit cu `vite build --mode native`.
 *
 * Constanta vine din build, nu din `Capacitor.isNativePlatform()`: așa ramurile de site (onboarding,
 * abonamente, plăți) se pot tăia la compilare, iar un site deschis dintr-un WebView oarecare nu
 * se crede aplicație.
 *
 * Ce lipsește din aplicație, intenționat: onboardingul, orice plată (abonamente, servicii
 * individuale, istoricul plăților) și site-ul public. Magazinele cer ca plățile pentru conținut
 * digital să treacă prin sistemul lor; aplicația e doar dashboardul unui cont deja activ.
 */
// `?.`: testele Playwright importă configurările de meniu direct în Node, unde `import.meta.env` nu există.
export const IS_NATIVE_APP = import.meta.env?.VITE_NATIVE_APP === 'true'

/** Ecranul pentru conturile care nu au ce vedea încă în aplicație. */
export const NATIVE_UNAVAILABLE_PATH = '/app/indisponibil'

export type NativeUnavailableReason = 'onboarding' | 'abonament' | 'srl' | 'rol' | 'eroare'

export const nativeUnavailablePath = (reason: NativeUnavailableReason) =>
  `${NATIVE_UNAVAILABLE_PATH}?motiv=${reason}`
