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
export const LEDGER_SOURCES = ['BANK', 'UBER', 'BOLT', 'OBLIO', 'UPLOAD', 'CASH_Z', 'MANUAL', 'E_FACTURA'] as const
export type LedgerSource = (typeof LEDGER_SOURCES)[number]

export const LEDGER_TRANSACTION_TYPES = [
  'INCOME', 'EXPENSE', 'TRANSFER', 'OWNER_CONTRIBUTION', 'LOAN', 'TAX', 'OTHER',
  'OWNER_WITHDRAWAL', 'INTERNAL_TRANSFER', 'PLATFORM_SETTLEMENT',
] as const
export type LedgerTransactionType = (typeof LEDGER_TRANSACTION_TYPES)[number]

/** Canalul: `MANUAL` = card sau cont neconectat (spec flux contabil R34, R35). */
export const PAYMENT_METHODS = ['BANK', 'CASH', 'MANUAL'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Spec flux contabil §4: cât de sigur e legată înregistrarea de documente și bani. */
export const RECONCILIATION_STATUSES = ['MATCHED', 'PARTIAL', 'UNMATCHED', 'NEEDS_REVIEW', 'NEEDS_RECONCILIATION'] as const
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number]

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

export const EXPORT_FORMATS = ['pdf', 'xlsx', 'csv'] as const
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
  client: ClientContact
}

/** Titularul contului PFA: chat, open banking și datele de contact din profilul clientului. */
export interface ClientContact {
  userId: string
  email: string
  phone: string | null
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
  client: ClientContact
}

/** Cheile setărilor versionate pe `validFrom` (`PfaAccountingSettings`, append-only). */
export const SETTING_KEYS = ['art317', 'art317_vat_code', 'platforms', 'vehicle_deductibility'] as const
export type SettingKey = (typeof SETTING_KEYS)[number]

export type VehicleDeductibility = '50_PERCENT' | '100_PERCENT'

export interface SettingValueMap {
  art317: boolean
  /** Codul de TVA art. 317 (`RO51321900`); separat de CUI, poate diferi de „RO” + CUI. */
  art317_vat_code: string
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
  art317: { enabled: boolean; activationDate: IsoDate | null; vatCode?: string | null }
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
  /** „Data impozitării” (tax point) de pe factură; decide luna fiscală a facturilor săptămânale Uber. */
  taxPointDate: IsoDate | null
  /** Reținerea la sursă raportată de platformă (rezumatul Bolt); doar informativ față de D100. */
  withheldTax: number | null
  /** Venitul cash din raportul platformei: doar control față de rapoartele Z (R24). */
  cashAmount?: number | null
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
  /** Trecută, dar de văzut (ex. corelarea cu raportul): nu blochează documentul. */
  warning?: boolean
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

/** Unde e clientul în colaborare. */
export type ClientStage = 'ACTIVE' | 'ONBOARDING' | 'INACTIVE'

/** Starea conexiunii open banking a clientului. */
export type BankConnectionStatus = 'CREATED' | 'PENDING' | 'LINKED' | 'EXPIRED' | 'ERROR' | 'REVOKED'

/** Cererea D700 pentru codul de TVA art. 317, de la generare la cod primit. */
export type VatRegistrationStatus =
  | 'WAITING_FOR_DATA'
  | 'GENERATED'
  | 'VALIDATION_FAILED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUBMITTED'
  | 'REGISTERED'

/** O cerere D700 (`GET accounting/vat-registrations`). */
export interface VatRegistration {
  id: string
  pfaId: string
  userId: string
  clientName: string
  cui: string | null
  status: VatRegistrationStatus
  /** Luna cererii, `yyyy-MM`. */
  period: string
  missingData: string | null
  rejectionReason: string | null
  vatCode: string | null
  vatCodeValidFrom: string | null
  hasXml: boolean
  hasPdf: boolean
  hasCertificate: boolean
  errors: string[]
  warnings: string[]
  createdAtUtc: string
  updatedAtUtc: string
}

export type VatRegistrationFileKind = 'xml' | 'pdf' | 'certificate'

/** Conexiunea OAuth cu ANAF a împuternicitului (adminul), făcută cu certificatul lui. */
export interface AnafConnection {
  /** ClientId și ClientSecret există pe server. */
  configured: boolean
  /** `null` = neconectat. */
  status: 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED' | null
  connectedBy: string | null
  connectedAtUtc: string | null
  accessExpiresAtUtc: string | null
  refreshExpiresAtUtc: string | null
  lastError: string | null
}

export type AnafPfaLinkStatus = 'ACTIVE' | 'NO_ACCESS' | 'DISABLED'

export interface AnafPfaLink {
  status: AnafPfaLinkStatus
  enabledAtUtc: string
  lastSyncAtUtc: string | null
  lastError: string | null
}

export type EFacturaMessageKind = 'RECEIVED' | 'SENT' | 'ERROR' | 'BUYER_MESSAGE' | 'OTHER'

/** Un mesaj e-Factura al unui PFA, cu datele facturii citite din XML. */
export interface EFacturaMessage {
  id: string
  kind: EFacturaMessageKind
  anafType: string
  createdAtUtc: string
  invoiceNumber: string | null
  issueDate: string | null
  supplierName: string | null
  supplierCif: string | null
  customerName: string | null
  customerCif: string | null
  currency: string | null
  totalAmount: number | null
  vatAmount: number | null
  downloaded: boolean
  downloadError: string | null
  details: string | null
  /** Facturile primite: plata vine din bancă (spec flux contabil R03–R04b). */
  paymentStatus: InvoicePaymentStatus
  paidAmount: number
}

export const INVOICE_PAYMENT_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const
export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number]

export type SpvMessageStatus = 'PROCESSED' | 'NEW' | 'NEEDS_ATTENTION'

/** Un mesaj SPV (recipisă, notificare, decizie, răspuns la o cerere), adus de aplicația desktop. */
export interface SpvMessage {
  id: string
  type: string
  createdAtUtc: string
  details: string | null
  status: SpvMessageStatus
  /** Ce s-a făcut automat sau de ce nu. */
  note: string | null
  hasDocument: boolean
  read: boolean
  requestType: string | null
}

export type SpvRequestStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'ANSWERED' | 'FAILED'

export interface SpvRequest {
  id: string
  type: string
  parameters: Record<string, string>
  status: SpvRequestStatus
  createdAtUtc: string
  sentAtUtc: string | null
  error: string | null
}

export interface PfaSpv {
  lastSyncAtUtc: string | null
  messages: SpvMessage[]
  requests: SpvRequest[]
}

export interface SpvAgentKey {
  id: string
  name: string
  prefix: string
  createdAtUtc: string
  lastUsedAtUtc: string | null
}

/** Aplicația desktop SPV, pentru admin. */
export interface SpvOverview {
  keys: SpvAgentKey[]
  lastSuccessAtUtc: string | null
  lastError: string | null
  needsAttention: number
  queuedRequests: number
}

/** Tabul „ANAF” din fișa clientului. */
export interface PfaEFactura {
  connection: AnafConnection
  link: AnafPfaLink | null
  messages: EFacturaMessage[]
}

/** Un rând din „Clienți PFA” și „Rezumat” (`GET accounting/clients?period=`). */
export interface ClientWorkspaceRow {
  pfaId: string
  userId: string
  name: string
  cui: string
  email: string
  stage: ClientStage
  /** `null` pentru clienții încă în onboarding. */
  monthStatus: PfaMonthStatus | null
  /** Primul motiv pentru care luna nu e gata. */
  reason: string | null
  declarations: Partial<Record<DeclarationType, DeclarationCell>>
  /** `null` = banca nu a fost conectată niciodată. */
  bankStatus: BankConnectionStatus | null
  unreadMessages: number
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
  /** Diferențe de semnalat, care nu blochează (corelarea cu raportul, reținerea la sursă). */
  warnings: string[]
  /** D100: reținerea la sursă raportată de platformă, lângă impozitul calculat. */
  withholding: WithholdingComparison[]
}

export interface WithholdingComparison {
  platform: string
  reported: number
  calculated: number
  difference: number
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
  reconciliationStatus: ReconciliationStatus
  /** Venitul brut și comisionul aceluiași payout (R21). */
  settlementGroupId: string | null
  /** Factura e-Factura plătită (R04). */
  eFacturaMessageId: string | null
  documentDate: IsoDate | null
  /** Partea personală, în valoare absolută (R30); nu e niciodată deductibilă. */
  personalAmount: number
  /** Stornarea (§4) înregistrării blocate cu acest id, dintr-o lună închisă. */
  stornoOfEntryId?: string | null
  /** Înregistrarea blocată pe care aceasta o înlocuiește, corectată, în luna curentă. */
  correctsEntryId?: string | null
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

/** O linie de pe bon; `personal` = nu ține de activitate (spec flux contabil R30). */
export interface ExpenseLine {
  name: string
  amount: number | null
  personal: boolean
}

export interface ExpenseDocumentUploadResult {
  documentId: string
  /** Pentru confirmare (`confirmExpenseDocument`). */
  expenseDocumentId: string
  extracted: {
    merchant: string | null
    merchantCui: string | null
    date: IsoDate | null
    total: number | null
    items: string[]
    number: string | null
    /** CUI-ul cumpărătorului de pe bon (R31–R33). */
    beneficiaryCui: string | null
    lines: ExpenseLine[] | null
  }
  /** Tranzacția propusă pentru potrivire; utilizatorul confirmă. */
  proposedMatch: LedgerEntry | null
  /** Partea personală propusă din linii (R30). */
  suggestedPersonalAmount: number
}

/** „Cum ai plătit?” (R34): din contul conectat, numerar sau card / cont neconectat. */
export type ExpensePaymentChoice = 'BANK' | 'CASH' | 'MANUAL'

export interface ConfirmExpenseDocumentRequest {
  payment: ExpensePaymentChoice
  /** Plata din bancă, la `BANK`. */
  ledgerEntryId: string | null
  personalAmount: number | null
  category: string | null
}

/** „Am găsit plata acestui bon în cont. Asociază?” (R36). */
export interface MatchProposal {
  id: string
  transaction: { id: string; date: IsoDate | null; amount: number; counterparty: string | null; details: string | null }
  entry: LedgerEntry
  createdAtUtc: string
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

// ---------------------------------------------------------------------------------------------
// Active, amortizare, inventariere, an contabil (spec registre §5–§8)
// ---------------------------------------------------------------------------------------------

export const ASSET_STATUSES = ['ACTIVE', 'DISPOSED', 'PENDING_CLASSIFICATION', 'FULLY_DEPRECIATED'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const ASSET_KINDS = ['FIXED_ASSET', 'INVENTORY_OBJECT'] as const
export type AssetKind = (typeof ASSET_KINDS)[number]

/** Decizia de mijloc fix a unei achiziții: Tax Engine propune `PENDING`, Adminul decide. */
export const FIXED_ASSET_REVIEWS = ['NONE', 'PENDING', 'EXPENSE', 'FIXED_ASSET', 'INVENTORY_OBJECT'] as const
export type FixedAssetReview = (typeof FIXED_ASSET_REVIEWS)[number]

export interface Asset {
  id: string
  pfaId: string
  /** `MF-0001` / `OI-0001`. */
  inventoryNumber: string
  name: string
  kind: AssetKind
  status: AssetStatus
  acquisitionEntryId: string | null
  documentRef: string
  supplierName: string | null
  entryDate: IsoDate
  inServiceDate: IsoDate | null
  entryValue: number
  depreciationClassCode: string | null
  normalLifeMonths: number | null
  method: string
  disposalDate: IsoDate | null
  disposalReason: string | null
  document: StoredFileRef | null
  monthlyDepreciation: number | null
  /** Data la care sunt calculate `accumulated` și `remaining`. */
  asOf: IsoDate
  accumulated: number
  remaining: number
}

export interface DepreciationLine {
  year: number
  month: number
  amount: number
  accumulated: number
  remaining: number
  isLocked: boolean
}

export interface AssetDetail {
  asset: Asset
  lines: DepreciationLine[]
}

export interface FixedAssetCandidate {
  ledgerEntryId: string
  date: IsoDate
  documentLabel: string
  description: string
  counterparty: string | null
  amount: number
  category: string | null
  review: FixedAssetReview
}

export type FixedAssetDecision = 'EXPENSE' | 'FIXED_ASSET' | 'INVENTORY_OBJECT'

export interface AssetClassificationRequest {
  name: string
  documentRef: string
  supplierName: string | null
  inServiceDate: IsoDate | null
  depreciationClassCode: string | null
  normalLifeMonths: number | null
  reason: string | null
}

export interface ManualAssetRequest {
  name: string
  kind: AssetKind
  entryDate: IsoDate
  entryValue: number
  documentRef: string
  supplierName: string | null
  reason: string | null
}

export const INVENTORY_REASONS = ['ACTIVITY_START', 'YEAR_END', 'CESSATION'] as const
export type InventoryReason = (typeof INVENTORY_REASONS)[number]

export const INVENTORY_STATUSES = ['DRAFT', 'AWAITING_PFA_CONFIRMATION', 'AWAITING_ADMIN_REVIEW', 'FINAL'] as const
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number]

export const INVENTORY_ITEM_STATUSES = ['PREFILLED', 'CONFIRMED', 'ADJUSTED', 'REMOVED', 'ADDED_MANUALLY'] as const
export type InventoryItemStatus = (typeof INVENTORY_ITEM_STATUSES)[number]

export const INVENTORY_CATEGORIES = ['FIXED_ASSETS', 'INVENTORY_OBJECTS', 'STOCKS', 'RECEIVABLES', 'BANK', 'CASH', 'DEBTS'] as const
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]

export type InventoryItemAction = 'CONFIRM' | 'ADJUST' | 'REMOVE' | 'NOTE'

export interface InventoryItem {
  id: string
  category: InventoryCategory
  description: string
  systemValue: number
  confirmedValue: number | null
  /** Confirmat − sistem. */
  difference: number
  sourceType: string | null
  sourceId: string | null
  status: InventoryItemStatus
  requiresConfirmation: boolean
  note: string | null
}

export interface InventoryCount {
  id: string
  pfaId: string
  date: IsoDate
  reason: InventoryReason
  status: InventoryStatus
  submittedAt: IsoDateTime | null
  finalizedAt: IsoDateTime | null
  finalizedBy: UserRef | null
  snapshotDocumentId: string | null
  items: InventoryItem[]
  total: number
}

export interface InventoryItemRequest {
  action: InventoryItemAction
  value?: number | null
  note?: string | null
}

export interface AddInventoryItemRequest {
  category: InventoryCategory
  description: string
  value: number
  note: string | null
}

export interface AccountingYear {
  pfaId: string
  year: number
  status: AccountingPeriodStatus
  closedBy: UserRef | null
  closedAt: IsoDateTime | null
  hasPackage: boolean
  /** Ce lipsește pentru „Închide anul”. */
  missing: string[]
}

/** Panoul de stare al registrelor (spec registre §8). */
export interface RegisterStatus {
  pfaId: string
  year: number
  rjipOk: boolean
  rjipExceptions: number
  refStatus: RefStatus
  refNet: number
  inventory: InventoryStatus | null
  inventoryCountId: string | null
  assetsInClassification: number
  yearStatus: AccountingPeriodStatus
}

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
/** Ce compune un rând REF: o înregistrare din ledger sau o lună de amortizare. */
export interface RefContribution {
  ledgerEntryId: string | null
  assetId: string | null
  date: IsoDate
  label: string
  value: number
}

export interface RefRow {
  year: number
  rectification: boolean
  incomeCategory: string
  calculationElement: string
  value: number
  contributions?: RefContribution[] | null
}

export interface RefView {
  pfaId: string
  year: number
  status: RefStatus
  /** Data situației intermediare; `null` pentru `CURRENT`/`FINAL`. */
  asOf: IsoDate | null
  rows: RefRow[]
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

/** Spec flux contabil §8: controalele reconcilierii lunare. */
export const RECONCILIATION_CONTROLS = [
  'OPEN_BANKING', 'E_FACTURA', 'CASH_REGISTER', 'BOLT_DOCUMENTS', 'UBER_DOCUMENTS',
  'UNRECONCILED_PAYOUTS', 'OPEN_TRANSACTIONS', 'PLATFORM_CASH_VS_Z', 'BANK_BALANCE',
  'FIXED_ASSETS_CLASSIFIED', 'DEPRECIATION',
] as const

/** Controalele pe care Adminul le poate explica (registre §7). */
export const EXPLAINABLE_CONTROLS: readonly ReconciliationControl[] = ['PLATFORM_CASH_VS_Z', 'UNRECONCILED_PAYOUTS']
export type ReconciliationControl = (typeof RECONCILIATION_CONTROLS)[number]

export interface ReconciliationControlResult {
  control: ReconciliationControl
  passed: boolean
  /** Fals când controlul nu privește PFA-ul (fără casă de marcat, fără Uber): trece. */
  applicable: boolean
  detail: string
}

export interface PayoutReconciliation {
  bankTransactionId: string
  date: IsoDate
  platform: LedgerSource
  payout: number
  gross: number | null
  commission: number | null
  difference: number | null
  status: ReconciliationStatus
}

export interface MonthReconciliation {
  pfaId: string
  period: Period
  status: AccountingPeriodStatus
  /** „Închide luna” e activ doar cu toate controalele trecute; serverul verifică la fel. */
  canClose: boolean
  controls: ReconciliationControlResult[]
  payouts: PayoutReconciliation[]
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
  /** Stornarea din luna curentă, când corecția privește o înregistrare blocată (§4). */
  stornoEntryId?: string | null
  /** Înregistrarea corectată care o înlocuiește pe cea stornată. */
  replacementEntryId?: string | null
}
