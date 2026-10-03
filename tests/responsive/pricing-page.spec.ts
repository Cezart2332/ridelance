import { test, expect, type Locator } from '@playwright/test'

const totalRow = (card: Locator) => card.getByText('Total lunar', { exact: true }).locator('..')

test.describe('noua ofertă publică de abonamente', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:5000/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.goto('/abonamente-preturi')
  })

  test('PFA are două planuri lunare fără marcă în titluri', async ({ page }) => {
    for (const [name, price] of [['PFAlone', '139 lei'], ['PFA Full', '299 lei']]) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
      await expect(totalRow(page.getByRole('article', { name, exact: true }))).toContainText(price)
    }
    await expect(page.getByRole('article')).toHaveCount(2)
    await expect(page.getByRole('button', { name: /Anual/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /RIDElance (Solo|Start|Pro|PFAlone|PFA Full)/ })).toHaveCount(0)
  })

  test('opțiunile PFAlone se adună și BCR reduce totalul', async ({ page }) => {
    const solo = page.getByRole('article', { name: 'PFAlone', exact: true })
    const full = page.getByRole('article', { name: 'PFA Full', exact: true })
    await solo.getByRole('checkbox', { name: /Open Banking/ }).check()
    await solo.getByRole('checkbox', { name: /Automatizare casă de marcat/ }).check()
    await expect(totalRow(solo)).toContainText('237 lei')
    await solo.getByRole('checkbox', { name: /Îmi deschid cont BCR/ }).check()
    await expect(totalRow(solo)).toContainText('187 lei')
    await expect(totalRow(full)).toContainText('249 lei')
    await solo.getByRole('checkbox', { name: /Open Banking/ }).uncheck()
    await expect(totalRow(solo)).toContainText('138 lei')
    await solo.getByRole('checkbox', { name: /Automatizare casă de marcat/ }).uncheck()
    await expect(totalRow(solo)).toContainText('89 lei')
    await expect(solo.getByText('primele 6 luni, apoi 139 lei/lună.')).toBeVisible()
    await expect(full.getByRole('checkbox')).toHaveCount(1)
  })

  test('Fleet separă costurile lunare de plata unică', async ({ page }) => {
    await page.getByRole('button', { name: 'SRL', exact: true }).click()
    const fleet = page.getByRole('article', { name: 'SRL Fleet', exact: true })
    await fleet.getByRole('checkbox', { name: /Open Banking/ }).check()
    await fleet.getByRole('button', { name: 'Adaugă anunțuri suplimentare' }).click()
    await fleet.getByRole('button', { name: 'Adaugă anunțuri suplimentare' }).click()
    await fleet.getByRole('checkbox', { name: /Îmi deschid cont BCR/ }).check()
    await expect(totalRow(fleet)).toContainText('377,80 lei')
    await fleet.getByRole('button', { name: 'Adaugă anunțuri anonimizate' }).click()
    await expect(fleet.getByText('Plată unică anonimizare (1)').locator('..')).toContainText('14,90 lei')
    await expect(totalRow(fleet)).toContainText('377,80 lei')
    await fleet.getByRole('button', { name: 'Scade anunțuri suplimentare' }).click()
    await fleet.getByRole('button', { name: 'Scade anunțuri suplimentare' }).click()
    await expect(fleet.getByRole('button', { name: 'Scade anunțuri suplimentare' })).toBeDisabled()
    await expect(totalRow(fleet)).toContainText('298 lei')
  })

  test('Fleet Pro afișează preț la lansare și este indisponibil', async ({ page }) => {
    await page.getByRole('button', { name: 'SRL', exact: true }).click()
    const pro = page.getByRole('article', { name: 'SRL Fleet Pro', exact: true })
    await expect(pro.getByRole('heading', { name: 'SRL Fleet Pro', exact: true })).toBeVisible()
    await expect(pro.getByText('Preț la lansare')).toBeVisible()
    await expect(pro.getByRole('button', { name: 'În curând' })).toBeDisabled()
    await expect(pro.getByRole('checkbox')).toHaveCount(0)
    await expect(pro.getByText('0 lei', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Anual/ })).toBeVisible()
  })

  test('beneficiile sunt specifice PFA/SRL și dialogul se închide', async ({ page }) => {
    await page.getByRole('article', { name: 'PFAlone', exact: true }).getByRole('button', { name: 'Beneficii parteneri' }).click()
    const dialog = page.getByRole('dialog', { name: 'Beneficii prin partenerii oficiali' })
    await expect(dialog.getByText('Benefit Edenred', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Constalaris', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: 'SRL', exact: true }).click()
    await page.getByRole('article', { name: 'SRL Fleet', exact: true }).getByRole('button', { name: 'Beneficii parteneri' }).click()
    await expect(dialog.getByText('Oblio', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Constalaris', { exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Închide beneficiile' }).click()
    await expect(dialog).toHaveCount(0)
  })

  test('landingul folosește aceeași ofertă și cardurile încap în ecran', async ({ page }) => {
    for (const audience of ['PFA', 'SRL']) {
      await page.getByRole('button', { name: audience, exact: true }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'PFAlone', exact: true })).toBeVisible()
    await expect(totalRow(page.getByRole('article', { name: 'PFA Full', exact: true }))).toContainText('299 lei')
    await page.getByRole('button', { name: 'SRL', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'SRL Fleet Pro', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('anual are 10% reducere, iar BCR scade doar 300 lei din primul an', async ({ page }) => {
    await page.getByRole('button', { name: /Anual/ }).click()
    const solo = page.getByRole('article', { name: 'PFAlone', exact: true })
    const full = page.getByRole('article', { name: 'PFA Full', exact: true })
    await expect(solo.getByTestId('plan-price')).toContainText('125,10 lei')
    await expect(solo.getByText('1.501,20 lei facturați anual · reducere 10%')).toBeVisible()
    await expect(full.getByText('3.229,20 lei facturați anual · reducere 10%')).toBeVisible()
    await solo.getByRole('checkbox', { name: /Îmi deschid cont BCR/ }).check()
    await expect(solo.getByText('1.201,20 lei facturați anual · reducere 10%')).toBeVisible()
    await expect(solo.getByTestId('plan-price')).toContainText('100,10 lei')
    await expect(full.getByText('2.929,20 lei facturați anual · reducere 10%')).toBeVisible()
    await solo.getByRole('checkbox', { name: /Open Banking/ }).check()
    await expect(solo.getByText('Echivalent lunar', { exact: true }).locator('..')).toContainText('149,10 lei')
    await expect(solo.getByText('1.201,20 lei facturați anual · reducere 10%')).toBeVisible()
    await page.getByRole('button', { name: 'SRL', exact: true }).click()
    await expect(page.getByRole('article', { name: 'SRL Fleet', exact: true }).getByText('2.929,20 lei facturați anual · reducere 10%')).toBeVisible()
    await page.goto('/')
    await page.getByRole('button', { name: /Anual/ }).click()
    await expect(page.getByRole('article', { name: 'PFAlone', exact: true }).getByText('1.201,20 lei facturați anual · reducere 10%')).toBeVisible()
  })

  test('cardurile sunt compacte, titlurile centrate și BCR nu schimbă dimensiunile', async ({ page, isMobile }) => {
    const sizes = isMobile ? [320, 390] : [1440]
    for (const width of sizes) {
      await page.setViewportSize({ width, height: isMobile ? 844 : 1000 })
      for (const audience of ['PFA', 'SRL']) {
        await page.getByRole('button', { name: audience, exact: true }).click()
        const card = page.getByRole('article').first()
        for (const cycle of ['Lunar', 'Anual']) {
          await page.getByRole('button', { name: new RegExp(cycle) }).click()
          const before = await card.evaluate((el) => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top + window.scrollY }))
          // Mai puțin de un ecran desktop, iar mobilul păstrează textul lizibil fără overflow.
          expect(before.height).toBeLessThan(page.viewportSize()!.width >= 900 ? 750 : 1050)
          await card.getByRole('checkbox', { name: /Îmi deschid cont BCR/ }).check()
          const after = await card.evaluate((el) => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top + window.scrollY }))
          expect(after).toEqual(before)
          await expect(card.getByTestId('bcr-price-note')).toBeVisible()
          const note = await card.getByTestId('bcr-price-note').boundingBox()
          const price = await card.getByTestId('plan-price').boundingBox()
          expect(note!.x).toBeGreaterThan(price!.x + price!.width / 3)
          expect(note!.y).toBeLessThan(price!.y + price!.height)
          await expect(card.getByRole('heading')).toHaveCSS('text-align', 'center')
          await card.getByRole('checkbox', { name: /Îmi deschid cont BCR/ }).uncheck()
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
    await expect(page.getByText('Flota, mașinile și închirierile într-un singur loc.')).toHaveCount(0)
    await expect(page.getByText('Închirierea devine un flux complet digital.')).toHaveCount(0)
    await page.getByRole('button', { name: 'PFA', exact: true }).click()
    await expect(page.getByText('Tu conduci. RIDElance îți dă instrumentele.')).toHaveCount(0)
    await expect(page.getByText('Tu conduci. RIDElance se ocupă de restul.')).toHaveCount(0)
  })

  test('detaliile complete și calculul rămân accesibile', async ({ page }) => {
    const solo = page.getByRole('article', { name: 'PFAlone', exact: true })
    await solo.getByRole('button', { name: 'Detalii și calcul' }).click()
    const dialog = page.getByRole('dialog', { name: 'PFAlone — detalii' })
    await expect(dialog.getByText(/dosarul și procesul de înființare sunt gestionate/)).toBeVisible()
    await expect(dialog.getByText('Alternativă gratuită: încarci extrasul bancar lunar.')).toBeVisible()
    await expect(dialog.getByText(/PFAlone nu include gestionarea/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Închide detaliile' }).click()
    await expect(dialog).toHaveCount(0)
  })
})
