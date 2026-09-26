import { formatAmount, formatCalculation, formatDate, formatLei } from '../../format'
import type { DeclarationBreakdown, DeclarationLine, DeclarationType, ExtractedFields, IsoDate, Period } from '../types'
import { round2, validAt } from './helpers'
import type { MockDb, MockDocument, MockPfa } from './mockDb'

/**
 * Oglinda mock a lui `MonthlyTaxEngine.Calculate` (B2): o funcție pură peste documentele
 * confirmate și regulile valabile la data fiecărei facturi. Cotele, țările UE și data
 * exigibilității vin din `db` (reguli și config), niciuna nu e scrisă aici.
 *
 * Diferență asumată față de B2: o cotă D100 neconfirmată nu blochează declarația, ci exclude
 * linia cu avertisment. Altfel exemplul Ion Popescu (D100 = 20, „+ Uber după cota confirmată”)
 * n-ar putea fi generat. De lămurit la B2.
 */

export interface MockTaxResult {
  blockingReasons: string[]
  declarations: Record<DeclarationType, { applicable: boolean; breakdown: DeclarationBreakdown }>
}

interface ConfirmedDocument {
  document: MockDocument
  fields: ExtractedFields
}

/** Documentele confirmate ale lunii, cu extracția curentă. `LOCKED` se derivă din `CONFIRMED`. */
export function confirmedDocuments(db: MockDb, pfaId: string, period: Period): ConfirmedDocument[] {
  return db.documents
    .filter((document) => document.pfaId === pfaId && document.period === period && document.status === 'CONFIRMED')
    .map((document) => ({ document, fields: document.extractions[document.extractions.length - 1].fields }))
}

function documentLabel(document: MockDocument, fields: ExtractedFields): string {
  const platform = document.platform === 'BOLT' ? 'Bolt' : document.platform === 'UBER' ? 'Uber' : ''
  return document.documentType === 'COMMISSION_INVOICE'
    ? `Factura ${platform} ${fields.invoiceNumber ?? ''}`.trim()
    : `Raportul ${platform} ${document.period}`
}

export function calculate(db: MockDb, pfa: MockPfa, period: Period): MockTaxResult {
  const blockingReasons: string[] = []
  const documents = confirmedDocuments(db, pfa.id, period)
  const invoices = documents.filter((item) => item.document.documentType === 'COMMISSION_INVOICE')
  const reports = documents.filter((item) => item.document.documentType === 'PLATFORM_REPORT')

  /** Suma în RON și cursul folosit. Sursa și ziua cursului sunt DE CONFIRMAT (§6 pct. 4). */
  function toRon(amount: number, currency: string | null, date: IsoDate | null): { ron: number; rate: number | null } | null {
    if (!currency || currency === 'RON') return { ron: amount, rate: null }
    const rate = db.exchangeRates
      .filter((item) => item.currency === currency && date !== null && item.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (!rate) {
      blockingReasons.push(`Lipsește cursul ${currency} la ${formatDate(date)}.`)
      return null
    }
    return { ron: round2(amount * rate.rate), rate: rate.rate }
  }

  const d100Lines: DeclarationLine[] = []
  const d301Lines: DeclarationLine[] = []
  const euBySupplier = new Map<string, { base: number; documents: ConfirmedDocument[]; country: string; name: string }>()

  for (const item of invoices) {
    const { document, fields } = item
    const date = fields.invoiceDate
    const commission = fields.commissionAmount
    if (!date || commission === null) {
      blockingReasons.push(`${documentLabel(document, fields)}: lipsește data sau comisionul.`)
      continue
    }
    const supplier = validAt(db.suppliers, date, (profile) => profile.vatId === fields.supplierVatId)
    if (!supplier) {
      blockingReasons.push(`${documentLabel(document, fields)}: furnizor necunoscut (${fields.supplierVatId}).`)
      continue
    }
    const converted = toRon(commission, fields.currency, date)
    if (!converted) continue
    const base = converted.ron
    const inForeignCurrency = converted.rate !== null
    const conversionNote = inForeignCurrency ? ` (${formatAmount(commission)} ${fields.currency} × ${converted.rate})` : ''
    const common = {
      sourceDocumentId: document.id,
      sourceDocumentLabel: documentLabel(document, fields),
      currency: fields.currency ?? 'RON',
      exchangeRate: converted.rate,
      supplierName: supplier.supplierName,
      supplierCountry: supplier.country,
      supplierVatId: supplier.vatId,
    }

    // D100
    const d100Rule = validAt(db.d100Rules, date, (rule) => rule.code === 'D100_COMMISSION_NONRESIDENT')
    if (d100Rule?.enabled) {
      const certValid =
        supplier.residenceCertValidFrom !== null &&
        supplier.residenceCertValidTo !== null &&
        supplier.residenceCertValidFrom <= date &&
        date <= supplier.residenceCertValidTo
      if (!certValid) {
        blockingReasons.push(`Certificatul de rezidență pentru ${supplier.supplierName} nu e valabil la ${formatDate(date)}.`)
      } else if (!supplier.d100RateConfirmed || supplier.d100Rate === null) {
        d100Lines.push({
          ...common,
          id: `D100-${document.id}`,
          ruleCode: d100Rule.code,
          base,
          rate: supplier.d100Rate,
          value: 0,
          explanation: `${formatAmount(base)}${conversionNote} × cotă neconfirmată`,
          operationType: null,
          treaty: supplier.treaty,
          residenceCertValidFrom: supplier.residenceCertValidFrom,
          residenceCertValidTo: supplier.residenceCertValidTo,
          excluded: true,
          warning: `Cota D100 pentru ${supplier.supplierName} nu e confirmată.`,
        })
      } else {
        const value = round2((base * supplier.d100Rate) / 100)
        d100Lines.push({
          ...common,
          id: `D100-${document.id}`,
          ruleCode: d100Rule.code,
          base,
          rate: supplier.d100Rate,
          value,
          explanation: `${formatCalculation(base, supplier.d100Rate, value)}${conversionNote}`,
          operationType: null,
          treaty: supplier.treaty,
          residenceCertValidFrom: supplier.residenceCertValidFrom,
          residenceCertValidTo: supplier.residenceCertValidTo,
          excluded: false,
          warning: null,
        })
      }
    }

    // D301 / D390: doar serviciile prestate de furnizori din alte state UE.
    if (!db.config.euCountries.includes(supplier.country)) continue
    const exigibility = db.config.vatExigibilityDate === 'INVOICE_DATE' ? date : (fields.periodTo ?? date)
    const vatRate = validAt(db.vatRates, exigibility)
    if (!vatRate) {
      blockingReasons.push(`Nu există cotă de TVA valabilă la ${formatDate(exigibility)}.`)
      continue
    }
    const vat = round2((base * vatRate.rate) / 100)
    d301Lines.push({
      ...common,
      id: `D301-${document.id}`,
      ruleCode: 'D301_EU_SERVICES',
      base,
      rate: vatRate.rate,
      value: vat,
      explanation: `${formatCalculation(base, vatRate.rate, vat)}${conversionNote}`,
      operationType: null,
      treaty: null,
      residenceCertValidFrom: null,
      residenceCertValidTo: null,
      excluded: false,
      warning: null,
    })

    const bucket = euBySupplier.get(supplier.vatId) ?? { base: 0, documents: [], country: supplier.country, name: supplier.supplierName }
    bucket.base = round2(bucket.base + base)
    bucket.documents.push(item)
    euBySupplier.set(supplier.vatId, bucket)
  }

  const d390Lines: DeclarationLine[] = [...euBySupplier.entries()].map(([vatId, bucket]) => ({
    id: `D390-${pfa.id}-${vatId}`,
    sourceDocumentId: bucket.documents[0].document.id,
    sourceDocumentLabel: bucket.documents.map((item) => documentLabel(item.document, item.fields)).join(', '),
    ruleCode: 'D390_EU_SERVICES',
    base: bucket.base,
    rate: null,
    value: 0,
    currency: 'RON',
    exchangeRate: null,
    explanation: `S / ${bucket.country} / ${bucket.name} / ${formatAmount(bucket.base)}`,
    supplierName: bucket.name,
    supplierCountry: bucket.country,
    supplierVatId: vatId,
    operationType: 'S',
    treaty: null,
    residenceCertValidFrom: null,
    residenceCertValidTo: null,
    excluded: false,
    warning: null,
  }))

  const rideIncome = round2(
    reports.reduce((sum, item) => sum + (toRon(item.fields.amount ?? 0, item.fields.currency, item.fields.periodTo)?.ron ?? 0), 0),
  )

  const sum = (lines: DeclarationLine[]) => round2(lines.filter((line) => !line.excluded).reduce((total, line) => total + line.value, 0))
  const d100Total = sum(d100Lines)
  const d301Total = sum(d301Lines)
  const excludedCount = d100Lines.filter((line) => line.excluded).length

  return {
    blockingReasons,
    declarations: {
      D100: {
        applicable: d100Lines.length > 0,
        breakdown: {
          lines: d100Lines,
          total: d100Total,
          explanation:
            `Impozit pe comisioanele nerezidenților: ${formatLei(d100Total)}.` +
            (excludedCount > 0 ? ` ${excludedCount} ${excludedCount === 1 ? 'linie exclusă' : 'linii excluse'} până la confirmarea cotei.` : ''),
          excludedRideIncome: null,
        },
      },
      D301: {
        applicable: d301Lines.length > 0,
        breakdown: {
          lines: d301Lines,
          total: d301Total,
          explanation: `TVA pentru serviciile intracomunitare achiziționate: ${formatLei(d301Total)}. Veniturile din curse nu intră în bază.`,
          excludedRideIncome: rideIncome,
        },
      },
      D390: {
        applicable: d390Lines.length > 0,
        breakdown: {
          lines: d390Lines,
          total: 0,
          explanation: '0 lei, doar raportare.',
          excludedRideIncome: null,
        },
      },
    },
  }
}
