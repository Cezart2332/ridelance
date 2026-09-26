import { formatAmount } from '../../format'
import type {
  AccountingPeriod,
  Asset,
  CashRegisterState,
  DocumentExtraction,
  ExpenseCategoryRule,
  ExtractedFields,
  IsoDate,
  LedgerEntry,
  LedgerSource,
  LedgerTransactionType,
  PaymentMethod,
  Period,
  Platform,
  SettingHistoryEntry,
  SupplierTaxProfile,
  UserRef,
  VehicleDeductibility,
} from '../types'
import { fakeSha256, lastDayOfPeriod, nextPeriod, periodOf, periodRange, resolveDeductibility, round2 } from './helpers'
import type { MockDb, MockDocument, MockExtractionSeed, MockPfa } from './mockDb'

/**
 * Datele de test ale Părții A (spec F0), pentru luna fiscală `2026-08`.
 *
 * - 30 de PFA-uri active în august: 27 ajung „Gata” după procesare, 2 „Necesită verificare”
 *   (Bogdan Matei, Răzvan Ene), 1 „Document lipsă” (George Stan) — exact fluxul din F3.
 * - 2 PFA-uri inactive, cu perioadele contabile închise; angajamentul lor s-a încheiat înainte de
 *   august, deci nu apar în luna fiscală.
 * - Un PFA cu cash `ACTIVE` și rapoarte Z (Andrei Dumitrescu), cu ziua din §5.3.
 * - Ledger pe 3 luni (august–octombrie 2026) pentru Ion Popescu, Andrei Dumitrescu, Mihai Ionescu.
 *
 * Totul e determinist: aceleași fixtures la fiecare încărcare, ca scenariile de acceptanță să fie
 * reproductibile.
 */

export const FIXTURE_PERIOD: Period = '2026-08'
/** Ultima lună cu date în ledger (ziua din §5.3 e 10.10.2026). */
const LAST_FIXTURE_PERIOD: Period = '2026-10'

export const MOCK_USERS = {
  accountant: { id: 'user-contabil', name: 'Contabil RIDElance' },
  admin: { id: 'user-admin', name: 'Admin RIDElance' },
  ai: { id: 'system-ai', name: 'Citire automată' },
  system: { id: 'system', name: 'Sistem' },
} satisfies Record<string, UserRef>

// ---------------------------------------------------------------------------------------------
// Reguli fiscale
// ---------------------------------------------------------------------------------------------

/**
 * Datele furnizorilor sunt cele de pe facturile de comision; se verifică cu facturile reale ale
 * clienților înainte de seed-ul din B0. Cota D100 pentru Uber e DE CONFIRMAT (§6 pct. 1).
 */
const BOLT = { name: 'Bolt Operations OÜ', country: 'EE', vatId: 'EE102090374' }
const UBER = { name: 'Uber B.V.', country: 'NL', vatId: 'NL852071588B01' }

function suppliers(): SupplierTaxProfile[] {
  return [
    {
      id: 'supplier-bolt',
      supplierName: BOLT.name,
      country: BOLT.country,
      vatId: BOLT.vatId,
      incomeType: 'COMMISSION',
      treaty: 'Convenția RO–EE',
      d100Rate: 2,
      d100RateConfirmed: true,
      validFrom: '2025-01-01',
      validTo: null,
      residenceCertValidFrom: '2026-01-01',
      residenceCertValidTo: '2026-12-31',
      residenceCertFile: fileRef('cert-bolt-2026', 'Certificat_rezidenta_Bolt_2026.pdf'),
    },
    {
      id: 'supplier-uber',
      supplierName: UBER.name,
      country: UBER.country,
      vatId: UBER.vatId,
      incomeType: 'COMMISSION',
      treaty: 'Convenția RO–NL',
      d100Rate: null,
      d100RateConfirmed: false,
      validFrom: '2025-01-01',
      validTo: null,
      residenceCertValidFrom: '2026-01-01',
      residenceCertValidTo: '2026-10-31',
      residenceCertFile: fileRef('cert-uber-2026', 'Certificat_rezidenta_Uber_2026.pdf'),
    },
  ]
}

function expenseCategories(): ExpenseCategoryRule[] {
  const rule = (
    category: string,
    label: string,
    vehicleRelated: boolean,
    defaultDeductibility: ExpenseCategoryRule['defaultDeductibility'],
    counterpartyPattern: string | null,
  ): ExpenseCategoryRule => ({
    id: `category-${category.toLowerCase()}`,
    category,
    label,
    vehicleRelated,
    defaultDeductibility,
    counterpartyPattern,
    validFrom: '2025-01-01',
    validTo: null,
  })
  return [
    rule('FUEL', 'Combustibil', true, '100_PERCENT', 'OMV|PETROM|ROMPETROL|MOL|LUKOIL|SOCAR'),
    rule('CAR_SERVICE', 'Service auto', true, '100_PERCENT', 'SERVICE|AUTO'),
    rule('CAR_INSURANCE', 'Asigurare auto', true, '100_PERCENT', 'ALLIANZ|GROUPAMA|OMNIASIG|GENERALI'),
    rule('CAR_WASH', 'Spălătorie auto', true, '100_PERCENT', 'WASH|SPALATORIE'),
    rule('PHONE', 'Telefonie mobilă', false, '100_PERCENT', 'ORANGE|VODAFONE|DIGI'),
    rule('CASH_REGISTER', 'Casă de marcat și consumabile', false, '100_PERCENT', 'DATECS|TREMOL'),
    // DE CONFIRMAT (§6 pct. 9): amortizarea nu se deduce prin procentul auto.
    rule('DEPRECIATION', 'Amortizare', true, 'SPECIAL_RULE', null),
    rule('PERSONAL', 'Cheltuieli personale', false, 'NON_DEDUCTIBLE', null),
  ]
}

// ---------------------------------------------------------------------------------------------
// PFA-uri
// ---------------------------------------------------------------------------------------------

interface PfaSeed {
  name: string
  platforms: Platform[]
  /** Venit / comision pe august, per platformă. */
  bolt?: { income: number; commission: number }
  uber?: { income: number; commission: number }
  cash?: CashRegisterState['status']
  cashActivationDate?: IsoDate
  deductibility?: { value: VehicleDeductibility; validFrom: IsoDate; note: string }[]
  startDate?: IsoDate
  endDate?: IsoDate
  uberCurrency?: 'EUR'
  failFirstValidation?: MockPfa['failFirstValidation']
}

const DEFAULT_DEDUCTIBILITY: NonNullable<PfaSeed['deductibility']> = [
  { value: '50_PERCENT', validFrom: '2026-01-01', note: 'Regula implicită pentru autoturisme cu utilizare mixtă.' },
]

const NAMED: PfaSeed[] = [
  {
    name: 'Ion Popescu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 8000, commission: 1000 },
    uber: { income: 5000, commission: 600 },
  },
  {
    name: 'Bogdan Matei',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 7900, commission: 1248.5 },
    uber: { income: 4200, commission: 714 },
  },
  {
    name: 'Răzvan Ene',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 6400, commission: 896 },
    uber: { income: 5600, commission: 952 },
  },
  {
    name: 'George Stan',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 7100, commission: 1065 },
    uber: { income: 3900, commission: 663 },
  },
  {
    name: 'Andrei Dumitrescu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 9200, commission: 1380 },
    uber: { income: 2800, commission: 448 },
    cash: 'ACTIVE',
    cashActivationDate: '2026-09-01',
    deductibility: [
      { value: '100_PERCENT', validFrom: '2026-01-01', note: 'Autoturism folosit exclusiv pentru ridesharing, cu foi de parcurs.' },
    ],
  },
  {
    name: 'Mihai Ionescu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 6800, commission: 1020 },
    uber: { income: 4700, commission: 799 },
    deductibility: [
      { value: '50_PERCENT', validFrom: '2026-01-01', note: 'Regula implicită pentru autoturisme cu utilizare mixtă.' },
      { value: '100_PERCENT', validFrom: '2026-09-01', note: 'De la 01.09.2026 autoturismul e folosit exclusiv pentru ridesharing; foi de parcurs depuse.' },
    ],
  },
  {
    name: 'Nicoleta Radu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 5900, commission: 885 },
    uber: { income: 4100, commission: 656 },
    failFirstValidation: {
      type: 'D301',
      level: 'XSD',
      message: 'Simulat în mock: câmpul „nr_evid” nu respectă formatul cerut de schemă.',
    },
  },
  {
    name: 'Vlad Constantin',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 7300, commission: 1095 },
    uber: { income: 1000, commission: 150 },
    uberCurrency: 'EUR',
  },
  {
    name: 'Ana Georgescu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 6100, commission: 915 },
    uber: { income: 3300, commission: 528 },
    cash: 'IN_VERIFICATION',
  },
  {
    name: 'Florin Munteanu',
    platforms: ['BOLT', 'UBER'],
    bolt: { income: 5400, commission: 810 },
    uber: { income: 3700, commission: 555 },
    cash: 'PENDING',
  },
]

const GENERIC_NAMES = [
  'Alexandru Popa',
  'Daniel Moldovan',
  'Marius Tudor',
  'Ștefan Neagu',
  'Laurențiu Barbu',
  'Cosmin Ilie',
  'Gabriel Sandu',
  'Ionuț Cristea',
  'Paul Oprea',
  'Robert Lazăr',
  'Victor Manole',
  'Claudiu Pavel',
  'Dragoș Toma',
  'Silviu Nistor',
  'Lucian Mocanu',
  'Emil Voicu',
  'Ovidiu Rusu',
  'Adrian Stoica',
  'Cătălin Dobre',
  'Sorin Lungu',
]
/** Ultimele trei lucrează doar cu Bolt. */
const BOLT_ONLY = new Set(['Adrian Stoica', 'Cătălin Dobre', 'Sorin Lungu'])

function genericSeed(name: string, index: number): PfaSeed {
  const boltIncome = 5000 + ((index * 733) % 4500)
  const boltCommission = round2(boltIncome * (0.12 + (index % 5) * 0.015))
  if (BOLT_ONLY.has(name)) {
    return { name, platforms: ['BOLT'], bolt: { income: boltIncome, commission: boltCommission } }
  }
  const uberIncome = 2500 + ((index * 517) % 3500)
  const uberCommission = round2(uberIncome * (0.14 + (index % 4) * 0.015))
  return {
    name,
    platforms: ['BOLT', 'UBER'],
    bolt: { income: boltIncome, commission: boltCommission },
    uber: { income: uberIncome, commission: uberCommission },
  }
}

const INACTIVE: PfaSeed[] = [
  { name: 'Cristian Vasile', platforms: ['BOLT', 'UBER'], startDate: '2025-03-01', endDate: '2026-06-30' },
  { name: 'Elena Marin', platforms: ['BOLT'], startDate: '2025-06-01', endDate: '2026-05-31' },
]

/** CUI cu cifră de control validă (cheia 753217532), ca să treacă de `validateRomanianCIF`. */
function cuiFor(index: number): string {
  const body = String(41000000 + index * 7919).slice(0, 8)
  // Ponderile se aliniază la dreapta: corpul de 8 cifre folosește ultimele 8 din cheie.
  const key = '753217532'
  let sum = 0
  for (let position = 0; position < body.length; position++) {
    sum += Number(body[position]) * Number(key[key.length - body.length + position])
  }
  const control = ((sum * 10) % 11) % 10
  return `${body}${control}`
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

export function fileRef(seed: string, fileName: string) {
  return {
    id: `file-${seed}`,
    fileName,
    contentType: 'application/pdf',
    sizeBytes: 38000 + (seed.length * 977) % 20000,
    hash: fakeSha256(seed),
  }
}

// ---------------------------------------------------------------------------------------------
// Documente platformă
// ---------------------------------------------------------------------------------------------

const REVIEWED_AT = '2026-09-05T09:30:00Z'
const UPLOADED_AT = '2026-09-03T08:15:00Z'

export interface DocumentSeed {
  pfa: Pick<MockPfa, 'id' | 'name' | 'cui'>
  platform: Platform
  kind: 'invoice' | 'report'
  income: number
  commission: number
  currency?: 'RON' | 'EUR'
  /** Implicit `FIXTURE_PERIOD`. */
  period?: Period
  /** Ce citește AI-ul, dacă diferă de ce e în PDF (cazul Bogdan Matei). */
  misreadCommission?: number
  /** Cod TVA de pe factură, dacă diferă de registru (cazul Răzvan Ene). */
  vatIdOnDocument?: string
  /** Documentul e doar încărcat; extracția se face la procesarea lunii. */
  unprocessed?: boolean
  /** Suprascrieri pentru documentele încărcate din UI. */
  id?: string
  fileName?: string
  uploadedAt?: string
}

function supplierOf(platform: Platform) {
  return platform === 'BOLT' ? BOLT : UBER
}

const toRoDate = (iso: IsoDate) => iso.split('-').reverse().join('.')

/** Un document platformă cu textul PDF și extracția pe care o va „citi” AI-ul simulat. */
export function buildDocument(seed: DocumentSeed, index: number): MockDocument {
  const { pfa, platform, kind } = seed
  const period = seed.period ?? FIXTURE_PERIOD
  const firstDay = `${period}-01`
  const lastDay = lastDayOfPeriod(period)
  const reportDate = `${nextPeriod(period)}-01`
  const supplier = supplierOf(platform)
  const vatId = seed.vatIdOnDocument ?? supplier.vatId
  const currency = seed.currency ?? 'RON'
  const id = seed.id ?? `doc-${pfa.id.replace('pfa-', '')}-${platform.toLowerCase()}-${kind}`
  const isInvoice = kind === 'invoice'
  const invoiceNumber = isInvoice ? `${platform === 'BOLT' ? 'EE-BOLT' : 'UBR-RO'}-${period}-${String(1000 + index)}` : null
  const printed = formatAmount(seed.commission)
  const printedIncome = formatAmount(seed.income)
  const extractedCommission = seed.misreadCommission ?? seed.commission
  const extractedPrinted = formatAmount(extractedCommission)

  const pdfText = isInvoice
    ? [
        `${supplier.name}`,
        `Cod TVA: ${vatId}`,
        `Factură nr. ${invoiceNumber}`,
        `Data facturii: ${toRoDate(lastDay)}`,
        `Perioada serviciului: ${toRoDate(firstDay)} – ${toRoDate(lastDay)}`,
        `Client: ${pfa.name} PFA, CUI ${pfa.cui}`,
        `Comision servicii platformă: ${printed} ${currency}`,
        `TVA: 0,00 ${currency} – Taxare inversă (art. 196 Directiva 2006/112/CE)`,
        `Total de plată: ${printed} ${currency}`,
      ].join('\n')
    : [
        `${supplier.name} – Raport lunar de venituri`,
        `Șofer: ${pfa.name} PFA, CUI ${pfa.cui}`,
        `Perioada: ${toRoDate(firstDay)} – ${toRoDate(lastDay)}`,
        `Venituri din curse: ${printedIncome} ${currency}`,
        `Comision reținut: ${printed} ${currency}`,
        `Sumă virată: ${formatAmount(round2(seed.income - seed.commission))} ${currency}`,
      ].join('\n')

  const fields: ExtractedFields = {
    supplierName: supplier.name,
    supplierCountry: supplier.country,
    supplierVatId: vatId,
    invoiceNumber,
    invoiceDate: isInvoice ? lastDay : reportDate,
    periodFrom: firstDay,
    periodTo: lastDay,
    currency,
    amount: isInvoice ? extractedCommission : seed.income,
    commissionAmount: extractedCommission,
    otherAmounts: isInvoice ? [{ label: 'TVA', amount: 0 }] : [],
  }
  const sourceSnippets: MockExtractionSeed['sourceSnippets'] = {
    supplierName: supplier.name,
    supplierVatId: vatId,
    invoiceNumber: invoiceNumber ?? undefined,
    invoiceDate: isInvoice ? toRoDate(lastDay) : undefined,
    periodFrom: toRoDate(firstDay),
    periodTo: toRoDate(lastDay),
    currency,
    amount: isInvoice ? `Total de plată: ${extractedPrinted}` : printedIncome,
    commissionAmount: extractedPrinted,
  }
  const extractionSeed: MockExtractionSeed = {
    documentType: isInvoice ? 'COMMISSION_INVOICE' : 'PLATFORM_REPORT',
    platform,
    fields,
    sourceSnippets,
    modelConfidence: seed.misreadCommission ? 0.71 : 0.97,
  }

  const fileName =
    seed.fileName ?? `${platform === 'BOLT' ? 'Bolt' : 'Uber'}_${isInvoice ? 'factura_comision' : 'raport'}_${period}_${slug(pfa.name)}.pdf`
  const uploadedAt = seed.uploadedAt ?? UPLOADED_AT
  const base: MockDocument = {
    id,
    pfaId: pfa.id,
    period,
    platform: seed.unprocessed ? null : platform,
    documentType: seed.unprocessed ? 'UNKNOWN' : extractionSeed.documentType,
    fileName,
    status: 'UPLOADED',
    uploadedBy: MOCK_USERS.accountant,
    uploadedAt,
    file: fileRef(id, fileName),
    pdfText,
    extractions: [],
    pendingExtraction: extractionSeed,
    extractionError: null,
    reviewedBy: null,
    reviewedAt: null,
  }
  if (seed.unprocessed) return base

  // Documentele deja citite și confirmate la încărcare, înainte de procesarea lunii.
  const extraction: DocumentExtraction = {
    version: 1,
    fields,
    sourceSnippets,
    modelConfidence: extractionSeed.modelConfidence,
    modelId: 'mock-extractor',
    promptVersion: 'fixture-v1',
    isManualEdit: false,
    manuallyEditedFields: [],
    createdBy: MOCK_USERS.ai,
    createdAt: uploadedAt,
  }
  return {
    ...base,
    status: 'CONFIRMED',
    extractions: [extraction],
    pendingExtraction: null,
    reviewedBy: MOCK_USERS.accountant,
    reviewedAt: REVIEWED_AT,
  }
}

// ---------------------------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------------------------

interface LedgerSeed {
  date: IsoDate
  documentLabel: string
  source: LedgerSource
  counterparty: string | null
  description: string
  transactionType: LedgerTransactionType
  paymentMethod: PaymentMethod
  amount: number
  category?: string
  status?: LedgerEntry['status']
}

function ledgerSeedsFor(name: string): LedgerSeed[] {
  const bank = (
    date: IsoDate,
    counterparty: string,
    description: string,
    amount: number,
    category?: string,
    status?: LedgerEntry['status'],
  ): LedgerSeed => ({
    date,
    documentLabel: `Extras ${date.split('-').reverse().join('.')}`,
    source: 'BANK',
    counterparty,
    description,
    transactionType: amount > 0 ? 'INCOME' : 'EXPENSE',
    paymentMethod: 'BANK',
    amount,
    category,
    status,
  })
  const payout = (date: IsoDate, platform: 'BOLT' | 'UBER', amount: number, status?: LedgerEntry['status']): LedgerSeed => ({
    date,
    documentLabel: `Extras ${date.split('-').reverse().join('.')}`,
    source: platform,
    counterparty: platform === 'BOLT' ? BOLT.name : UBER.name,
    description: `Payout ${platform === 'BOLT' ? 'Bolt' : 'Uber'}`,
    transactionType: 'INCOME',
    paymentMethod: 'BANK',
    amount,
    status,
  })
  const zReport = (date: IsoDate, zNumber: number, total: number, status?: LedgerEntry['status']): LedgerSeed => ({
    date,
    documentLabel: `Raport Z nr. ${zNumber}`,
    source: 'CASH_Z',
    counterparty: null,
    description: `Încasări numerar, raport Z nr. ${zNumber}`,
    transactionType: 'INCOME',
    paymentMethod: 'CASH',
    amount: total,
    status,
  })

  const months: Record<string, LedgerSeed[]> = {
    'Ion Popescu': [
      payout('2026-08-04', 'BOLT', 1720),
      payout('2026-08-11', 'BOLT', 1810),
      payout('2026-08-18', 'BOLT', 1650),
      payout('2026-08-25', 'BOLT', 1820),
      payout('2026-08-06', 'UBER', 1180),
      payout('2026-08-20', 'UBER', 1240),
      bank('2026-08-07', 'OMV Petrom', 'Combustibil', -310, 'FUEL'),
      bank('2026-08-19', 'Rompetrol', 'Combustibil', -285.4, 'FUEL'),
      bank('2026-08-22', 'Service Auto Expert SRL', 'Revizie și plăcuțe frână', -1000, 'CAR_SERVICE'),
      payout('2026-09-01', 'BOLT', 1760),
      payout('2026-09-08', 'BOLT', 1690),
      payout('2026-09-15', 'BOLT', 1840),
      payout('2026-09-03', 'UBER', 1210),
      bank('2026-09-05', 'OMV Petrom', 'Combustibil', -298.2, 'FUEL'),
      bank('2026-09-12', 'Allianz-Țiriac', 'Poliță RCA 12 luni', -1450, 'CAR_INSURANCE'),
      bank('2026-09-18', 'Orange România', 'Abonament telefon', -45, 'PHONE'),
      payout('2026-10-06', 'BOLT', 1730, 'AUTO_IMPORTED'),
      bank('2026-10-08', 'MOL România', 'Combustibil', -276.9, 'FUEL', 'AUTO_IMPORTED'),
      bank('2026-10-09', 'eMAG', 'Cumpărătură neclasificată', -189.99, undefined, 'NEEDS_REVIEW'),
    ],
    'Andrei Dumitrescu': [
      payout('2026-08-05', 'BOLT', 1980),
      payout('2026-08-12', 'BOLT', 2040),
      payout('2026-08-19', 'BOLT', 1910),
      payout('2026-08-26', 'BOLT', 1890),
      payout('2026-08-14', 'UBER', 1180),
      bank('2026-08-09', 'OMV Petrom', 'Combustibil', -340, 'FUEL'),
      bank('2026-08-20', 'Datecs', 'Casă de marcat Datecs DP-25X', -1350, 'CASH_REGISTER'),
      payout('2026-09-02', 'BOLT', 1950),
      payout('2026-09-16', 'BOLT', 2010),
      bank('2026-09-10', 'Rompetrol', 'Combustibil', -320.5, 'FUEL'),
      bank('2026-09-24', 'Spălătoria Clean Car', 'Spălătorie', -60, 'CAR_WASH'),
      zReport('2026-09-05', 118, 310),
      zReport('2026-09-12', 119, 385.5),
      zReport('2026-09-19', 120, 402),
      zReport('2026-09-26', 121, 298),
      zReport('2026-10-03', 122, 356, 'AUTO_IMPORTED'),
      zReport('2026-10-06', 123, 275, 'AUTO_IMPORTED'),
      zReport('2026-10-08', 124, 330, 'AUTO_IMPORTED'),
      // §5.3 „O zi în RIDElance”, 10.10.2026.
      bank('2026-10-10', 'OMV Petrom', 'Combustibil', -300, 'FUEL', 'AUTO_IMPORTED'),
      payout('2026-10-10', 'BOLT', 1850, 'AUTO_IMPORTED'),
      zReport('2026-10-10', 125, 420, 'AUTO_IMPORTED'),
    ],
    'Mihai Ionescu': [
      payout('2026-08-03', 'BOLT', 1520),
      payout('2026-08-17', 'BOLT', 1610),
      payout('2026-08-10', 'UBER', 1330),
      bank('2026-08-12', 'MOL România', 'Combustibil', -290, 'FUEL'),
      bank('2026-08-28', 'Service Auto Expert SRL', 'Schimb ulei și filtre', -1000, 'CAR_SERVICE'),
      payout('2026-09-07', 'BOLT', 1580),
      payout('2026-09-21', 'BOLT', 1640),
      payout('2026-09-14', 'UBER', 1290),
      bank('2026-09-09', 'OMV Petrom', 'Combustibil', -305, 'FUEL'),
      bank('2026-09-15', 'Service Auto Expert SRL', 'Înlocuire amortizoare', -1000, 'CAR_SERVICE'),
      payout('2026-10-05', 'BOLT', 1600, 'AUTO_IMPORTED'),
      bank('2026-10-07', 'Lukoil', 'Combustibil', -270, 'FUEL', 'AUTO_IMPORTED'),
    ],
  }
  return months[name] ?? []
}

function buildLedger(pfa: MockPfa, history: SettingHistoryEntry[], categories: ExpenseCategoryRule[], nextId: () => string): LedgerEntry[] {
  return ledgerSeedsFor(pfa.name)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((seed) => {
      const base = {
        date: seed.date,
        transactionType: seed.transactionType,
        amount: seed.amount,
        category: seed.category ?? null,
      }
      const id = nextId()
      return {
        id,
        pfaId: pfa.id,
        date: seed.date,
        documentLabel: seed.documentLabel,
        sourceDocumentId: null,
        source: seed.source,
        externalId: `${seed.source}-${id}`,
        counterparty: seed.counterparty,
        description: seed.description,
        transactionType: seed.transactionType,
        paymentMethod: seed.paymentMethod,
        amount: seed.amount,
        currency: 'RON',
        category: seed.category ?? null,
        ...resolveDeductibility(base, history, categories),
        status: seed.status ?? 'VERIFIED',
        accountingPeriod: periodOf(seed.date),
        closedPeriodFlag: false,
        rowVersion: '1',
      }
    })
}

function assetsFor(pfa: MockPfa): Asset[] {
  const asset = (id: string, type: string, description: string, acquisitionDate: IsoDate, acquisitionValue: number): Asset => ({
    id: `asset-${pfa.id.replace('pfa-', '')}-${id}`,
    pfaId: pfa.id,
    type,
    description,
    acquisitionDate,
    acquisitionValue,
    document: fileRef(`asset-${pfa.id}-${id}`, `Factura_${id}.pdf`),
    status: 'IN_USE',
    disposedDate: null,
  })
  switch (pfa.name) {
    case 'Ion Popescu':
      return [asset('car', 'Autoturism', 'Toyota Corolla Hybrid, B-101-IPP', '2024-06-01', 98500)]
    case 'Andrei Dumitrescu':
      return [
        asset('car', 'Autoturism', 'Dacia Logan MCV, B-123-ADM', '2025-11-15', 62000),
        asset('ecr', 'Casă de marcat', 'Datecs DP-25X', '2026-08-20', 1350),
      ]
    case 'Mihai Ionescu':
      return [
        asset('car', 'Autoturism', 'Skoda Octavia, IF-45-MIH', '2025-02-10', 87000),
        { ...asset('phone', 'Telefon', 'Samsung Galaxy A55', '2026-02-10', 1899), status: 'DISPOSED', disposedDate: '2026-09-15' },
      ]
    default:
      return []
  }
}

// ---------------------------------------------------------------------------------------------
// Asamblare
// ---------------------------------------------------------------------------------------------

export function createFixtureDb(): MockDb {
  let sequence = 0
  const nextId = () => `led-${String(++sequence).padStart(4, '0')}`

  const seeds: PfaSeed[] = [...NAMED, ...GENERIC_NAMES.map((name, index) => genericSeed(name, index + NAMED.length)), ...INACTIVE]
  const categories = expenseCategories()

  const pfas: MockPfa[] = []
  const settingsHistory: MockDb['settingsHistory'] = {}
  const documents: MockDocument[] = []
  const ledger: LedgerEntry[] = []
  const assets: Asset[] = []
  const periods: AccountingPeriod[] = []

  seeds.forEach((seed, index) => {
    const id = `pfa-${slug(seed.name)}`
    const inactive = Boolean(seed.endDate)
    const startDate = seed.startDate ?? (index % 3 === 0 ? '2025-09-01' : '2026-01-01')
    const art317ActivationDate = startDate
    const cashStatus = seed.cash ?? 'NOT_REQUIRED_CURRENT_CONFIGURATION'

    const pfa: MockPfa = {
      id,
      name: seed.name,
      cui: cuiFor(index + 1),
      engagement: { status: inactive ? 'INACTIVE' : 'ACTIVE', startDate, endDate: seed.endDate ?? null },
      cash: {
        status: cashStatus,
        cashRequested: cashStatus !== 'NOT_REQUIRED_CURRENT_CONFIGURATION',
        cashEnabled: cashStatus === 'ACTIVE',
        activationDate: seed.cashActivationDate ?? null,
        verifiedBy: cashStatus === 'ACTIVE' ? MOCK_USERS.accountant : null,
        evidenceFile: cashStatus === 'ACTIVE' ? fileRef(`fiscalizare-${id}`, 'Dovada_fiscalizare_casa_de_marcat.pdf') : null,
      },
      monthStatus: {},
      failFirstValidation: seed.failFirstValidation ?? null,
    }
    pfas.push(pfa)

    const changedAt = `${startDate}T10:00:00Z`
    const history: SettingHistoryEntry[] = [
      {
        id: `set-${id}-art317`,
        key: 'art317',
        value: true,
        validFrom: art317ActivationDate,
        validTo: null,
        note: 'Cod special de TVA art. 317 obținut la înregistrare.',
        changedBy: MOCK_USERS.accountant,
        changedAt,
      },
      {
        id: `set-${id}-platforms`,
        key: 'platforms',
        value: seed.platforms,
        validFrom: startDate,
        validTo: null,
        note: 'Platformele declarate la onboarding.',
        changedBy: MOCK_USERS.accountant,
        changedAt,
      },
      ...(seed.deductibility ?? DEFAULT_DEDUCTIBILITY).map((item, itemIndex) => ({
        id: `set-${id}-deductibility-${itemIndex}`,
        key: 'vehicle_deductibility' as const,
        value: item.value,
        validFrom: item.validFrom < startDate ? startDate : item.validFrom,
        validTo: null,
        note: item.note,
        changedBy: MOCK_USERS.accountant,
        changedAt: `${item.validFrom}T10:00:00Z`,
      })),
    ]
    settingsHistory[id] = history

    // Perioadele contabile: închise până în iulie inclusiv; la inactive, până la final.
    const firstPeriod = periodOf(startDate) < '2026-01' ? '2026-01' : periodOf(startDate)
    const lastPeriod = seed.endDate ? periodOf(seed.endDate) : LAST_FIXTURE_PERIOD
    for (const period of periodRange(firstPeriod, lastPeriod)) {
      const closed = inactive || period <= '2026-07'
      periods.push({
        pfaId: id,
        period,
        status: closed ? 'CLOSED' : 'OPEN',
        closedBy: closed ? MOCK_USERS.accountant : null,
        closedAt: closed ? `${period}-28T12:00:00Z` : null,
      })
    }

    if (inactive) return

    const invoiceSlots: DocumentSeed[] = []
    if (seed.bolt) {
      invoiceSlots.push({
        pfa,
        platform: 'BOLT',
        kind: 'invoice',
        ...seed.bolt,
        misreadCommission: seed.name === 'Bogdan Matei' ? 1284.5 : undefined,
        unprocessed: seed.name === 'Bogdan Matei',
      })
      invoiceSlots.push({ pfa, platform: 'BOLT', kind: 'report', ...seed.bolt })
    }
    if (seed.uber) {
      // George Stan: lipsește factura Uber.
      if (seed.name !== 'George Stan') {
        invoiceSlots.push({
          pfa,
          platform: 'UBER',
          kind: 'invoice',
          ...seed.uber,
          currency: seed.uberCurrency,
          vatIdOnDocument: seed.name === 'Răzvan Ene' ? 'NL001234567B01' : undefined,
          unprocessed: seed.name === 'Răzvan Ene',
        })
      }
      invoiceSlots.push({ pfa, platform: 'UBER', kind: 'report', ...seed.uber, currency: seed.uberCurrency })
    }
    invoiceSlots.forEach((slot, slotIndex) => documents.push(buildDocument(slot, index * 10 + slotIndex)))

    ledger.push(...buildLedger(pfa, history, categories, nextId))
    assets.push(...assetsFor(pfa))
  })

  return {
    config: {
      euCountries: ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'SE', 'SI', 'SK'],
      allowedCurrencies: ['RON', 'EUR'],
      settlementCorrelation: { minPercent: 10, maxPercent: 30 },
      vatExigibilityDate: 'INVOICE_DATE',
      retention: { yearsAfter: 5, startMonthDay: '07-01' },
    },
    pfas,
    settingsHistory,
    documents,
    declarations: [],
    suppliers: suppliers(),
    vatRates: [
      { id: 'vat-19', rate: 19, validFrom: '2017-01-01', validTo: '2025-07-31' },
      { id: 'vat-21', rate: 21, validFrom: '2025-08-01', validTo: null },
    ],
    d100Rules: [
      {
        id: 'd100-commission',
        code: 'D100_COMMISSION_NONRESIDENT',
        enabled: true,
        description: 'Impozit pe veniturile nerezidenților din comisioanele reținute de platforme.',
        pendingConfirmation: false,
        parameters: { base: 'COMMISSION_AMOUNT_RON', rateSource: 'SupplierTaxProfile.D100Rate' },
        validFrom: '2025-01-01',
        validTo: null,
      },
      {
        id: 'd100-rent',
        code: 'D100_RENT_INDIVIDUAL',
        enabled: false,
        description: 'Impozit pe chiria plătită persoanelor fizice. DE CONFIRMAT: bază, cotă, sursa datelor.',
        pendingConfirmation: true,
        parameters: {},
        validFrom: '2025-01-01',
        validTo: null,
      },
    ],
    // Versiunile reale vin din kiturile ANAF (B4); în mock rămân marcate ca atare.
    anafSchemas: (['D100', 'D301', 'D390'] as const).map((declarationType) => ({
      id: `schema-${declarationType.toLowerCase()}`,
      declarationType,
      version: 'necompletat (mock)',
      xsdFile: null,
      validatorVersion: null,
      validFrom: '2025-01-01',
      validTo: null,
    })),
    expenseCategories: categories,
    exchangeRates: [
      // Curs de test; sursa și ziua cursului sunt DE CONFIRMAT (§6 pct. 4).
      { currency: 'EUR', date: '2026-08-31', rate: 5.08, source: 'BNR (fixture)' },
    ],
    ledger,
    assets,
    periods,
    corrections: [],
    audit: [],
    jobs: {},
    sequence: 1000,
  }
}
