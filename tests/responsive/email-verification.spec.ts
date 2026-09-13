import { test, expect, type Page, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

/**
 * Confirmarea contului nou: codul din email, apoi codul din SMS.
 *
 * Niciuna nu e încă impusă (vezi `components/auth/emailVerification.ts`), iar testul verifică
 * exact asta: pașii apar și funcționează, dar nu țin pe nimeni pe loc. Când `required` devine
 * `true`, testul de la final trebuie să se inverseze — de aceea e scris explicit, nu omis.
 */

interface Captured {
  register?: Record<string, unknown>
  verify?: { email?: string; code?: string }
  smsTo?: string | null
}

async function mockAuth(page: Page, captured: Captured = {}) {
  await page.route(`${API}/**`, (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )

  await page.route(`${API}/users/register`, (route: Route) => {
    captured.register = route.request().postDataJSON()
    route.fulfill({ status: 200, contentType: 'application/json', body: '"user-1"' })
  })

  await page.route(`${API}/users/login`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'test-token', role: 'CarPoster', userId: 'user-1' }),
    }),
  )

  await page.route(`${API}/users/verify-email`, (route: Route) => {
    captured.verify = route.request().postDataJSON()
    // Cod greșit: serverul refuză.
    route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({ detail: 'Codul introdus nu este corect.' }),
    })
  })

  await page.route(`${API}/users/phone/send-code`, (route: Route) => {
    captured.smsTo = route.request().postDataJSON()?.phoneNumber ?? null
    route.fulfill({ status: 204 })
  })

  await page.route(`${API}/users/phone/confirm`, (route: Route) =>
    route.fulfill({ status: 400, contentType: 'application/problem+json', body: '{}' }),
  )
}

async function register(page: Page) {
  await page.goto('/inregistrare/anunturi')
  await page.getByLabel('Email').fill('sofer@example.ro')
  await page.getByLabel('Telefon').fill('0722 123 456')
  await page.getByLabel('Parolă', { exact: true }).fill('ParolaTest123!')
  await page.getByLabel('Repetă parola').fill('ParolaTest123!')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Creează contul' }).click()
}

async function typeCode(page: Page, prefix: string, code: string) {
  for (const [index, digit] of [...code].entries()) {
    await page.getByLabel(`${prefix} ${index + 1} din 6`, { exact: true }).fill(digit)
  }
}

test.describe('confirmare cont', () => {
  test.describe.configure({ timeout: 90_000 })

  test('înregistrarea trimite telefonul, fără nume, și cere codul din email', async ({ page }) => {
    const captured: Captured = {}
    await mockAuth(page, captured)
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    await expect(page).toHaveURL(/confirmare-email/)
    await expect(page.getByRole('heading', { name: /Confirmă-ți adresa/ })).toBeVisible()
    await expect(page.getByText(/sofer@example\.ro/)).toBeVisible()

    expect(captured.register).toMatchObject({ email: 'sofer@example.ro', phoneNumber: '0722 123 456', role: 'CarPoster' })
    expect(captured.register).not.toHaveProperty('firstName')
  })

  test('parolele diferite opresc înregistrarea', async ({ page }) => {
    const captured: Captured = {}
    await mockAuth(page, captured)
    await page.goto('/inregistrare')
    await page.getByLabel('Email').fill('sofer@example.ro')
    await page.getByLabel('Telefon').fill('0722 123 456')
    await page.getByLabel('Parolă', { exact: true }).fill('ParolaTest123!')
    await page.getByLabel('Repetă parola').fill('AltaParola123!')
    // Eroarea apare la ieșirea din câmp și împinge bifa mai jos; altfel clickul ar cădea lângă ea.
    await page.getByLabel('Repetă parola').blur()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Creează contul' }).click()

    await expect(page.getByText('Parolele nu coincid.')).toBeVisible()
    expect(captured.register).toBeUndefined()
  })

  test('codul din email pleacă întreg, apoi se trimite SMS-ul', async ({ page }) => {
    const captured: Captured = {}
    await mockAuth(page, captured)
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    await typeCode(page, 'Cifra', '483920')
    await page.getByRole('button', { name: 'Confirmă adresa' }).click()

    await expect.poll(() => captured.verify).toBeTruthy()
    expect(captured.verify).toEqual({ email: 'sofer@example.ro', code: '483920' })

    await expect(page.getByRole('heading', { name: /Confirmă-ți telefonul/ })).toBeVisible()
    await expect.poll(() => captured.smsTo).toBe('0722 123 456')
  })

  test('codurile greșite nu țin utilizatorul pe loc, cât timp confirmarea nu e impusă', async ({ page }) => {
    await mockAuth(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await register(page)

    await typeCode(page, 'Cifra', '000000')
    await page.getByRole('button', { name: 'Confirmă adresa' }).click()

    await typeCode(page, 'Cifra SMS', '000000')
    await page.getByRole('button', { name: 'Confirmă telefonul' }).click()

    // Serverul a refuzat ambele coduri, dar contul e utilizabil: se ajunge în dashboard.
    await expect(page).toHaveURL(/dashboard-srl/)
  })
})
