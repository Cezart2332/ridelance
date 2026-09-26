/**
 * Contractul API al modulului de contabilitate PFA (spec contabilitate §3–§4).
 *
 * Sursa de adevăr pentru frontend până la B0, când tipurile se oglindesc în DTO-urile C#.
 * Enum-urile sunt uniuni de șiruri (proiectul compilează cu `erasableSyntaxOnly`, deci fără
 * `enum`), fiecare cu lista de valori alături, ca să poată fi iterate în filtre și în teste.
 *
 * Convenții:
 * - perioada lunară e `yyyy-MM`; datele sunt ISO `yyyy-MM-dd`; momentele sunt ISO UTC;
 * - sumele sunt în RON, cu zecimale, nerotunjite (rotunjirea pe declarație e DE CONFIRMAT);
 * - cotele (`rate`) sunt procente: `21` înseamnă 21%.
 */

/** `yyyy-MM`, de ex. `2026-08`. */
export type Period = string
/** `yyyy-MM-dd`. */
export type IsoDate = string
/** Moment ISO 8601 în UTC. */
export type IsoDateTime = string

/** Rolurile care văd modulul. Numele urmează `UserRole` din backend, nu `ADMIN`/`ACCOUNTANT` din spec. */
export const ACCOUNTING_ROLES = ['Admin', 'Contabil'] as const
export type AccountingRole = (typeof ACCOUNTING_ROLES)[number]

// ---------------------------------------------------------------------------------------------
// §3 Enumerări
// ---------------------------------------------------------------------------------------------

export const PLATFORMS = ['BOLT', 'UBER'] as const
export type Platform = (typeof PLATFORMS)[number]

/** §3.1 */
export const PLATFORM_DOCUMENT_STATUSES = [
  'UPLOADED',
  'EXTRACTING',
  'EXTRACTION_FAILED',
  'NEEDS_REVIEW',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'LOCKED',
] as const
export type PlatformDocumentStatus = (typeof PLATFORM_DOCUMENT_STATUSES)[number]

/** Clasificarea documentului; vine din extracție, nu din alegerea utilizatorului. */
export const PLATFORM_DOCUMENT_TYPES = ['COMMISSION_INVOICE', 'PLATFORM_REPORT', 'UNKNOWN'] as const
export type PlatformDocumentType = (typeof PLATFORM_DOCUMENT_TYPES)[number]

/** §3.2 */
export const DECLARATION_STATUSES = [
  'NOT_APPLICABLE',
  'BLOCKED_MISSING_DOCUMENTS',
  'BLOCKED_NEEDS_REVIEW',
  'DRAFT',
  'GENERATED',
  'VALIDATION_FAILED',
  'VALIDATED',
  'READY_TO_SIGN',
  'SIGNED',
  'SUBMITTED',
  'ACCEPTED',
  'REJECTED',
] as const
export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number]

export const DECLARATION_TYPES = ['D100', 'D301', 'D390'] as const
export type DeclarationType = (typeof DECLARATION_TYPES)[number]

export const DECLARATION_VERSION_KINDS = ['INITIAL', 'RECTIFICATIVE'] as const
export type DeclarationVersionKind = (typeof DECLARATION_VERSION_KINDS)[number]

/** Acțiunile din `POST /declaration-versions/{id}/transitions`. Recipisa și rectificativa au endpoint-uri proprii. */
export const DECLARATION_ACTIONS = ['VALIDATE', 'MARK_SIGNED', 'MARK_SUBMITTED', 'MARK_REJECTED', 'REGENERATE'] as const
export type DeclarationAction = (typeof DECLARATION_ACTIONS)[number]

export const VALIDATION_LEVELS = ['RIDELANCE', 'XSD', 'ANAF'] as const
export type ValidationLevel = (typeof VALIDATION_LEVELS)[number]

/** Verificările deterministe de pe document (B1). */
export const DOCUMENT_CHECK_CODES = [
  'AMOUNT_IN_TEXT',
  'ARITHMETIC',
  'SUPPLIER_KNOWN',
  'VAT_ID_FORMAT',
  'PERIOD_MATCH',
  'NOT_DUPLICATE',
  'NOT_ALREADY_DECLARED',
  'CURRENCY_ALLOWED',
  'SETTLEMENT_CORRELATION',
] as const
export type DocumentCheckCode = (typeof DOCUMENT_CHECK_CODES)[number]

/**
 * Starea unui PFA pe o lună, după pre-check (B3). Alimentează statisticile din §4.3
 * (`ready`, `needsReview`, `missingDocuments`, `notProcessed`).
 */
export const PFA_MONTH_STATUSES = ['NOT_PROCESSED', 'READY', 'NEEDS_REVIEW', 'MISSING_DOCUMENTS'] as const
export type PfaMonthStatus = (typeof PFA_MONTH_STATUSES)[number]

export const ENGAGEMENT_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number]

/** §3.3 */
export const LEDGER_SOURCES = ['BANK', 'UBER', 'BOLT', 'OBLIO', 'UPLOAD', 'CASH_Z', 'MANUAL'] as const
export type LedgerSource = (typeof LEDGER_SOURCES)[number]

export const LEDGER_TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER', 'OWNER_CONTRIBUTION', 'LOAN', 'TAX', 'OTHER'] as const
export type LedgerTransactionType = (typeof LEDGER_TRANSACTION_TYPES)[number]

export const PAYMENT_METHODS = ['BANK', 'CASH'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const DEDUCTIBILITY_TYPES = ['100_PERCENT', '50_PERCENT', 'NON_DEDUCTIBLE', 'SPECIAL_RULE'] as const
export type DeductibilityType = (typeof DEDUCTIBILITY_TYPES)[number]

export const LEDGER_ENTRY_STATUSES = ['AUTO_IMPORTED', 'NEEDS_REVIEW', 'VERIFIED', 'LOCKED'] as const
export type LedgerEntryStatus = (typeof LEDGER_ENTRY_STATUSES)[number]

/** §3.4 */
export const CASH_REGISTER_STATUSES = ['NOT_REQUIRED_CURRENT_CONFIGURATION', 'PENDING', 'IN_VERIFICATION', 'ACTIVE'] as const
export type CashRegisterStatus = (typeof CASH_REGISTER_STATUSES)[number]

/** §3.5 */
export const ACCOUNTING_PERIOD_STATUSES = ['OPEN', 'CLOSED'] as const
export type AccountingPeriodStatus = (typeof ACCOUNTING_PERIOD_STATUSES)[number]

/** §3.6 */
export const REF_STATUSES = ['CURRENT', 'FINAL', 'INTERMEDIATE'] as const
export type RefStatus = (typeof REF_STATUSES)[number]

export const JOB_STATUSES = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_TYPES = ['PROCESS_PERIOD', 'GENERATE_DECLARATIONS', 'VALIDATE_DECLARATIONS', 'HANDOVER_PACKAGE'] as const
export type JobType = (typeof JOB_TYPES)[number]

export const EXPORT_FORMATS = ['pdf', 'xlsx'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

// ---------------------------------------------------------------------------------------------
// Comune
// ---------------------------------------------------------------------------------------------

export interface UserRef {
  id: string
  name: string
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

/** Un fișier servit de backend. Descărcarea trece prin endpoint-ul dedicat, nu printr-un URL public. */
export interface StoredFileRef {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  /** SHA-256, hex. */
  hash: string
}

// ---------------------------------------------------------------------------------------------
// §4.1 PFA și dosar
// ---------------------------------------------------------------------------------------------

export interface PfaListQuery {
  status?: 'active' | 'inactive'
  search?: string
}

export interface PfaListItem {
  id: string
  name: string
  cui: string
  /** Cod special de TVA art. 317. */
  art317: boolean
  platforms: Platform[]
  engagementStatus: EngagementStatus
  /** Luna fiscală curentă (cea pentru care se pregătesc declarațiile). */
  currentPeriod: Period
  /** Badge-ul agregat al lunii curente. */
  currentMonthStatus: PfaMonthStatus
  cashStatus: CashRegisterStatus
}

export interface PfaAccountingSummary {
  id: string
  name: string
  cui: string
  /** Sistem real: mereu `true` în V1 (read-only). */
  realSystem: boolean
  /** Plătitor normal de TVA: mereu `false` în V1 (read-only). */
  vatPayer: boolean
  art317: boolean
  art317ActivationDate: IsoDate | null
  platforms: Platform[]
  engagement: {
    status: EngagementStatus
    startDate: IsoDate
    endDate: IsoDate | null
  }
  currentPeriod: Period
  currentMonthStatus: PfaMonthStatus
  cash: CashRegisterState
  /** Dosar inactiv: toate acțiunile de scriere dispar din UI. */
  readOnly: boolean
  /** Calculat de backend (`RetentionService`); doar pentru dosarele inactive. */
  retentionUntil: IsoDate | null
}

/** Cheile setărilor versionate pe `validFrom` (`PfaAccountingSettings`, append-only). */
export const SETTING_KEYS = ['art317', 'platforms', 'vehicle_deductibility'] as const
export type SettingKey = (typeof SETTING_KEYS)[number]

export type VehicleDeductibility = '50_PERCENT' | '100_PERCENT'

export interface SettingValueMap {
  art317: boolean
  platforms: Platform[]
  vehicle_deductibility: VehicleDeductibility
}

export interface SettingHistoryEntry<K extends SettingKey = SettingKey> {
  id: string
  key: K
  value: SettingValueMap[K]
  validFrom: IsoDate
  /** Derivat din `validFrom`-ul intrării următoare; `null` = valabilă în continuare. */
  validTo: IsoDate | null
  note: string
  changedBy: UserRef
  changedAt: IsoDateTime
}

export interface PfaAccountingSettings {
  pfaId: string
  realSystem: boolean
  vatPayer: boolean
  /** Valorile valabile azi. */
  art317: { enabled: boolean; activationDate: IsoDate | null }
  platforms: Platform[]
  vehicleDeductibility: VehicleDeductibility
  cash: CashRegisterState
  history: SettingHistoryEntry[]
}

export type SettingsChange = {
  [K in SettingKey]: { field: K; value: SettingValueMap[K]; validFrom: IsoDate; note: string }
}[SettingKey]

export interface CashRegisterState {
  status: CashRegisterStatus
  cashRequested: boolean
  cashEnabled: boolean
  activationDate: IsoDate | null
  verifiedBy: UserRef | null
  evidenceFile: StoredFileRef | null
}

export interface CashTransitionRequest {
  to: CashRegisterStatus
  note: string
  /** Obligatoriu pentru trecerea în `ACTIVE`. */
  evidenceDocumentId?: string
}

/** Răspunsul `POST /pfas/{pfaId}/cash/evidence`: id-ul dovezii, trimis apoi la tranziția spre `ACTIVE`. */
export interface CashEvidenceUploadResult {
  documentId: string
}

/**
 * Răspunsul PFA-ului la întrebarea din onboarding (pasul 3) despre plățile în numerar. DA pune
 * casa de marcat în `PENDING`; activarea rămâne a contabilului (F7).
 */
export interface CashPreference {
  cashRequested: boolean
  answeredAt: IsoDateTime
}

export interface DeactivateRequest {
  accountingEndDate: IsoDate
}

export interface JobRef {
  jobId: string
}

export interface AuditQuery {
  from?: IsoDate
  to?: IsoDate
  entity?: string
}

export interface AuditEntry {
  id: string
  /** Numele entității din backend, de ex. `DeclarationVersion`, `LedgerEntry`. */
  entity: string
  entityId: string
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
  user: UserRef
  at: IsoDateTime
}

// ---------------------------------------------------------------------------------------------
// §4.2 Documente platformă
// ---------------------------------------------------------------------------------------------

export interface PlatformDocument {
  id: string
  pfaId: string
  period: Period
  platform: Platform | null
  documentType: PlatformDocumentType
  fileName: string
  status: PlatformDocumentStatus
  uploadedBy: UserRef
  uploadedAt: IsoDateTime
}

export interface PlatformDocumentListItem extends PlatformDocument {
  /** Suma principală citită (comisionul la facturi, venitul la rapoarte); `null` înainte de extracție. */
  mainAmount: number | null
  currency: string | null
  failedChecks: number
}

export interface OtherAmount {
  label: string
  amount: number
}

/** Câmpurile tipate ale extracției (B0 `DocumentExtraction`). */
export interface ExtractedFields {
  supplierName: string | null
  supplierCountry: string | null
  supplierVatId: string | null
  invoiceNumber: string | null
  invoiceDate: IsoDate | null
  periodFrom: IsoDate | null
  periodTo: IsoDate | null
  currency: string | null
  /** Totalul documentului; la rapoarte, venitul brut din curse. */
  amount: number | null
  commissionAmount: number | null
  otherAmounts: OtherAmount[]
}

export type ExtractedFieldKey = keyof ExtractedFields

export interface DocumentExtraction {
  version: number
  fields: ExtractedFields
  /** Textul exact din PDF pentru fiecare valoare; căutat în text layer pentru evidențiere. */
  sourceSnippets: Partial<Record<ExtractedFieldKey, string>>
  /** 0–1, informație secundară. */
  modelConfidence: number | null
  modelId: string | null
  promptVersion: string | null
  isManualEdit: boolean
  /** Câmpurile modificate manual față de extracția AI, marcate în UI. */
  manuallyEditedFields: ExtractedFieldKey[]
  createdBy: UserRef | null
  createdAt: IsoDateTime
}

export interface DocumentCheck {
  code: DocumentCheckCode
  passed: boolean
  message: string
  /** Acțiunea propusă lângă verificarea picată. */
  action?: 'ADD_SUPPLIER'
}

export interface DeclarationReference {
  declarationId: string
  versionId: string
  type: DeclarationType
  period: Period
  versionNo: number
  kind: DeclarationVersionKind
  status: DeclarationStatus
}

export interface PlatformDocumentDetail extends PlatformDocumentListItem {
  file: StoredFileRef
  extraction: DocumentExtraction | null
  checks: DocumentCheck[]
  includedIn: DeclarationReference[]
  /** Explicația afișată pe un document `LOCKED`. */
  lockedReason: string | null
  reviewedBy: UserRef | null
  reviewedAt: IsoDateTime | null
  /** Mesajul de eroare pentru `EXTRACTION_FAILED`. */
  extractionError: string | null
}

export interface UploadPlatformDocumentRequest {
  file: File
  period: Period
}

export interface UpdateExtractionRequest {
  fields: Partial<ExtractedFields>
  /** Obligatoriu. */
  reason: string
}

export interface ConfirmBulkRequest {
  ids: string[]
}

export interface ConfirmBulkResult {
  confirmed: string[]
  skipped: { id: string; reason: string }[]
}

// ---------------------------------------------------------------------------------------------
// §4.3 Luna fiscală (bulk)
// ---------------------------------------------------------------------------------------------

export interface PeriodStats {
  total: number
  ready: number
  needsReview: number
  missingDocuments: number
  notProcessed: number
}

export interface PlatformMonthFigures {
  income: number | null
  commission: number | null
}

export interface DeclarationCell {
  declarationId: string | null
  versionId: string | null
  /** `null` = nimic calculat încă (luna neprocesată). */
  status: DeclarationStatus | null
  amount: number | null
}

export interface OverviewRow {
  pfaId: string
  pfaName: string
  cui: string
  status: PfaMonthStatus
  /** Primul motiv se afișează sub numele PFA-ului. */
  blockingReasons: string[]
  bolt: PlatformMonthFigures | null
  uber: PlatformMonthFigures | null
  declarations: Record<DeclarationType, DeclarationCell>
}

export interface PeriodOverview {
  period: Period
  stats: PeriodStats
  rows: OverviewRow[]
}

export interface JobResultItem {
  pfaId: string | null
  pfaName: string | null
  message: string
}

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  progress: { done: number; total: number }
  results: JobResultItem[]
  errors: JobResultItem[]
  createdAt: IsoDateTime
  finishedAt: IsoDateTime | null
  /** Doar pentru `HANDOVER_PACKAGE`: arhiva generată. */
  file: StoredFileRef | null
}

// ---------------------------------------------------------------------------------------------
// §4.4 Declarații
// ---------------------------------------------------------------------------------------------

export interface DeclarationSummary {
  declarationId: string | null
  pfaId: string
  period: Period
  type: DeclarationType
  status: DeclarationStatus | null
  /** De plată. D390 e mereu 0 (doar raportare). */
  amount: number | null
  currentVersionId: string | null
  currentVersionNo: number | null
  currentVersionKind: DeclarationVersionKind | null
  blockingReasons: string[]
}

export interface StatusHistoryEntry {
  from: DeclarationStatus | null
  to: DeclarationStatus
  at: IsoDateTime
  by: UserRef
  note: string | null
}

export interface ValidationMessage {
  /** Câmpul din declarație, dacă eroarea se poate lega de unul. */
  field: string | null
  text: string
}

export interface ValidationLevelResult {
  level: ValidationLevel
  passed: boolean
  messages: ValidationMessage[]
}

export interface ValidationResult {
  levels: ValidationLevelResult[]
  validatedAt: IsoDateTime
  validatorVersion: string | null
}

export interface DeclarationVersion {
  id: string
  declarationId: string
  versionNo: number
  kind: DeclarationVersionKind
  status: DeclarationStatus
  amount: number
  schemaVersion: string | null
  rectificationReason: string | null
  hasXml: boolean
  hasPdf: boolean
  receiptNumber: string | null
  receiptFile: StoredFileRef | null
  statusHistory: StatusHistoryEntry[]
  createdAt: IsoDateTime
  /** Concurrency token. */
  rowVersion: string
}

export interface DeclarationDetail {
  id: string
  pfaId: string
  period: Period
  type: DeclarationType
  versions: DeclarationVersion[]
  currentVersionId: string
}

/** Tipul operațiunii din D390; în V1 doar servicii. */
export type D390OperationType = 'S'

export interface DeclarationLine {
  id: string
  sourceDocumentId: string
  /** De ex. „Factura Bolt BOLT-2026-08-0001”. */
  sourceDocumentLabel: string
  ruleCode: string
  base: number
  rate: number | null
  value: number
  currency: string
  /** Cursul folosit, când documentul nu e în RON. */
  exchangeRate: number | null
  /** „1.000,00 × 21% = 210,00”. */
  explanation: string
  supplierName: string
  supplierCountry: string
  supplierVatId: string
  /** D390 */
  operationType: D390OperationType | null
  /** D100: convenția de evitare a dublei impuneri aplicată. */
  treaty: string | null
  /** D100: valabilitatea certificatului de rezidență. */
  residenceCertValidFrom: IsoDate | null
  residenceCertValidTo: IsoDate | null
}

export interface DeclarationBreakdown {
  lines: DeclarationLine[]
  total: number
  explanation: string
  /** D301: veniturile din curse, care nu intră în bază. */
  excludedRideIncome: number | null
}

export interface TransitionRequest {
  action: DeclarationAction
  /** Obligatoriu pentru `MARK_REJECTED`. */
  note?: string
}

export interface UploadReceiptRequest {
  file: File
  receiptNumber?: string
}

export interface RectificationRequest {
  reason: string
}

// ---------------------------------------------------------------------------------------------
// §4.5 Reguli fiscale (fără DELETE: o regulă se închide prin `validTo`)
// ---------------------------------------------------------------------------------------------

export interface Validity {
  validFrom: IsoDate
  validTo: IsoDate | null
}

export interface SupplierTaxProfile extends Validity {
  id: string
  supplierName: string
  country: string
  vatId: string
  /** De ex. `COMMISSION`. */
  incomeType: string
  /** De ex. „Convenția RO–EE”. */
  treaty: string | null
  d100Rate: number | null
  /** `false` blochează D100 cu „Cota D100 pentru {furnizor} nu e confirmată”. */
  d100RateConfirmed: boolean
  residenceCertValidFrom: IsoDate | null
  residenceCertValidTo: IsoDate | null
  residenceCertFile: StoredFileRef | null
  /** Observație afișată lângă profil, de ex. „fixture – de înlocuit”. */
  note: string | null
}

export interface VatRate extends Validity {
  id: string
  rate: number
}

export const D100_RULE_CODES = ['D100_COMMISSION_NONRESIDENT', 'D100_RENT_INDIVIDUAL'] as const
export type D100RuleCode = (typeof D100_RULE_CODES)[number]

export interface D100Rule extends Validity {
  id: string
  code: D100RuleCode
  enabled: boolean
  description: string
  /** Marcată DE CONFIRMAT cu contabilul: afișată ca atare, nu se aplică până nu e confirmată. */
  pendingConfirmation: boolean
  parameters: Record<string, unknown>
}

export interface AnafDeclarationSchema extends Validity {
  id: string
  declarationType: DeclarationType
  version: string
  xsdFile: StoredFileRef | null
  validatorVersion: string | null
}

export interface ExpenseCategoryRule extends Validity {
  id: string
  category: string
  label: string
  /** Legată de autovehicul: deductibilitatea vine din setarea `vehicle_deductibility`. */
  vehicleRelated: boolean
  defaultDeductibility: DeductibilityType
  /** Regula deterministă de clasificare (contrapartidă sau MCC). */
  counterpartyPattern: string | null
}

export interface ExchangeRate {
  currency: string
  date: IsoDate
  rate: number
  source: string
}

export interface ExchangeRateQuery {
  currency: string
  date: IsoDate
}

/** Ce trimite formularul la creare; `id` îl dă backendul. */
export type RuleInput<T extends { id: string }> = Omit<T, 'id'>

// ---------------------------------------------------------------------------------------------
// §4.6 Ledger, cash, registre, perioade
// ---------------------------------------------------------------------------------------------

export interface LedgerQuery {
  from?: IsoDate
  to?: IsoDate
  status?: LedgerEntryStatus
  type?: LedgerTransactionType
  source?: LedgerSource
  page?: number
  pageSize?: number
}

/**
 * O înregistrare contabilă internă. Câmpurile complete vin din documentul clientului, secțiunea 3,
 * care nu e în repo: lista de aici e cea din spec (F6, B6) și se reconciliază la B0.
 */
export interface LedgerEntry {
  id: string
  pfaId: string
  date: IsoDate
  /** Documentul justificativ, așa cum apare în RJIP (de ex. „Extras 10.10.2026”, „Z 125”). */
  documentLabel: string
  sourceDocumentId: string | null
  source: LedgerSource
  externalId: string | null
  counterparty: string | null
  description: string
  transactionType: LedgerTransactionType
  paymentMethod: PaymentMethod
  /** Pozitivă la încasări, negativă la plăți. */
  amount: number
  currency: string
  /** Categoria din `ExpenseCategoryRule`, doar pentru cheltuieli. */
  category: string | null
  vehicleRelated: boolean
  deductibilityType: DeductibilityType | null
  deductiblePercent: number | null
  deductibleAmount: number | null
  /** Setarea și data ei, pentru „sumă × % = deductibil”. */
  deductibilityRule: { settingKey: SettingKey | null; ruleId: string | null; validFrom: IsoDate } | null
  status: LedgerEntryStatus
  /** `yyyy-MM` */
  accountingPeriod: Period
  /** Import căzut într-o perioadă închisă (B6). */
  closedPeriodFlag: boolean
  rowVersion: string
}

export interface UpdateLedgerEntryRequest {
  /** `sourceDocumentId` confirmă potrivirea propusă la încărcarea unui document de cheltuială. */
  fields: Partial<
    Pick<
      LedgerEntry,
      'date' | 'documentLabel' | 'counterparty' | 'description' | 'transactionType' | 'paymentMethod' | 'amount' | 'category' | 'sourceDocumentId'
    >
  >
  reason: string
}

export interface ManualLedgerEntryRequest {
  date: IsoDate
  documentLabel: string
  counterparty: string | null
  description: string
  transactionType: LedgerTransactionType
  paymentMethod: PaymentMethod
  amount: number
  category: string | null
  reason: string
}

export interface ExpenseDocumentUploadResult {
  documentId: string
  extracted: {
    merchant: string | null
    merchantCui: string | null
    date: IsoDate | null
    total: number | null
    items: string[]
  }
  /** Tranzacția propusă pentru potrivire; utilizatorul confirmă. */
  proposedMatch: LedgerEntry | null
}

export interface ZReport {
  id: string
  date: IsoDate
  zNumber: string
  total: number
  file: StoredFileRef | null
  ledgerEntryId: string | null
}

export interface ZReportUploadResult {
  extracted: { date: IsoDate | null; zNumber: string | null; total: number | null }
  ledgerEntry: LedgerEntry
}

export const ASSET_STATUSES = ['IN_USE', 'DISPOSED'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

export interface Asset {
  id: string
  pfaId: string
  type: string
  description: string
  acquisitionDate: IsoDate
  acquisitionValue: number
  document: StoredFileRef | null
  status: AssetStatus
  disposedDate: IsoDate | null
}

export type AssetInput = Omit<Asset, 'id' | 'pfaId'>

export interface RangeQuery {
  from: IsoDate
  to: IsoDate
}

/**
 * Rândul RJIP (14-1-1/b). Coloanele exacte din OMFP 170/2015 sunt DE CONFIRMAT (§6 pct. 10);
 * forma de aici e cea din spec B7.
 */
export interface RjipRow {
  ledgerEntryId: string
  date: IsoDate
  document: string
  operation: string
  cashIn: number
  cashOut: number
  bankIn: number
  bankOut: number
}

export interface RjipMonthTotal {
  period: Period
  cashIn: number
  cashOut: number
  bankIn: number
  bankOut: number
}

export interface RjipView {
  pfaId: string
  from: IsoDate
  to: IsoDate
  rows: RjipRow[]
  monthTotals: RjipMonthTotal[]
}

/** Rândul REF (OMFP 3254/2017). Denumirile elementelor de calcul vin din modelul oficial, DE CONFIRMAT. */
export interface RefRow {
  year: number
  rectification: boolean
  incomeCategory: string
  calculationElement: string
  value: number
}

export interface RefView {
  pfaId: string
  year: number
  status: RefStatus
  /** Data situației intermediare; `null` pentru `CURRENT`/`FINAL`. */
  asOf: IsoDate | null
  rows: RefRow[]
}

export interface InventoryView {
  pfaId: string
  year: number
  assets: Asset[]
}

export interface RegisterExportQuery {
  format: ExportFormat
}

export interface AccountingPeriod {
  pfaId: string
  period: Period
  status: AccountingPeriodStatus
  closedBy: UserRef | null
  closedAt: IsoDateTime | null
}

export interface PeriodCorrectionRequest {
  ledgerEntryId?: string
  change: Record<string, unknown>
  reason: string
}

export interface PeriodCorrection {
  id: string
  pfaId: string
  period: Period
  ledgerEntryId: string | null
  change: Record<string, unknown>
  reason: string
  by: UserRef
  at: IsoDateTime
}
