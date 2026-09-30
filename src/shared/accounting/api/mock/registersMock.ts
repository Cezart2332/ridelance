import type {
  Asset,
  DepreciationLine,
  FixedAssetCandidate,
  FixedAssetReview,
  InventoryCount,
  InventoryItem,
  IsoDate,
  LedgerEntry,
} from '../types'
import { round2 } from './helpers'
import type { MockDb } from './mockDb'

/** Funcțiile pure ale registrelor din mock (spec registre §5–§6), aceleași reguli ca serverul. */

/** Pragul de mijloc fix și categoriile de consum (fixed_asset_rules pe server). */
export const FIXED_ASSET_THRESHOLD = 2500
const CONSUMABLES = ['FUEL', 'CAR_SERVICE', 'CAR_INSURANCE', 'CAR_WASH', 'PHONE', 'PERSONAL', 'DEPRECIATION', 'PLATFORM_COMMISSION']

const monthStart = (date: IsoDate) => `${date.slice(0, 7)}-01`

function addMonths(date: IsoDate, months: number): IsoDate {
  const [year, month] = date.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}-01`
}

export function isComplete(asset: Asset): boolean {
  return Boolean(asset.inServiceDate) && (asset.kind === 'INVENTORY_OBJECT' || (Boolean(asset.depreciationClassCode) && (asset.normalLifeMonths ?? 0) > 0))
}

/** Planul liniar din luna următoare punerii în funcțiune; diferența de rotunjire în ultima lună. */
export function depreciationPlan(asset: Asset): DepreciationLine[] {
  if (asset.kind !== 'FIXED_ASSET' || !isComplete(asset) || !asset.inServiceDate || !asset.normalLifeMonths) return []
  const life = asset.normalLifeMonths
  const monthly = round2(asset.entryValue / life)
  const first = addMonths(monthStart(asset.inServiceDate), 1)
  const stop = asset.disposalDate ? monthStart(asset.disposalDate) : null
  const lines: DepreciationLine[] = []
  let accumulated = 0
  for (let index = 0; index < life; index += 1) {
    const month = addMonths(first, index)
    if (stop && month > stop) break
    const amount = index === life - 1 ? round2(asset.entryValue - monthly * (life - 1)) : monthly
    accumulated = round2(accumulated + amount)
    lines.push({ year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)), amount, accumulated, remaining: round2(asset.entryValue - accumulated), isLocked: false })
  }
  return lines
}

/** Activul cu amortizarea cumulată și valoarea rămasă la `asOf`. */
export function assetAt(asset: Asset, asOf: IsoDate): Asset {
  const lines = depreciationPlan(asset)
  const accumulated = round2(
    lines.filter((line) => `${line.year}-${String(line.month).padStart(2, '0')}-01` <= asOf).reduce((sum, line) => sum + line.amount, 0),
  )
  const remaining = round2(asset.entryValue - accumulated)
  const status = asset.status === 'ACTIVE' && lines.length > 0 && remaining === 0 ? 'FULLY_DEPRECIATED' : asset.status
  return { ...asset, status, asOf, accumulated, remaining, monthlyDepreciation: lines[0]?.amount ?? null }
}

export function nextInventoryNumber(db: MockDb, pfaId: string, kind: Asset['kind']): string {
  const prefix = kind === 'FIXED_ASSET' ? 'MF-' : 'OI-'
  const numbers = db.assets.filter((asset) => asset.pfaId === pfaId && asset.inventoryNumber.startsWith(prefix)).map((asset) => Number(asset.inventoryNumber.slice(3)) || 0)
  return `${prefix}${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`
}

/** Decizia de mijloc fix a unei plăți: cea luată de Admin, altfel propunerea Tax Engine. */
export function reviewOf(db: MockDb, entry: LedgerEntry): FixedAssetReview {
  const decided = db.fixedAssetDecisions[entry.id]
  if (decided) return decided
  const candidate =
    entry.transactionType === 'EXPENSE' &&
    Math.abs(entry.amount) - (entry.personalAmount ?? 0) >= FIXED_ASSET_THRESHOLD &&
    !CONSUMABLES.includes(entry.category ?? '')
  return candidate ? 'PENDING' : 'NONE'
}

export function candidates(db: MockDb, pfaId: string): FixedAssetCandidate[] {
  return db.ledger
    .filter((entry) => entry.pfaId === pfaId && reviewOf(db, entry) === 'PENDING')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ledgerEntryId: entry.id,
      date: entry.date,
      documentLabel: entry.documentLabel,
      description: entry.description,
      counterparty: entry.counterparty,
      amount: entry.amount,
      category: entry.category,
      review: 'PENDING' as const,
    }))
}

/** Precompletarea inventarului: activele, numerarul calculat, fără bancă și datorii în mock. */
export function prefill(db: MockDb, pfaId: string, date: IsoDate, nextId: (prefix: string) => string): InventoryItem[] {
  const item = (category: InventoryItem['category'], description: string, value: number, requiresConfirmation: boolean, sourceType: string | null, sourceId: string | null): InventoryItem => ({
    id: nextId('inv-item'),
    category,
    description,
    systemValue: round2(value),
    confirmedValue: null,
    difference: 0,
    sourceType,
    sourceId,
    status: 'PREFILLED',
    requiresConfirmation,
    note: null,
  })
  const items = db.assets
    .filter((asset) => asset.pfaId === pfaId && asset.entryDate <= date && (!asset.disposalDate || asset.disposalDate > date))
    .map((asset) => assetAt(asset, date))
    .map((asset) =>
      item(asset.kind === 'FIXED_ASSET' ? 'FIXED_ASSETS' : 'INVENTORY_OBJECTS', `${asset.inventoryNumber} ${asset.name}`, asset.remaining, false, 'PfaAsset', asset.id),
    )
  const cash = db.ledger
    .filter((entry) => entry.pfaId === pfaId && entry.date <= date && entry.paymentMethod === 'CASH' && entry.transactionType !== 'PLATFORM_SETTLEMENT')
    .reduce((sum, entry) => sum + entry.amount, 0)
  items.push(item('CASH', 'Numerar în casă (calculat din registru)', cash, true, 'Ledger', null))
  return items
}

export function withTotals(count: InventoryCount): InventoryCount {
  const items = count.items.map((item) => ({ ...item, difference: round2((item.confirmedValue ?? item.systemValue) - item.systemValue) }))
  const total = round2(items.filter((item) => item.status !== 'REMOVED').reduce((sum, item) => sum + (item.confirmedValue ?? item.systemValue), 0))
  return { ...count, items, total }
}

export function needsNote(item: InventoryItem): boolean {
  return item.difference !== 0 || item.status === 'REMOVED' || item.status === 'ADDED_MANUALLY'
}
