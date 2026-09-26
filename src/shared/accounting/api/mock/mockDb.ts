import type {
  AccountingPeriod,
  AnafDeclarationSchema,
  Asset,
  AuditEntry,
  CashRegisterState,
  D100Rule,
  DeclarationBreakdown,
  DeclarationType,
  DeclarationVersion,
  DocumentExtraction,
  EngagementStatus,
  ExchangeRate,
  ExpenseCategoryRule,
  ExtractedFields,
  IsoDate,
  IsoDateTime,
  Job,
  LedgerEntry,
  Period,
  PeriodCorrection,
  PfaMonthStatus,
  Platform,
  PlatformDocumentStatus,
  PlatformDocumentType,
  SettingHistoryEntry,
  StoredFileRef,
  SupplierTaxProfile,
  UserRef,
  ValidationLevel,
  ValidationResult,
  VatRate,
} from '../types'

/**
 * Starea internă a mock-ului. Păstrează și ce nu iese prin API (textul PDF-ului, extracția pe
 * care o va „citi” AI-ul simulat), ca verificările și calculul să lucreze pe aceleași date pe care
 * le va avea backendul.
 */

export interface MockPfa {
  id: string
  name: string
  cui: string
  /** Art. 317 și platformele nu stau aici: sursa lor e istoricul setărilor (`settingsHistory`). */
  engagement: { status: EngagementStatus; startDate: IsoDate; endDate: IsoDate | null }
  cash: CashRegisterState
  /** Rezultatul pre-check-ului pe lună; lipsă = neprocesat. */
  monthStatus: Record<Period, { status: PfaMonthStatus; reasons: string[] }>
  /** Pentru a face accesibilă tranziția `VALIDATION_FAILED`: prima validare a acestui tip pică. */
  failFirstValidation: { type: DeclarationType; level: ValidationLevel; message: string } | null
}

/** Ce „citește” AI-ul simulat când documentul e procesat. */
export interface MockExtractionSeed {
  documentType: PlatformDocumentType
  platform: Platform | null
  fields: ExtractedFields
  sourceSnippets: DocumentExtraction['sourceSnippets']
  modelConfidence: number
  /** Setat: extracția eșuează cu acest mesaj. */
  failure?: string
}

export interface MockDocument {
  id: string
  pfaId: string
  period: Period
  platform: Platform | null
  documentType: PlatformDocumentType
  fileName: string
  /** Statusul stocat. `LOCKED` se derivă la citire (declarație dincolo de GENERATED sau perioadă închisă). */
  status: Exclude<PlatformDocumentStatus, 'LOCKED'>
  uploadedBy: UserRef
  uploadedAt: IsoDateTime
  file: StoredFileRef
  /** Textul PDF-ului (text layer); verificarea `AMOUNT_IN_TEXT` caută în el. */
  pdfText: string
  /** Istoricul extracțiilor; ultima e cea curentă. */
  extractions: DocumentExtraction[]
  /** Extracția care se aplică la procesare, pentru documentele `UPLOADED`. */
  pendingExtraction: MockExtractionSeed | null
  extractionError: string | null
  reviewedBy: UserRef | null
  reviewedAt: IsoDateTime | null
}

export interface MockDeclarationVersion extends DeclarationVersion {
  breakdown: DeclarationBreakdown
  validation: ValidationResult | null
  xml: string | null
  /** Toate documentele sursă (D390 agregă pe furnizor, deci liniile nu le acoperă pe toate). */
  documentIds: string[]
}

export interface MockDeclaration {
  id: string
  pfaId: string
  period: Period
  type: DeclarationType
  versions: MockDeclarationVersion[]
}

/** Configurări care în backend vin din tabele (`valid_from`/`valid_to`) sau din appsettings. */
export interface MockConfig {
  /** Țările UE pentru D301/D390 (achiziții intracomunitare de servicii). */
  euCountries: string[]
  /** Monedele acceptate de `CURRENCY_ALLOWED`. */
  allowedCurrencies: string[]
  /** `SETTLEMENT_CORRELATION`: comision / venit, în procente. */
  settlementCorrelation: { minPercent: number; maxPercent: number }
  /** DE CONFIRMAT (§6 pct. 3): data exigibilității TVA. Mock: data facturii. */
  vatExigibilityDate: 'INVOICE_DATE' | 'SERVICE_PERIOD_END'
  /** DE CONFIRMAT (§6 pct. 12). */
  retention: { yearsAfter: number; startMonthDay: string }
}

export interface MockDb {
  config: MockConfig
  pfas: MockPfa[]
  settingsHistory: Record<string, SettingHistoryEntry[]>
  documents: MockDocument[]
  declarations: MockDeclaration[]
  suppliers: SupplierTaxProfile[]
  vatRates: VatRate[]
  d100Rules: D100Rule[]
  anafSchemas: AnafDeclarationSchema[]
  expenseCategories: ExpenseCategoryRule[]
  exchangeRates: ExchangeRate[]
  ledger: LedgerEntry[]
  assets: Asset[]
  periods: AccountingPeriod[]
  corrections: PeriodCorrection[]
  /** Dovezile de fiscalizare încărcate, după id. */
  cashEvidence: Record<string, { pfaId: string; file: StoredFileRef }>
  audit: (AuditEntry & { pfaId: string | null })[]
  jobs: Record<string, Job>
  /** Contor pentru id-uri deterministe. */
  sequence: number
}
