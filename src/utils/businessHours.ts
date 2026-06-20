const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

export function getBucharestBusinessHoursStatus(startHour: number, endHour: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bucharest',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  const nowMinutes = hour * 60 + minute
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60
  const isOpen = WEEKDAYS.has(weekday) && nowMinutes >= startMinutes && nowMinutes < endMinutes

  return {
    isOpen,
    label: `Luni-Vineri ${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`,
  }
}
