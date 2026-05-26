const ROMANIA_TZ = 'Europe/Bucharest'

/** Start/end of calendar month in Romania, as UTC Date for comparisons */
export function getRomaniaMonthBounds(date = new Date()): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROMANIA_TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start, end }
}

export function isUploadedInRomaniaMonth(uploadedAtUtc: string, date = new Date()): boolean {
  const uploaded = new Date(uploadedAtUtc)
  const { start, end } = getRomaniaMonthBounds(date)
  return uploaded >= start && uploaded < end
}
