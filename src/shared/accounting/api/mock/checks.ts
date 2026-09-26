import { formatAmount, formatDate } from '../../format'
import type { DocumentCheck, ExtractedFields, PlatformDocumentType } from '../types'
import { periodOf, validAt } from './helpers'
import type { MockDb, MockDocument } from './mockDb'

/**
 * Verificările deterministe din B1, în varianta mock. Backendul le reimplementează într-o clasă
 * testată unitar; aici contează ca rezultatele să fie aceleași pe fixtures.
 */

/** Formele în care o sumă poate apărea în PDF: `1.000,00`, `1,000.00`, `1000.00`, `1000,00`. */
function amountSpellings(value: number): string[] {
  const fixed = value.toFixed(2)
  const [whole, decimals] = fixed.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '#')
  return [
    `${grouped.replace(/#/g, '.')},${decimals}`,
    `${grouped.replace(/#/g, ',')}.${decimals}`,
    `${whole}.${decimals}`,
    `${whole},${decimals}`,
  ]
}

function amountInText(text: string, value: number): boolean {
  return amountSpellings(value).some((spelling) => text.includes(spelling))
}

const FIELD_LABEL: Partial<Record<keyof ExtractedFields, string>> = {
  amount: 'total',
  commissionAmount: 'comision',
}

export function runChecks(db: MockDb, document: MockDocument, fields: ExtractedFields, documentType: PlatformDocumentType): DocumentCheck[] {
  const checks: DocumentCheck[] = []
  const isInvoice = documentType === 'COMMISSION_INVOICE'

  // AMOUNT_IN_TEXT
  const amounts: { label: string; value: number }[] = []
  for (const key of ['amount', 'commissionAmount'] as const) {
    const value = fields[key]
    if (value !== null) amounts.push({ label: FIELD_LABEL[key] ?? key, value })
  }
  fields.otherAmounts.forEach((item) => amounts.push({ label: item.label, value: item.amount }))
  const missing = amounts.filter((item) => !amountInText(document.pdfText, item.value))
  checks.push({
    code: 'AMOUNT_IN_TEXT',
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'Toate sumele citite apar în textul documentului.'
        : missing.map((item) => `Suma ${formatAmount(item.value)} (${item.label}) nu apare în textul documentului.`).join(' '),
  })

  if (isInvoice) {
    // ARITHMETIC: subtotal + TVA = total, TVA = 0 (taxare inversă).
    const vat = fields.otherAmounts.find((item) => item.label === 'TVA')?.amount ?? 0
    const subtotal = fields.commissionAmount ?? 0
    const total = fields.amount ?? 0
    const sumOk = Math.abs(subtotal + vat - total) < 0.005
    checks.push({
      code: 'ARITHMETIC',
      passed: sumOk && vat === 0,
      message: !sumOk
        ? `Comision ${formatAmount(subtotal)} + TVA ${formatAmount(vat)} ≠ total ${formatAmount(total)}.`
        : vat !== 0
          ? `TVA-ul de pe factură trebuie să fie 0 (taxare inversă), nu ${formatAmount(vat)}.`
          : 'Comision + TVA = total; TVA 0 (taxare inversă).',
    })

    // SUPPLIER_KNOWN
    const supplier =
      fields.supplierVatId && fields.invoiceDate
        ? validAt(db.suppliers, fields.invoiceDate, (item) => item.vatId === fields.supplierVatId)
        : null
    checks.push({
      code: 'SUPPLIER_KNOWN',
      passed: supplier !== null,
      message: supplier
        ? `Furnizor identificat: ${supplier.supplierName}.`
        : `Furnizorul cu codul TVA ${fields.supplierVatId ?? '(lipsă)'} nu există în registrul de furnizori la data facturii.`,
      action: supplier ? undefined : 'ADD_SUPPLIER',
    })

    // VAT_ID_FORMAT
    const prefix = fields.supplierVatId?.slice(0, 2) ?? ''
    const formatOk = Boolean(fields.supplierCountry) && prefix === fields.supplierCountry
    checks.push({
      code: 'VAT_ID_FORMAT',
      passed: formatOk,
      message: formatOk
        ? `Prefixul codului TVA (${prefix}) corespunde țării furnizorului.`
        : `Prefixul codului TVA (${prefix || 'lipsă'}) nu corespunde țării furnizorului (${fields.supplierCountry ?? 'lipsă'}).`,
    })

    // NOT_DUPLICATE
    const duplicate = db.documents.find(
      (other) =>
        fields.invoiceNumber !== null &&
        other.id !== document.id &&
        other.documentType === 'COMMISSION_INVOICE' &&
        other.extractions.length > 0 &&
        other.extractions[other.extractions.length - 1].fields.supplierVatId === fields.supplierVatId &&
        other.extractions[other.extractions.length - 1].fields.invoiceNumber === fields.invoiceNumber,
    )
    checks.push({
      code: 'NOT_DUPLICATE',
      passed: !duplicate,
      message: duplicate
        ? `Există deja un document cu același furnizor și număr (${fields.invoiceNumber}).`
        : 'Nu există alt document cu același furnizor și număr.',
    })

    // NOT_ALREADY_DECLARED
    const declaredElsewhere = db.declarations.find(
      (declaration) =>
        declaration.period !== document.period &&
        declaration.versions.some(
          (version) => version.status === 'ACCEPTED' && version.breakdown.lines.some((line) => line.sourceDocumentId === document.id),
        ),
    )
    checks.push({
      code: 'NOT_ALREADY_DECLARED',
      passed: !declaredElsewhere,
      message: declaredElsewhere
        ? `Documentul apare deja în ${declaredElsewhere.type} pentru ${declaredElsewhere.period}, cu recipisă.`
        : 'Documentul nu a mai fost declarat.',
    })
  }

  // PERIOD_MATCH. Regula de exigibilitate e DE CONFIRMAT (config); mock: data facturii sau
  // sfârșitul perioadei raportate cad în luna procesată.
  const referenceDate = isInvoice ? fields.invoiceDate : fields.periodTo
  const periodOk = referenceDate !== null && periodOf(referenceDate) === document.period
  checks.push({
    code: 'PERIOD_MATCH',
    passed: periodOk,
    message: periodOk
      ? `Data ${formatDate(referenceDate)} e în perioada procesată.`
      : `Data ${formatDate(referenceDate)} nu e în perioada procesată (${document.period}).`,
  })

  // CURRENCY_ALLOWED
  const currencyOk = fields.currency !== null && db.config.allowedCurrencies.includes(fields.currency)
  checks.push({
    code: 'CURRENCY_ALLOWED',
    passed: currencyOk,
    message: currencyOk
      ? `Moneda ${fields.currency} e acceptată.`
      : `Moneda ${fields.currency ?? '(lipsă)'} nu e acceptată (doar ${db.config.allowedCurrencies.join(' / ')}).`,
  })

  // SETTLEMENT_CORRELATION: comision / venit din raportul platformei, în intervalul configurat.
  const report = isInvoice
    ? db.documents.find(
        (other) =>
          other.pfaId === document.pfaId &&
          other.period === document.period &&
          other.platform === document.platform &&
          other.documentType === 'PLATFORM_REPORT' &&
          other.extractions.length > 0,
      )
    : null
  const income = isInvoice ? (report?.extractions[report.extractions.length - 1].fields.amount ?? null) : fields.amount
  const commission = fields.commissionAmount
  const { minPercent, maxPercent } = db.config.settlementCorrelation
  if (income && commission !== null) {
    const ratio = (commission / income) * 100
    const ok = ratio >= minPercent && ratio <= maxPercent
    checks.push({
      code: 'SETTLEMENT_CORRELATION',
      passed: ok,
      message: `Comision / venit = ${formatAmount(ratio)}% (interval acceptat ${minPercent}–${maxPercent}%).`,
    })
  } else {
    checks.push({
      code: 'SETTLEMENT_CORRELATION',
      passed: true,
      message: 'Raportul platformei nu e încă disponibil; corelarea se reface la pre-check.',
    })
  }

  return checks
}
