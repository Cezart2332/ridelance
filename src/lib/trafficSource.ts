/**
 * De unde a venit vizitatorul, reținut pe durata sesiunii.
 *
 * Parametrii `utm_*` stau în URL doar la prima pagină deschisă. Cine intră dintr-o reclamă și abia
 * apoi răsfoiește câteva anunțuri ar apărea, fără asta, ca trafic direct pe toate în afară de
 * primul — iar cererea trimisă la final, cea care contează, ar apărea tot ca directă.
 *
 * Se citește o dată, la prima încărcare, și se ține în `sessionStorage`: o sesiune, o sursă.
 * Nu e o identificare a persoanei și nu se leagă de nimic din ce face utilizatorul — e numele
 * campaniei, atât.
 */

const KEY = 'ridelance.source'

/** Vizită directă pe pagina anunțului. Aceeași valoare implicită ca pe server. */
export const DIRECT_SOURCE = 'vdp'

/** Aceleași reguli ca `TrafficSource.Normalize` de pe server, ca să nu trimitem ce oricum se taie. */
function normalize(raw: string | null): string | null {
  if (!raw) return null

  const cleaned = raw.trim().replace(/[^a-zA-Z0-9\-_.]/g, '')
  return cleaned ? cleaned.slice(0, 32) : null
}

/** Domeniul din care s-a venit, când n-avem `utm_source`: „google", „facebook". */
function fromReferrer(): string | null {
  if (!document.referrer) return null

  try {
    const host = new URL(document.referrer).hostname
    // Navigarea în interiorul site-ului nu e o sursă externă.
    if (host === window.location.hostname) return null

    return normalize(host.replace(/^www\./, '').split('.')[0])
  } catch {
    return null
  }
}

/**
 * Sursa sesiunii curente. Prima chemare o stabilește, restul o citesc.
 *
 * `sessionStorage` poate lipsi (fereastră privată strictă, browser cu stocarea blocată); atunci
 * răspunsul e sursa din URL sau vizită directă, ceea ce e destul.
 */
export function currentSource(): string {
  const fromUrl = normalize(new URLSearchParams(window.location.search).get('utm_source'))

  try {
    const stored = window.sessionStorage.getItem(KEY)

    // URL-ul bate ce e reținut: un al doilea link de campanie, în aceeași sesiune, e o campanie nouă.
    if (fromUrl) {
      window.sessionStorage.setItem(KEY, fromUrl)
      return fromUrl
    }

    if (stored) return stored

    const referrer = fromReferrer()
    if (referrer) {
      window.sessionStorage.setItem(KEY, referrer)
      return referrer
    }
  } catch {
    // Stocarea blocată nu e un motiv să nu numărăm vizita.
  }

  return fromUrl ?? fromReferrer() ?? DIRECT_SOURCE
}
