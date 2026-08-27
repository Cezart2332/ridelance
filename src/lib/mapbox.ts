/**
 * Accesul la Mapbox, într-un singur loc.
 *
 * Token-ul e o variabilă de mediu, nu o constantă în cod: e publishable prin design, dar tot nu
 * are ce căuta în repo — se setează pe mediul de rulare. În dezvoltare lipsește de obicei, iar
 * componentele care folosesc harta trebuie să arate ceva util, nu o pânză gri.
 */
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export const MAPBOX_AVAILABLE = MAPBOX_TOKEN.length > 0

/**
 * Stilul folosit peste tot: întunecat, recolorat la rulare de `applyBrandTint`.
 *
 * Varianta deschisă a fost încercată întâi și a picat pe același lucru de fiecare dată — străzi
 * albe pe uscat aproape alb, pastile albe peste ele. Pe fond întunecat, fiecare element pus
 * deasupra e alb sau colorat, deci se desprinde fără să fie nevoie să-l îngroșăm.
 */
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11'

/** Centrul implicit — București — pentru harta fără niciun punct de arătat. */
export const DEFAULT_CENTER: [number, number] = [26.1025, 44.4268]
export const DEFAULT_ZOOM = 10.5
