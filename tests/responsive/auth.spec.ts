import { mkdirSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

/**
 * Criteriul greu al redesignului de auth: ecranul nu are scroll. Nici pe laptopul de 1366×768
 * (viewportul critic — după cromul browserului rămân ~610px utilizabili), nici pe telefon, nici
 * cu alert-ul de eroare afișat.
 *
 * Paginile sunt publice și nu cer nimic de la backend la montare, deci testul rulează fără API.
 */
const VIEWPORTS = {
  desktop: [
    { name: '1366x768', width: 1366, height: 768 },
    // Cazul real de pe laptopul de 1366×768: Playwright dă viewportul întreg, dar într-un
    // browser adevărat bara de titlu, tab-urile și bara de adrese lasă ~610px. Ăsta e
    // viewportul pentru care s-a calculat bugetul vertical.
    { name: '1366x610', width: 1366, height: 610 },
    { name: '1440x900', width: 1440, height: 900 },
  ],
  mobile: [
    { name: '390x844', width: 390, height: 844 },
    { name: '375x667', width: 375, height: 667 },
  ],
} as const

const PAGES = [
  { name: 'autentificare', path: '/autentificare' },
  { name: 'inregistrare', path: '/inregistrare' },
]

async function expectNoScroll(page: Page) {
  const overflow = await page.evaluate(() => ({
    vertical: document.documentElement.scrollHeight - window.innerHeight,
    horizontal: document.documentElement.scrollWidth - window.innerWidth,
  }))
  expect(overflow.vertical, 'scroll vertical').toBeLessThanOrEqual(2)
  expect(overflow.horizontal, 'scroll orizontal').toBeLessThanOrEqual(2)
}

test.describe('auth — încadrare într-un singur ecran', () => {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} nu are scroll`, async ({ page }, testInfo) => {
      const viewports = VIEWPORTS[testInfo.project.name as keyof typeof VIEWPORTS]

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' })

        const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
        mkdirSync(dir, { recursive: true })
        await page.screenshot({ path: `${dir}/auth-${pageInfo.name}-${viewport.name}.png` })

        await expectNoScroll(page)
      }
    })
  }

  test('login nu are scroll nici cu alert-ul de eroare afișat', async ({ page }, testInfo) => {
    // Backendul întoarce 400 pentru credențiale greșite (`UserErrors.InvalidCredentials` e un
    // `Error.Failure`), nu 401 — de aceea fixture-ul e pe 400.
    await page.route('**/users/login', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Users.InvalidCredentials', detail: 'Invalid credentials.' }),
      }),
    )

    for (const viewport of VIEWPORTS[testInfo.project.name as keyof typeof VIEWPORTS]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/autentificare', { waitUntil: 'networkidle' })

      // Label-urile sunt `required`, deci numele accesibil e „Email *" / „Parolă *".
      await page.getByLabel(/Email/).fill('gresit@exemplu.ro')
      await page.getByLabel(/Parolă/).fill('parola-gresita')
      await page.getByRole('button', { name: 'Autentifică-te' }).click()

      const alert = page.getByRole('alert')
      await expect(alert).toContainText('Email sau parolă incorectă.')

      await expectNoScroll(page)
    }
  })
})

test.describe('auth — asset-ul vizual', () => {
  test('imaginea din panoul stâng nu se descarcă sub breakpoint-ul md', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'relevant doar pe mobil')

    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('auth-visual')) requested.push(request.url())
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    // Panoul se montează într-un efect, după primul paint — lăsăm randarea să se așeze.
    await expect(page.getByRole('button', { name: 'Autentifică-te' })).toBeVisible()

    expect(page.locator('img[src*="auth-visual"]')).toHaveCount(0)
    expect(requested, 'auth-visual.webp nu trebuie cerut pe mobil').toEqual([])
  })

  test('imaginea se descarcă pe desktop', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'relevant doar pe desktop')

    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('auth-visual')) requested.push(request.url())
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    await expect(page.locator('img[src*="auth-visual"]')).toBeVisible()

    expect(requested.length).toBeGreaterThan(0)
  })
})
