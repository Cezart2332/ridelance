import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * O hartă care nu poate porni nu are voie să dărâme pagina.
 *
 * Fără WebGL (dezactivat, driver vechi, unele WebView-uri) `new mapboxgl.Map` aruncă sincron
 * „Failed to initialize WebGL". Neprinsă, eroarea urca până la ErrorBoundary și toată pagina devenea
 * „500 · Ceva n-a mers". Acum doar locul hărții arată `MapUnavailable`, restul paginii rămâne.
 *
 * Browserul e pornit fără GPU și fără rasterizatorul software, deci fără WebGL. Harta încearcă să
 * pornească doar dacă serverul de dezvoltare are `VITE_MAPBOX_TOKEN`; fără el, locul hărții arată
 * mesajul despre tokenul lipsă — pagina trebuie să stea în picioare în ambele cazuri.
 */

test.use({ launchOptions: { args: ['--disable-gpu', '--disable-software-rasterizer'] } })

async function stub(page: Page) {
  await page.route('http://localhost:5000/**', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('hartă fără WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await stub(page)
  })

  test('/orase-ridesharing rămâne întreagă, doar harta lipsește', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto('/orase-ridesharing')

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('Harta nu e disponibilă')).toBeVisible()
    await expect(page.getByText('Ceva n-a mers', { exact: true })).toHaveCount(0)

    if (process.env.VITE_MAPBOX_TOKEN) {
      await expect(page.getByText(/browserul nu are WebGL activ/)).toBeVisible()
    }

    expect(pageErrors).toEqual([])
  })
})
