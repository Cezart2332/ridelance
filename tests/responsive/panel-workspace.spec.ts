import { expect, test, type Page } from '@playwright/test'

const clients = [
  { pfaId: 'ana', userId: 'ana', name: 'ANA IONESCU PFA', cui: '11111111', email: 'ana@example.test' },
  { pfaId: 'bogdan', userId: 'bogdan', name: 'BOGDAN MARIN PFA', cui: '22222222', email: 'bogdan@example.test' },
  { pfaId: 'cezar', userId: 'cezar', name: 'CEZAR POPESCU PFA', cui: '33333333', email: 'cezar@example.test' },
].map((client) => ({ ...client, stage: 'ACTIVE', monthStatus: 'NOT_PROCESSED', reason: null, declarations: {}, bankStatus: null, unreadMessages: 0 }))

const fiscal = {
  year: 2026,
  thresholds: { cas12: 48600, cas24: 97200, cassMin: 24300, cassMax: 291600, vatArt310: 395000 },
  rows: clients.map((client, index) => ({ pfaId: client.pfaId, profileStatus: 'COMPLETED', profileLabel: 'Standard', asOf: '2026-09-30', stale: false, grossIncome: index === 2 ? null : index === 0 ? 25000 : 10000, expenses: 2000, netIncome: index === 2 ? null : index === 0 ? 23000 : 8000, cas: 0, cass: 2300, incomeTax: 2070, totalTaxes: 4370 })),
}

async function mock(page: Page, role: 'Admin' | 'Contabil') {
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Operator', lastName: role, role } }))
  await page.route('**/notifications', (route) => route.fulfill({ json: [] }))
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) => route.fulfill({ json: { items: [] } }))
  await page.route(/\/accounting\/clients(\?.*)?$/, (route) => route.fulfill({ json: clients }))
  await page.route('**/accounting/platform-inbox', (route) => route.fulfill({ json: [] }))
  await page.route('**/accounting/fiscal-overview?*', (route) => route.fulfill({ json: fiscal }))
}

for (const role of ['Admin', 'Contabil'] as const) {
  const url = role === 'Admin' ? '/admin?tab=contab_pfa' : '/contabil?tab=clienti'

  test(`${role}: tema și meniul rămân utilizabile la reîncărcare`, async ({ page }, info) => {
    await mock(page, role)
    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'Clienți PFA', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Schimbă tema' })).toBeVisible()
    if (role === 'Contabil') {
      await expect(page.getByRole('navigation', { name: 'Navigare contabil' }).getByText('Notificări', { exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Notificări', exact: true })).toBeVisible()
    }
    await page.getByRole('button', { name: 'Schimbă tema' }).click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('rl-panel-theme'))).toBe('light')
    if (info.project.name === 'desktop') {
      await page.getByRole('button', { name: 'Restrânge meniul' }).click()
      await expect(page.getByRole('button', { name: 'Extinde meniul' })).toHaveAttribute('aria-expanded', 'false')
    } else {
      await page.getByRole('button', { name: 'Deschide meniul' }).click()
      await expect(page.getByRole('button', { name: 'Închide meniul' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Deschide meniul' })).toHaveAttribute('aria-expanded', 'false')
    }
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Clienți PFA', exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('rl-panel-theme'))).toBe('light')
    if (info.project.name === 'desktop') {
      await page.getByRole('button', { name: 'Extinde meniul' }).click()
      await expect(page.getByRole('button', { name: 'Restrânge meniul' })).toHaveAttribute('aria-expanded', 'true')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/panel-${role.toLowerCase()}-light-${info.project.name}.png`, fullPage: true })
  })

  test(`${role}: sortare fiscală, căutare și acces la toate coloanele`, async ({ page }) => {
    await mock(page, role)
    await page.goto(url)
    const rows = page.getByRole('link', { name: /Deschide dosarul/ })
    await expect(rows).toHaveCount(3)
    // Bordura câmpului de căutare trebuie să rămână în pagină, chiar când filtrele se derulează.
    await expect.poll(() => page.getByLabel('Caută client').evaluate((input) =>
      input.closest('.MuiFormControl-root')!.getBoundingClientRect().right <= innerWidth - 16,
    )).toBe(true)
    await page.getByRole('button', { name: 'Venit brut' }).click()
    await expect(rows.first()).toHaveAttribute('aria-label', 'Deschide dosarul BOGDAN MARIN PFA')
    await page.getByRole('button', { name: 'Venit brut' }).click()
    await expect(rows.first()).toHaveAttribute('aria-label', 'Deschide dosarul ANA IONESCU PFA')
    await expect(rows.last()).toHaveAttribute('aria-label', 'Deschide dosarul CEZAR POPESCU PFA')
    await page.getByLabel('Caută client').fill('22222222')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toHaveAttribute('aria-label', 'Deschide dosarul BOGDAN MARIN PFA')
    await expect(page.getByRole('columnheader', { name: 'CASS', exact: true })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Impozit', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Acțiuni pentru BOGDAN MARIN PFA' }).click()
    await expect(page.getByRole('menuitem', { name: 'Sinteză fiscală' })).toBeVisible()
    await page.keyboard.press('Escape')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('contabil: eroarea fiscală permite reîncercarea fără pierderea listei', async ({ page }) => {
  await mock(page, 'Contabil')
  let unavailable = true
  await page.route('**/accounting/fiscal-overview?*', (route) => unavailable
    ? route.fulfill({ status: 503, json: { detail: 'Serviciul fiscal este indisponibil.' } })
    : route.fulfill({ json: fiscal }))
  await page.goto('/contabil?tab=clienti')
  await expect(page.getByRole('alert')).toContainText('Datele fiscale pentru')
  await expect(page.getByRole('link', { name: /Deschide dosarul/ })).toHaveCount(3)
  unavailable = false
  await page.getByRole('button', { name: 'Reîncearcă', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Parametri fiscali 2026')).toBeVisible()
})
