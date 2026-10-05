// Capturi ale panourilor Admin/Contabil pe backend-ul e2e local (5080 + 5175), pentru verificarea
// redesign-ului: un PNG pe secțiune, în tema închisă (sau `PANEL_THEME=light`).
//
//   node tests/responsive/panel-shots.mjs admin [tab1,tab2]
//   PANEL_CLIENT=first: secțiunile fișei primului client, fără modificarea datelor lui.
//
// Conturile sunt cele din seed-ul e2e (backend/tests/UnitTests/Accounting/AccountingE2ESeed.cs).
import { chromium, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { totp } from '../totp.mjs'

const role = process.argv[2] ?? 'admin'
const only = process.argv[3]?.split(',')
const theme = process.env.PANEL_THEME ?? 'dark'
const width = Number(process.env.PANEL_WIDTH ?? 1440)
const clientSections = process.env.PANEL_CLIENT === 'first'
const base = 'http://localhost:5175'
const accounts = {
  admin: { email: 'admin.e2e@ridelance.test', password: 'E2e-Admin-2026!', path: '/admin' },
  contabil: { email: 'contabil.e2e@ridelance.test', password: 'E2e-Contabil-2026!', path: '/contabil' },
}
const tabs = {
  admin: ['overview', 'pfa', 'pfa_inrolate', 'srl_inrolate', 'chat', 'sarcini', 'contab_azi', 'contab_pfa', 'contab_declaratii', 'contab_cod_tva', 'contab_anaf', 'contab_reguli', 'masini', 'pagini_firme', 'servicii', 'asigurari', 'eldrive', 'facturare', 'reduceri', 'calendar', 'contabili', 'notificari'],
  contabil: ['azi', 'clienti', 'declaratii', 'cod-tva', 'reguli', 'notificari'],
}
const account = accounts[role]
const out = `test-results/panel/${role}-${theme}-${width}`
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: process.env.PANEL_BROWSER ?? 'msedge' })
const page = await browser.newPage({ viewport: { width, height: 900 } })
let renderingFailed = false
page.on('pageerror', (error) => console.error(`Eroare în pagină: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
    renderingFailed = true
    console.error(message.text())
  }
})
await page.addInitScript((value) => { if (location.protocol === 'http:' || location.protocol === 'https:') window.localStorage.setItem('rl-panel-theme', value) }, theme)
await page.goto(`${base}/autentificare`)
await page.getByPlaceholder('Email').fill(account.email)
await page.getByPlaceholder('Parola').fill(account.password)
await page.keyboard.press('Enter')
await page.getByLabel('Cod de autentificare').fill(totp())
await page.keyboard.press('Enter')
await page.waitForURL(`**${account.path}**`)
let clientId
if (clientSections) {
  await page.goto(`${base}${account.path}?tab=${role === 'admin' ? 'contab_pfa' : 'clienti'}`)
  await expect(page.getByRole('heading', { name: 'Clienți PFA', exact: true })).toBeVisible({ timeout: 45_000 })
  await page.screenshot({ path: `${out}/clients-before-open.png`, fullPage: true })
  await page.getByRole('link', { name: /Deschide dosarul/ }).first().click()
  await page.waitForURL('**pfa=**')
  clientId = new URL(page.url()).searchParams.get('pfa')
}
for (const tab of only ?? (clientSections ? ['luna', 'banca', 'cheltuieli', 'registre', 'anual', 'mesaje', 'anaf', 'setari', 'istoric'] : tabs[role])) {
  const query = clientSections ? `tab=${role === 'admin' ? 'contab_pfa' : 'clienti'}&pfa=${encodeURIComponent(clientId)}&sectiune=${tab}` : `tab=${tab}`
  await page.goto(`${base}${account.path}?${query}`)
  await page.waitForTimeout(2500)
  await expect(page.getByRole('progressbar')).toHaveCount(0, { timeout: 20_000 })
  await page.screenshot({ path: `${out}/${clientSections ? 'client-' : ''}${tab}.png`, fullPage: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  console.log(`${tab}${overflow ? '  ⚠ scroll orizontal' : ''}`)
}
await browser.close()
if (renderingFailed) process.exitCode = 1
