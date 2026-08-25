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
   * Banda de logouri de pe pagina publică: o casetă de 40×40 pentru fiecare.
   *
   * Logourile își păstrează proporția înăuntru, nu se întind la pătrat — întinse, „asigurari.ro"
   * și „eldrive", care sunt de patru ori mai late decât înalte, ar fi ieșit strivite. Egal e
   * spațiul primit, nu pixelii umpluți.
   */
  wall: {
    maxWidth: 40,
    maxHeight: 40,
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
