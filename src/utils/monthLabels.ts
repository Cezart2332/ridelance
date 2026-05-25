/** Short labels for charts (Jan–Dec). */
export const MONTH_CHART_LABELS = [
  'Ian',
  'Feb',
  'Mar',
  'Apr',
  'Mai',
  'Iun',
  'Iul',
  'Aug',
  'Sep',
  'Oct',
  'Noi',
  'Dec',
] as const;

export const ROMANIAN_MONTHS = [
  'Ianuarie',
  'Februarie',
  'Martie',
  'Aprilie',
  'Mai',
  'Iunie',
  'Iulie',
  'August',
  'Septembrie',
  'Octombrie',
  'Noiembrie',
  'Decembrie',
] as const;

export function monthLabelToNumber(label: string): number {
  const index = ROMANIAN_MONTHS.indexOf(label as (typeof ROMANIAN_MONTHS)[number]);
  return index >= 0 ? index + 1 : new Date().getMonth() + 1;
}

export function monthNumberToLabel(month: number): string {
  return ROMANIAN_MONTHS[month - 1] ?? ROMANIAN_MONTHS[new Date().getMonth()];
}

export function currentMonthYear(): { year: number; month: number; label: string } {
  const now = new Date();
  const month = now.getMonth() + 1;
  return { year: now.getFullYear(), month, label: monthNumberToLabel(month) };
}
