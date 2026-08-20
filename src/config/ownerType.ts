/**
 * Tipul de proprietar al unui cont de business: PFA sau SRL.
 *
 * E o dimensiune **separată de rol**, în mod deliberat. Spec-ul §1.1 cerea redenumirea enum-ului
 * `UserRole` în `Pfa | Srl`, dar `CarPoster` nu e doar o etichetă: decide permisiuni
 * (`PermissionProvider`), accesul la mașini (`CarAccessHelper`) și dacă listarea se plătește
 * (`CreateCarCommand`). Redenumirea lui ar fi transformat un refactor de UI într-o schimbare de
 * autorizare și de plăți.
 *
 * Așa că rolul rămâne rolul — mecanismul tehnic de acces — iar `OwnerType` e citirea de business
 * a aceleiași informații: cine e entitatea din spatele contului. Restul aplicației se ramifică pe
 * `OwnerType`, nu pe rol, ca ziua în care rolurile se restructurează să nu atingă niciun ecran.
 *
 * Vezi `NOTES-srl-restructure.md` §3 și §6.3.
 */
export type OwnerType = 'Pfa' | 'Srl'

/** Denumirile din interfață. Singurul loc unde „PFA" și „SRL" se scriu ca text. */
export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  Pfa: 'PFA',
  Srl: 'SRL',
}

/**
 * Traduce rolul primit de la API în tipul de proprietar.
 *
 * `null` pentru rolurile care nu sunt conturi de business (`Admin`, `Contabil`) — acelea au
 * dashboard-uri proprii și nu trec niciodată prin ramificațiile pe `OwnerType`.
 */
export function ownerTypeFromRole(role: string | null | undefined): OwnerType | null {
  if (role === 'Client') return 'Pfa'
  if (role === 'CarPoster') return 'Srl'
  return null
}
