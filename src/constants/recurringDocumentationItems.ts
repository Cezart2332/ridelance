/** Monthly recurring documentation — aligned with backend DocumentCategory */
export const RECURRING_DOCUMENTATION_ITEMS = [
  {
    id: 'extras-bancar',
    label: 'Extrase bancare (toate conturile)',
    category: 'ExtrasBancar',
  },
  {
    id: 'raport-uber',
    label: 'Raport venituri Uber',
    category: 'RaportUber',
  },
  {
    id: 'raport-bolt',
    label: 'Raport venituri Bolt',
    category: 'RaportBolt',
  },
  {
    id: 'facturi-cheltuieli',
    label: 'Facturi cheltuieli deductibile',
    category: 'Cheltuiala',
    useExpenseUpload: true as const,
  },
] as const

export type RecurringDocumentationItem = (typeof RECURRING_DOCUMENTATION_ITEMS)[number]

export function recurringItemUsesExpenseUpload(
  item: RecurringDocumentationItem,
): item is RecurringDocumentationItem & { useExpenseUpload: true } {
  return 'useExpenseUpload' in item && Boolean((item as { useExpenseUpload?: boolean }).useExpenseUpload)
}

export const RECURRING_DOCUMENTATION_CATEGORIES = RECURRING_DOCUMENTATION_ITEMS.map(
  (item) => item.category,
)
