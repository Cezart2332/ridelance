import { mkdirSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

/**
 * Ecranele de autentificare: logo sus, card centrat cu slide-uri în stânga și formular în dreapta.
 *
 * Designul lasă aer în jurul cardului, deci pagina poate derula pe ecrane joase — ce nu are voie e
 * să derulele lateral. Paginile sunt publice și nu cer nimic de la backend la montare, deci testul
 * rulează fără API.
 */
const VIEWPORTS = {
  desktop: [
    { name: '1366x768', width: 1366, height: 768 },
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

async function expectNoHorizontalScroll(page: Page) {
  const horizontal = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(horizontal, 'scroll orizontal').toBeLessThanOrEqual(2)
}

test.describe('auth — layout', () => {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} nu derulează lateral`, async ({ page }, testInfo) => {
      const viewports = VIEWPORTS[testInfo.project.name as keyof typeof VIEWPORTS]

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(pageInfo.path, { waitUntil: 'networkidle' })

        const dir = `test-results/responsive/screenshots/${testInfo.project.name}`
        mkdirSync(dir, { recursive: true })
        await page.screenshot({ path: `${dir}/auth-${pageInfo.name}-${viewport.name}.png` })

        await expectNoHorizontalScroll(page)
      }
    })
  }

  test('login arată eroarea de la server', async ({ page }, testInfo) => {
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

      await page.getByLabel('Email').fill('gresit@exemplu.ro')
      await page.getByLabel('Parolă', { exact: true }).fill('parola-gresita')
      await page.getByRole('button', { name: 'Intră în RIDElance' }).click()

      await expect(page.getByRole('alert')).toContainText('Email sau parolă incorectă.')
      await expectNoHorizontalScroll(page)
    }
  })
})

test.describe('auth — slide-uri', () => {
  test('nu se montează sub breakpoint-ul md', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'relevant doar pe mobil')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    await expect(page.getByRole('button', { name: 'Intră în RIDElance' })).toBeVisible()
    await expect(page.locator('aside')).toHaveCount(0)
  })

  test('apar pe desktop, cu trei indicatori', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'relevant doar pe desktop')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/autentificare', { waitUntil: 'networkidle' })
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Slide \d din 3$/ })).toHaveCount(3)
  })
})
