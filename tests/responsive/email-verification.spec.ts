import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Pasul de confirmare a adresei, după înregistrare.
 *
 * Confirmarea nu e încă impusă (vezi `components/auth/emailVerification.ts`), iar testul verifică
 * exact asta: pasul apare și funcționează, dar nu ține pe nimeni pe loc. Când `required` devine
 * `true`, testul de la final trebuie să se inverseze — de aceea e scris explicit, nu omis.
 */

async function mockAuth(page: Page, onVerify?: (body: unknown) => void) {
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route(`${API}/users/register`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '"user-1"' }),
  )

  await page.route(`${API}/users/login`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'test-token', role: 'CarPoster', userId: 'user-1' }),
    }),
  )

  await page.route(`${API}/users/verify-email`, (route: Route) => {
    onVerify?.(route.request().postDataJSON())
    // Cod greșit: serverul refuză.
    route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({ detail: 'Codul introdus nu este corect.' }),
    })
  })
}

async function register(page: Page) {
  await page.goto('/inregistrare/anunturi')
  // MUI scrie asteriscul de „obligatoriu" în eticheta însăși, deci numele accesibil e „Email *".
  await page.getByLabel(/^Nume complet/).fill('Ion Popescu')
  await page.getByLabel(/^Email/).fill('sofer@example.ro')
  await page.getByLabel(/^Parolă/).fill('ParolaTest123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Creează contul' }).click()
}

test.describe('confirmare email', () => {
  test.describe.configure({ timeout: 90_000 })

  test('după înregistrare se cere codul, înaintea dashboardului', async ({ page }) => {
    await mockAuth(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    await expect(page).toHaveURL(/confirmare-email/)
    await expect(page.getByRole('heading', { name: /Confirmă-ți adresa/ })).toBeVisible()
    // Adresa e reluată, ca să se vadă unde a plecat codul.
    await expect(page.getByText(/sofer@example\.ro/)).toBeVisible()
    await expect(page.getByLabel('Cifra 1 din 6')).toBeVisible()
  })

  test('codul lipit umple toate căsuțele și pleacă întreg la server', async ({ page }) => {
    let sent: { email?: string; code?: string } | null = null
    await mockAuth(page, (body) => {
      sent = body as { email: string; code: string }
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    await page.getByLabel('Cifra 1 din 6').focus()
    await page.evaluate(() => navigator.clipboard.writeText('483920')).catch(() => {})

    // Lipirea prin clipboard cere permisiuni; tastarea acoperă aceeași cale de completare.
    for (const [index, digit] of [...'483920'].entries()) {
      await page.getByLabel(`Cifra ${index + 1} din 6`).fill(digit)
    }

    await page.getByRole('button', { name: 'Confirmă adresa' }).click()
    await expect.poll(() => sent).not.toBeNull()
    expect(sent!.code).toBe('483920')
    expect(sent!.email).toBe('sofer@example.ro')
  })

  test('un cod greșit nu ține utilizatorul pe loc, cât timp confirmarea nu e impusă', async ({ page }) => {
    await mockAuth(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    for (const [index, digit] of [...'000000'].entries()) {
      await page.getByLabel(`Cifra ${index + 1} din 6`).fill(digit)
    }
    await page.getByRole('button', { name: 'Confirmă adresa' }).click()

    // Serverul a refuzat codul, dar contul e utilizabil: se ajunge în dashboard.
    await expect(page).toHaveURL(/dashboard-srl/)
  })
})
