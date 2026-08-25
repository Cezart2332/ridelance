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
   * Banda de logouri de pe pagina publică: jumătate din celula lor.
   *
   * În procente, nu în pixeli, ca logourile să urmeze celula pe fiecare lățime de ecran. Cere o
   * celulă cu înălțime definită — un procent măsurat față de o înălțime `auto` nu înseamnă nimic
   * și se comportă ca `none`.
   */
  wall: {
    maxWidth: '50%',
    maxHeight: '50%',
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
