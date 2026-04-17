import { useMemo, useState, type ChangeEvent } from 'react'
import {
  calculateNormaSystem,
  calculateRealSystem,
  formatRon,
  GROSS_MINIMUM_SALARY,
  UBER_BOLT_ANNUAL_INCOME_NORM,
  type TaxConfig,
  type TaxSystem,
} from '../lib/taxCalculator'
import './TaxCalculator.css'

const DEFAULT_VALUES: TaxConfig = {
  yearlyIncome: 96000,
  yearlyDeductibleExpenses: 12000,
}

const DEFAULT_INPUT_VALUES: Record<keyof TaxConfig, string> = {
  yearlyIncome: String(DEFAULT_VALUES.yearlyIncome),
  yearlyDeductibleExpenses: String(DEFAULT_VALUES.yearlyDeductibleExpenses),
}

function toPositiveNumber(value: string) {
  if (value.trim() === '') {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function normalizeNumberInput(value: string) {
  const digitsOnly = value.replace(/\D+/g, '')
  if (digitsOnly.length === 0) {
    return ''
  }

  return digitsOnly.replace(/^0+(?=\d)/, '')
}

export default function TaxCalculator() {
  const [taxSystem, setTaxSystem] = useState<TaxSystem>('real')
  const [formInputs, setFormInputs] = useState<Record<keyof TaxConfig, string>>(DEFAULT_INPUT_VALUES)

  const form = useMemo<TaxConfig>(
    () => ({
      yearlyIncome: toPositiveNumber(formInputs.yearlyIncome),
      yearlyDeductibleExpenses: toPositiveNumber(formInputs.yearlyDeductibleExpenses),
    }),
    [formInputs],
  )

  const realResult = useMemo(() => calculateRealSystem(form), [form])
  const normaResult = useMemo(() => calculateNormaSystem(form), [form])

  const selected = taxSystem === 'real' ? realResult : normaResult
  const alternative = taxSystem === 'real' ? normaResult : realResult
  const lostMoney = Math.max(0, alternative.moneyKept - selected.moneyKept)
  const bestSystem: TaxSystem = realResult.moneyKept >= normaResult.moneyKept ? 'real' : 'norma'

  const handleNumberChange =
    (key: keyof TaxConfig) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormInputs((previous) => ({
        ...previous,
        [key]: normalizeNumberInput(event.target.value),
      }))
    }

  return (
    <div className="tax-calculator" aria-label="Calculator taxe PFA">
      <div className="tax-input-grid">
        <label className="tax-field">
          <span>Venit anual estimat (RON)</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formInputs.yearlyIncome}
            onChange={handleNumberChange('yearlyIncome')}
          />
        </label>

        <label className="tax-field">
          <span>Cheltuieli deductibile anuale</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formInputs.yearlyDeductibleExpenses}
            onChange={handleNumberChange('yearlyDeductibleExpenses')}
            placeholder="Ex: 12000"
          />
        </label>
      </div>

      <div className="tax-system-toggle" role="group" aria-label="Tip impozitare">
        <button
          type="button"
          className={taxSystem === 'real' ? 'is-active' : ''}
          onClick={() => setTaxSystem('real')}
        >
          Sistem Real
        </button>
        <button
          type="button"
          className={taxSystem === 'norma' ? 'is-active' : ''}
          onClick={() => setTaxSystem('norma')}
        >
          Normă de venit
        </button>
      </div>

      <p className="tax-note">
        Salariul minim brut folosit în calcule: <strong>{formatRon(GROSS_MINIMUM_SALARY)} RON</strong>.
      </p>
      <p className="tax-note">
        Normă anuală Uber / Bolt: <strong>{formatRon(UBER_BOLT_ANNUAL_INCOME_NORM)} RON</strong>.
      </p>

      <div className="tax-summary-grid">
        <article>
          <p>Venit anual real (input)</p>
          <strong>{formatRon(form.yearlyIncome)} RON</strong>
        </article>
        <article>
          <p>
            {taxSystem === 'norma' ? 'Normă de venit (bază taxare)' : 'Bază taxare (venit - cheltuieli)'}
          </p>
          <strong>{formatRon(selected.taxBase)} RON</strong>
        </article>
        <article>
          <p>Total taxe</p>
          <strong>{formatRon(selected.breakdown.totalTaxes)} RON</strong>
        </article>
        <article>
          <p>Bani finali</p>
          <strong>{formatRon(selected.moneyKept)} RON</strong>
        </article>
      </div>

      <div className="tax-breakdown">
        <p>Impozit pe venit: {formatRon(selected.breakdown.incomeTax)} RON</p>
        <p>CAS: {formatRon(selected.breakdown.cas)} RON</p>
        <p>CASS: {formatRon(selected.breakdown.cass)} RON</p>
      </div>

      <div className="tax-compare">
        <p>
          Sistem Real: <strong>{formatRon(realResult.moneyKept)} RON</strong>
        </p>
        <p>
          Normă de venit: <strong>{formatRon(normaResult.moneyKept)} RON</strong>
        </p>
        <p className={lostMoney > 0 ? 'tax-warning' : 'tax-success'}>
          {lostMoney > 0
            ? `You lose ${formatRon(lostMoney)} RON if you choose the wrong system.`
            : `Alegi deja varianta optimă (${bestSystem === 'real' ? 'Sistem Real' : 'Normă de venit'}).`}
        </p>
      </div>
    </div>
  )
}