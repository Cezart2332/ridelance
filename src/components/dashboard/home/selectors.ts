import type { RealProfit } from '../../../services/pfaDashboard.service'
import type { PeriodPreset } from './useDashboardFilters'

const COMPARISON_LABELS: Record<PeriodPreset, string> = {
  week: 'vs săptămâna anterioară',
  month: 'vs luna anterioară',
  prevMonth: 'vs luna precedentă ei',
  year: 'vs anul anterior',
  custom: 'vs perioada anterioară echivalentă',
}

/** Ce înseamnă delta de pe carduri, în cuvinte. Aceeași frază pe orice pagină o arată. */
export function comparisonLabelFor(period: PeriodPreset): string {
  return COMPARISON_LABELS[period] ?? COMPARISON_LABELS.custom
}

/**
 * Derivarea comună a cifrelor financiare.
 *
 * Acasă și Situație financiară arată aceleași valori, la nivel de bit. Ele vin din același
 * endpoint, dar asta singur nu ajunge: în momentul în care o pagină își calculează local
 * fie și o scădere, cele două se pot despărți. Tot ce nu e citit direct din DTO se calculează
 * aici, o singură dată, și se folosește din ambele locuri.
 */
export interface FinancialBreakdown {
  netEarnings: number
  deductibleExpenses: number
  estimatedTaxes: number
  realProfit: number
  /** Ce rămâne după ce pui taxele deoparte, înainte de cheltuieli. */
  availableAfterTaxes: number
  retentionRatio: number | null
  isNegative: boolean
  /** Suma inclusă în profit al cărei document nu a fost încă verificat de RIDElance. */
  awaitingReview: number
}

export function selectFinancialBreakdown(profit: RealProfit): FinancialBreakdown {
  return {
    netEarnings: profit.netEarnings,
    deductibleExpenses: profit.deductibleExpenses,
    estimatedTaxes: profit.estimatedTaxes,
    realProfit: profit.value,
    availableAfterTaxes: profit.netEarnings - profit.estimatedTaxes,
    retentionRatio: profit.retentionRatio,
    isNegative: profit.value < 0,
    awaitingReview: profit.expensesAwaitingReview,
  }
}

export interface WaterfallStep {
  key: string
  label: string
  amount: number
  /** Rândul final are separator deasupra și greutate mai mare. */
  isResult?: boolean
}

/** Cascada „încasări − cheltuieli − taxe = profit", fără culori: acelea vin din `CHART`. */
export function selectRealProfitWaterfall(profit: RealProfit): WaterfallStep[] {
  const breakdown = selectFinancialBreakdown(profit)
  return [
    { key: 'net', label: 'Încasări nete', amount: breakdown.netEarnings },
    { key: 'expenses', label: 'Cheltuieli deductibile', amount: -breakdown.deductibleExpenses },
    { key: 'taxes', label: 'Taxe estimate', amount: -breakdown.estimatedTaxes },
    { key: 'result', label: 'Profit real estimat', amount: breakdown.realProfit, isResult: true },
  ]
}
