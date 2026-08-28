/**
 * Rutele publice de autentificare, într-un singur loc.
 *
 * Până acum șirul `/auth` era scris de mână în 13 fișiere, iar interceptorul din `lib/axios.ts`
 * se baza pe `startsWith('/auth')` — o gardă care ar fi prins din accident și `/autentificare`.
 * Cu spec-ul de redesign login și register devin rute distincte, deci prefixul comun dispare
 * și potrivirea trebuie să fie exactă.
 */
export const ROUTES = {
  login: '/autentificare',
  register: '/inregistrare',
  /** Înregistrare pentru conturile de închiriere mașini (rol `CarPoster`). */
  registerCarPoster: '/inregistrare/anunturi',
  /** Confirmarea adresei, imediat după crearea contului. */
  verifyEmail: '/confirmare-email',
  forgotPassword: '/parola-uitata',
  /**
   * Semnarea unui document de închiriere, deschisă din email.
   *
   * Publică prin proiectare: chiriașul n-are cont RIDElance. Tokenul din cale e autentificarea.
   */
  signDocument: '/semneaza/:token',
} as const
