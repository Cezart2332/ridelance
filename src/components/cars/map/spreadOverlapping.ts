/**
 * Desface în evantai punctele care s-ar suprapune pe ecran.
 *
 * Două mașini parcate la aceeași adresă cad exact pe același pixel, iar harta arată un singur pin:
 * omul vede o mașină acolo unde sunt patru. Nici clusterizarea clasică n-ar fi ajutat — ar fi
 * ascuns prețurile în spatele unui număr, adică exact informația pentru care se deschide harta.
 *
 * Aici fiecare pin rămâne al lui și rămâne apăsabil; se mută doar cu câțiva pixeli, pe un cerc în
 * jurul locului comun. Deplasarea e de aceeași mărime cu ambiguitatea pe care o rezolvă, deci nu
 * mută niciun pin într-un loc care ar induce în eroare.
 *
 * Gruparea se face în **pixeli**, nu în metri, și de aceea depinde de zoom: la vederea pe țară se
 * calcă pe picioare orașe întregi, la nivel de stradă doar mașinile din aceeași curte. Apelantul
 * recalculează la fiecare schimbare de zoom.
 */

export interface SpreadPoint {
  id: string
  latitude: number
  longitude: number
}

/** Sub atâția pixeli între ele, două pinuri se ating. Puțin peste lățimea unei pastile de preț. */
const MIN_GAP = 46

/** Cât de departe de locul real ajunge un pin desfăcut. Peste atât, evantaiul ar minți. */
const MAX_RADIUS = 34

/**
 * Deplasarea în pixeli a fiecărui punct, după id.
 *
 * `[0, 0]` pentru punctele singure — majoritatea. Se întoarce o intrare pentru fiecare punct, ca
 * apelantul să poată reseta deplasările vechi fără să țină minte care erau.
 *
 * @param project Proiecția hărții: coordonate geografice → pixeli pe ecran, la zoomul curent.
 */
export function spreadOffsets(
  points: readonly SpreadPoint[],
  project: (lngLat: [number, number]) => { x: number; y: number },
): Map<string, [number, number]> {
  const clusters: { x: number; y: number; members: string[] }[] = []

  for (const point of points) {
    const { x, y } = project([point.longitude, point.latitude])

    // Grupare lacomă: primul grup destul de aproape îl primește. Cu zeci de puncte pe ecran,
    // un algoritm mai bun n-ar schimba rezultatul, dar ar schimba cât e de citit codul.
    const near = clusters.find((cluster) => Math.hypot(cluster.x - x, cluster.y - y) < MIN_GAP)

    if (near) {
      near.members.push(point.id)
    } else {
      clusters.push({ x, y, members: [point.id] })
    }
  }

  const offsets = new Map<string, [number, number]>()

  for (const cluster of clusters) {
    const count = cluster.members.length

    if (count === 1) {
      offsets.set(cluster.members[0], [0, 0])
      continue
    }

    // Raza crește cu numărul de pinuri, ca să nu se lipească între ele pe cerc, dar se oprește
    // înainte să ducă evantaiul departe de locul real.
    const radius = Math.min(MAX_RADIUS, MIN_GAP * 0.5 + count * 2.5)

    cluster.members.forEach((id, index) => {
      // Pornim de sus și mergem în sensul acelor de ceasornic: cu două mașini ies una deasupra
      // celeilalte, ceea ce se citește ca „mai multe aici", nu ca două locuri diferite.
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2

      offsets.set(id, [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)])
    })
  }

  return offsets
}
