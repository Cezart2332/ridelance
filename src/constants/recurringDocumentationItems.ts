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
    id: 'factura-comision-uber',
    label: 'Factură comision Uber',
    category: 'FacturaComisionUber',
  },
  {
    id: 'factura-comision-bolt',
    label: 'Factură comision Bolt',
    category: 'FacturaComisionBolt',
  },
  {
    id: 'facturi-cheltuieli',
    label: 'Facturi cheltuieli deductibile',
    category: 'Cheltuiala',
    useExpenseUpload: true as const,
  },
  {
    id: 'decont-tva-intracomunitar',
    label: 'Decont TVA intracomunitar',
    category: 'DecontTvaIntracomunitar',
    contabilUploads: true as const,
  },
  {
    id: 'decont-taxa-nerezident',
    label: 'Decont taxă nerezident',
    category: 'DecontTaxaNerezident',
    contabilUploads: true as const,
  },
] as const

export type RecurringDocumentationItem = (typeof RECURRING_DOCUMENTATION_ITEMS)[number]

export function recurringItemUsesExpenseUpload(
  item: RecurringDocumentationItem,
): item is RecurringDocumentationItem & { useExpenseUpload: true } {
  return 'useExpenseUpload' in item && Boolean((item as { useExpenseUpload?: boolean }).useExpenseUpload)
}

/** Items uploaded each month by the accountant (deconturi), not by the client. */
export function recurringItemUploadedByContabil(item: RecurringDocumentationItem): boolean {
  return 'contabilUploads' in item && Boolean((item as { contabilUploads?: boolean }).contabilUploads)
}

export const RECURRING_DOCUMENTATION_CATEGORIES = RECURRING_DOCUMENTATION_ITEMS.map(
  (item) => item.category,
)
