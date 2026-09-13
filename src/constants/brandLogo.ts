import logoWithMottoSvg from '../assets/logowithmotto.svg?raw'

/**
 * Logoul complet (RIDElance + „Independent. Dar nu singur."), pentru fundaluri închise.
 *
 * Albastrul rămâne al logoului; doar gri-ul închis — „RIDE" și motto-ul — devine deschis, altfel
 * #3F3E3F nu s-ar citi pe bleumarin. Culoarea se schimbă aici, nu în fișierul SVG, ca varianta
 * pentru fundal deschis să rămână sursa.
 */
export const LOGO_WITH_MOTTO_ON_DARK = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  logoWithMottoSvg.replaceAll('#3F3E3F', '#DCE1E8'),
)}`
