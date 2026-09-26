import type {
  AccountingPeriod,
  AnafDeclarationSchema,
  Asset,
  AssetInput,
  AuditEntry,
  AuditQuery,
  CashRegisterState,
  CashTransitionRequest,
  ConfirmBulkRequest,
  ConfirmBulkResult,
  D100Rule,
  DeactivateRequest,
  DeclarationBreakdown,
  DeclarationDetail,
  DeclarationSummary,
  DeclarationVersion,
  ExchangeRate,
  ExchangeRateQuery,
  ExpenseCategoryRule,
  ExpenseDocumentUploadResult,
  ExportFormat,
  InventoryView,
  Job,
  JobRef,
  LedgerEntry,
  LedgerQuery,
  ManualLedgerEntryRequest,
  Paged,
  PeriodCorrection,
  PeriodCorrectionRequest,
  PeriodOverview,
  Period,
  PfaAccountingSettings,
  PfaAccountingSummary,
  PfaListItem,
  PfaListQuery,
  PlatformDocument,
  PlatformDocumentDetail,
  PlatformDocumentListItem,
  RangeQuery,
  RectificationRequest,
  RefView,
  RjipView,
  RuleInput,
  SettingsChange,
  SupplierTaxProfile,
  TransitionRequest,
  UpdateExtractionRequest,
  UpdateLedgerEntryRequest,
  UploadPlatformDocumentRequest,
  UploadReceiptRequest,
  ValidationResult,
  VatRate,
  ZReportUploadResult,
} from './types'

/** Regulile fiscale au toate același CRUD fără ștergere (§4.5). */
export interface RuleResource<T extends { id: string }> {
  list(): Promise<T[]>
  create(input: RuleInput<T>): Promise<T>
  update(id: string, input: RuleInput<T>): Promise<T>
}

/**
 * Tot ce știu ecranele despre backendul de contabilitate. Implementările (`mock`, `http`) se aleg
 * în `accountingApi.ts`; componentele nu știu care rulează.
 *
 * Grupurile urmează secțiunile din §4. Căile HTTP sunt în `httpAccountingApi.ts`.
 */
export interface AccountingApi {
  /** §4.1 */
  pfas: {
    list(query?: PfaListQuery): Promise<PfaListItem[]>
    getSummary(pfaId: string): Promise<PfaAccountingSummary>
    getSettings(pfaId: string): Promise<PfaAccountingSettings>
    updateSettings(pfaId: string, change: SettingsChange): Promise<PfaAccountingSettings>
    transitionCash(pfaId: string, request: CashTransitionRequest): Promise<CashRegisterState>
    deactivate(pfaId: string, request: DeactivateRequest): Promise<PfaAccountingSummary>
    createHandoverPackage(pfaId: string): Promise<JobRef>
    getAudit(pfaId: string, query?: AuditQuery): Promise<AuditEntry[]>
  }

  /** §4.2 */
  documents: {
    list(pfaId: string, period: Period): Promise<PlatformDocumentListItem[]>
    upload(pfaId: string, request: UploadPlatformDocumentRequest): Promise<PlatformDocument>
    get(id: string): Promise<PlatformDocumentDetail>
    /** PDF-ul original. */
    getFile(id: string): Promise<Blob>
    updateExtraction(id: string, request: UpdateExtractionRequest): Promise<PlatformDocumentDetail>
    confirm(id: string): Promise<PlatformDocumentDetail>
    confirmBulk(request: ConfirmBulkRequest): Promise<ConfirmBulkResult>
  }

  /** §4.3 — luna fiscală, pe toate PFA-urile. */
  months: {
    getOverview(period: Period): Promise<PeriodOverview>
    process(period: Period): Promise<JobRef>
    generate(period: Period): Promise<JobRef>
    validate(period: Period): Promise<JobRef>
  }

  jobs: {
    get(jobId: string): Promise<Job>
  }

  /** §4.4 */
  declarations: {
    list(pfaId: string, period: Period): Promise<DeclarationSummary[]>
    get(id: string): Promise<DeclarationDetail>
    getBreakdown(versionId: string): Promise<DeclarationBreakdown>
    getXml(versionId: string): Promise<string>
    getPdf(versionId: string): Promise<Blob>
    getValidation(versionId: string): Promise<ValidationResult | null>
    transition(versionId: string, request: TransitionRequest): Promise<DeclarationVersion>
    uploadReceipt(versionId: string, request: UploadReceiptRequest): Promise<DeclarationVersion>
    createRectification(declarationId: string, request: RectificationRequest): Promise<DeclarationVersion>
  }

  /** §4.5 */
  rules: {
    suppliers: RuleResource<SupplierTaxProfile>
    vatRates: RuleResource<VatRate>
    d100: RuleResource<D100Rule>
    anafSchemas: RuleResource<AnafDeclarationSchema>
    expenseCategories: RuleResource<ExpenseCategoryRule>
    getExchangeRate(query: ExchangeRateQuery): Promise<ExchangeRate | null>
  }

  /** §4.6 */
  ledger: {
    list(pfaId: string, query?: LedgerQuery): Promise<Paged<LedgerEntry>>
    update(id: string, request: UpdateLedgerEntryRequest): Promise<LedgerEntry>
    verify(id: string): Promise<LedgerEntry>
    createManual(pfaId: string, request: ManualLedgerEntryRequest): Promise<LedgerEntry>
    uploadExpenseDocument(pfaId: string, file: File): Promise<ExpenseDocumentUploadResult>
    uploadZReport(pfaId: string, file: File): Promise<ZReportUploadResult>
  }

  assets: {
    list(pfaId: string): Promise<Asset[]>
    create(pfaId: string, input: AssetInput): Promise<Asset>
    update(pfaId: string, id: string, input: AssetInput): Promise<Asset>
  }

  registers: {
    getRjip(pfaId: string, range: RangeQuery): Promise<RjipView>
    exportRjip(pfaId: string, range: RangeQuery, format: ExportFormat): Promise<Blob>
    getRef(pfaId: string, year: number): Promise<RefView>
    exportRef(pfaId: string, year: number, format: ExportFormat, asOf?: string): Promise<Blob>
    getInventory(pfaId: string, year: number): Promise<InventoryView>
    exportInventory(pfaId: string, year: number, format: ExportFormat): Promise<Blob>
  }

  /** Perioadele contabile per PFA (§3.5), nu luna fiscală bulk. */
  periods: {
    list(pfaId: string): Promise<AccountingPeriod[]>
    close(pfaId: string, period: Period): Promise<AccountingPeriod>
    createCorrection(pfaId: string, period: Period, request: PeriodCorrectionRequest): Promise<PeriodCorrection>
  }
}
