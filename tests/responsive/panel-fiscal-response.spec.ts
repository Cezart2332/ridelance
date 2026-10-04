import { expect, test } from '@playwright/test'
import { mockAccountingClient } from './fixtures/accountingClient'

test('fișa clientului rămâne accesibilă când serverul vechi trimite o listă fără rezumat fiscal', async ({ page }) => {
  test.setTimeout(60_000)
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'staff', role: 'Contabil' } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Ana', lastName: 'Contabil', role: 'Contabil' } }))
  await page.route('**/notifications', (route) => route.fulfill({ json: [] }))
  await mockAccountingClient(page, { pfaId: 'client', userId: 'owner', name: 'ION POPESCU PFA', email: 'ion@example.test' })
  await page.route('**/accounting/fiscal-overview?*', (route) => route.fulfill({ json: [] }))
  await page.goto('/contabil?tab=clienti&pfa=client&sectiune=fiscal')
  await expect(page.getByRole('heading', { name: 'ION POPESCU PFA' })).toBeVisible({ timeout: 45_000 })
  await expect(page.getByRole('alert')).toContainText('Rezumatul fiscal nu este disponibil.')
  await expect(page.getByText('Datele fiscale nu sunt disponibile momentan.')).toBeVisible()
  await expect(page.getByText('Profil fiscal indisponibil')).toBeVisible()
  await page.getByRole('button', { name: 'Înapoi la Clienți PFA' }).click()
  await expect(page.getByRole('heading', { name: 'Clienți PFA', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Deschide dosarul ION POPESCU PFA' })).toBeVisible()
})
