import type {
  ClientWorkspaceRow,
  AccountingPeriod,
  AnafDeclarationSchema,
  AccountingYear,
  AddInventoryItemRequest,
  Asset,
  AssetClassificationRequest,
  AssetDetail,
  FixedAssetCandidate,
  FixedAssetDecision,
  InventoryCount,
  InventoryItemRequest,
  InventoryReason,
  ManualAssetRequest,
  ReconciliationControl,
  RegisterStatus,
  AuditEntry,
  AuditQuery,
  CashEvidenceUploadResult,
  CashPreference,
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
  ConfirmExpenseDocumentRequest,
  MonthReconciliation,
  MatchProposal,
  ExportFormat,
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
  VatRegistration,
  AnafConnection,
  PfaSpv,
  SpvAgentKey,
  SpvOverview,
  PfaEFactura,
  VatRegistrationFileKind,
  ZReportUploadResult,
} from './types'

/** Regulile fiscale au toate același CRUD fără ștergere (§4.5). */
export interface RuleResource<T extends { id: string }> {
  list(): Promise<T[]>
  create(input: RuleInput<T>): Promise<T>
  update(id: string, input: RuleInput<T>): Promise<T>
  /** Doar unde e permis (furnizorii): ștergere logică, refuzată dacă regula e folosită în declarații. */
  remove?(id: string): Promise<void>
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
    /** Dovada de fiscalizare a casei de marcat (multipart), cerută de tranziția spre `ACTIVE`. */
    uploadCashEvidence(pfaId: string, file: File): Promise<CashEvidenceUploadResult>
    transitionCash(pfaId: string, request: CashTransitionRequest): Promise<CashRegisterState>
    deactivate(pfaId: string, request: DeactivateRequest): Promise<PfaAccountingSummary>
    createHandoverPackage(pfaId: string): Promise<JobRef>
    getAudit(pfaId: string, query?: AuditQuery): Promise<AuditEntry[]>
  }

  /** Pentru utilizatorul PFA însuși (rol PFA), nu pentru ADMIN / ACCOUNTANT: pasul 3 din onboarding. */
  onboarding: {
    getCashPreference(): Promise<CashPreference | null>
    setCashPreference(request: { cashRequested: boolean }): Promise<CashPreference>
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
    /** Doar ADMIN: ștergere logică; refuzată pentru documentele din declarații sau perioade închise. */
    remove(id: string): Promise<void>
  }

  /** §4.3 — luna fiscală, pe toate PFA-urile. */
  /** Portofoliul (contabilul: clienții alocați; adminul: toți), cu luna, banca și mesajele. */
  clients: {
    list(period: Period): Promise<ClientWorkspaceRow[]>
  }

  /** Conexiunea ANAF (OAuth, certificatul împuternicitului) și e-Factura pe clienți. */
  anaf: {
    connection(): Promise<AnafConnection>
    /** Adresa ANAF la care se trimite adminul; după autorizare revine la `returnPath`. */
    start(returnPath: string): Promise<string>
    disconnect(): Promise<void>
    forPfa(pfaId: string): Promise<PfaEFactura>
    connectPfa(pfaId: string): Promise<void>
    sync(pfaId: string): Promise<{ newMessages: number; downloaded: number }>
    disablePfa(pfaId: string): Promise<void>
    getFile(messageId: string, kind: 'xml' | 'pdf'): Promise<Blob>
  }

  /** SPV prin aplicația desktop RIDElance SPV (stickul împuternicitului). */
  spv: {
    forPfa(pfaId: string): Promise<PfaSpv>
    /** Pune cererea în coadă; pleacă la următoarea trimitere a aplicației. */
    queueRequest(pfaId: string, type: string, parameters: Record<string, string>): Promise<void>
    markRead(messageId: string): Promise<void>
    getFile(messageId: string): Promise<Blob>
    overview(): Promise<SpvOverview>
    /** Cheia nouă, afișată o singură dată. */
    createKey(name: string): Promise<{ key: SpvAgentKey; secret: string }>
    revokeKey(keyId: string): Promise<void>
  }

  /** Cererile D700 pentru codul de TVA art. 317, generate din onboarding. */
  vatRegistrations: {
    list(): Promise<VatRegistration[]>
    /** Cererea unui PFA (profilul de onboarding); `null` dacă nu există. */
    forPfa(pfaId: string): Promise<VatRegistration | null>
    /** Generează sau regenerează D700 din datele actuale ale PFA-ului. */
    generate(pfaId: string): Promise<VatRegistration>
    /** Validatorul ANAF și PDF-ul de semnat. */
    validate(id: string): Promise<VatRegistration>
    transition(id: string, to: 'APPROVED' | 'REJECTED' | 'SUBMITTED', note?: string): Promise<VatRegistration>
    registerCode(id: string, request: { vatCode: string; validFrom: string; file?: File }): Promise<VatRegistration>
    getFile(id: string, kind: VatRegistrationFileKind): Promise<Blob>
  }

  /** Joburile lunii; cu `pfaId`, doar pentru un client (pagina clientului). */
  months: {
    getOverview(period: Period): Promise<PeriodOverview>
    process(period: Period, pfaId?: string): Promise<JobRef>
    /** Confirmă în bloc documentele lunii `PENDING_CONFIRMATION` (verificări trecute), pe toate PFA-urile. */
    confirmCleanDocuments(period: Period): Promise<ConfirmBulkResult>
    generate(period: Period, pfaId?: string): Promise<JobRef>
    validate(period: Period, pfaId?: string): Promise<JobRef>
  }

  jobs: {
    get(jobId: string): Promise<Job>
    /** Fișierul produs de job (arhiva dosarului de predare). */
    getFile(jobId: string): Promise<Blob>
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
    confirmExpenseDocument(pfaId: string, expenseDocumentId: string, request: ConfirmExpenseDocumentRequest): Promise<LedgerEntry>
    matchProposals(pfaId: string): Promise<MatchProposal[]>
    acceptMatch(id: string): Promise<LedgerEntry>
    rejectMatch(id: string): Promise<void>
    uploadZReport(pfaId: string, file: File): Promise<ZReportUploadResult>
  }

  /** Activele și decizia de mijloc fix (spec registre §6). */
  assets: {
    list(pfaId: string, asOf?: string): Promise<Asset[]>
    get(pfaId: string, id: string): Promise<AssetDetail>
    candidates(pfaId: string): Promise<FixedAssetCandidate[]>
    /** `null` la decizia „cheltuială curentă”. */
    decide(pfaId: string, ledgerEntryId: string, decision: FixedAssetDecision, name: string | null, reason: string | null): Promise<Asset | null>
    create(pfaId: string, request: ManualAssetRequest): Promise<Asset>
    classify(pfaId: string, id: string, request: AssetClassificationRequest): Promise<Asset>
    dispose(pfaId: string, id: string, date: string, reason: string): Promise<Asset>
    exportSheet(pfaId: string, id: string, format: ExportFormat): Promise<Blob>
    exportList(pfaId: string, asOf: string, format: ExportFormat): Promise<Blob>
  }

  registers: {
    status(pfaId: string, year: number): Promise<RegisterStatus>
    getRjip(pfaId: string, range: RangeQuery, regenerate?: boolean): Promise<RjipView>
    exportRjip(pfaId: string, range: RangeQuery, format: ExportFormat): Promise<Blob>
    getRef(pfaId: string, year: number): Promise<RefView>
    exportRef(pfaId: string, year: number, format: ExportFormat, asOf?: string): Promise<Blob>
    exportInventory(pfaId: string, year: number, format: ExportFormat): Promise<Blob>
  }

  /** Inventarierea (spec registre §5). */
  inventory: {
    list(pfaId: string): Promise<InventoryCount[]>
    start(pfaId: string, date: string, reason: InventoryReason): Promise<InventoryCount>
    updateItem(pfaId: string, countId: string, itemId: string, request: InventoryItemRequest): Promise<InventoryCount>
    addItem(pfaId: string, countId: string, request: AddInventoryItemRequest): Promise<InventoryCount>
    finalize(pfaId: string, countId: string): Promise<InventoryCount>
  }

  /** Anul contabil (spec registre §7). */
  years: {
    get(pfaId: string, year: number): Promise<AccountingYear>
    close(pfaId: string, year: number): Promise<AccountingYear>
    /** Doar ADMIN, cu motiv. */
    reopen(pfaId: string, year: number, reason: string): Promise<AccountingYear>
    package(pfaId: string, year: number): Promise<Blob>
  }

  /** Perioadele contabile per PFA (§3.5), nu luna fiscală bulk. */
  periods: {
    list(pfaId: string): Promise<AccountingPeriod[]>
    close(pfaId: string, period: Period): Promise<AccountingPeriod>
    reconciliation(pfaId: string, period: Period): Promise<MonthReconciliation>
    /** Doar ADMIN, cu motiv obligatoriu. */
    reopen(pfaId: string, period: Period, reason: string): Promise<AccountingPeriod>
    createCorrection(pfaId: string, period: Period, request: PeriodCorrectionRequest): Promise<PeriodCorrection>
    /** Registre §7: explicația Adminului pentru Z vs cash platformă sau payout-urile nereconciliate. */
    explain(pfaId: string, period: Period, control: ReconciliationControl, note: string): Promise<void>
  }
}
