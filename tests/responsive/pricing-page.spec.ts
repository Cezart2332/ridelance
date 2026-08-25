import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Pagina de Abonamente are două comutatoare, iar ele schimbă conținutul, nu doar stilul: PFA are
 * trei planuri și o variantă anuală, flota are unul singur și nicio variantă anuală.
 *
 * Prețurile sunt verificate ca text, pentru că sunt cifre comerciale: o zecimală pierdută la
 * conversia lunar → anual e o reducere greșit anunțată public.
 */

async function stub(page: Page) {
  await page.route('http://localhost:5000/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('abonamente', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await stub(page)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/abonamente-preturi')
  })

  test('PFA are trei planuri, cu prețuri lunare', async ({ page }) => {
    for (const [title, price] of [
      ['RIDElance Solo', '199 lei'],
      ['RIDElance Start', '399 lei'],
      ['RIDElance Pro', '599 lei'],
    ]) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
      await expect(page.getByText(price, { exact: true })).toBeVisible()
    }
  })

  test('comutatorul anual scade 10% și arată totalul facturat', async ({ page }) => {
    await page.getByRole('button', { name: /Anual/ }).click()

    await expect(page.getByText('179,10 lei', { exact: true })).toBeVisible()
    await expect(page.getByText('359,10 lei', { exact: true })).toBeVisible()
    await expect(page.getByText('539,10 lei', { exact: true })).toBeVisible()

    await expect(page.getByText('2.149,20 lei facturați anual · economisești 238,80 lei/an')).toBeVisible()
  })

  test('flota are un singur plan, fără variantă anuală', async ({ page }) => {
    await page.getByRole('button', { name: /Flotă/ }).click()

    await expect(page.getByRole('heading', { name: 'RIDElance Fleet' })).toBeVisible()
    await expect(page.getByText('299 lei', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /RIDElance (Solo|Start|Pro)/ })).toHaveCount(0)

    // Comutatorul lunar/anual dispare: planul de flotă n-are a doua variantă de facturare.
    await expect(page.getByRole('button', { name: /Anual/ })).toHaveCount(0)
  })

  test('beneficiile comune apar o singură dată, jos, cu logourile partenerilor', async ({ page }) => {
    const section = page.getByText('Incluse în toate planurile RIDElance')
    await expect(section).toBeVisible()

    const cards = page.locator('img[alt="bcr"], img[alt="mol"], img[alt="oblio"], img[alt="simplifi"], img[alt="asigurari-ro"]')
    // Apar și în listele planurilor, și în secțiunea de jos — deci cel puțin cele cinci de jos.
    expect(await cards.count()).toBeGreaterThanOrEqual(5)
  })
})
