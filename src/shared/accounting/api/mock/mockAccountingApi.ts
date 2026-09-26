import { DECLARATION_ACTION_TARGETS, DECLARATION_STATUSES_LOCKING_DOCUMENTS, canTransition, isActionAllowed } from '../../declarationWorkflow'
import { CASH_STATUSES_REQUIRING_EVIDENCE, canTransitionCash } from '../../cashWorkflow'
import { formatAmount, formatDate, formatLei, formatPeriod, formatValidity } from '../../format'
import { DECLARATION_STATUS, PLATFORM_LABEL } from '../../statusLabels'
import type { AccountingApi, RuleResource } from '../contract'
import { badRequest, conflict, notFound } from '../errors'
import type {
  AccountingPeriod,
  AnafDeclarationSchema,
  Asset,
  AssetInput,
  AuditEntry,
  D100Rule,
  DeclarationDetail,
  DeclarationStatus,
  DeclarationSummary,
  DeclarationType,
  DeclarationVersion,
  DocumentCheck,
  ExpenseCategoryRule,
  ExportFormat,
  ExtractedFieldKey,
  ExtractedFields,
  IsoDate,
  Job,
  JobResultItem,
  JobType,
  LedgerEntry,
  OverviewRow,
  PfaAccountingSettings,
  PfaAccountingSummary,
  PfaListItem,
  PfaMonthStatus,
  Period,
  Platform,
  PlatformDocument,
  PlatformDocumentDetail,
  PlatformDocumentListItem,
  PlatformDocumentStatus,
  RefView,
  RuleInput,
  StoredFileRef,
  SupplierTaxProfile,
  ValidationLevelResult,
  Validity,
  VatRate,
} from '../types'
import { DECLARATION_TYPES } from '../types'
import { runChecks } from './checks'
import { FIXTURE_PERIOD, MOCK_USERS, buildDocument, createFixtureDb, fileRef } from './fixtures'
import {
  fakeSha256,
  lastDayOfPeriod,
  overlaps,
  periodOf,
  resolveDeductibility,
  retentionUntil,
  round2,
  settingAt,
  settingValueAt,
  validAt,
  withDerivedValidTo,
} from './helpers'
import type { MockDb, MockDeclaration, MockDeclarationVersion, MockDocument, MockPfa } from './mockDb'
import { csvBlob, textPdf } from './pdf'
import { calculate } from './taxEngine'

/**
 * Implementarea mock a `AccountingApi` (Partea A). Ține starea în memorie, pe fixtures, și
 * simulează ce va face backendul: latența (300–800 ms), joburile cu progres, extracția asincronă,
 * verificările, pre-check-ul, calculul și mașina de stări din §3.2 (tranzițiile invalide → 409).
 *
 * Toate răspunsurile sunt copii: ecranele nu pot modifica starea mock-ului decât prin API.
 */

const LATENCY_MS = { min: 300, max: 800 }
const EXTRACTION_MS = { min: 1500, max: 3000 }
const JOB_TICK_MS = { min: 150, max: 400 }
const CURRENT_USER = MOCK_USERS.accountant

let db: MockDb = createFixtureDb()
/** Crește la reset, ca timer-ele pornite pe starea veche să nu scrie în cea nouă. */
let generation = 0

/** Readuce mock-ul la fixtures (pagina de debug, testele). */
export function resetMockAccountingDb(): void {
  db = createFixtureDb()
  generation++
}

// ---------------------------------------------------------------------------------------------
// Infrastructură
// ---------------------------------------------------------------------------------------------

const randomBetween = ({ min, max }: { min: number; max: number }) => min + Math.random() * (max - min)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Latență, apoi execută și întoarce o copie. O excepție devine promisiune respinsă. */
async function respond<T>(work: () => T | Promise<T>): Promise<T> {
  await sleep(randomBetween(LATENCY_MS))
  return structuredClone(await work())
}

const nowIso = () => new Date().toISOString()

function todayIso(): IsoDate {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const nextId = (prefix: string) => `${prefix}-${++db.sequence}`

function requireReason(reason: string | null | undefined, what = 'Motivul'): string {
  const trimmed = reason?.trim() ?? ''
  if (!trimmed) throw badRequest('REASON_REQUIRED', `${what} e obligatoriu.`)
  return trimmed
}

function requireDate(value: string | null | undefined, field: string): IsoDate {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw badRequest('INVALID_DATE', `${field}: dată invalidă.`)
  return value
}

function requirePeriod(period: string): Period {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw badRequest('INVALID_PERIOD', `Perioada „${period}” nu e în formatul yyyy-MM.`)
  return period
}

function audit(
  pfaId: string | null,
  entity: string,
  entityId: string,
  action: string,
  before: unknown,
  after: unknown,
  reason: string | null,
): void {
  const toRecord = (value: unknown) => (value === null || value === undefined ? null : (structuredClone(value) as Record<string, unknown>))
  db.audit.push({
    id: nextId('audit'),
    pfaId,
    entity,
    entityId,
    action,
    before: toRecord(before),
    after: toRecord(after),
    reason,
    user: CURRENT_USER,
    at: nowIso(),
  })
}

async function fileRefFrom(file: File, prefix: string): Promise<StoredFileRef> {
  let hash: string
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  } catch {
    // `crypto.subtle` lipsește în contexte nesigure (http pe altă gazdă decât localhost).
    hash = fakeSha256(`${file.name}:${file.size}:${file.lastModified}`)
  }
  return {
    id: nextId(prefix),
    fileName: file.name,
    contentType: file.type || 'application/pdf',
    sizeBytes: file.size,
    hash,
  }
}

// ---------------------------------------------------------------------------------------------
// PFA
// ---------------------------------------------------------------------------------------------

function findPfa(pfaId: string): MockPfa {
  const pfa = db.pfas.find((item) => item.id === pfaId)
  if (!pfa) throw notFound('PFA-ul')
  return pfa
}

function ensureWritable(pfa: MockPfa): void {
  if (pfa.engagement.status === 'INACTIVE') {
    throw conflict('PFA_READ_ONLY', `Dosarul ${pfa.name} e inactiv și poate fi doar consultat.`)
  }
}

function activeIn(pfa: MockPfa, period: Period): boolean {
  const { startDate, endDate } = pfa.engagement
  return periodOf(startDate) <= period && (!endDate || period <= periodOf(endDate))
}

const historyOf = (pfaId: string) => db.settingsHistory[pfaId] ?? []

/** Data la care se citesc setările „de azi”; pentru un dosar închis, ultima zi a angajamentului. */
function settingsDate(pfa: MockPfa): IsoDate {
  const today = todayIso()
  return pfa.engagement.endDate && pfa.engagement.endDate < today ? pfa.engagement.endDate : today
}

function platformsAt(pfa: MockPfa, date: IsoDate): Platform[] {
  return settingValueAt(historyOf(pfa.id), 'platforms', date) ?? []
}

function art317At(pfa: MockPfa, date: IsoDate): { enabled: boolean; activationDate: IsoDate | null } {
  const entry = settingAt(historyOf(pfa.id), 'art317', date)
  return { enabled: entry?.value ?? false, activationDate: entry?.value ? entry.validFrom : null }
}

function monthStatusOf(pfa: MockPfa, period: Period): PfaMonthStatus {
  return pfa.monthStatus[period]?.status ?? 'NOT_PROCESSED'
}

function toSummary(pfa: MockPfa): PfaAccountingSummary {
  const date = settingsDate(pfa)
  const art317 = art317At(pfa, date)
  const endDate = pfa.engagement.endDate
  const { yearsAfter, startMonthDay } = db.config.retention
  return {
    id: pfa.id,
    name: pfa.name,
    cui: pfa.cui,
    realSystem: true,
    vatPayer: false,
    art317: art317.enabled,
    art317ActivationDate: art317.activationDate,
    platforms: platformsAt(pfa, date),
    engagement: { ...pfa.engagement },
    currentPeriod: FIXTURE_PERIOD,
    currentMonthStatus: monthStatusOf(pfa, FIXTURE_PERIOD),
    cash: pfa.cash,
    readOnly: pfa.engagement.status === 'INACTIVE',
    retentionUntil:
      pfa.engagement.status === 'INACTIVE' && endDate ? retentionUntil(Number(endDate.slice(0, 4)), yearsAfter, startMonthDay) : null,
  }
}

function toSettings(pfa: MockPfa): PfaAccountingSettings {
  const date = settingsDate(pfa)
  const history = withDerivedValidTo(historyOf(pfa.id))
  return {
    pfaId: pfa.id,
    realSystem: true,
    vatPayer: false,
    art317: art317At(pfa, date),
    platforms: platformsAt(pfa, date),
    vehicleDeductibility: settingValueAt(history, 'vehicle_deductibility', date) ?? '50_PERCENT',
    cash: pfa.cash,
    history,
  }
}

function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// ---------------------------------------------------------------------------------------------
// Documente
// ---------------------------------------------------------------------------------------------

function findDocument(id: string): MockDocument {
  const document = db.documents.find((item) => item.id === id)
  if (!document) throw notFound('Documentul')
  return document
}

const currentExtraction = (document: MockDocument) => document.extractions[document.extractions.length - 1] ?? null

function findDeclarationOfVersion(versionId: string): { declaration: MockDeclaration; version: MockDeclarationVersion } {
  for (const declaration of db.declarations) {
    const version = declaration.versions.find((item) => item.id === versionId)
    if (version) return { declaration, version }
  }
  throw notFound('Versiunea declarației')
}

const currentVersion = (declaration: MockDeclaration) => declaration.versions[declaration.versions.length - 1]

/** De ce e blocat un document confirmat; `null` dacă se mai poate edita. */
function lockReason(document: MockDocument): string | null {
  if (document.status !== 'CONFIRMED') return null
  const period = db.periods.find((item) => item.pfaId === document.pfaId && item.period === document.period)
  if (period?.status === 'CLOSED') return `Perioada ${formatPeriod(document.period)} e închisă.`
  // B5: o rectificativă deschisă care include documentul îl deblochează pentru corecție.
  const openRectification = db.declarations.some((declaration) => {
    const version = currentVersion(declaration)
    return version.kind === 'RECTIFICATIVE' && version.status === 'GENERATED' && version.documentIds.includes(document.id)
  })
  if (openRectification) return null
  for (const declaration of db.declarations) {
    const version = currentVersion(declaration)
    if (version.documentIds.includes(document.id) && DECLARATION_STATUSES_LOCKING_DOCUMENTS.includes(version.status)) {
      return `Inclus în ${declaration.type} v${version.versionNo} (${DECLARATION_STATUS[version.status].label}). Se deblochează doar printr-o rectificativă.`
    }
  }
  return null
}

function effectiveStatus(document: MockDocument): PlatformDocumentStatus {
  return lockReason(document) ? 'LOCKED' : document.status
}

function checksOf(document: MockDocument): DocumentCheck[] {
  const extraction = currentExtraction(document)
  return extraction ? runChecks(db, document, extraction.fields, document.documentType) : []
}

/**
 * Verificările depind și de reguli (de ex. un furnizor adăugat în registru), deci se refac la
 * citire; statusul urmează rezultatul cât timp documentul nu e confirmat.
 */
function refreshReviewStatus(document: MockDocument): DocumentCheck[] {
  const checks = checksOf(document)
  if (document.status === 'NEEDS_REVIEW' || document.status === 'PENDING_CONFIRMATION') {
    document.status = checks.every((check) => check.passed) ? 'PENDING_CONFIRMATION' : 'NEEDS_REVIEW'
  }
  return checks
}

function toDocument(document: MockDocument): PlatformDocument {
  return {
    id: document.id,
    pfaId: document.pfaId,
    period: document.period,
    platform: document.platform,
    documentType: document.documentType,
    fileName: document.fileName,
    status: effectiveStatus(document),
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt,
  }
}

function toListItem(document: MockDocument): PlatformDocumentListItem {
  const checks = refreshReviewStatus(document)
  const fields = currentExtraction(document)?.fields ?? null
  return {
    ...toDocument(document),
    mainAmount: fields ? (document.documentType === 'PLATFORM_REPORT' ? fields.amount : fields.commissionAmount) : null,
    currency: fields?.currency ?? null,
    failedChecks: checks.filter((check) => !check.passed).length,
  }
}

function toDetail(document: MockDocument): PlatformDocumentDetail {
  const checks = refreshReviewStatus(document)
  const extraction = currentExtraction(document)
  const fields = extraction?.fields ?? null
  const includedIn = db.declarations.flatMap((declaration) =>
    declaration.versions
      .filter((version) => version.documentIds.includes(document.id))
      .map((version) => ({
        declarationId: declaration.id,
        versionId: version.id,
        type: declaration.type,
        period: declaration.period,
        versionNo: version.versionNo,
        kind: version.kind,
        status: version.status,
      })),
  )
  return {
    ...toDocument(document),
    mainAmount: fields ? (document.documentType === 'PLATFORM_REPORT' ? fields.amount : fields.commissionAmount) : null,
    currency: fields?.currency ?? null,
    failedChecks: checks.filter((check) => !check.passed).length,
    file: document.file,
    extraction,
    checks,
    includedIn,
    lockedReason: lockReason(document),
    reviewedBy: document.reviewedBy,
    reviewedAt: document.reviewedAt,
    extractionError: document.extractionError,
  }
}

/** Aplică extracția „citită” de AI-ul simulat și rulează verificările. */
function extract(document: MockDocument): void {
  const seed = document.pendingExtraction
  document.pendingExtraction = null
  if (!seed || seed.failure) {
    document.status = 'EXTRACTION_FAILED'
    document.extractionError = seed?.failure ?? 'Documentul nu a putut fi citit.'
    return
  }
  document.documentType = seed.documentType
  document.platform = seed.platform
  document.extractionError = null
  document.extractions.push({
    version: document.extractions.length + 1,
    fields: structuredClone(seed.fields),
    sourceSnippets: structuredClone(seed.sourceSnippets),
    modelConfidence: seed.modelConfidence,
    modelId: 'mock-extractor',
    promptVersion: 'mock-v1',
    isManualEdit: false,
    manuallyEditedFields: [],
    createdBy: MOCK_USERS.ai,
    createdAt: nowIso(),
  })
  const checks = runChecks(db, document, seed.fields, seed.documentType)
  document.status = checks.every((check) => check.passed) ? 'PENDING_CONFIRMATION' : 'NEEDS_REVIEW'
}

/** Ce „citește” AI-ul dintr-un fișier încărcat din UI: tipul din numele fișierului, sumele din documentul pereche. */
function seedForUpload(pfa: MockPfa, period: Period, file: File, id: string): MockDocument {
  const name = normalizeSearch(file.name)
  let platform: Platform | null = name.includes('bolt') ? 'BOLT' : name.includes('uber') ? 'UBER' : null
  let kind: 'invoice' | 'report' | null = /factur|invoice|comision/.test(name) ? 'invoice' : /raport|report|statement/.test(name) ? 'report' : null

  // AI-ul real citește conținutul; mock-ul, când numele nu spune destul, alege singurul slot lipsă
  // compatibil cu ce se știe din nume.
  if (!platform || !kind) {
    const present = db.documents.filter((item) => item.pfaId === pfa.id && item.period === period)
    const missing = platformsAt(pfa, lastDayOfPeriod(period)).flatMap((candidate) =>
      (['invoice', 'report'] as const)
        .filter((candidateKind) => !present.some((item) => item.platform === candidate && item.documentType === (candidateKind === 'invoice' ? 'COMMISSION_INVOICE' : 'PLATFORM_REPORT')))
        .map((candidateKind) => ({ platform: candidate, kind: candidateKind })),
    ).filter((slot) => (!platform || slot.platform === platform) && (!kind || slot.kind === kind))
    if (missing.length === 1) {
      platform = missing[0].platform
      kind = missing[0].kind
    }
  }

  if (!platform || !kind) {
    return {
      ...buildDocument({ pfa, platform: 'BOLT', kind: 'invoice', income: 0, commission: 0, period, unprocessed: true, id, fileName: file.name, uploadedAt: nowIso() }, 0),
      pdfText: '',
      pendingExtraction: {
        documentType: 'UNKNOWN',
        platform: null,
        fields: {} as ExtractedFields,
        sourceSnippets: {},
        modelConfidence: 0,
        failure: 'Tipul documentului nu a putut fi recunoscut. Încarcă factura de comision sau raportul lunar Bolt/Uber (numele fișierului trebuie să conțină platforma).',
      },
    }
  }

  const sibling = db.documents
    .filter((item) => item.pfaId === pfa.id && item.period === period && item.platform === platform && item.extractions.length > 0)
    .map((item) => currentExtraction(item)!.fields)[0]
  const commission = sibling?.commissionAmount ?? 750
  const income = sibling && sibling.amount !== null && sibling.amount > commission ? sibling.amount : round2(commission / 0.15)
  const currency = sibling?.currency === 'EUR' ? 'EUR' : 'RON'
  return buildDocument(
    { pfa, platform, kind, income, commission, currency, period, unprocessed: true, id, fileName: file.name, uploadedAt: nowIso() },
    db.sequence % 1000,
  )
}

/** Confirmarea în bloc: sare peste ce nu se poate confirma și spune de ce. */
function confirmMany(ids: string[], reason: string): { confirmed: string[]; skipped: { id: string; reason: string }[] } {
  const confirmed: string[] = []
  const skipped: { id: string; reason: string }[] = []
  const touched = new Set<string>()
  for (const id of ids) {
    const document = db.documents.find((item) => item.id === id)
    if (!document) {
      skipped.push({ id, reason: 'Documentul nu există.' })
      continue
    }
    if (findPfa(document.pfaId).engagement.status === 'INACTIVE') {
      skipped.push({ id, reason: 'Dosar inactiv.' })
      continue
    }
    const failed = refreshReviewStatus(document).find((check) => !check.passed)
    if (document.status !== 'PENDING_CONFIRMATION') {
      skipped.push({ id, reason: failed ? failed.message : `Nu așteaptă confirmare (status ${effectiveStatus(document)}).` })
      continue
    }
    document.status = 'CONFIRMED'
    document.reviewedBy = CURRENT_USER
    document.reviewedAt = nowIso()
    audit(document.pfaId, 'PlatformDocument', document.id, 'CONFIRM', { status: 'PENDING_CONFIRMATION' }, { status: 'CONFIRMED' }, reason)
    confirmed.push(id)
    touched.add(`${document.pfaId}|${document.period}`)
  }
  touched.forEach((key) => {
    const [pfaId, period] = key.split('|')
    refreshPrecheck(pfaId, period)
  })
  return { confirmed, skipped }
}

// ---------------------------------------------------------------------------------------------
// Pre-check și luna fiscală
// ---------------------------------------------------------------------------------------------

const SLOT_LABEL = { COMMISSION_INVOICE: 'factura de comision', PLATFORM_REPORT: 'raportul lunar' } as const

function documentName(document: MockDocument): string {
  const platform = document.platform ? PLATFORM_LABEL[document.platform] : ''
  if (document.documentType === 'COMMISSION_INVOICE') return `Factura ${platform}`.trim()
  if (document.documentType === 'PLATFORM_REPORT') return `Raportul ${platform}`.trim()
  return document.fileName
}

/** `PreCheckService.Run` (B3), simplificat pe ce există în mock. */
function runPrecheck(pfa: MockPfa, period: Period): PfaMonthStatus {
  const periodEnd = lastDayOfPeriod(period)
  const documents = db.documents.filter((item) => item.pfaId === pfa.id && item.period === period)
  const missing: string[] = []
  const review: string[] = []

  for (const platform of platformsAt(pfa, periodEnd)) {
    for (const type of ['COMMISSION_INVOICE', 'PLATFORM_REPORT'] as const) {
      if (!documents.some((item) => item.platform === platform && item.documentType === type)) {
        missing.push(`Lipsește ${SLOT_LABEL[type]} ${PLATFORM_LABEL[platform]}.`)
      }
    }
  }

  let pendingConfirmation = 0
  for (const document of documents) {
    if (document.status === 'CONFIRMED') continue
    if (document.status === 'UPLOADED' || document.status === 'EXTRACTING') {
      review.push(`${document.fileName}: încă necitit.`)
    } else if (document.status === 'EXTRACTION_FAILED') {
      review.push(`${document.fileName}: citire eșuată.`)
    } else {
      const failed = refreshReviewStatus(document).find((check) => !check.passed)
      if (failed) review.push(`${documentName(document)}: ${failed.message}`)
      else pendingConfirmation++
    }
  }
  // După problemele reale: un document fără probleme doar așteaptă confirmarea.
  if (pendingConfirmation > 0) {
    review.push(pendingConfirmation === 1 ? 'Un document așteaptă confirmare.' : `${pendingConfirmation} documente așteaptă confirmare.`)
  }

  if (!art317At(pfa, periodEnd).enabled) review.push('Codul special de TVA art. 317 nu e activ în perioadă.')

  if (missing.length === 0 && review.length === 0) review.push(...calculate(db, pfa, period).blockingReasons)

  const status: PfaMonthStatus = missing.length > 0 ? 'MISSING_DOCUMENTS' : review.length > 0 ? 'NEEDS_REVIEW' : 'READY'
  pfa.monthStatus[period] = { status, reasons: [...missing, ...review] }
  return status
}

/** După o schimbare pe documente, pre-check-ul se reface doar dacă luna a fost deja procesată. */
function refreshPrecheck(pfaId: string, period: Period): void {
  const pfa = db.pfas.find((item) => item.id === pfaId)
  if (pfa && pfa.monthStatus[period]) runPrecheck(pfa, period)
}

function declarationSummaries(pfa: MockPfa, period: Period): DeclarationSummary[] {
  const month = pfa.monthStatus[period]
  const preview = month?.status === 'READY' ? calculate(db, pfa, period) : null

  return DECLARATION_TYPES.map((type): DeclarationSummary => {
    const declaration = db.declarations.find((item) => item.pfaId === pfa.id && item.period === period && item.type === type)
    if (declaration) {
      const version = currentVersion(declaration)
      return {
        declarationId: declaration.id,
        pfaId: pfa.id,
        period,
        type,
        status: version.status,
        amount: version.amount,
        currentVersionId: version.id,
        currentVersionNo: version.versionNo,
        currentVersionKind: version.kind,
        blockingReasons: [],
      }
    }
    const empty = { declarationId: null, pfaId: pfa.id, period, type, currentVersionId: null, currentVersionNo: null, currentVersionKind: null }
    if (!month) return { ...empty, status: null, amount: null, blockingReasons: [] }
    if (month.status === 'MISSING_DOCUMENTS') return { ...empty, status: 'BLOCKED_MISSING_DOCUMENTS', amount: null, blockingReasons: month.reasons }
    if (month.status === 'NEEDS_REVIEW') return { ...empty, status: 'BLOCKED_NEEDS_REVIEW', amount: null, blockingReasons: month.reasons }
    // READY, încă negenerată: suma e previzualizarea calculului pe regulile de azi.
    const result = preview!.declarations[type]
    return result.applicable
      ? { ...empty, status: 'DRAFT', amount: result.breakdown.total, blockingReasons: [] }
      : { ...empty, status: 'NOT_APPLICABLE', amount: null, blockingReasons: [] }
  })
}

function platformFigures(pfa: MockPfa, period: Period, platform: Platform) {
  if (!platformsAt(pfa, lastDayOfPeriod(period)).includes(platform)) return null
  const documents = db.documents.filter((item) => item.pfaId === pfa.id && item.period === period && item.platform === platform)
  const report = documents.find((item) => item.documentType === 'PLATFORM_REPORT')
  const invoice = documents.find((item) => item.documentType === 'COMMISSION_INVOICE')
  const reportFields = report ? currentExtraction(report)?.fields : null
  const invoiceFields = invoice ? currentExtraction(invoice)?.fields : null
  return {
    income: reportFields?.amount ?? null,
    commission: invoiceFields?.commissionAmount ?? reportFields?.commissionAmount ?? null,
  }
}

function overviewRow(pfa: MockPfa, period: Period): OverviewRow {
  const summaries = declarationSummaries(pfa, period)
  const cell = (type: DeclarationType) => {
    const summary = summaries.find((item) => item.type === type)!
    return { declarationId: summary.declarationId, versionId: summary.currentVersionId, status: summary.status, amount: summary.amount }
  }
  return {
    pfaId: pfa.id,
    pfaName: pfa.name,
    cui: pfa.cui,
    status: monthStatusOf(pfa, period),
    blockingReasons: pfa.monthStatus[period]?.reasons ?? [],
    bolt: platformFigures(pfa, period, 'BOLT'),
    uber: platformFigures(pfa, period, 'UBER'),
    declarations: { D100: cell('D100'), D301: cell('D301'), D390: cell('D390') },
  }
}

// ---------------------------------------------------------------------------------------------
// Joburi
// ---------------------------------------------------------------------------------------------

interface JobUnit {
  pfaId: string | null
  pfaName: string | null
  run: () => { ok: boolean; message: string }
}

function startJob(type: JobType, units: JobUnit[], onComplete?: (job: Job) => void): { jobId: string } {
  const job: Job = {
    id: nextId('job'),
    type,
    status: 'QUEUED',
    progress: { done: 0, total: units.length },
    results: [],
    errors: [],
    createdAt: nowIso(),
    finishedAt: null,
    file: null,
  }
  db.jobs[job.id] = job
  const startedIn = generation
  let index = 0

  const tick = () => {
    if (startedIn !== generation) return
    job.status = 'RUNNING'
    const batch = 1 + Math.floor(Math.random() * 3)
    for (let step = 0; step < batch && index < units.length; step++, index++) {
      const unit = units[index]
      const item: JobResultItem = { pfaId: unit.pfaId, pfaName: unit.pfaName, message: '' }
      try {
        const outcome = unit.run()
        item.message = outcome.message
        ;(outcome.ok ? job.results : job.errors).push(item)
      } catch (error) {
        item.message = error instanceof Error ? error.message : 'Eroare neașteptată.'
        job.errors.push(item)
      }
      job.progress.done = index + 1
    }
    if (index >= units.length) {
      job.status = 'COMPLETED'
      job.finishedAt = nowIso()
      onComplete?.(job)
      return
    }
    setTimeout(tick, randomBetween(JOB_TICK_MS))
  }
  setTimeout(tick, randomBetween(JOB_TICK_MS))
  return { jobId: job.id }
}

function pfasInPeriod(period: Period): MockPfa[] {
  return db.pfas.filter((pfa) => activeIn(pfa, period)).sort((a, b) => a.name.localeCompare(b.name, 'ro'))
}

const MONTH_STATUS_MESSAGE: Record<PfaMonthStatus, string> = {
  NOT_PROCESSED: 'Neprocesat',
  READY: 'Gata',
  NEEDS_REVIEW: 'Necesită verificare',
  MISSING_DOCUMENTS: 'Document lipsă',
}

// ---------------------------------------------------------------------------------------------
// Declarații
// ---------------------------------------------------------------------------------------------

function escapeXml(value: string | number): string {
  return String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
}

/** Deliberat NU e formatul ANAF: XML-ul real se generează din XSD-urile oficiale în B4. */
function mockXml(pfa: MockPfa, declaration: MockDeclaration, version: MockDeclarationVersion): string {
  const lines = version.breakdown.lines
    .map(
      (line) =>
        `  <linie document="${escapeXml(line.sourceDocumentLabel)}" furnizor="${escapeXml(line.supplierName)}" codTva="${escapeXml(line.supplierVatId)}" baza="${line.base.toFixed(2)}" cota="${line.rate ?? ''}" valoare="${line.value.toFixed(2)}"/>`,
    )
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- MOCK RIDElance: acesta NU este formatul ANAF. XML-ul real se generează din XSD-urile oficiale (etapa B4). -->',
    `<mockDeclaratie tip="${declaration.type}" perioada="${declaration.period}" cui="${pfa.cui}" versiune="${version.versionNo}" tipVersiune="${version.kind}" total="${version.amount.toFixed(2)}">`,
    lines,
    '</mockDeclaratie>',
  ].join('\n')
}

function setStatus(pfa: MockPfa, declaration: MockDeclaration, version: MockDeclarationVersion, to: DeclarationStatus, note: string | null): void {
  const from = version.status
  if (!canTransition(from, to)) {
    throw conflict('INVALID_TRANSITION', `Tranziția „${DECLARATION_STATUS[from].label}” → „${DECLARATION_STATUS[to].label}” nu e permisă.`)
  }
  version.status = to
  version.statusHistory.push({ from, to, at: nowIso(), by: CURRENT_USER, note })
  version.rowVersion = String(Number(version.rowVersion) + 1)
  audit(pfa.id, 'DeclarationVersion', version.id, `STATUS_${to}`, { status: from }, { status: to, declaration: declaration.type }, note)
}

/** Recalculează versiunea din documentele și regulile curente (generare, regenerare, rectificativă). */
function applyCalculation(pfa: MockPfa, declaration: MockDeclaration, version: MockDeclarationVersion): void {
  const result = calculate(db, pfa, declaration.period)
  if (result.blockingReasons.length > 0) throw conflict('PRECHECK_BLOCKED', result.blockingReasons[0])
  const { breakdown } = result.declarations[declaration.type]
  version.breakdown = breakdown
  version.amount = breakdown.total
  // D390 agregă pe furnizor; documentele ei sunt aceleași facturi UE ca la D301.
  const perDocument = declaration.type === 'D390' ? result.declarations.D301.breakdown.lines : breakdown.lines
  version.documentIds = [...new Set(perDocument.map((line) => line.sourceDocumentId))]
  version.schemaVersion = validAt(db.anafSchemas, lastDayOfPeriod(declaration.period), (schema) => schema.declarationType === declaration.type)?.version ?? null
  version.validation = null
  version.hasPdf = false
  version.xml = mockXml(pfa, declaration, version)
  version.hasXml = true
}

function newVersion(declaration: MockDeclaration, kind: MockDeclarationVersion['kind'], reason: string | null): MockDeclarationVersion {
  return {
    id: nextId('decl-ver'),
    declarationId: declaration.id,
    versionNo: declaration.versions.length + 1,
    kind,
    status: 'GENERATED',
    amount: 0,
    schemaVersion: null,
    rectificationReason: reason,
    hasXml: false,
    hasPdf: false,
    receiptNumber: null,
    receiptFile: null,
    statusHistory: [{ from: null, to: 'GENERATED', at: nowIso(), by: CURRENT_USER, note: reason }],
    createdAt: nowIso(),
    rowVersion: '1',
    breakdown: { lines: [], total: 0, explanation: '', excludedRideIncome: null },
    validation: null,
    xml: null,
    documentIds: [],
  }
}

function generateFor(pfa: MockPfa, period: Period): { ok: boolean; message: string } {
  if (db.declarations.some((item) => item.pfaId === pfa.id && item.period === period)) {
    return { ok: true, message: 'Declarațiile existau deja; nimic de generat.' }
  }
  if (runPrecheck(pfa, period) !== 'READY') {
    return { ok: false, message: `Nu mai e gata: ${pfa.monthStatus[period].reasons[0]}` }
  }
  const result = calculate(db, pfa, period)
  const generated: string[] = []
  for (const type of DECLARATION_TYPES) {
    if (!result.declarations[type].applicable) continue
    const declaration: MockDeclaration = { id: nextId('decl'), pfaId: pfa.id, period, type, versions: [] }
    const version = newVersion(declaration, 'INITIAL', null)
    declaration.versions.push(version)
    applyCalculation(pfa, declaration, version)
    db.declarations.push(declaration)
    audit(pfa.id, 'DeclarationVersion', version.id, 'GENERATE', null, { type, period, amount: version.amount }, null)
    generated.push(`${type} ${formatLei(version.amount)}`)
  }
  return { ok: true, message: generated.length > 0 ? `Generate: ${generated.join(', ')}.` : 'Nicio declarație aplicabilă.' }
}

/** Cele 3 niveluri (B4), simulate. RIDElance chiar recalculează din snapshot. */
function validateVersion(pfa: MockPfa, declaration: MockDeclaration, version: MockDeclarationVersion): boolean {
  const expected = round2(version.breakdown.lines.reduce((sum, line) => sum + line.value, 0))
  const ridelanceOk = declaration.type === 'D390' ? version.amount === 0 : expected === version.amount
  const failure = pfa.failFirstValidation
  const failsNow =
    failure !== null &&
    failure.type === declaration.type &&
    !version.statusHistory.some((entry) => entry.to === 'VALIDATION_FAILED')

  const levels: ValidationLevelResult[] = []
  let previousPassed = true
  for (const level of ['RIDELANCE', 'XSD', 'ANAF'] as const) {
    if (!previousPassed) {
      levels.push({ level, passed: false, messages: [{ field: null, text: 'Nu s-a rulat: nivelul anterior a picat.' }] })
      continue
    }
    let passed = true
    const messages: { field: string | null; text: string }[] = []
    if (level === 'RIDELANCE' && !ridelanceOk) {
      passed = false
      messages.push({ field: null, text: `Suma liniilor (${formatAmount(expected)}) nu corespunde totalului (${formatAmount(version.amount)}).` })
    }
    if (failsNow && failure?.level === level) {
      passed = false
      messages.push({ field: null, text: failure.message })
    }
    levels.push({ level, passed, messages })
    previousPassed = passed
  }

  version.validation = { levels, validatedAt: nowIso(), validatorVersion: 'mock' }
  if (levels.every((level) => level.passed)) {
    setStatus(pfa, declaration, version, 'VALIDATED', null)
    version.hasPdf = true
    setStatus(pfa, declaration, version, 'READY_TO_SIGN', 'PDF pentru semnare generat (simulat).')
    return true
  }
  setStatus(pfa, declaration, version, 'VALIDATION_FAILED', null)
  return false
}

function toVersion(version: MockDeclarationVersion): DeclarationVersion {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { breakdown, validation, xml, documentIds, ...rest } = version
  return rest
}

function toDeclarationDetail(declaration: MockDeclaration): DeclarationDetail {
  return {
    id: declaration.id,
    pfaId: declaration.pfaId,
    period: declaration.period,
    type: declaration.type,
    versions: declaration.versions.map(toVersion),
    currentVersionId: currentVersion(declaration).id,
  }
}

// ---------------------------------------------------------------------------------------------
// Reguli
// ---------------------------------------------------------------------------------------------

function ruleResource<T extends Validity & { id: string }>(options: {
  items: () => T[]
  prefix: string
  entity: string
  /** Cheia pe care nu se pot suprapune perioadele de valabilitate. */
  keyOf: (item: RuleInput<T>) => string
  describeKey: (item: RuleInput<T>) => string
}): RuleResource<T> {
  const check = (input: RuleInput<T>, selfId: string | null) => {
    requireDate(input.validFrom, 'Valabil de la')
    if (input.validTo !== null) requireDate(input.validTo, 'Valabil până la')
    if (input.validTo !== null && input.validTo < input.validFrom) {
      throw badRequest('INVALID_VALIDITY', '„Valabil până la” e înainte de „Valabil de la”.')
    }
    const clash = options.items().find((other) => other.id !== selfId && options.keyOf(other) === options.keyOf(input) && overlaps(other, input))
    if (clash) {
      throw conflict(
        'OVERLAPPING_VALIDITY',
        `Pentru ${options.describeKey(input)} există deja o regulă valabilă ${formatValidity(clash.validFrom, clash.validTo)}. Închide-o întâi prin „Valabil până la”.`,
      )
    }
  }
  return {
    list: () => respond(() => [...options.items()].sort((a, b) => options.keyOf(a).localeCompare(options.keyOf(b)) || a.validFrom.localeCompare(b.validFrom))),
    create: (input) =>
      respond(() => {
        check(input, null)
        const item = { ...structuredClone(input), id: nextId(options.prefix) } as T
        options.items().push(item)
        audit(null, options.entity, item.id, 'CREATE', null, item, null)
        return item
      }),
    update: (id, input) =>
      respond(() => {
        const items = options.items()
        const index = items.findIndex((item) => item.id === id)
        if (index < 0) throw notFound('Regula')
        check(input, id)
        const before = items[index]
        const after = { ...structuredClone(input), id } as T
        items[index] = after
        audit(null, options.entity, id, 'UPDATE', before, after, null)
        return after
      }),
  }
}

// ---------------------------------------------------------------------------------------------
// Ledger, perioade, registre
// ---------------------------------------------------------------------------------------------

function findLedgerEntry(id: string): LedgerEntry {
  const entry = db.ledger.find((item) => item.id === id)
  if (!entry) throw notFound('Tranzacția')
  return entry
}

function isPeriodClosed(pfaId: string, period: Period): boolean {
  return db.periods.some((item) => item.pfaId === pfaId && item.period === period && item.status === 'CLOSED')
}

function ensurePeriodOpen(pfaId: string, period: Period): void {
  if (isPeriodClosed(pfaId, period)) {
    throw conflict('PERIOD_CLOSED', `Perioada ${formatPeriod(period)} e închisă. Modificările se fac doar prin „Corecție controlată”.`)
  }
}

function withDeductibility(entry: LedgerEntry): LedgerEntry {
  return { ...entry, ...resolveDeductibility(entry, historyOf(entry.pfaId), db.expenseCategories) }
}

const LEDGER_EDITABLE_FIELDS = [
  'date',
  'documentLabel',
  'counterparty',
  'description',
  'transactionType',
  'paymentMethod',
  'amount',
  'category',
  'sourceDocumentId',
] as const

function applyLedgerChange(entry: LedgerEntry, change: Record<string, unknown>): LedgerEntry {
  const next = { ...entry } as Record<string, unknown>
  for (const field of LEDGER_EDITABLE_FIELDS) {
    if (field in change && change[field] !== undefined) next[field] = change[field]
  }
  const updated = next as unknown as LedgerEntry
  updated.accountingPeriod = periodOf(updated.date)
  updated.rowVersion = String(Number(entry.rowVersion) + 1)
  return withDeductibility(updated)
}

function replaceLedgerEntry(entry: LedgerEntry): void {
  db.ledger[db.ledger.findIndex((item) => item.id === entry.id)] = entry
}

function ledgerInRange(pfaId: string, from: IsoDate, to: IsoDate): LedgerEntry[] {
  return db.ledger
    .filter((entry) => entry.pfaId === pfaId && entry.date >= from && entry.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

function refView(pfa: MockPfa, year: number, asOfOverride?: IsoDate): RefView {
  const entries = ledgerInRange(pfa.id, `${year}-01-01`, asOfOverride ?? `${year}-12-31`)
  // Recunoașterea venitului e DE CONFIRMAT (§6 pct. 8); mock: încasările, așa cum sunt înregistrate.
  const income = round2(entries.filter((entry) => entry.transactionType === 'INCOME').reduce((sum, entry) => sum + entry.amount, 0))
  const deductible = round2(
    entries.filter((entry) => entry.transactionType === 'EXPENSE').reduce((sum, entry) => sum + (entry.deductibleAmount ?? 0), 0),
  )
  const yearPeriods = db.periods.filter((item) => item.pfaId === pfa.id && item.period.startsWith(`${year}-`))
  const closedYear = yearPeriods.length === 12 && yearPeriods.every((item) => item.status === 'CLOSED')
  const endDate = pfa.engagement.endDate
  const intermediate = asOfOverride ?? (!closedYear && pfa.engagement.status === 'INACTIVE' && endDate?.startsWith(`${year}-`) ? endDate : null)
  // Denumirile elementelor de calcul se iau din modelul OMFP 3254/2017 (DE CONFIRMAT, §6 pct. 10).
  const row = (calculationElement: string, value: number) => ({
    year,
    rectification: false,
    incomeCategory: 'Activități independente – transport alternativ (ridesharing)',
    calculationElement,
    value,
  })
  return {
    pfaId: pfa.id,
    year,
    status: closedYear ? 'FINAL' : intermediate ? 'INTERMEDIATE' : 'CURRENT',
    asOf: closedYear ? null : intermediate,
    rows: [row('Venit brut', income), row('Cheltuieli deductibile', deductible), row('Venit net', round2(income - deductible))],
  }
}

function inventoryAssets(pfaId: string, year: number): Asset[] {
  return db.assets
    .filter(
      (asset) =>
        asset.pfaId === pfaId && asset.acquisitionDate <= `${year}-12-31` && (!asset.disposedDate || asset.disposedDate >= `${year}-01-01`),
    )
    .sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate))
}

function validateAsset(input: AssetInput): void {
  if (!input.type.trim() || !input.description.trim()) throw badRequest('ASSET_INVALID', 'Tipul și descrierea sunt obligatorii.')
  requireDate(input.acquisitionDate, 'Data achiziției')
  if (!(input.acquisitionValue > 0)) throw badRequest('ASSET_INVALID', 'Valoarea achiziției trebuie să fie pozitivă.')
  if (input.status === 'DISPOSED') requireDate(input.disposedDate, 'Data ieșirii')
}

const MOCK_EXPORT_NOTE = 'Export simulat (mock). Layoutul oficial vine în B7, după confirmarea modelelor OMFP.'

async function exportRows(title: string, format: ExportFormat, header: string[], rows: (string | number)[][]): Promise<Blob> {
  if (format === 'xlsx') return csvBlob(header, rows)
  return textPdf(title, [header.join(' | '), ...rows.map((row) => row.join(' | '))], MOCK_EXPORT_NOTE)
}

// ---------------------------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------------------------

export function createMockAccountingApi(): AccountingApi {
  return {
    pfas: {
      list: (query) =>
        respond((): PfaListItem[] => {
          const search = normalizeSearch(query?.search?.trim() ?? '')
          return db.pfas
            .filter((pfa) => !query?.status || pfa.engagement.status === (query.status === 'active' ? 'ACTIVE' : 'INACTIVE'))
            .filter((pfa) => !search || normalizeSearch(pfa.name).includes(search) || pfa.cui.includes(search))
            .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
            .map((pfa) => {
              const summary = toSummary(pfa)
              return {
                id: pfa.id,
                name: pfa.name,
                cui: pfa.cui,
                art317: summary.art317,
                platforms: summary.platforms,
                engagementStatus: pfa.engagement.status,
                currentPeriod: summary.currentPeriod,
                currentMonthStatus: summary.currentMonthStatus,
                cashStatus: pfa.cash.status,
              }
            })
        }),

      getSummary: (pfaId) => respond(() => toSummary(findPfa(pfaId))),

      getSettings: (pfaId) => respond(() => toSettings(findPfa(pfaId))),

      updateSettings: (pfaId, change) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const note = requireReason(change.note, 'Observația / justificarea')
          const validFrom = requireDate(change.validFrom, 'Valabil de la')
          if (change.field === 'platforms' && change.value.length === 0) {
            throw badRequest('PLATFORMS_REQUIRED', 'Alege cel puțin o platformă.')
          }
          const history = historyOf(pfaId)
          if (history.some((entry) => entry.key === change.field && entry.validFrom === validFrom)) {
            throw conflict('SETTING_EXISTS', `Există deja o valoare cu „Valabil de la” ${formatDate(validFrom)}. Istoricul nu se suprascrie.`)
          }
          const before = settingAt(history, change.field, validFrom)
          const entry = {
            id: nextId('set'),
            key: change.field,
            value: structuredClone(change.value),
            validFrom,
            validTo: null,
            note,
            changedBy: CURRENT_USER,
            changedAt: nowIso(),
          }
          db.settingsHistory[pfaId] = [...history, entry]
          audit(pfaId, 'PfaAccountingSettings', entry.id, 'APPEND', before ? { value: before.value } : null, { key: change.field, value: change.value, validFrom }, note)
          // Deductibilitatea se reaplică pe tranzacțiile din perioadele deschise.
          if (change.field === 'vehicle_deductibility') {
            db.ledger = db.ledger.map((item) =>
              item.pfaId === pfaId && !isPeriodClosed(pfaId, item.accountingPeriod) ? withDeductibility(item) : item,
            )
          }
          return toSettings(pfa)
        }),

      uploadCashEvidence: (pfaId, file) =>
        respond(async () => {
          ensureWritable(findPfa(pfaId))
          const stored = await fileRefFrom(file, 'cash-evidence')
          db.cashEvidence[stored.id] = { pfaId, file: stored }
          audit(pfaId, 'CashEvidence', stored.id, 'UPLOAD', null, { fileName: stored.fileName }, null)
          return { documentId: stored.id }
        }),

      transitionCash: (pfaId, request) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const note = requireReason(request.note, 'Nota')
          const from = pfa.cash.status
          if (!canTransitionCash(from, request.to)) {
            throw conflict('INVALID_TRANSITION', `Casa de marcat nu poate trece din ${from} în ${request.to}.`)
          }
          const evidence = request.evidenceDocumentId ? db.cashEvidence[request.evidenceDocumentId] : undefined
          if (CASH_STATUSES_REQUIRING_EVIDENCE.includes(request.to) && (!evidence || evidence.pfaId !== pfaId)) {
            throw badRequest('EVIDENCE_REQUIRED', 'Încarcă dovada de fiscalizare înainte de activarea numerarului.')
          }
          const before = { ...pfa.cash }
          const active = request.to === 'ACTIVE'
          pfa.cash = {
            status: request.to,
            cashRequested: request.to !== 'NOT_REQUIRED_CURRENT_CONFIGURATION',
            cashEnabled: active,
            activationDate: active ? todayIso() : null,
            verifiedBy: active ? CURRENT_USER : null,
            evidenceFile: active ? evidence!.file : request.to === 'NOT_REQUIRED_CURRENT_CONFIGURATION' ? null : before.evidenceFile,
          }
          audit(pfaId, 'CashRegisterState', pfaId, `CASH_${request.to}`, before, pfa.cash, note)
          return pfa.cash
        }),

      deactivate: (pfaId, request) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const endDate = requireDate(request.accountingEndDate, 'Data de sfârșit')
          if (endDate < pfa.engagement.startDate) {
            throw badRequest('INVALID_END_DATE', `Data de sfârșit e înainte de începutul colaborării (${formatDate(pfa.engagement.startDate)}).`)
          }
          const before = { ...pfa.engagement }
          pfa.engagement = { ...pfa.engagement, status: 'INACTIVE', endDate }
          audit(pfaId, 'PfaAccountingEngagement', pfaId, 'DEACTIVATE', before, pfa.engagement, null)
          return toSummary(pfa)
        }),

      createHandoverPackage: (pfaId) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          const year = Number((pfa.engagement.endDate ?? todayIso()).slice(0, 4))
          const steps = [
            'RJIP',
            `REF ${refView(pfa, year).status === 'FINAL' ? 'final' : 'intermediar'}`,
            'Registru-inventar',
            'Ledger (Excel)',
            'Documente originale',
            'Declarații (XML + PDF) și recipise',
            'Sumar_predare.pdf',
          ]
          return startJob(
            'HANDOVER_PACKAGE',
            steps.map((step) => ({ pfaId: pfa.id, pfaName: pfa.name, run: () => ({ ok: true, message: `Adăugat în arhivă: ${step}.` }) })),
            (job) => {
              job.file = { ...fileRef(`handover-${pfa.id}-${job.id}`, `RIDElance_PFA_${pfa.cui}_${year}.zip`), contentType: 'application/zip' }
              audit(pfa.id, 'HandoverPackage', job.id, 'GENERATE', null, { fileName: job.file.fileName }, null)
            },
          )
        }),

      getAudit: (pfaId, query) =>
        respond((): AuditEntry[] => {
          findPfa(pfaId)
          return db.audit
            .filter((entry) => entry.pfaId === pfaId)
            .filter((entry) => !query?.from || entry.at.slice(0, 10) >= query.from)
            .filter((entry) => !query?.to || entry.at.slice(0, 10) <= query.to)
            .filter((entry) => !query?.entity || entry.entity === query.entity)
            .sort((a, b) => b.at.localeCompare(a.at))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ pfaId: _pfaId, ...entry }) => entry)
        }),
    },

    onboarding: {
      getCashPreference: () => respond(() => db.myCashPreference),
      setCashPreference: (request) =>
        respond(() => {
          const before = db.myCashPreference
          db.myCashPreference = { cashRequested: request.cashRequested, answeredAt: nowIso() }
          audit(null, 'CashPreference', 'me', request.cashRequested ? 'CASH_PENDING' : 'CASH_NOT_REQUIRED_CURRENT_CONFIGURATION', before, db.myCashPreference, null)
          return db.myCashPreference
        }),
    },

    documents: {
      list: (pfaId, period) =>
        respond(() => {
          findPfa(pfaId)
          return db.documents
            .filter((document) => document.pfaId === pfaId && document.period === period)
            .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt) || a.id.localeCompare(b.id))
            .map(toListItem)
        }),

      upload: (pfaId, request) =>
        respond(async () => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const period = requirePeriod(request.period)
          if (!activeIn(pfa, period)) throw badRequest('PERIOD_OUTSIDE_ENGAGEMENT', `${pfa.name} nu e client în ${formatPeriod(period)}.`)
          ensurePeriodOpen(pfaId, period)
          const file = await fileRefFrom(request.file, 'file')
          const existing = db.documents.find((document) => document.pfaId === pfaId && document.file.hash === file.hash)
          if (existing) {
            throw conflict('DUPLICATE_FILE', `Fișierul a fost deja încărcat ca „${existing.fileName}”.`, { existingDocumentId: existing.id })
          }
          const document = seedForUpload(pfa, period, request.file, nextId('doc'))
          document.file = file
          document.status = 'EXTRACTING'
          db.documents.push(document)
          audit(pfaId, 'PlatformDocument', document.id, 'UPLOAD', null, { fileName: document.fileName, period }, null)

          const startedIn = generation
          setTimeout(() => {
            if (startedIn !== generation) return
            extract(document)
            refreshPrecheck(pfaId, period)
          }, randomBetween(EXTRACTION_MS))
          return toDocument(document)
        }),

      get: (id) => respond(() => toDetail(findDocument(id))),

      getFile: (id) =>
        respond(() => {
          const document = findDocument(id)
          const lines = document.pdfText ? document.pdfText.split('\n') : ['(document fără text)']
          return textPdf(document.fileName, lines, 'Document simulat (mock).')
        }),

      updateExtraction: (id, request) =>
        respond(() => {
          const document = findDocument(id)
          const pfa = findPfa(document.pfaId)
          ensureWritable(pfa)
          const reason = requireReason(request.reason, 'Motivul modificării')
          const locked = lockReason(document)
          if (locked) throw conflict('DOCUMENT_LOCKED', locked)
          const previous = currentExtraction(document)
          if (!previous) throw conflict('NO_EXTRACTION', 'Documentul nu a fost încă citit.')

          const fields: ExtractedFields = { ...previous.fields, ...structuredClone(request.fields) }
          const changed = (Object.keys(request.fields) as ExtractedFieldKey[]).filter(
            (key) => JSON.stringify(previous.fields[key]) !== JSON.stringify(fields[key]),
          )
          if (changed.length === 0) throw badRequest('NO_CHANGES', 'Nicio valoare nu s-a schimbat.')
          const sourceSnippets = { ...previous.sourceSnippets }
          changed.forEach((key) => delete sourceSnippets[key])

          document.extractions.push({
            version: previous.version + 1,
            fields,
            sourceSnippets,
            modelConfidence: previous.modelConfidence,
            modelId: previous.modelId,
            promptVersion: previous.promptVersion,
            isManualEdit: true,
            manuallyEditedFields: [...new Set([...previous.manuallyEditedFields, ...changed])],
            createdBy: CURRENT_USER,
            createdAt: nowIso(),
          })
          const checks = runChecks(db, document, fields, document.documentType)
          document.status = checks.every((check) => check.passed) ? 'PENDING_CONFIRMATION' : 'NEEDS_REVIEW'
          document.reviewedBy = null
          document.reviewedAt = null
          const pick = (source: ExtractedFields) => Object.fromEntries(changed.map((key) => [key, source[key]]))
          audit(document.pfaId, 'DocumentExtraction', document.id, 'MANUAL_EDIT', pick(previous.fields), pick(fields), reason)
          refreshPrecheck(document.pfaId, document.period)
          return toDetail(document)
        }),

      confirm: (id) =>
        respond(() => {
          const document = findDocument(id)
          ensureWritable(findPfa(document.pfaId))
          refreshReviewStatus(document)
          if (document.status === 'NEEDS_REVIEW') throw conflict('CHECKS_FAILED', 'Documentul are verificări picate și nu poate fi confirmat.')
          if (document.status !== 'PENDING_CONFIRMATION') {
            throw conflict('INVALID_TRANSITION', `Documentul nu așteaptă confirmare (status ${effectiveStatus(document)}).`)
          }
          document.status = 'CONFIRMED'
          document.reviewedBy = CURRENT_USER
          document.reviewedAt = nowIso()
          audit(document.pfaId, 'PlatformDocument', document.id, 'CONFIRM', { status: 'PENDING_CONFIRMATION' }, { status: 'CONFIRMED' }, null)
          refreshPrecheck(document.pfaId, document.period)
          return toDetail(document)
        }),

      confirmBulk: (request) => respond(() => confirmMany(request.ids, 'Confirmare în bloc')),
    },

    months: {
      getOverview: (period) =>
        respond(() => {
          requirePeriod(period)
          const rows = pfasInPeriod(period).map((pfa) => overviewRow(pfa, period))
          const count = (status: PfaMonthStatus) => rows.filter((row) => row.status === status).length
          return {
            period,
            stats: {
              total: rows.length,
              ready: count('READY'),
              needsReview: count('NEEDS_REVIEW'),
              missingDocuments: count('MISSING_DOCUMENTS'),
              notProcessed: count('NOT_PROCESSED'),
            },
            rows,
          }
        }),

      confirmCleanDocuments: (period) =>
        respond(() => {
          requirePeriod(period)
          const active = new Set(pfasInPeriod(period).map((pfa) => pfa.id))
          const ids = db.documents
            .filter((document) => document.period === period && active.has(document.pfaId))
            .filter((document) => {
              refreshReviewStatus(document)
              return document.status === 'PENDING_CONFIRMATION'
            })
            .map((document) => document.id)
          return confirmMany(ids, 'Confirmare în bloc a documentelor fără probleme')
        }),

      process: (period) =>
        respond(() => {
          requirePeriod(period)
          return startJob(
            'PROCESS_PERIOD',
            pfasInPeriod(period).map((pfa) => ({
              pfaId: pfa.id,
              pfaName: pfa.name,
              run: () => {
                db.documents
                  .filter((document) => document.pfaId === pfa.id && document.period === period && document.status === 'UPLOADED')
                  .forEach(extract)
                const status = runPrecheck(pfa, period)
                const reason = pfa.monthStatus[period].reasons[0]
                return { ok: true, message: reason ? `${MONTH_STATUS_MESSAGE[status]}: ${reason}` : MONTH_STATUS_MESSAGE[status] }
              },
            })),
          )
        }),

      generate: (period) =>
        respond(() => {
          requirePeriod(period)
          const candidates = pfasInPeriod(period).filter(
            (pfa) =>
              monthStatusOf(pfa, period) === 'READY' && !db.declarations.some((item) => item.pfaId === pfa.id && item.period === period),
          )
          return startJob(
            'GENERATE_DECLARATIONS',
            candidates.map((pfa) => ({ pfaId: pfa.id, pfaName: pfa.name, run: () => generateFor(pfa, period) })),
          )
        }),

      validate: (period) =>
        respond(() => {
          requirePeriod(period)
          const byPfa = new Map<string, MockDeclaration[]>()
          db.declarations
            .filter((declaration) => declaration.period === period && currentVersion(declaration).status === 'GENERATED')
            .forEach((declaration) => byPfa.set(declaration.pfaId, [...(byPfa.get(declaration.pfaId) ?? []), declaration]))
          return startJob(
            'VALIDATE_DECLARATIONS',
            [...byPfa.entries()].map(([pfaId, declarations]) => {
              const pfa = findPfa(pfaId)
              return {
                pfaId,
                pfaName: pfa.name,
                run: () => {
                  const failed = declarations.filter((declaration) => !validateVersion(pfa, declaration, currentVersion(declaration)))
                  return failed.length === 0
                    ? { ok: true, message: `Validate: ${declarations.map((item) => item.type).join(', ')}.` }
                    : { ok: false, message: `Validare picată: ${failed.map((item) => item.type).join(', ')}.` }
                },
              }
            }),
          )
        }),
    },

    jobs: {
      get: (jobId) =>
        respond(() => {
          const job = db.jobs[jobId]
          if (!job) throw notFound('Jobul')
          return job
        }),
      // Mock-ul nu construiește arhiva: întoarce lista de conținut, ca text.
      getFile: (jobId) =>
        respond(() => {
          const job = db.jobs[jobId]
          if (!job?.file) throw notFound('Fișierul jobului')
          const lines = [`${job.file.fileName} (simulat)`, '', ...job.results.map((item) => item.message)]
          return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
        }),
    },

    declarations: {
      list: (pfaId, period) => respond(() => declarationSummaries(findPfa(pfaId), requirePeriod(period))),

      get: (id) =>
        respond(() => {
          const declaration = db.declarations.find((item) => item.id === id)
          if (!declaration) throw notFound('Declarația')
          return toDeclarationDetail(declaration)
        }),

      getBreakdown: (versionId) => respond(() => findDeclarationOfVersion(versionId).version.breakdown),

      getXml: (versionId) =>
        respond(() => {
          const { version } = findDeclarationOfVersion(versionId)
          if (!version.xml) throw notFound('XML-ul')
          return version.xml
        }),

      getPdf: (versionId) =>
        respond(() => {
          const { declaration, version } = findDeclarationOfVersion(versionId)
          if (!version.hasPdf) throw notFound('PDF-ul')
          const pfa = findPfa(declaration.pfaId)
          return textPdf(
            `${declaration.type} – ${pfa.name} – ${formatPeriod(declaration.period)} (v${version.versionNo})`,
            [
              `CUI ${pfa.cui}`,
              `De plată: ${formatLei(version.amount)}`,
              ...version.breakdown.lines.map((line) => `${line.sourceDocumentLabel}: ${line.explanation}`),
            ],
            'PDF simulat (mock) – nu e generat de DUKIntegrator.',
          )
        }),

      getValidation: (versionId) => respond(() => findDeclarationOfVersion(versionId).version.validation),

      transition: (versionId, request) =>
        respond(() => {
          const { declaration, version } = findDeclarationOfVersion(versionId)
          const pfa = findPfa(declaration.pfaId)
          ensureWritable(pfa)
          if (version.id !== currentVersion(declaration).id) {
            throw conflict('NOT_CURRENT_VERSION', 'Doar versiunea curentă își poate schimba statusul. Versiunile vechi rămân neschimbate.')
          }
          if (!isActionAllowed(version.status, request.action)) {
            throw conflict('INVALID_TRANSITION', `Acțiunea nu e permisă din statusul „${DECLARATION_STATUS[version.status].label}”.`)
          }
          const note = request.note?.trim() || null
          if (request.action === 'MARK_REJECTED') requireReason(note, 'Motivul respingerii')

          if (request.action === 'VALIDATE') {
            validateVersion(pfa, declaration, version)
          } else if (request.action === 'REGENERATE') {
            // Întâi calculul: dacă pre-check-ul blochează, versiunea rămâne neatinsă.
            applyCalculation(pfa, declaration, version)
            setStatus(pfa, declaration, version, 'GENERATED', note)
          } else {
            setStatus(pfa, declaration, version, DECLARATION_ACTION_TARGETS[request.action], note)
          }
          return toVersion(version)
        }),

      uploadReceipt: (versionId, request) =>
        respond(async () => {
          const { declaration, version } = findDeclarationOfVersion(versionId)
          const pfa = findPfa(declaration.pfaId)
          ensureWritable(pfa)
          if (version.status !== 'SUBMITTED') {
            throw conflict('INVALID_TRANSITION', 'Recipisa se încarcă doar pe o declarație depusă.')
          }
          version.receiptFile = await fileRefFrom(request.file, 'receipt')
          version.receiptNumber = request.receiptNumber?.trim() || null
          setStatus(pfa, declaration, version, 'ACCEPTED', version.receiptNumber ? `Recipisa nr. ${version.receiptNumber}` : null)
          return toVersion(version)
        }),

      createRectification: (declarationId, request) =>
        respond(() => {
          const declaration = db.declarations.find((item) => item.id === declarationId)
          if (!declaration) throw notFound('Declarația')
          const pfa = findPfa(declaration.pfaId)
          ensureWritable(pfa)
          const reason = requireReason(request.reason, 'Motivul rectificativei')
          if (currentVersion(declaration).status !== 'ACCEPTED') {
            throw conflict('INVALID_TRANSITION', 'Rectificativa se creează doar dintr-o versiune cu recipisă validă.')
          }
          const version = newVersion(declaration, 'RECTIFICATIVE', reason)
          applyCalculation(pfa, declaration, version)
          declaration.versions.push(version)
          audit(pfa.id, 'DeclarationVersion', version.id, 'RECTIFICATION', null, { type: declaration.type, versionNo: version.versionNo, amount: version.amount }, reason)
          return toVersion(version)
        }),
    },

    rules: {
      suppliers: ruleResource<SupplierTaxProfile>({
        items: () => db.suppliers,
        prefix: 'supplier',
        entity: 'SupplierTaxProfile',
        keyOf: (item) => item.vatId,
        describeKey: (item) => `${item.supplierName} (${item.vatId})`,
      }),
      vatRates: ruleResource<VatRate>({
        items: () => db.vatRates,
        prefix: 'vat',
        entity: 'VatRate',
        keyOf: () => 'VAT',
        describeKey: () => 'cota de TVA',
      }),
      d100: ruleResource<D100Rule>({
        items: () => db.d100Rules,
        prefix: 'd100',
        entity: 'D100Rule',
        keyOf: (item) => item.code,
        describeKey: (item) => item.code,
      }),
      anafSchemas: ruleResource<AnafDeclarationSchema>({
        items: () => db.anafSchemas,
        prefix: 'schema',
        entity: 'AnafDeclarationSchema',
        keyOf: (item) => item.declarationType,
        describeKey: (item) => `schema ${item.declarationType}`,
      }),
      expenseCategories: ruleResource<ExpenseCategoryRule>({
        items: () => db.expenseCategories,
        prefix: 'category',
        entity: 'ExpenseCategoryRule',
        keyOf: (item) => item.category,
        describeKey: (item) => `categoria ${item.label}`,
      }),
      getExchangeRate: (query) =>
        respond(
          () =>
            db.exchangeRates
              .filter((rate) => rate.currency === query.currency && rate.date <= query.date)
              .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
        ),
    },

    ledger: {
      list: (pfaId, query) =>
        respond(() => {
          findPfa(pfaId)
          const page = Math.max(1, query?.page ?? 1)
          const pageSize = Math.min(200, Math.max(1, query?.pageSize ?? 25))
          const items = db.ledger
            .filter((entry) => entry.pfaId === pfaId)
            .filter((entry) => !query?.from || entry.date >= query.from)
            .filter((entry) => !query?.to || entry.date <= query.to)
            .filter((entry) => !query?.status || entry.status === query.status)
            .filter((entry) => !query?.type || entry.transactionType === query.type)
            .filter((entry) => !query?.source || entry.source === query.source)
            .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
          return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length }
        }),

      update: (id, request) =>
        respond(() => {
          const entry = findLedgerEntry(id)
          ensureWritable(findPfa(entry.pfaId))
          const reason = requireReason(request.reason, 'Motivul modificării')
          ensurePeriodOpen(entry.pfaId, entry.accountingPeriod)
          if (request.fields.date) ensurePeriodOpen(entry.pfaId, periodOf(requireDate(request.fields.date, 'Data')))
          const updated = applyLedgerChange(entry, request.fields)
          replaceLedgerEntry(updated)
          audit(entry.pfaId, 'LedgerEntry', id, 'UPDATE', entry, updated, reason)
          return updated
        }),

      verify: (id) =>
        respond(() => {
          const entry = findLedgerEntry(id)
          ensureWritable(findPfa(entry.pfaId))
          ensurePeriodOpen(entry.pfaId, entry.accountingPeriod)
          if (entry.transactionType === 'EXPENSE' && !entry.category) {
            throw conflict('CATEGORY_REQUIRED', 'Alege categoria cheltuielii înainte de verificare.')
          }
          const updated = { ...entry, status: 'VERIFIED' as const, rowVersion: String(Number(entry.rowVersion) + 1) }
          replaceLedgerEntry(updated)
          audit(entry.pfaId, 'LedgerEntry', id, 'VERIFY', { status: entry.status }, { status: 'VERIFIED' }, null)
          return updated
        }),

      createManual: (pfaId, request) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const reason = requireReason(request.reason)
          const date = requireDate(request.date, 'Data')
          ensurePeriodOpen(pfaId, periodOf(date))
          if (!request.description.trim()) throw badRequest('DESCRIPTION_REQUIRED', 'Descrierea e obligatorie.')
          const entry = withDeductibility({
            id: nextId('led'),
            pfaId,
            date,
            documentLabel: request.documentLabel.trim() || 'Notă contabilă',
            sourceDocumentId: null,
            source: 'MANUAL',
            externalId: null,
            counterparty: request.counterparty,
            description: request.description.trim(),
            transactionType: request.transactionType,
            paymentMethod: request.paymentMethod,
            amount: request.amount,
            currency: 'RON',
            category: request.category,
            vehicleRelated: false,
            deductibilityType: null,
            deductiblePercent: null,
            deductibleAmount: null,
            deductibilityRule: null,
            status: 'VERIFIED',
            accountingPeriod: periodOf(date),
            closedPeriodFlag: false,
            rowVersion: '1',
          })
          db.ledger.push(entry)
          audit(pfaId, 'LedgerEntry', entry.id, 'CREATE_MANUAL', null, entry, reason)
          return entry
        }),

      uploadExpenseDocument: (pfaId, file) =>
        respond(async () => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const stored = await fileRefFrom(file, 'expdoc')
          const proposedMatch =
            db.ledger
              .filter(
                (entry) =>
                  entry.pfaId === pfaId &&
                  entry.transactionType === 'EXPENSE' &&
                  entry.paymentMethod === 'BANK' &&
                  !entry.sourceDocumentId &&
                  !isPeriodClosed(pfaId, entry.accountingPeriod),
              )
              .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
          audit(pfaId, 'ExpenseDocument', stored.id, 'UPLOAD', null, { fileName: stored.fileName }, null)
          return {
            documentId: stored.id,
            extracted: {
              merchant: proposedMatch?.counterparty ?? null,
              merchantCui: null,
              date: proposedMatch?.date ?? null,
              total: proposedMatch ? Math.abs(proposedMatch.amount) : null,
              items: proposedMatch ? [proposedMatch.description] : [],
            },
            proposedMatch,
          }
        }),

      uploadZReport: (pfaId, file) =>
        respond(async () => {
          const pfa = findPfa(pfaId)
          ensureWritable(pfa)
          const date = todayIso()
          if (pfa.cash.status !== 'ACTIVE' || !pfa.cash.activationDate || pfa.cash.activationDate > date) {
            throw conflict('CASH_NOT_ACTIVE', 'Rapoartele Z se pot încărca doar cu casa de marcat activă la data raportului.')
          }
          ensurePeriodOpen(pfaId, periodOf(date))
          const stored = await fileRefFrom(file, 'zreport')
          const lastNumber = Math.max(
            0,
            ...db.ledger
              .filter((entry) => entry.pfaId === pfaId && entry.source === 'CASH_Z')
              .map((entry) => Number(/(\d+)$/.exec(entry.documentLabel)?.[1] ?? 0)),
          )
          const zNumber = String(lastNumber + 1)
          const total = 250 + ((lastNumber * 37) % 200)
          const entry = withDeductibility({
            id: nextId('led'),
            pfaId,
            date,
            documentLabel: `Raport Z nr. ${zNumber}`,
            sourceDocumentId: stored.id,
            source: 'CASH_Z',
            externalId: `CASH_Z-${zNumber}`,
            counterparty: null,
            description: `Încasări numerar, raport Z nr. ${zNumber}`,
            transactionType: 'INCOME',
            paymentMethod: 'CASH',
            amount: total,
            currency: 'RON',
            category: null,
            vehicleRelated: false,
            deductibilityType: null,
            deductiblePercent: null,
            deductibleAmount: null,
            deductibilityRule: null,
            // Utilizatorul confirmă câmpurile extrase prin „Verifică”.
            status: 'NEEDS_REVIEW',
            accountingPeriod: periodOf(date),
            closedPeriodFlag: false,
            rowVersion: '1',
          })
          db.ledger.push(entry)
          audit(pfaId, 'ZReport', stored.id, 'UPLOAD', null, { date, zNumber, total }, null)
          return { extracted: { date, zNumber, total }, ledgerEntry: entry }
        }),
    },

    assets: {
      list: (pfaId) =>
        respond(() => {
          findPfa(pfaId)
          return db.assets.filter((asset) => asset.pfaId === pfaId).sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate))
        }),

      create: (pfaId, input) =>
        respond(() => {
          ensureWritable(findPfa(pfaId))
          validateAsset(input)
          const asset: Asset = { ...structuredClone(input), id: nextId('asset'), pfaId }
          db.assets.push(asset)
          audit(pfaId, 'Asset', asset.id, 'CREATE', null, asset, null)
          return asset
        }),

      update: (pfaId, id, input) =>
        respond(() => {
          ensureWritable(findPfa(pfaId))
          validateAsset(input)
          const index = db.assets.findIndex((asset) => asset.id === id && asset.pfaId === pfaId)
          if (index < 0) throw notFound('Activul')
          const before = db.assets[index]
          const after: Asset = { ...structuredClone(input), id, pfaId }
          db.assets[index] = after
          audit(pfaId, 'Asset', id, 'UPDATE', before, after, null)
          return after
        }),
    },

    registers: {
      getRjip: (pfaId, range) =>
        respond(() => {
          findPfa(pfaId)
          const rows = ledgerInRange(pfaId, range.from, range.to).map((entry) => {
            const value = Math.abs(entry.amount)
            const incoming = entry.amount > 0
            const cash = entry.paymentMethod === 'CASH'
            return {
              ledgerEntryId: entry.id,
              date: entry.date,
              document: entry.documentLabel,
              operation: entry.counterparty ? `${entry.description} – ${entry.counterparty}` : entry.description,
              cashIn: cash && incoming ? value : 0,
              cashOut: cash && !incoming ? value : 0,
              bankIn: !cash && incoming ? value : 0,
              bankOut: !cash && !incoming ? value : 0,
            }
          })
          const totals = new Map<Period, { cashIn: number; cashOut: number; bankIn: number; bankOut: number }>()
          rows.forEach((row) => {
            const period = periodOf(row.date)
            const total = totals.get(period) ?? { cashIn: 0, cashOut: 0, bankIn: 0, bankOut: 0 }
            totals.set(period, {
              cashIn: round2(total.cashIn + row.cashIn),
              cashOut: round2(total.cashOut + row.cashOut),
              bankIn: round2(total.bankIn + row.bankIn),
              bankOut: round2(total.bankOut + row.bankOut),
            })
          })
          return {
            pfaId,
            from: range.from,
            to: range.to,
            rows,
            monthTotals: [...totals.entries()].map(([period, total]) => ({ period, ...total })),
          }
        }),

      exportRjip: (pfaId, range, format) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          const rows = ledgerInRange(pfaId, range.from, range.to).map((entry) => {
            const value = formatAmount(Math.abs(entry.amount))
            const cash = entry.paymentMethod === 'CASH'
            const incoming = entry.amount > 0
            return [
              formatDate(entry.date),
              entry.documentLabel,
              entry.description,
              cash && incoming ? value : '',
              cash && !incoming ? value : '',
              !cash && incoming ? value : '',
              !cash && !incoming ? value : '',
            ]
          })
          return exportRows(
            `Registru-jurnal de încasări și plăți – ${pfa.name} (CUI ${pfa.cui}) – ${formatDate(range.from)}–${formatDate(range.to)}`,
            format,
            ['Data', 'Document', 'Felul operațiunii', 'Încasări numerar', 'Plăți numerar', 'Încasări bancă', 'Plăți bancă'],
            rows,
          )
        }),

      getRef: (pfaId, year) => respond(() => refView(findPfa(pfaId), year)),

      exportRef: (pfaId, year, format, asOf) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          const view = refView(pfa, year, asOf)
          const status = view.status === 'INTERMEDIATE' ? `situație intermediară la ${formatDate(view.asOf)}` : view.status === 'FINAL' ? 'final' : 'calcul curent'
          return exportRows(
            `Registrul de evidență fiscală ${year} – ${pfa.name} (CUI ${pfa.cui}) – ${status}`,
            format,
            ['An', 'Rectificare', 'Categoria venitului', 'Element de calcul', 'Valoare'],
            view.rows.map((row) => [row.year, row.rectification ? 'Da' : 'Nu', row.incomeCategory, row.calculationElement, formatAmount(row.value)]),
          )
        }),

      getInventory: (pfaId, year) => respond(() => ({ pfaId, year, assets: inventoryAssets(findPfa(pfaId).id, year) })),

      exportInventory: (pfaId, year, format) =>
        respond(() => {
          const pfa = findPfa(pfaId)
          return exportRows(
            `Registru-inventar ${year} – ${pfa.name} (CUI ${pfa.cui})`,
            format,
            ['Tip', 'Descriere', 'Data achiziției', 'Valoare', 'Status', 'Data ieșirii'],
            inventoryAssets(pfaId, year).map((asset) => [
              asset.type,
              asset.description,
              formatDate(asset.acquisitionDate),
              formatAmount(asset.acquisitionValue),
              asset.status === 'IN_USE' ? 'În folosință' : 'Ieșit',
              formatDate(asset.disposedDate),
            ]),
          )
        }),
    },

    periods: {
      list: (pfaId) =>
        respond((): AccountingPeriod[] => {
          findPfa(pfaId)
          return db.periods.filter((item) => item.pfaId === pfaId).sort((a, b) => b.period.localeCompare(a.period))
        }),

      close: (pfaId, period) =>
        respond(() => {
          ensureWritable(findPfa(pfaId))
          const item = db.periods.find((candidate) => candidate.pfaId === pfaId && candidate.period === period)
          if (!item) throw notFound('Perioada')
          if (item.status === 'CLOSED') throw conflict('PERIOD_CLOSED', `Perioada ${formatPeriod(period)} e deja închisă.`)
          item.status = 'CLOSED'
          item.closedBy = CURRENT_USER
          item.closedAt = nowIso()
          db.ledger = db.ledger.map((entry) =>
            entry.pfaId === pfaId && entry.accountingPeriod === period ? { ...entry, status: 'LOCKED' as const } : entry,
          )
          audit(pfaId, 'AccountingPeriod', `${pfaId}:${period}`, 'CLOSE', { status: 'OPEN' }, { status: 'CLOSED' }, null)
          return item
        }),

      createCorrection: (pfaId, period, request) =>
        respond(() => {
          ensureWritable(findPfa(pfaId))
          const reason = requireReason(request.reason, 'Motivul corecției')
          if (!isPeriodClosed(pfaId, period)) {
            throw badRequest('PERIOD_OPEN', `Perioada ${formatPeriod(period)} e deschisă; modifică direct tranzacția.`)
          }
          let ledgerEntryId: string | null = null
          if (request.ledgerEntryId) {
            const entry = findLedgerEntry(request.ledgerEntryId)
            if (entry.pfaId !== pfaId || entry.accountingPeriod !== period) {
              throw badRequest('ENTRY_OUTSIDE_PERIOD', 'Tranzacția nu aparține perioadei corectate.')
            }
            if (request.change.date && periodOf(String(request.change.date)) !== period) {
              throw badRequest('ENTRY_OUTSIDE_PERIOD', 'O corecție nu poate muta tranzacția în altă perioadă.')
            }
            const updated = { ...applyLedgerChange(entry, request.change), status: 'LOCKED' as const }
            replaceLedgerEntry(updated)
            audit(pfaId, 'LedgerEntry', entry.id, 'PERIOD_CORRECTION', entry, updated, reason)
            ledgerEntryId = entry.id
          }
          const correction = {
            id: nextId('correction'),
            pfaId,
            period,
            ledgerEntryId,
            change: structuredClone(request.change),
            reason,
            by: CURRENT_USER,
            at: nowIso(),
          }
          db.corrections.push(correction)
          audit(pfaId, 'PeriodCorrection', correction.id, 'CREATE', null, correction, reason)
          return correction
        }),
    },
  }
}
