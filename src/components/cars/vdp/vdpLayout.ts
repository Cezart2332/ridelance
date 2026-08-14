/**
 * Măsurile paginii de detaliu, dintr-un singur loc.
 *
 * Sunt exact cele din specul de design: grilă de 1184px, coloană dreaptă de 293px, ritm vertical
 * dat de linii hairline la 36px distanță. Stau aici, nu în `TOKENS`, fiindcă sunt ale acestei
 * pagini — scara generală a aplicației rămâne cea din `src/constants/tokens.ts`.
 *
 * `headerOffset` e suma barelor lipite sus (headerul site-ului + bara de secțiuni). Orice derulare
 * programatică trebuie să scadă valoarea asta, altfel titlul secțiunii ajunge sub ele.
 */
export const VDP = {
  maxWidth: 1184,
  gutter: 24,
  rightColumn: 293,
  columnGap: 56,

  radius: { card: 12, image: 8 },

  /** Spațiul de deasupra și de dedesubtul liniei care desparte două secțiuni. */
  sectionGap: 36,

  subnavHeight: 56,
  /** Înălțimea `AppBar`-ului din `AppLayout`: 64 pe mobil, 72 pe desktop. */
  siteHeader: { xs: 64, md: 72 },
  headerOffset: { xs: 64 + 56, md: 72 + 56 },

  /** Titlurile din spec sunt display: foarte grase, cu tracking negativ. */
  display: { fontWeight: 900, letterSpacing: '-0.025em' },
} as const

/** Ieșirea din grilă pentru benzile care ating marginile ferestrei (hartă, breadcrumbs). */
export const fullBleed = {
  width: '100vw',
  marginLeft: 'calc(50% - 50vw)',
} as const
