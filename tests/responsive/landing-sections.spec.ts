import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Două secțiuni de pe landing care se pot pierde ușor la o editare: catalogul de asigurări, care
 * are treisprezece categorii din care pagina principală arată doar patru, și banda de parteneri,
 * care își ia ordinea din lista de beneficii.
 */

async function stub(page: Page) {
  await page.route('http://localhost:5000/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('landing', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await stub(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
  })

  test('arată doar cele patru asigurări care privesc un șofer', async ({ page }) => {
    const cards = page.locator('a[href*="asigurari.ro/asigurare/"]')
    await expect(cards).toHaveCount(4)

    for (const label of ['RCA', 'CASCO', 'CASCO Econom', 'Accidente călători']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }

    // Restul catalogului nu dispare, doar se mută: se ajunge la el din pagina partenerului.
    const all = page.getByRole('link', { name: /Vezi toate asigurările/i })
    await expect(all).toHaveAttribute('href', '/parteneri/asigurari-ro')
  })

  test('partenerii apar în ordinea din Beneficii', async ({ page }) => {
    const logos = page.getByText('Partenerii RIDElance', { exact: true }).first().locator('..').locator('img')
    await expect(logos).toHaveCount(8)

    const order = await logos.evaluateAll((els) => els.map((el) => el.getAttribute('alt')))
    // ACE n-are pagină de beneficii, deci stă la coadă; restul urmează ordinea de acolo.
    expect(order).toEqual(['BCR', 'MOL', 'asigurari.ro', 'Oblio', 'Consulto', 'Simplifi', 'eldrive', 'ACE'])
  })
})
