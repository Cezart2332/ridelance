import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

/**
 * Scenariile de acceptanță ale contabilității pe API-ul real (spec B9), cu seed-ul
 * `AccountingE2ESeed` (fixtures, august 2026): procesarea lunii și excepțiile, declarațiile până la
 * rectificativă (D301 al lui Ion) și exportul RJIP. Rulează în ordine: fiecare scenariu pornește din
 * starea lăsată de cel dinainte.
 */

const EMAIL = process.env.E2E_ACCOUNTANT_EMAIL ?? 'contabil.e2e@ridelance.test'
const PASSWORD = process.env.E2E_ACCOUNTANT_PASSWORD ?? 'E2e-Contabil-2026!'
const MONTH = '/contabil?tab=declaratii&luna=2026-08'

test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/autentificare')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Parolă').fill(PASSWORD)
  await page.getByRole('button', { name: 'Intră în RIDElance' }).click()
  await page.waitForURL(/\/contabil/)
}

/**
 * Navigare în aplicație, fără reîncărcarea paginii: tokenul de acces stă doar în memorie, iar o
 * reîncărcare ar depinde de reîmprospătarea lui prin cookie.
 */
async function open(page: Page, url: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, url)
}

/** Rândul unui PFA (luna fiscală sau „Clienți PFA”): se deschide ca link spre profilul clientului. */
function pfa(page: Page, name: string) {
  return page.getByRole('link', { name: `Deschide dosarul ${name}` })
}

function stat(page: Page, label: string) {
  return page.getByRole('button', { name: new RegExp(`^${label}`) })
}

test('luna fiscală: procesarea și rezolvarea excepțiilor', async ({ page }) => {
  await login(page)
  await open(page, MONTH)
  await expect(page.getByText('Declarații · august 2026')).toBeVisible()
  await expect(stat(page, 'Neprocesate')).toContainText('4')

  await page.getByRole('button', { name: 'Procesează luna' }).click()
  await expect(page.getByText('Finalizat')).toBeVisible()
  await expect(stat(page, 'Necesită verificare')).toContainText('3')
  await expect(stat(page, 'Document lipsă')).toContainText('1')

  // Excepția 1: documentele verificate care așteaptă doar confirmarea (Ion, Ana).
  await page.getByRole('button', { name: 'Confirmă documentele fără probleme' }).click()
  await expect(stat(page, 'Gata')).toContainText('2')

  // Excepția 2: factura Bolt a lui Bogdan, citită greșit — corectată manual, cu motiv, apoi confirmată.
  await pfa(page, 'MATEI BOGDAN PFA').click()
  await page.getByRole('button', { name: 'Verifică' }).click()
  const review = page.getByRole('dialog')
  await expect(review).toContainText('Suma 1.284,50 (comision) nu apare în textul documentului.')
  await review.getByRole('button', { name: 'Modifică' }).click()
  await review.getByLabel('Comision').fill('1.248,50')
  await review.getByLabel('Total factură').fill('1.248,50')
  await review.getByLabel('Motivul modificării (obligatoriu)').fill('Suma din PDF e 1.248,50')
  await review.getByRole('button', { name: 'Salvează' }).click()
  await expect(review).toContainText('Toate sumele citite apar în textul documentului.')
  await review.getByRole('button', { name: 'Confirmă' }).click()
  await expect(review).toContainText('Confirmat')
  await review.getByRole('button', { name: 'Închide' }).click()
  await expect(page.getByText('Gata · august 2026')).toBeVisible()

  // Excepția 3: lui George îi lipsește factura Uber. Încărcarea ei trece prin citirea AI, oprită
  // în e2e: luna o arată ca document lipsă, cu motivul.
  await open(page, MONTH)
  await expect(stat(page, 'Gata')).toContainText('3')
  await expect(pfa(page, 'STAN GEORGE PFA')).toContainText('Lipsește factura de comision Uber.')
})

test('declarații: generare, validare pe 3 niveluri, recipisă și rectificativă', async ({ page }) => {
  await login(page)
  await open(page, MONTH)
  await page.getByRole('button', { name: 'Generează declarațiile' }).click()
  await expect(page.getByText('Generarea declarațiilor')).toBeVisible()
  await expect(page.getByText('Finalizat')).toBeVisible()
  const ion = pfa(page, 'POPESCU ION PFA')
  await expect(ion).toContainText('Draft automat')
  // Cazul de referință (spec §5.1): D100 = 20, D301 = 336, D390 = 0.
  await expect(ion).toContainText('20,00 lei')
  await expect(ion).toContainText('336,00 lei')
  await ion.click()

  const d301 = page.getByRole('region', { name: 'D301 – decont special TVA' })
  await expect(d301).toContainText('Draft automat')
  await d301.getByRole('button', { name: 'Validează' }).click()
  // RIDElance + XSD + validatorul ANAF (serviciul Java): PDF-ul DUKIntegrator e gata de semnat.
  await expect(d301).toContainText('Pregătit pentru depunere', { timeout: 60_000 })

  await d301.getByRole('button', { name: 'Marchează semnat' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Marchează semnat' }).click()
  await expect(d301.getByRole('button', { name: 'Marchează depus' })).toBeVisible()
  await d301.getByRole('button', { name: 'Marchează depus' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Marchează depus' }).click()
  await expect(d301).toContainText('Depus nu înseamnă acceptat. Se așteaptă recipisa.')

  await d301.getByRole('button', { name: 'Încarcă recipisa' }).click()
  const receipt = page.getByRole('dialog')
  await receipt.locator('input[type=file]').setInputFiles({ name: 'recipisa-d301.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 recipisa') })
  await receipt.getByLabel('Număr recipisă (opțional)').fill('INTERNT-123')
  await receipt.getByRole('button', { name: 'Încarcă' }).click()
  await expect(d301).toContainText('Recipisa nr. INTERNT-123')

  await d301.getByRole('button', { name: 'Creează rectificativă' }).click()
  const rectification = page.getByRole('dialog')
  await rectification.getByLabel('Motivul rectificativei (obligatoriu)').fill('Comision Bolt corectat')
  await rectification.getByRole('button', { name: 'Creează rectificativa' }).click()
  await expect(d301).toContainText('v2 · Rectificativă')
  await expect(d301.getByRole('button', { name: 'Istoric versiuni (2)' })).toBeVisible()
})

test('dosar: setări, casa de marcat, reguli fiscale, predare și inactivare', async ({ page }) => {
  await login(page)

  // F5: o setare nouă se adaugă în istoric, cu „Valabil de la”; cea veche rămâne.
  await open(page, '/contabil?tab=clienti')
  await pfa(page, 'GEORGESCU ANA PFA').click()
  await page.getByRole('tab', { name: 'Setări' }).click()
  // Un singur rând pentru art. 317: codul (separat de CUI) decide și regimul.
  await expect(page.getByText('RO41000075, din 01.09.2025')).toBeVisible()
  await page.getByRole('button', { name: 'Modifică' }).nth(2).click()
  const setting = page.getByRole('dialog')
  await setting.getByRole('combobox').click()
  await page.getByRole('option', { name: '50%' }).click()
  await setting.getByLabel('Valabil de la').fill('2026-10-01')
  await setting.getByLabel('Observație / justificare (obligatoriu)').fill('Utilizare mixtă din octombrie')
  await setting.getByRole('button', { name: 'Salvează' }).click()
  await expect(page.getByText('de la 01.10.2026: 50%')).toBeVisible()
  await expect(page.getByText('01.01.2026–30.09.2026: 100%')).toBeVisible()

  // F7: casa de marcat trece prin verificare; activarea cere dovada de fiscalizare.
  await page.getByRole('button', { name: 'Pornește verificarea' }).click()
  await page.getByRole('dialog').getByLabel('Notă (obligatoriu)').fill('Clientul a cerut numerar')
  await page.getByRole('dialog').getByRole('button', { name: 'Trece în verificare' }).click()
  await page.getByRole('button', { name: 'Activează numerarul', exact: true }).click()
  const activation = page.getByRole('dialog')
  await expect(activation.getByRole('button', { name: 'Activează', exact: true })).toBeDisabled()
  await activation.locator('input[type=file]').setInputFiles({ name: 'fiscalizare.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 dovada') })
  await activation.getByLabel('Notă (obligatoriu)').fill('Verificat în SPV')
  await activation.getByRole('button', { name: 'Activează', exact: true }).click()
  await expect(page.getByText('fiscalizare.pdf')).toBeVisible()
  await expect(page.getByText('Contabil E2E').first()).toBeVisible()

  // F5: reguli fiscale fără ștergere; o categorie nouă de cheltuieli.
  await open(page, '/contabil?tab=reguli')
  await page.getByRole('tab', { name: 'Categorii cheltuieli' }).click()
  const categories = page.getByRole('region', { name: 'Categorii de cheltuieli' })
  await categories.getByRole('button', { name: 'Adaugă' }).click()
  const rule = page.getByRole('dialog')
  await rule.getByLabel('Cod categorie').fill('PARKING')
  await rule.getByLabel('Denumire').fill('Parcare')
  await rule.getByLabel('Contrapartidă (regex) (opțional)').fill('PARCARE|PARKING')
  await rule.getByRole('button', { name: 'Salvează' }).click()
  await expect(categories).toContainText('Parcare (PARKING)')

  // F7: dosarul de predare al lui Ion (job, apoi arhiva).
  await open(page, '/contabil?tab=clienti')
  await pfa(page, 'POPESCU ION PFA').click()
  await page.getByRole('button', { name: 'Mai multe acțiuni' }).click()
  await page.getByRole('menuitem', { name: 'Generează dosar de predare' }).click()
  const handover = page.getByRole('dialog')
  await handover.getByRole('button', { name: 'Generează dosarul' }).click()
  const archive = page.waitForEvent('download')
  await handover.getByRole('button', { name: 'Descarcă arhiva' }).click()
  expect((await archive).suggestedFilename()).toMatch(/^RIDElance_PFA_12345674_\d{4}\.zip$/)
  await handover.getByRole('button', { name: 'Închide' }).click()

  // F7: inactivarea lui George: dosar read-only, cu termenul de păstrare.
  await open(page, '/contabil?tab=clienti')
  await pfa(page, 'STAN GEORGE PFA').click()
  await page.getByRole('button', { name: 'Mai multe acțiuni' }).click()
  await page.getByRole('menuitem', { name: 'Inactivează PFA' }).click()
  const deactivate = page.getByRole('dialog')
  await deactivate.getByLabel('Sfârșitul perioadei contabile').fill('2026-08-31')
  await deactivate.getByRole('button', { name: 'Inactivează', exact: true }).click()
  await expect(page.getByText('Păstrare obligatorie până la 30.06.2032.', { exact: false })).toBeVisible()
})

test('registre: exportul RJIP', async ({ page }) => {
  await login(page)
  await open(page, MONTH)
  await pfa(page, 'POPESCU ION PFA').click()
  await page.getByRole('tab', { name: 'Registre' }).click()

  // „O zi în RIDElance” (spec §5.3), din ledger-ul importat din bancă.
  await expect(page.getByRole('row', { name: /Payout saptamana 40/ })).toContainText('1.850,00')
  await expect(page.getByRole('row', { name: /Plata card OMV Petrom Brasov/ })).toContainText('300,00')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export PDF' }).first().click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^RJIP_12345674_.+\.pdf$/)
  // PDF-ul generat de backend (QuestPDF), nu exportul simulat al mock-ului.
  expect(readFileSync(await file.path()).subarray(0, 4).toString()).toBe('%PDF')
})

test('Clienți PFA: lista, profilul și spațiul de lucru unite', async ({ page }) => {
  await login(page)
  await open(page, '/contabil?tab=clienti')
  const rows = page.getByRole('link', { name: /^Deschide dosarul / })
  await expect(rows).toHaveCount(4)
  await page.getByLabel('Caută client').fill('popescu')
  await expect(rows).toHaveCount(1)

  await pfa(page, 'POPESCU ION PFA').click()
  await expect(page.getByText('CUI 12345674')).toBeVisible()
  await expect(page.getByText('Ion.Popescu.e2e@ridelance.test')).toBeVisible()

  // Venituri și notele vin din spațiul de lucru vechi al contabilului, acum în același profil.
  await page.getByRole('tab', { name: 'Venituri' }).click()
  await expect(page.getByRole('button', { name: 'Marchează ca procesat' })).toBeVisible()
  await page.getByRole('tab', { name: 'Istoric' }).click()
  await page.getByPlaceholder('Notă vizibilă doar contabililor').fill('Extras verificat')
  await page.getByRole('button', { name: 'Adaugă notă' }).click()
  await expect(page.getByText('Extras verificat')).toBeVisible()
})
