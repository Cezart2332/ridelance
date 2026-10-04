import type { FiscalOverviewRow, FiscalThresholds } from '../../api/types'
import type { PanelTone } from '../../../../components/panel/panelUtils'

/** Ziua din an a datei `yyyy-MM-dd` (1 ianuarie = 1). */
function dayOfYear(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const current = Date.UTC(year, month - 1, day)
  return Math.floor((current - Date.UTC(year, 0, 0)) / 86_400_000)
}

/** Încasările anului duse liniar până la 31 decembrie, din ritmul de până la data rulării. */
export function projectedTurnover(row: FiscalOverviewRow): number | null {
  if (row.grossIncome === null || !row.asOf) return null
  const days = Math.max(1, dayOfYear(row.asOf))
  const year = Number(row.asOf.slice(0, 4))
  const daysInYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
  return (row.grossIncome / days) * daysInYear
}

/** Cât din plafonul TVA art. 310 s-a atins și tonul: roșu la proiecție peste plafon, galben de la 75%. */
export function vatRisk(row: FiscalOverviewRow, thresholds: FiscalThresholds | null): { ratio: number; tone: PanelTone | null; projection: number | null } | null {
  if (!thresholds || row.grossIncome === null) return null
  const ratio = row.grossIncome / thresholds.vatArt310
  const projection = projectedTurnover(row)
  if (ratio >= 1 || (projection !== null && projection >= thresholds.vatArt310)) return { ratio, tone: 'red', projection }
  return { ratio, tone: ratio >= 0.75 ? 'yellow' : null, projection }
}

/** Pragul CAS următor (12× sau 24×) și dacă venitul net a ajuns la 90% din el. */
export function casThreshold(row: FiscalOverviewRow, thresholds: FiscalThresholds | null): { label: string; value: number; near: boolean } | null {
  if (!thresholds || row.netIncome === null) return null
  const net = row.netIncome
  if (net >= thresholds.cas24) return null
  const [label, value] = net < thresholds.cas12 ? ['12×', thresholds.cas12] : ['24×', thresholds.cas24]
  return { label, value, near: net >= value * 0.9 }
}

/** Insigna profilului fiscal: eticheta situației sau cât de departe e PFA-ul de completare. */
export function profileBadge(row: FiscalOverviewRow | undefined): { tone: PanelTone; label: string } {
  if (!row || row.profileStatus === 'NOT_STARTED') return { tone: 'yellow', label: 'Necompletat' }
  if (row.profileStatus === 'DRAFT') return { tone: 'yellow', label: 'Ciornă' }
  return { tone: 'gray', label: row.profileLabel ?? 'Standard' }
}
