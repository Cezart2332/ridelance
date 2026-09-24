import { TOKENS } from '../../constants/tokens'

/**
 * Forma comună a cortinei și a antetului de login din aplicație.
 *
 * Cortina de la pornire se strânge exact în antetul de login, iar la conectare pleacă din el. Ca
 * trecerea să nu sară, amândouă se desenează din aceleași valori: aceeași culoare, aceeași înălțime,
 * aceeași curbă.
 */

export const CURTAIN_COLOR = TOKENS.ink

/** Cât coboară curba sub dreptunghiul antetului. */
export const CURVE_HEIGHT = 84

/**
 * Marginea de jos, într-un viewBox 100×100 întins pe toată lățimea: sus în dreapta, cea mai adâncă
 * spre stânga, apoi urcă puțin spre marginea din stânga.
 */
export const CURVE_PATH = 'M0 0 H100 C78 0 60 100 34 100 C18 100 6 80 0 62 Z'

/** Înălțimea dreptunghiului antetului, fără curbă: aproape o treime din ecran, în limite. */
export function authHeaderHeight(viewportHeight: number): number {
  return Math.round(Math.min(250, Math.max(170, viewportHeight * 0.26)))
}

/**
 * Logoul mare de la pornire are aceeași lățime ca în ecranul de start nativ (iOS îl întinde pe
 * ecran cu „aspect fill”): 38,36% din latura mare a ecranului. Același calcul stă în `index.html`.
 */
export const BOOT_LOGO_WIDTH = 'min(calc(0.3836 * max(100vw, 100vh)), 88vw)'
