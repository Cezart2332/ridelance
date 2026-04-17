export type TaxSystem = 'real' | 'norma'

export const GROSS_MINIMUM_SALARY = 4050
export const UBER_BOLT_ANNUAL_INCOME_NORM = 49100

export interface TaxConfig {
  yearlyIncome: number
  yearlyDeductibleExpenses: number
}

export interface TaxBreakdown {
  incomeTax: number
  cas: number
  cass: number
  totalTaxes: number
}

export interface TaxResult {
  system: TaxSystem
  annualIncome: number
  annualExpenses: number
  taxBase: number
  breakdown: TaxBreakdown
  moneyKept: number
}

function clampPositive(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return value
}

function calculateCAS(base: number, minimumSalary: number) {
  const yearlyThreshold = 12 * minimumSalary
  if (base < yearlyThreshold) {
    return 0
  }

  return 0.25 * yearlyThreshold
}

function calculateCASS(base: number, minimumSalary: number) {
  const threshold6 = 6 * minimumSalary
  const threshold12 = 12 * minimumSalary
  const threshold24 = 24 * minimumSalary

  if (base < threshold6) {
    return 0
  }

  if (base < threshold12) {
    return 0.1 * threshold6
  }

  if (base < threshold24) {
    return 0.1 * threshold12
  }

  return 0.1 * threshold24
}

function buildBreakdown(taxBase: number, minimumSalary: number): TaxBreakdown {
  const incomeTax = 0.1 * taxBase
  const cas = calculateCAS(taxBase, minimumSalary)
  const cass = calculateCASS(taxBase, minimumSalary)

  return {
    incomeTax,
    cas,
    cass,
    totalTaxes: incomeTax + cas + cass,
  }
}

export function calculateRealSystem(config: TaxConfig): TaxResult {
  const yearlyIncome = clampPositive(config.yearlyIncome)
  const yearlyDeductibleExpenses = clampPositive(config.yearlyDeductibleExpenses)
  const minimumSalary = GROSS_MINIMUM_SALARY

  const annualIncome = yearlyIncome
  const annualExpenses = yearlyDeductibleExpenses
  const taxBase = Math.max(0, annualIncome - annualExpenses)
  const breakdown = buildBreakdown(taxBase, minimumSalary)
  const moneyKept = Math.max(0, annualIncome - annualExpenses - breakdown.totalTaxes)

  return {
    system: 'real',
    annualIncome,
    annualExpenses,
    taxBase,
    breakdown,
    moneyKept,
  }
}

export function calculateNormaSystem(config: TaxConfig): TaxResult {
  const yearlyIncome = clampPositive(config.yearlyIncome)
  const minimumSalary = GROSS_MINIMUM_SALARY

  const annualIncome = yearlyIncome
  const taxBase = UBER_BOLT_ANNUAL_INCOME_NORM
  const breakdown = buildBreakdown(taxBase, minimumSalary)
  const moneyKept = Math.max(0, annualIncome - breakdown.totalTaxes)

  return {
    system: 'norma',
    annualIncome,
    annualExpenses: 0,
    taxBase,
    breakdown,
    moneyKept,
  }
}

export function formatRon(value: number) {
  return new Intl.NumberFormat('ro-RO', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}