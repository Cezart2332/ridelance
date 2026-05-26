import { deductibleExpensesData } from '../data/cheltuieliDeductibile'

export interface DeductibleExpenseOption {
  id: string
  category: string
  name: string
  deductible: string
  label: string
}

export const deductibleExpenseOptions: DeductibleExpenseOption[] = deductibleExpensesData.flatMap(
  (cat) =>
    cat.items.map((item) => ({
      id: `${cat.name}::${item.name}`,
      category: cat.name,
      name: item.name,
      deductible: item.deductible,
      label: `${item.name} (${item.deductible})`,
    })),
)

export function findDeductibleOption(query: string): DeductibleExpenseOption | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return deductibleExpenseOptions.find(
    (o) => o.label.toLowerCase() === q || o.name.toLowerCase() === q,
  )
}
