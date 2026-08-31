/**
 * Tokenii de care are nevoie o ofertă de partener ca să se deseneze.
 *
 * Ofertele apar în două locuri cu palete diferite — pagina publică (`TOKENS`) și dashboardul
 * (`DASHBOARD_TOKENS`) — iar componenta nu trebuie să știe în care dintre ele e randată. Primește
 * culorile ca argument și atât.
 *
 * Sunt exact câmpurile comune celor două seturi. Adăugarea unuia nou aici cere verificarea că
 * există în ambele, altfel una dintre suprafețe randează `undefined` în CSS și nu se plânge nimeni.
 */
export interface OfferTokens {
  ink: string
  primary: string
  primaryStrong: string
  paper: string
  surface: string
  border: string
  textMuted: string
  textSubtle: string
  radius: { md: number; lg: number; xl: number; full: number }
}
