import { pfaDashboardService, type DashboardQuery } from '../../../services/pfaDashboard.service'
import { formatDate, formatTime } from './format'

/** Plafon de siguranță: un export nu are voie să tragă la nesfârșit din API. */
const MAX_ROWS = 5000
const PAGE_SIZE = 100

function escapeCell(value: string | number | null): string {
  if (value === null) return ''
  const text = String(value)
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Exportă cursele din perioada și filtrele curente. Separatorul e `;` iar zecimala `,`,
 * ca Excel-ul în locale ro-RO să deschidă fișierul fără pași de import.
 */
export async function exportRidesCsv(query: DashboardQuery): Promise<number> {
  const rows: string[] = [
    ['Data', 'Ora', 'Platforma', 'Categorie', 'Preluare', 'Destinatie', 'Distanta (km)', 'Durata (min)', 'Plata', 'Net (lei)']
      .map(escapeCell)
      .join(';'),
  ]

  let page = 1
  let total = Infinity

  while (rows.length - 1 < Math.min(total, MAX_ROWS)) {
    const response = await pfaDashboardService.getRides({
      ...query,
      page,
      pageSize: PAGE_SIZE,
      sort: '-date',
      q: '',
    })

    total = response.total
    if (response.items.length === 0) break

    response.items.forEach((ride) => {
      rows.push(
        [
          formatDate(ride.startedAtUtc),
          formatTime(ride.startedAtUtc),
          ride.platform === 'bolt' ? 'Bolt' : 'Uber',
          ride.category,
          ride.pickup,
          ride.dropoff,
          ride.distanceKm === null ? null : String(ride.distanceKm).replace('.', ','),
          ride.durationMin === null ? null : String(ride.durationMin),
          ride.paymentType === 'card' ? 'Card' : 'Cash',
          ride.net.toFixed(2).replace('.', ','),
        ]
          .map(escapeCell)
          .join(';'),
      )
    })

    page += 1
  }

  // BOM-ul face ca Excel să recunoască UTF-8 și să nu strice diacriticele.
  const blob = new Blob([`\ufeff${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `curse_${query.from}_${query.to}.csv`
  link.click()
  URL.revokeObjectURL(url)

  return rows.length - 1
}
