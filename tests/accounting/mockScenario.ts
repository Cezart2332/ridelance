/**
 * Scenariul de acceptanță al fundației contabilității (spec F0), rulat headless pe mock:
 * fixtures → procesare (0 / 29 / 1) → confirmarea în bloc (27 / 2 / 1) → rezolvarea celor 3 excepții → generare → validare →
 * tranziții, recipisă, rectificativă → ledger / RJIP / REF (§5.3) → cash, setări, perioade.
 *
 * `npm run test:accounting` (bundle cu rolldown, apoi Node). Latența mock-ului e reală, deci
 * durează aproape un minut.
 */
import { createMockAccountingApi, resetMockAccountingDb } from '../../src/shared/accounting/api/mock/mockAccountingApi'
import { validateRomanianCIF } from '../../src/utils/validation'
import { formatLei, formatDate, formatValidity } from '../../src/shared/accounting/format'
import { availableOperations } from '../../src/shared/accounting/declarationWorkflow'

const api = createMockAccountingApi()
const P = '2026-08'
let failures = 0
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` (așteptat ${JSON.stringify(expected)})`}`)
}
async function waitJob(jobId: string) {
  let lastDone = -1
  const seen: number[] = []
  for (;;) {
    const job = await api.jobs.get(jobId)
    if (job.progress.done !== lastDone) seen.push(job.progress.done)
    lastDone = job.progress.done
    if (job.status === 'COMPLETED' || job.status === 'FAILED') return { job, seen }
  }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  expect('format lei', formatLei(1234.56), '1.234,56 lei')
  expect('format date', formatDate('2026-10-10'), '10.10.2026')
  expect('format validity', formatValidity('2027-07-01', null), 'de la 01.07.2027')

  const all = await api.pfas.list()
  expect('total PFA', all.length, 32)
  expect('inactive', (await api.pfas.list({ status: 'inactive' })).map((p) => p.name), ['Cristian Vasile', 'Elena Marin'])
  expect('CUI valide', all.every((p) => validateRomanianCIF(p.cui) === true), true)
  expect('cash ACTIVE', all.filter((p) => p.cashStatus === 'ACTIVE').map((p) => p.name), ['Andrei Dumitrescu'])
  expect('search diacritics', (await api.pfas.list({ search: 'razvan' })).map((p) => p.name), ['Răzvan Ene'])

  let overview = await api.months.getOverview(P)
  expect('overview initial', overview.stats, { total: 30, ready: 0, needsReview: 0, missingDocuments: 0, notProcessed: 30 })

  const processed = await waitJob((await api.months.process(P)).jobId)
  expect('process job progress grows', processed.seen.length > 2, true)
  overview = await api.months.getOverview(P)
  expect('overview after process', overview.stats, { total: 30, ready: 0, needsReview: 29, missingDocuments: 1, notProcessed: 0 })
  const clean = await api.months.confirmCleanDocuments(P)
  expect('confirmare în bloc', [clean.confirmed.length, clean.skipped.length], [30 * 4 - 3 * 2 - 1 - 2, 0])
  overview = await api.months.getOverview(P)
  expect('overview after bulk confirm', overview.stats, { total: 30, ready: 27, needsReview: 2, missingDocuments: 1, notProcessed: 0 })
  for (const row of overview.rows.filter((r) => r.status !== 'READY')) console.log('     ', row.pfaName, row.status, '→', row.blockingReasons[0])

  const ion = overview.rows.find((r) => r.pfaName === 'Ion Popescu')!
  expect('Ion preview', [ion.declarations.D100.amount, ion.declarations.D301.amount, ion.declarations.D390.amount], [20, 336, 0])
  expect('Ion bolt/uber', [ion.bolt, ion.uber], [{ income: 8000, commission: 1000 }, { income: 5000, commission: 600 }])

  // Bogdan: suma citită greșit
  const bogdan = overview.rows.find((r) => r.pfaName === 'Bogdan Matei')!
  const bogdanDocs = await api.documents.list(bogdan.pfaId, P)
  const bogdanInvoice = bogdanDocs.find((d) => d.status === 'NEEDS_REVIEW')!
  let detail = await api.documents.get(bogdanInvoice.id)
  expect('Bogdan check', detail.checks.filter((c) => !c.passed).map((c) => c.code), ['AMOUNT_IN_TEXT'])
  console.log('      ', detail.checks.find((c) => !c.passed)!.message)
  try {
    await api.documents.confirm(bogdanInvoice.id)
    expect('confirm cu verificare picată', 'accepted', '409')
  } catch (e) {
    expect('confirm cu verificare picată', (e as { status: number }).status, 409)
  }
  try {
    await api.documents.updateExtraction(bogdanInvoice.id, { fields: { commissionAmount: 1248.5, amount: 1248.5 }, reason: '' })
  } catch (e) {
    expect('edit fără motiv', (e as { status: number }).status, 400)
  }
  detail = await api.documents.updateExtraction(bogdanInvoice.id, { fields: { commissionAmount: 1248.5, amount: 1248.5 }, reason: 'Suma corectă e 1.248,50 conform PDF.' })
  expect('Bogdan after edit', [detail.status, detail.extraction!.manuallyEditedFields], ['PENDING_CONFIRMATION', ['commissionAmount', 'amount']])
  const bulk = await api.documents.confirmBulk({ ids: [bogdanInvoice.id, 'nope'] })
  expect('bulk confirm', [bulk.confirmed.length, bulk.skipped.length], [1, 1])

  // Răzvan: furnizor necunoscut → adaugă în registru
  const razvan = overview.rows.find((r) => r.pfaName === 'Răzvan Ene')!
  const razvanInvoice = (await api.documents.list(razvan.pfaId, P)).find((d) => d.status === 'NEEDS_REVIEW')!
  detail = await api.documents.get(razvanInvoice.id)
  expect('Răzvan check', detail.checks.filter((c) => !c.passed).map((c) => [c.code, c.action]), [['SUPPLIER_KNOWN', 'ADD_SUPPLIER']])
  try {
    await api.rules.suppliers.create({ supplierName: 'Uber B.V.', country: 'NL', vatId: 'NL852071588B01', incomeType: 'COMMISSION', treaty: null, d100Rate: 1, d100RateConfirmed: false, validFrom: '2026-01-01', validTo: null, residenceCertValidFrom: null, residenceCertValidTo: null, residenceCertFile: null, note: null })
  } catch (e) {
    expect('overlap refuzat', (e as { status: number }).status, 409)
  }
  await api.rules.suppliers.create({ supplierName: 'Uber B.V. (sucursală)', country: 'NL', vatId: 'NL001234567B01', incomeType: 'COMMISSION', treaty: 'Convenția RO–NL', d100Rate: 0, d100RateConfirmed: true, validFrom: '2026-01-01', validTo: null, residenceCertValidFrom: '2026-01-01', residenceCertValidTo: '2026-12-31', residenceCertFile: null, note: null })
  detail = await api.documents.get(razvanInvoice.id)
  expect('Răzvan after supplier', detail.status, 'PENDING_CONFIRMATION')
  await api.documents.confirm(razvanInvoice.id)

  // George: încarcă factura Uber lipsă
  const george = overview.rows.find((r) => r.pfaName === 'George Stan')!
  const uploaded = await api.documents.upload(george.pfaId, { file: new File(['%PDF george uber'], 'Uber_factura_comision_august.pdf', { type: 'application/pdf' }), period: P })
  expect('upload status', uploaded.status, 'EXTRACTING')
  try {
    await api.documents.upload(george.pfaId, { file: new File(['%PDF george uber'], 'copie.pdf'), period: P })
  } catch (e) {
    expect('upload duplicat', [(e as { status: number }).status, !!(e as { details: { existingDocumentId: string } }).details.existingDocumentId], [409, true])
  }
  await sleep(3200)
  detail = await api.documents.get(uploaded.id)
  expect('George extracted', [detail.status, detail.platform, detail.documentType], ['PENDING_CONFIRMATION', 'UBER', 'COMMISSION_INVOICE'])
  await api.documents.confirm(uploaded.id)

  overview = await api.months.getOverview(P)
  expect('overview resolved', overview.stats, { total: 30, ready: 30, needsReview: 0, missingDocuments: 0, notProcessed: 0 })

  const generated = await waitJob((await api.months.generate(P)).jobId)
  expect('generate job', [generated.job.results.length, generated.job.errors.length], [30, 0])
  const again = await waitJob((await api.months.generate(P)).jobId)
  expect('generate idempotent', again.job.progress.total, 0)

  const ionDecl = await api.declarations.list(ion.pfaId, P)
  expect('Ion declarații', ionDecl.map((d) => [d.type, d.status, d.amount]), [['D100', 'GENERATED', 20], ['D301', 'GENERATED', 336], ['D390', 'GENERATED', 0]])
  const d100 = await api.declarations.getBreakdown(ionDecl[0].currentVersionId!)
  console.log('      D100:', d100.lines.map((l) => `${l.explanation}${l.warning ? ' ⚠ ' + l.warning : ''}`).join(' | '))
  const d301 = await api.declarations.getBreakdown(ionDecl[1].currentVersionId!)
  console.log('      D301:', d301.lines.map((l) => l.explanation).join(' | '), '| venituri excluse', d301.excludedRideIncome)
  const d390 = await api.declarations.getBreakdown(ionDecl[2].currentVersionId!)
  console.log('      D390:', d390.lines.map((l) => l.explanation).join(' | '))

  const vlad = overview.rows.find((r) => r.pfaName === 'Vlad Constantin')!
  const vladD301 = (await api.declarations.list(vlad.pfaId, P))[1]
  const vladBreak = await api.declarations.getBreakdown(vladD301.currentVersionId!)
  console.log('      Vlad EUR D301:', vladBreak.lines.map((l) => l.explanation).join(' | '))

  const validated = await waitJob((await api.months.validate(P)).jobId)
  expect('validate job', [validated.job.results.length, validated.job.errors.length], [29, 1])
  const nicoleta = overview.rows.find((r) => r.pfaName === 'Nicoleta Radu')!
  const nd = await api.declarations.list(nicoleta.pfaId, P)
  expect('Nicoleta D301', nd[1].status, 'VALIDATION_FAILED')
  const validation = await api.declarations.getValidation(nd[1].currentVersionId!)
  console.log('      ', validation!.levels.map((l) => `${l.level}:${l.passed}`).join(' '), validation!.levels[1].messages[0]?.text)
  expect('ops VALIDATION_FAILED', availableOperations('VALIDATION_FAILED'), ['REGENERATE'])
  await api.declarations.transition(nd[1].currentVersionId!, { action: 'REGENERATE' })
  const v = await api.declarations.transition(nd[1].currentVersionId!, { action: 'VALIDATE' })
  expect('Nicoleta after regenerate+validate', v.status, 'READY_TO_SIGN')

  // Tranziții pe D301 Ion
  const vid = ionDecl[1].currentVersionId!
  try {
    await api.declarations.transition(vid, { action: 'MARK_SUBMITTED' })
  } catch (e) {
    expect('tranziție invalidă', (e as { status: number }).status, 409)
  }
  await api.declarations.transition(vid, { action: 'MARK_SIGNED' })
  await api.declarations.transition(vid, { action: 'MARK_SUBMITTED' })
  const ionInvoiceId = d301.lines[0].sourceDocumentId
  expect('doc locked după submit', (await api.documents.get(ionInvoiceId)).status, 'LOCKED')
  const accepted = await api.declarations.uploadReceipt(vid, { file: new File(['recipisa'], 'recipisa.pdf'), receiptNumber: 'INTERNT-123' })
  expect('accepted', accepted.status, 'ACCEPTED')
  const rect = await api.declarations.createRectification(ionDecl[1].declarationId!, { reason: 'Corecție comision Uber' })
  expect('rectificativă', [rect.versionNo, rect.kind, rect.status], [2, 'RECTIFICATIVE', 'GENERATED'])
  const full = await api.declarations.get(ionDecl[1].declarationId!)
  expect('v1 neschimbată', full.versions.map((x) => [x.versionNo, x.status]), [[1, 'ACCEPTED'], [2, 'GENERATED']])
  const docAfterRect = await api.documents.get(ionInvoiceId)
  expect('doc deblocat de rectificativă', [docAfterRect.status, docAfterRect.includedIn.length], ['CONFIRMED', 4])
  console.log('      XML:', (await api.declarations.getXml(rect.id)).split('\n')[1])

  // Ledger / RJIP / REF — Andrei, 10.10.2026
  const andrei = all.find((p) => p.name === 'Andrei Dumitrescu')!
  const day = await api.ledger.list(andrei.id, { from: '2026-10-10', to: '2026-10-10' })
  expect('ledger 10.10', day.items.map((e) => [e.description, e.amount, e.paymentMethod, e.deductibleAmount]).sort(), [
    ['Combustibil', -300, 'BANK', 300],
    ['Payout Bolt', 1850, 'BANK', null],
    ['Încasări numerar, raport Z nr. 125', 420, 'CASH', null],
  ].sort())
  const rjip = await api.registers.getRjip(andrei.id, { from: '2026-10-10', to: '2026-10-10' })
  expect('RJIP 10.10', rjip.rows.map((r) => [r.cashIn, r.cashOut, r.bankIn, r.bankOut]).sort(), [[0, 0, 0, 300], [0, 0, 1850, 0], [420, 0, 0, 0]].sort())
  const ref = await api.registers.getRef(andrei.id, 2026)
  console.log('      REF 2026 Andrei:', ref.status, ref.rows.map((r) => `${r.calculationElement}=${r.value}`).join(', '))

  // Mihai: 50% → 100% din 01.09.2026 (service 1.000 în aug și sept)
  const mihai = all.find((p) => p.name === 'Mihai Ionescu')!
  const services = (await api.ledger.list(mihai.id, { pageSize: 100 })).items.filter((e) => e.category === 'CAR_SERVICE')
  expect('Mihai deductibil', services.map((e) => [e.date, e.deductibleAmount]).sort(), [['2026-08-28', 500], ['2026-09-15', 1000]])

  // Z report upload
  const z = await api.ledger.uploadZReport(andrei.id, new File(['z'], 'z.pdf'))
  expect('Z upload', [z.ledgerEntry.source, z.ledgerEntry.paymentMethod, z.extracted.zNumber], ['CASH_Z', 'CASH', '126'])
  try {
    await api.ledger.uploadZReport(ion.pfaId, new File(['z2'], 'z.pdf'))
  } catch (e) {
    expect('Z fără cash activ', (e as { status: number }).status, 409)
  }

  // Cash: nu poate sări peste verificare
  const florin = all.find((p) => p.name === 'Florin Munteanu')!
  try {
    await api.pfas.transitionCash(florin.id, { to: 'ACTIVE', note: 'x', evidenceDocumentId: 'f' })
  } catch (e) {
    expect('cash skip verificare', (e as { status: number }).status, 409)
  }
  await api.pfas.transitionCash(florin.id, { to: 'IN_VERIFICATION', note: 'Dosar primit' })
  try {
    await api.pfas.transitionCash(florin.id, { to: 'ACTIVE', note: 'ok' })
  } catch (e) {
    expect('cash fără dovadă', (e as { status: number }).status, 400)
  }
  try {
    await api.pfas.transitionCash(florin.id, { to: 'ACTIVE', note: 'ok', evidenceDocumentId: 'inexistent' })
  } catch (e) {
    expect('cash cu dovadă neîncărcată', (e as { status: number }).status, 400)
  }
  const evidence = await api.pfas.uploadCashEvidence(florin.id, new File(['fiscalizare'], 'fiscalizare.pdf'))
  const cash = await api.pfas.transitionCash(florin.id, { to: 'ACTIVE', note: 'ok', evidenceDocumentId: evidence.documentId })
  expect('cash activ', [cash.status, cash.verifiedBy?.name], ['ACTIVE', 'Contabil RIDElance'])

  // Setări append-only
  const s = await api.pfas.updateSettings(ion.pfaId, { field: 'vehicle_deductibility', value: '100_PERCENT', validFrom: '2026-10-01', note: 'Foi de parcurs' })
  expect('istoric deductibilitate', s.history.filter((h) => h.key === 'vehicle_deductibility').map((h) => [h.value, h.validFrom, h.validTo]), [['50_PERCENT', '2026-01-01', '2026-09-30'], ['100_PERCENT', '2026-10-01', null]])

  // Inactiv
  const cristian = all.find((p) => p.name === 'Cristian Vasile')!
  const cs = await api.pfas.getSummary(cristian.id)
  expect('retenție', [cs.readOnly, cs.retentionUntil], [true, '2032-06-30'])
  try {
    await api.pfas.updateSettings(cristian.id, { field: 'art317', value: false, validFrom: '2026-07-01', note: 'x' })
  } catch (e) {
    expect('inactiv read-only', (e as { status: number }).status, 409)
  }
  const handover = await waitJob((await api.pfas.createHandoverPackage(cristian.id)).jobId)
  expect('dosar predare', handover.job.file?.fileName, `RIDElance_PFA_${cristian.cui}_2026.zip`)

  // Perioade
  await api.periods.close(mihai.id, '2026-08')
  const locked = (await api.ledger.list(mihai.id, { from: '2026-08-01', to: '2026-08-31' })).items
  expect('lună închisă → LOCKED', locked.every((e) => e.status === 'LOCKED'), true)
  try {
    await api.ledger.update(locked[0].id, { fields: { description: 'x' }, reason: 'y' })
  } catch (e) {
    expect('edit în lună închisă', (e as { status: number }).status, 409)
  }
  const corr = await api.periods.createCorrection(mihai.id, '2026-08', { ledgerEntryId: locked[0].id, change: { description: 'Corectat' }, reason: 'Descriere greșită' })
  expect('corecție controlată', corr.ledgerEntryId, locked[0].id)
  const auditLog = await api.pfas.getAudit(mihai.id)
  expect('audit are corecția', auditLog.some((a) => a.action === 'PERIOD_CORRECTION' && a.reason === 'Descriere greșită'), true)

  // Decizii pct. 2: o cotă D100 neconfirmată blochează luna.
  resetMockAccountingDb()
  const uber = (await api.rules.suppliers.list()).find((item) => item.vatId === 'NL852071588B01')!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _uberId, ...uberInput } = uber
  await api.rules.suppliers.update(uber.id, { ...uberInput, d100Rate: null, d100RateConfirmed: false })
  await waitJob((await api.months.process(P)).jobId)
  await api.months.confirmCleanDocuments(P)
  const blocked = (await api.months.getOverview(P)).rows.find((row) => row.pfaName === 'Ion Popescu')!
  expect('D100 neconfirmat blochează', [blocked.status, blocked.blockingReasons[0]], ['NEEDS_REVIEW', 'Cota D100 pentru Uber B.V. nu e confirmată.'])
  const boltOnly = (await api.months.getOverview(P)).rows.find((row) => row.pfaName === 'Adrian Stoica')!
  expect('PFA doar Bolt neafectat', boltOnly.status, 'READY')

  console.log(failures === 0 ? '\nTOATE VERIFICĂRILE AU TRECUT' : `\n${failures} VERIFICĂRI PICATE`)
  process.exit(failures === 0 ? 0 : 1)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
