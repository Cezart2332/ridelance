import type { StatusTone } from '../../components/admin/StatusBadge'
import type {
  AccountingPeriodStatus,
  BankClassification,
  RegisterExceptionKind,
  AssetKind,
  AssetStatus,
  InventoryCategory,
  InventoryItemStatus,
  InventoryReason,
  InventoryStatus,
  CashRegisterStatus,
  DeclarationStatus,
  DeclarationType,
  DeductibilityType,
  DocumentCheckCode,
  EngagementStatus,
  JobStatus,
  JobType,
  LedgerEntryStatus,
  LedgerSource,
  LedgerTransactionType,
  PaymentMethod,
  ReconciliationStatus,
  ReconciliationControl,
  PfaMonthStatus,
  Platform,
  PlatformDocumentStatus,
  PlatformDocumentType,
  RefStatus,
  ValidationLevel,
} from './api/types'

/**
 * Enum → label românesc + ton, într-un singur loc (spec F0).
 *
 * Tonul e al `StatusBadge` din admin, care îl traduce în tokeni din paletă
 * (`success.main` / `success.light` etc.), deci niciun ecran nu alege culori de mână.
 */

export interface StatusDescriptor {
  label: string
  tone: StatusTone
  /** Explicația din spec, pentru tooltip. */
  hint?: string
}

/** §3.1 */
export const PLATFORM_DOCUMENT_STATUS: Readonly<Record<PlatformDocumentStatus, StatusDescriptor>> = {
  UPLOADED: { label: 'Încărcat', tone: 'neutral' },
  EXTRACTING: { label: 'Se citește…', tone: 'neutral' },
  EXTRACTION_FAILED: { label: 'Citire eșuată', tone: 'error' },
  NEEDS_REVIEW: { label: 'De verificat', tone: 'warning', hint: 'Cel puțin o verificare a picat.' },
  PENDING_CONFIRMATION: {
    label: 'De confirmat',
    tone: 'warning',
    hint: 'Verificările au trecut, se așteaptă confirmare.',
  },
  CONFIRMED: { label: 'Confirmat', tone: 'success' },
  LOCKED: {
    label: 'Blocat',
    tone: 'neutral',
    hint: 'Inclus într-o declarație dincolo de „Draft automat” sau într-o perioadă închisă.',
  },
}

/** §3.2 */
export const DECLARATION_STATUS: Readonly<Record<DeclarationStatus, StatusDescriptor>> = {
  NOT_APPLICABLE: { label: 'N/A', tone: 'neutral', hint: 'Nu există bază pentru declarație.' },
  BLOCKED_MISSING_DOCUMENTS: { label: 'Lipsesc documente', tone: 'error' },
  BLOCKED_NEEDS_REVIEW: { label: 'De verificat', tone: 'warning', hint: 'Există documente nevalidate.' },
  DRAFT: { label: 'Draft', tone: 'neutral' },
  GENERATED: { label: 'Draft automat', tone: 'neutral', hint: 'XML generat, încă nevalidat.' },
  VALIDATION_FAILED: { label: 'De verificat', tone: 'error', hint: 'Una dintre cele 3 validări a picat.' },
  VALIDATED: { label: 'Verificat', tone: 'success' },
  READY_TO_SIGN: { label: 'Pregătit pentru depunere', tone: 'success', hint: 'PDF-ul pentru semnare a fost generat.' },
  SIGNED: { label: 'Semnat', tone: 'success' },
  SUBMITTED: { label: 'Depus', tone: 'warning', hint: 'Depus nu înseamnă acceptat. Se așteaptă recipisa.' },
  ACCEPTED: { label: 'Recipisă validă', tone: 'success' },
  REJECTED: { label: 'Respins', tone: 'error' },
  INDEX_RECEIVED: { label: 'Index ANAF', tone: 'warning', hint: 'Se așteaptă recipisa din SPV.' },
}

export const PFA_MONTH_STATUS: Readonly<Record<PfaMonthStatus, StatusDescriptor>> = {
  NOT_PROCESSED: { label: 'Neprocesat', tone: 'neutral' },
  READY: { label: 'Gata', tone: 'success' },
  NEEDS_REVIEW: { label: 'Necesită verificare', tone: 'warning' },
  MISSING_DOCUMENTS: { label: 'Document lipsă', tone: 'error' },
}

export const ENGAGEMENT_STATUS: Readonly<Record<EngagementStatus, StatusDescriptor>> = {
  ACTIVE: { label: 'Activ', tone: 'success' },
  INACTIVE: { label: 'Inactiv', tone: 'neutral' },
}

/** §3.3 */
export const LEDGER_ENTRY_STATUS: Readonly<Record<LedgerEntryStatus, StatusDescriptor>> = {
  AUTO_IMPORTED: { label: 'Importat automat', tone: 'neutral' },
  NEEDS_REVIEW: { label: 'De verificat', tone: 'warning' },
  VERIFIED: { label: 'Verificat', tone: 'success' },
  LOCKED: { label: 'Blocat', tone: 'neutral', hint: 'Perioadă închisă.' },
}

/** §3.4. „Inactiv” e forma din UI pentru configurarea fără numerar (F7: INACTIV → ÎN VERIFICARE → ACTIV). */
export const CASH_REGISTER_STATUS: Readonly<Record<CashRegisterStatus, StatusDescriptor>> = {
  NOT_REQUIRED_CURRENT_CONFIGURATION: {
    label: 'Inactiv',
    tone: 'neutral',
    hint: 'Casa de marcat nu e necesară în configurația curentă.',
  },
  PENDING: { label: 'Solicitat', tone: 'warning', hint: 'Clientul a cerut numerar; se așteaptă dovada de fiscalizare.' },
  IN_VERIFICATION: { label: 'În verificare', tone: 'warning' },
  ACTIVE: { label: 'Activ', tone: 'success' },
}

/** §3.5 */
export const ACCOUNTING_PERIOD_STATUS: Readonly<Record<AccountingPeriodStatus, StatusDescriptor>> = {
  OPEN: { label: 'Deschisă', tone: 'neutral' },
  CLOSED: { label: 'Închisă', tone: 'success' },
}

/** §3.6. Pentru `INTERMEDIATE` ecranul adaugă data: „Situație intermediară la dd.MM.yyyy”. */
export const REF_STATUS: Readonly<Record<RefStatus, StatusDescriptor>> = {
  CURRENT: { label: 'Calcul curent', tone: 'neutral' },
  FINAL: { label: 'Final', tone: 'success' },
  INTERMEDIATE: { label: 'Situație intermediară', tone: 'warning' },
}

export const JOB_STATUS: Readonly<Record<JobStatus, StatusDescriptor>> = {
  QUEUED: { label: 'În așteptare', tone: 'neutral' },
  RUNNING: { label: 'În lucru', tone: 'neutral' },
  COMPLETED: { label: 'Finalizat', tone: 'success' },
  FAILED: { label: 'Eșuat', tone: 'error' },
}

// Etichete simple, fără ton ---------------------------------------------------------------------

export const JOB_TYPE_LABEL: Readonly<Record<JobType, string>> = {
  PROCESS_PERIOD: 'Procesarea lunii',
  GENERATE_DECLARATIONS: 'Generarea declarațiilor',
  VALIDATE_DECLARATIONS: 'Validarea declarațiilor',
  HANDOVER_PACKAGE: 'Dosar de predare',
}

export const PLATFORM_LABEL: Readonly<Record<Platform, string>> = {
  BOLT: 'Bolt',
  UBER: 'Uber',
}

export const PLATFORM_DOCUMENT_TYPE_LABEL: Readonly<Record<PlatformDocumentType, string>> = {
  COMMISSION_INVOICE: 'Factură comision',
  PLATFORM_REPORT: 'Raport venituri',
  UNKNOWN: 'Tip necunoscut',
}

export const DECLARATION_TYPE_LABEL: Readonly<Record<DeclarationType, string>> = {
  D100: 'D100 – impozit nerezidenți',
  D301: 'D301 – decont special TVA',
  D390: 'D390 – declarație recapitulativă',
  D207: 'D207 – informativă nerezidenți',
  D205: 'D205 – informativă chirii',
  D212: 'D212 – declarația unică',
}

export const VALIDATION_LEVEL_LABEL: Readonly<Record<ValidationLevel, string>> = {
  RIDELANCE: 'RIDElance',
  XSD: 'XSD',
  ANAF: 'ANAF',
}

export const DOCUMENT_CHECK_LABEL: Readonly<Record<DocumentCheckCode, string>> = {
  AMOUNT_IN_TEXT: 'Sumele apar în text',
  ARITHMETIC: 'Aritmetică',
  SUPPLIER_KNOWN: 'Furnizor cunoscut',
  VAT_ID_FORMAT: 'Format cod TVA',
  PERIOD_MATCH: 'Perioada',
  NOT_DUPLICATE: 'Fără duplicat',
  NOT_ALREADY_DECLARED: 'Nedeclarat anterior',
  CURRENCY_ALLOWED: 'Moneda',
  SETTLEMENT_CORRELATION: 'Corelare cu raportul platformei',
}

export const LEDGER_SOURCE_LABEL: Readonly<Record<LedgerSource, string>> = {
  BANK: 'Bancă',
  UBER: 'Uber',
  BOLT: 'Bolt',
  OBLIO: 'Oblio',
  UPLOAD: 'Document încărcat',
  CASH_Z: 'Raport Z',
  MANUAL: 'Manual',
  E_FACTURA: 'e-Factura',
}

export const LEDGER_TRANSACTION_TYPE_LABEL: Readonly<Record<LedgerTransactionType, string>> = {
  INCOME: 'Venit',
  EXPENSE: 'Cheltuială',
  TRANSFER: 'Transfer',
  OWNER_CONTRIBUTION: 'Aport personal',
  LOAN: 'Împrumut',
  TAX: 'Taxe și impozite',
  OTHER: 'Altele',
  OWNER_WITHDRAWAL: 'Retragere titular',
  INTERNAL_TRANSFER: 'Transfer între conturi',
  PLATFORM_SETTLEMENT: 'Payout platformă',
}

export const PAYMENT_METHOD_LABEL: Readonly<Record<PaymentMethod, string>> = {
  BANK: 'Bancă',
  CASH: 'Numerar',
  MANUAL: 'Card / cont neconectat',
}

export const RECONCILIATION_CONTROL_LABEL: Readonly<Record<ReconciliationControl, string>> = {
  OPEN_BANKING: 'Open Banking',
  E_FACTURA: 'e-Factura',
  CASH_REGISTER: 'Casă de marcat / Z',
  BOLT_DOCUMENTS: 'Bolt: raport fiscal și factură comision',
  UBER_DOCUMENTS: 'Uber: raport fiscal și facturi comision',
  UNRECONCILED_PAYOUTS: 'Payout-uri nereconciliate',
  OPEN_TRANSACTIONS: 'Tranzacții fără document / de verificat',
  PLATFORM_CASH_VS_Z: 'Cash platformă vs rapoarte Z',
  BANK_BALANCE: 'Sold bancar vs RJIP bancă',
  FIXED_ASSETS_CLASSIFIED: 'Achiziții de clasificat (mijloace fixe)',
  DEPRECIATION: 'Amortizarea lunii',
}

export const ASSET_STATUS: Readonly<Record<AssetStatus, StatusDescriptor>> = {
  ACTIVE: { label: 'Activ', tone: 'success' },
  PENDING_CLASSIFICATION: { label: 'De clasificat', tone: 'warning' },
  FULLY_DEPRECIATED: { label: 'Amortizat integral', tone: 'neutral' },
  DISPOSED: { label: 'Ieșit din gestiune', tone: 'neutral' },
}

export const ASSET_KIND_LABEL: Readonly<Record<AssetKind, string>> = {
  FIXED_ASSET: 'Mijloc fix',
  INVENTORY_OBJECT: 'Obiect de inventar',
}

export const INVENTORY_STATUS: Readonly<Record<InventoryStatus, StatusDescriptor>> = {
  DRAFT: { label: 'Ciornă', tone: 'neutral' },
  AWAITING_PFA_CONFIRMATION: { label: 'La confirmarea PFA', tone: 'warning' },
  AWAITING_ADMIN_REVIEW: { label: 'De revizuit', tone: 'warning' },
  FINAL: { label: 'Final', tone: 'success' },
}

export const INVENTORY_REASON_LABEL: Readonly<Record<InventoryReason, string>> = {
  ACTIVITY_START: 'Începerea activității',
  YEAR_END: 'Sfârșitul anului',
  CESSATION: 'Încetarea activității',
}

export const INVENTORY_CATEGORY_LABEL: Readonly<Record<InventoryCategory, string>> = {
  FIXED_ASSETS: 'Mijloace fixe',
  INVENTORY_OBJECTS: 'Obiecte de inventar',
  STOCKS: 'Stocuri',
  RECEIVABLES: 'Creanțe',
  BANK: 'Disponibil în bancă',
  CASH: 'Numerar',
  DEBTS: 'Datorii',
}

export const INVENTORY_ITEM_STATUS: Readonly<Record<InventoryItemStatus, StatusDescriptor>> = {
  PREFILLED: { label: 'De confirmat', tone: 'warning' },
  CONFIRMED: { label: 'Confirmat', tone: 'success' },
  ADJUSTED: { label: 'Corectat', tone: 'neutral' },
  REMOVED: { label: 'Scos din folosință', tone: 'neutral' },
  ADDED_MANUALLY: { label: 'Adăugat', tone: 'neutral' },
}

export const RECONCILIATION_STATUS_LABEL: Readonly<Record<ReconciliationStatus, string>> = {
  MATCHED: 'Reconciliat',
  PARTIAL: 'Plată parțială',
  UNMATCHED: 'Document lipsă',
  NEEDS_REVIEW: 'De verificat',
  NEEDS_RECONCILIATION: 'Așteaptă reconcilierea',
}

export const DEDUCTIBILITY_TYPE_LABEL: Readonly<Record<DeductibilityType, string>> = {
  '100_PERCENT': 'Deductibil 100%',
  '50_PERCENT': 'Deductibil 50%',
  NON_DEDUCTIBLE: 'Nedeductibil',
  SPECIAL_RULE: 'Regim special',
}

/** Explicația din RJIP a fiecărei clasificări bancare (aceeași ca în backend). */
export const BANK_CLASSIFICATION_LABEL: Readonly<Record<BankClassification, string>> = {
  OWNER_CONTRIBUTION: 'Aport titular',
  OWNER_WITHDRAWAL: 'Transfer către titular',
  INTERNAL_TRANSFER: 'Transfer între conturile PFA',
  TAX_PAYMENT: 'Plată impozite/contribuții ANAF',
  BANK_FEE: 'Comision administrare cont bancar',
  ACTIVITY_INCOME: 'Încasare venit din activitate',
  NON_TAXABLE: 'Încasare neimpozabilă',
  EXPENSE: 'Cheltuială din activitate',
}

/** Marcajul rândului RJIP cu excepție. */
export const REGISTER_EXCEPTION_LABEL: Readonly<Record<RegisterExceptionKind, string>> = {
  UNIDENTIFIED_INCOME: 'neidentificată',
  UNCLASSIFIED_PAYMENT: 'neclasificată',
  MISSING_DOCUMENT: 'fără document',
  TRANSFER_TO_CONFIRM: 'transfer de confirmat',
  UNRECONCILED_PAYOUT: 'payout nereconciliat',
}
