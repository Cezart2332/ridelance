import type {
  AnnualAnswersRequest,
  AnnualDeclaration,
  AnnualRecord,
  D205Model,
  D207Model,
  D212View,
  AnnualDeclarations,
  C801,
  C801Status,
  D212Field,
  D212Model,
  DeclarationAttention,
  NonResidentDecision,
  RentalContract,
  RentalContractRequest,
} from '../types'
import { round2 } from './helpers'

/**
 * Declarațiile anuale în mock (spec declarații F30–F61): aceleași reguli de blocare ca serverul,
 * pe date simple. D212 folosește parametrii 2026 din `tax-2026.json` (doar pentru demonstrație).
 */
interface AnnualState {
  answers: AnnualAnswersRequest
}

const state = new Map<string, AnnualState>()
const contracts = new Map<string, RentalContract[]>()
const c801 = new Map<string, C801>()
const decisions = new Map<string, NonResidentDecision[]>()

const PARAMETERS = { cas12: 48600, cas24: 97200, cassMin: 24300, cassMax: 291600, cas: 0.25, cass: 0.1, tax: 0.1 }

function annualState(pfaId: string, year: number): AnnualState {
  const key = `${pfaId}:${year}`
  let found = state.get(key)
  if (!found) {
    found = { answers: { hasExternalIncome: null, supplementCompleted: false, anafPrefilledNetIncome: null } }
    state.set(key, found)
  }
  return found
}

function decisionsOf(pfaId: string, year: number): NonResidentDecision[] {
  if (!decisions.has(pfaId)) {
    decisions.set(pfaId, [
      decision(pfaId, `${year}-03-05`, 'Bolt Operations OÜ', 'EE', 'EE102090374', 1250, 2, 'AUTO'),
      decision(pfaId, `${year}-04-05`, 'Bolt Operations OÜ', 'EE', 'EE102090374', 980, 2, 'AUTO'),
      decision(pfaId, `${year}-04-12`, 'Uber B.V.', 'NL', 'NL852071589B01', 1430, 16, 'NEEDS_LEGAL_CONFIRMATION'),
    ])
  }
  return decisions.get(pfaId)!
}

function decision(pfaId: string, paymentDate: string, supplierLegalName: string, supplierCountry: string, supplierTaxId: string, gross: number, rate: number, status: NonResidentDecision['status']): NonResidentDecision {
  return {
    id: `nr-${pfaId}-${paymentDate}-${supplierTaxId}`,
    paymentId: `pay-${pfaId}-${paymentDate}`,
    pfaId,
    supplierLegalName,
    supplierCountry,
    supplierTaxId,
    paymentDate,
    grossIncomeRon: gross,
    taxRate: rate,
    taxDue: round2((gross * rate) / 100),
    obligationCode: '634',
    status,
    explanation: status === 'AUTO' ? 'Cota din tratat, certificat de rezidență valabil la data plății.' : 'Certificatul de rezidență lipsește la data plății: cota legală, de confirmat.',
    confirmedAt: null,
    confirmationReason: null,
  }
}

function d212(net: number, gross: number, deductible: number, year: number): D212Model {
  const casBase = net < PARAMETERS.cas12 ? 0 : net < PARAMETERS.cas24 ? PARAMETERS.cas12 : PARAMETERS.cas24
  const casDue = Math.round(casBase * PARAMETERS.cas)
  const cassBase = Math.min(Math.max(net, 0), PARAMETERS.cassMax)
  const cassDeductible = Math.round(cassBase * PARAMETERS.cass)
  const cassDue = net >= PARAMETERS.cassMin ? cassDeductible : Math.round(PARAMETERS.cassMin * PARAMETERS.cass)
  const incomeTaxBase = Math.max(0, net - casDue - cassDeductible)
  return {
    taxYear: year,
    formYear: year + 1,
    ruleVersion: `${year}.1`,
    grossIncome: gross,
    deductibleExpenses: deductible,
    netIncome: net,
    carriedLosses: 0,
    casBase,
    casDue,
    cassBase,
    cassDue,
    cassDeductible,
    incomeTaxBase,
    incomeTaxDue: Math.round(incomeTaxBase * PARAMETERS.tax),
    lossCarriedForward: Math.max(0, -net),
  }
}

function form(model: D212Model): D212Field[] {
  const income = 'Cap. I — Venitul realizat din activități independente'
  const contributions = 'Cap. I — Contribuțiile sociale datorate'
  return [
    { section: income, label: 'Venit brut', value: model.grossIncome },
    { section: income, label: 'Cheltuieli deductibile', value: model.deductibleExpenses },
    { section: income, label: 'Venit net anual', value: model.netIncome },
    { section: income, label: 'Venit net anual impozabil', value: model.incomeTaxBase },
    { section: income, label: 'Impozit pe venit datorat', value: model.incomeTaxDue },
    { section: contributions, label: 'Baza de calcul CAS', value: model.casBase },
    { section: contributions, label: 'CAS datorată', value: model.casDue },
    { section: contributions, label: 'Baza de calcul CASS', value: model.cassBase },
    { section: contributions, label: 'CASS datorată', value: model.cassDue },
  ]
}

export function annualOf(pfaId: string, year: number, yearClosed: boolean, records: Partial<Record<string, AnnualRecord>> = {}): AnnualDeclarations {
  const current = annualState(pfaId, year)
  const list = decisionsOf(pfaId, year)
  const pending = list.filter((item) => item.status === 'NEEDS_LEGAL_CONFIRMATION').length
  const byTaxId = new Map<string, NonResidentDecision[]>()
  list.forEach((item) => byTaxId.set(item.supplierTaxId, [...(byTaxId.get(item.supplierTaxId) ?? []), item]))
  const beneficiaries = [...byTaxId.values()].map((items) => {
    const taxWithheld = round2(items.reduce((sum, item) => sum + item.taxDue, 0))
    return {
      supplierName: items[0].supplierLegalName,
      country: items[0].supplierCountry,
      taxId: items[0].supplierTaxId,
      incomeType: 'COMMISSION',
      grossIncome: round2(items.reduce((sum, item) => sum + item.grossIncomeRon, 0)),
      taxWithheld,
      exemptIncome: round2(items.filter((item) => item.taxDue === 0).reduce((sum, item) => sum + item.grossIncomeRon, 0)),
      treaty: items[0].supplierCountry === 'EE' ? 'Convenția RO–EE' : null,
      payments: items.length,
      declaredInD100: taxWithheld,
    }
  })
  const d207Blockers = pending > 0 ? [pending === 1 ? 'O regulă de nerezident e de confirmat.' : `${pending} reguli de nerezident sunt de confirmat.`] : []

  const rent = contracts.get(pfaId) ?? []
  const rentPayments = rent.flatMap((contract) => contract.payments.filter((payment) => payment.paymentDate.startsWith(`${year}-`)).map((payment) => ({ contract, payment })))

  const d212Blockers: string[] = []
  if (!yearClosed) d212Blockers.push(`Registrul de evidență fiscală ${year} nu e final: anul nu e închis.`)
  if (current.answers.hasExternalIncome === null) d212Blockers.push('Lipsește răspunsul despre alte venituri sau contribuții în afara RIDElance.')
  else if (current.answers.hasExternalIncome && !current.answers.supplementCompleted) d212Blockers.push('Formularul suplimentar pentru veniturile din afara RIDElance nu e completat.')
  const model = d212Blockers.length === 0 ? d212(61_500, 84_200, 22_700, year) : null
  const prefill = model && current.answers.anafPrefilledNetIncome !== null
    ? current.answers.anafPrefilledNetIncome === model.netIncome ? 'MATCH' as const : 'NEEDS_REVIEW' as const
    : 'NOT_AVAILABLE' as const
  const d212Review = prefill === 'NEEDS_REVIEW' ? [`Precompletarea ANAF are venitul net ${current.answers.anafPrefilledNetIncome} lei, calculul ${model!.netIncome} lei.`] : []


  const d207Total = round2(beneficiaries.reduce((sum, item) => sum + item.taxWithheld, 0))
  const d205Total = round2(rentPayments.reduce((sum, item) => sum + item.payment.tax, 0))
  return {
    pfaId,
    year,
    d207: {
      type: 'D207',
      ready: d207Blockers.length === 0 && beneficiaries.length > 0,
      blockers: d207Blockers,
      review: [],
      model: { year, beneficiaries, totalGross: round2(beneficiaries.reduce((sum, item) => sum + item.grossIncome, 0)), totalTax: d207Total, paidTotal: null },
      record: records.D207 ?? null,
    },
    d205: rent.length === 0
      ? null
      : {
          type: 'D205',
          ready: false,
          blockers: ['Regula de reținere pentru chirie e de confirmat juridic.', 'Termenul D205 e de confirmat juridic.'],
          review: [],
          model: {
            year,
            beneficiaries: rent.map((contract) => {
              const payments = rentPayments.filter((item) => item.contract.id === contract.id)
              return {
                ownerName: contract.ownerName,
                ownerCnpMasked: contract.ownerCnpMasked,
                contractNumber: contract.contractNumber,
                grossIncome: round2(payments.reduce((sum, item) => sum + item.payment.grossAmount, 0)),
                taxWithheld: round2(payments.reduce((sum, item) => sum + item.payment.tax, 0)),
                payments: payments.length,
              }
            }),
            totalGross: round2(rentPayments.reduce((sum, item) => sum + item.payment.grossAmount, 0)),
            totalTax: d205Total,
          },
          record: records.D205 ?? null,
        },
    d212: {
      type: 'D212',
      ready: model !== null,
      blockers: d212Blockers,
      review: d212Review,
      model: {
        model,
        form: model ? form(model) : [],
        formVersion: `D212-${year + 1}`,
        hasExternalIncome: current.answers.hasExternalIncome,
        supplementCompleted: current.answers.supplementCompleted,
        anafPrefilledNetIncome: current.answers.anafPrefilledNetIncome,
        prefill,
      },
      record: records.D212 ?? null,
    },
    pendingLegalConfirmations: pending,
  }
}

/** Suma de plată a unei declarații anuale (D207/D205: impozitul reținut; D212: CAS + CASS + impozit). */
export function amountOf(row: AnnualDeclaration<D207Model> | AnnualDeclaration<D205Model> | AnnualDeclaration<D212View>): number {
  if (row.type === 'D212') {
    const model = (row.model as D212View).model
    return model ? model.casDue + model.cassDue + model.incomeTaxDue : 0
  }
  return (row.model as D207Model | D205Model).totalTax
}

export function saveAnnualAnswers(pfaId: string, year: number, request: AnnualAnswersRequest): void {
  annualState(pfaId, year).answers = { ...request, supplementCompleted: request.hasExternalIncome === true && request.supplementCompleted }
}

export function listDecisions(pfaId: string, status?: NonResidentDecision['status']): NonResidentDecision[] {
  return decisionsOf(pfaId, new Date().getFullYear()).filter((item) => !status || item.status === status)
}

export function confirmDecision(id: string, reason: string): NonResidentDecision {
  const found = [...decisions.values()].flat().find((item) => item.id === id)
  if (!found) throw new Error('Decizia nu există.')
  found.status = 'CONFIRMED'
  found.confirmationReason = reason
  found.confirmedAt = new Date().toISOString()
  return found
}

export function attentionOf(pfas: { id: string; name: string }[]): DeclarationAttention[] {
  return pfas.flatMap((pfa) => {
    const pending = (decisions.get(pfa.id) ?? []).filter((item) => item.status === 'NEEDS_LEGAL_CONFIRMATION')
    return pending.length === 0
      ? []
      : [{ pfaId: pfa.id, pfaName: pfa.name, period: pending[0].paymentDate.slice(0, 7), type: 'D100' as const, declarationId: null, versionId: null, reason: 'Regula de nerezident de confirmat' }]
  })
}

export function listContracts(pfaId: string): RentalContract[] {
  return contracts.get(pfaId) ?? []
}

export function createContract(pfaId: string, request: RentalContractRequest): RentalContract {
  const contract: RentalContract = {
    id: `rent-${pfaId}-${Date.now()}`,
    ownerName: request.ownerName,
    ownerCnpMasked: `${request.ownerCnp.slice(0, 1)}********${request.ownerCnp.slice(-4)}`,
    contractNumber: request.contractNumber,
    contractDate: request.contractDate,
    grossRent: request.grossRent,
    paymentFrequency: request.paymentFrequency,
    withholdingRuleId: request.withholdingRuleId,
    payments: [],
  }
  contracts.set(pfaId, [...listContracts(pfaId), contract])
  return contract
}

export function addRentPayment(contractId: string, paymentDate: string, grossAmount: number): void {
  const contract = [...contracts.values()].flat().find((item) => item.id === contractId)
  if (!contract) throw new Error('Contractul nu există.')
  contract.payments.push({ id: `rp-${Date.now()}`, paymentDate, grossAmount, tax: round2(grossAmount * 0.1), withholdOnPayment: true, ruleConfirmed: false })
}

export function c801Of(pfaId: string, cui: string): C801 {
  let found = c801.get(pfaId)
  if (!found) {
    found = { pfaId, cui, cashRegisterStatus: 'ACTIVE', activationDate: null, activityType: '4', vehiclePlate: null, status: 'NOT_STARTED', documentId: null, nuiNumber: null, missing: ['Numărul de înmatriculare'] }
    c801.set(pfaId, found)
  }
  return found
}

export function updateC801(pfaId: string, cui: string, request: { status: C801Status; documentId: string | null; nuiNumber: string | null; vehiclePlate: string | null }): C801 {
  const current = c801Of(pfaId, cui)
  if (request.status !== 'NOT_STARTED' && !request.documentId) throw new Error('Pentru C801 depusă e nevoie de document (cererea sau confirmarea furnizorului).')
  if (request.status === 'NUI_RECEIVED' && !request.nuiNumber) throw new Error('NUI-ul e obligatoriu.')
  const vehiclePlate = request.vehiclePlate ? request.vehiclePlate.toUpperCase() : current.vehiclePlate
  const updated: C801 = { ...current, status: request.status, documentId: request.documentId, nuiNumber: request.nuiNumber, vehiclePlate, missing: vehiclePlate ? [] : ['Numărul de înmatriculare'] }
  c801.set(pfaId, updated)
  return updated
}
