/**
 * Dimensiunile logourilor de partener, într-un singur loc.
 *
 * Fiecare ecran și le scria pe ale lui, așa că aceleași logouri ieșeau de mărimi diferite de la o
 * pagină la alta, iar pe pagina publică ACE avea și o excepție proprie, cu 20px peste restul.
 * Logourile nu au aceeași formă — unele sunt lungi, altele pătrate — deci se încadrează într-o
 * cutie comună și își păstrează proporția; ce e egal e spațiul pe care îl primesc, nu pixelii pe
 * care îi umplu.
 */
export const PARTNER_LOGO = {
  /**
   * Banda de logouri de pe pagina publică.
   *
   * Înălțime fixă, nu plafon: cu plafon pe ambele laturi, logourile late (asigurari.ro, eldrive)
   * se opreau în limita de lățime și ieșeau cu 13px mai scunde decât restul. Ochiul compară
   * înălțimile pe un rând, deci aceea e latura care trebuie să fie egală; lățimea urmează
   * proporția fiecărui logo, mărginită de celula lui ca să nu dea pe afară pe ecran mic.
   */
  wall: {
    height: { xs: 30, md: 48 },
    maxWidth: '100%',
  },
  /** Logo într-un rând de taburi, lângă sau în locul etichetei. */
  tab: {
    height: 26,
    maxWidth: 88,
  },
  /**
   * Cutia din antetul panoului de partener, plus logoul dinăuntru.
   *
   * Aici logoul se încadrează, nu se aliniază pe înălțime ca la bandă: cutia e mică, iar un logo
   * lat ca eldrive ar depăși-o de două ori dacă i-am fixa înălțimea.
   */
  panelBox: {
    width: 112,
    height: 68,
  },
  panel: {
    maxWidth: 90,
    maxHeight: 46,
  },
} as const
