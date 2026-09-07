import { expect, test, type Page } from '@playwright/test'
import type { FleetState } from '../../src/services/fleetOnboarding.service'

const company = {
  cui: '12345678',
  name: 'Flota Exemplu SRL',
  address: 'Strada Exemplu 10',
  city: 'București',
  county: 'București',
  registrationNumber: 'J40/123/2026',
  vatPayer: true,
  postalCode: '010101',
  caen: '4933',
  registrationDate: '2026-01-01',
  status: 'ÎNREGISTRAT',
  vatOnCollection: false,
}
function fixture(step = 0): FleetState {
  return {
    progress: {
      completedStep: step,
      company: step ? company : null,
      pendingCompany: null,
      position: null,
      platforms: [],
      vehicleCount: 0,
      bankDeferred: false,
      oblioDeferred: false,
      bcrRequested: false,
      bcrEligibleAtUtc: null,
      cycle: 'Monthly',
      completedAtUtc: null,
      checkoutAttemptId: null,
      checkoutClientSecret: null,
    },
    dashboardAllowed: false,
    legacyAccount: false,
    // Furnizorii de email și SMS nu sunt configurați, deci poarta e stinsă — ca în producție.
    contactVerificationRequired: false,
    email: 'manager@example.test',
    phone: '0712345678',
    emailVerified: true,
    phoneVerified: true,
    firstName: 'Ion',
    lastName: 'Pop',
    bankConnected: false,
    oblioConnected: false,
    amountDueBani: 29900,
    regularAmountBani: 29900,
    monthlyAmountBani: 29900,
    annualAmountBani: 322920,
  }
}
async function backend(page: Page, state: FleetState) {
  await page.route('**/users/refresh-token', (route) =>
    route.fulfill({
      json: {
        accessToken: 'test-token',
        role: 'CarPoster',
        userId: 'fleet-test',
      },
    }),
  )
  await page.route('**/fleet-onboarding', async (route) => {
    if (route.request().method() === 'PUT') {
      const input = route.request().postDataJSON()
      if (input.step === 1 && !input.confirmCompany)
        state.progress.pendingCompany = company
      else {
        state.progress.completedStep = Math.max(
          state.progress.completedStep,
          input.step,
        )
        if (input.step === 1)
          state.progress.company = state.progress.pendingCompany
        if (input.cycle) {
          state.progress.cycle = input.cycle
          state.amountDueBani =
            input.cycle === 'Annual'
              ? state.annualAmountBani
              : state.monthlyAmountBani
          state.regularAmountBani = input.cycle === 'Annual' ? 322920 : 29900
        }
      }
    }
    await route.fulfill({ json: state })
  })
}

test('firma, administrator, flotă zero și integrări amânate până la plată', async ({
  page,
}, info) => {
  await backend(page, fixture())
  await page.goto('/onboarding-srl')
  await page.getByLabel('CUI / CIF').fill('12345678')
  await page
    .getByRole('button', { name: 'Verifică firma', exact: true })
    .click()
  await expect(
    page.getByText('Flota Exemplu SRL', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Da, continuă' }).click()
  await page.getByLabel('Funcția în companie').click()
  await page.getByRole('option', { name: 'Manager flotă', exact: true }).click()
  await page.getByRole('button', { name: 'Continuă', exact: true }).click()
  await page.getByRole('button', { name: 'Momentan cu niciuna' }).click()
  await page.getByRole('button', { name: 'Continuă', exact: true }).click()
  await page
    .getByRole('button', { name: 'Voi configura contul bancar mai târziu' })
    .click()
  await page
    .getByRole('button', { name: 'Configurează mai târziu', exact: true })
    .click()
  await page.getByRole('button', { name: 'Anual −10%' }).click()
  await expect(
    page.getByText('3.229,2', { exact: false }).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Alege Fleet' }).click()
  await expect(
    page.getByRole('button', { name: 'Plătește și intră în RIDElance' }),
  ).toBeDisabled()
  await page.getByRole('checkbox').nth(0).check()
  await page.getByRole('checkbox').nth(1).check()
  await expect(
    page.getByRole('button', { name: 'Plătește și intră în RIDElance' }),
  ).toBeEnabled()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: `test-results/fleet-payment-${info.project.name}.png`,
    fullPage: true,
  })
})

test('beneficiul BCR reduce prețul afișat lunar și anual', async ({
  page,
}, info) => {
  const state = fixture(5)
  state.progress.bcrEligibleAtUtc = '2026-09-06T10:00:00Z'
  state.monthlyAmountBani = 24900
  state.annualAmountBani = 292920
  await backend(page, state)
  await page.goto('/onboarding-srl')
  await expect(page.getByText('249', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('299 lei / lună', { exact: true })).toHaveCSS(
    'text-decoration-line',
    'line-through',
  )
  await page.getByRole('button', { name: 'Anual −10%' }).click()
  await expect(
    page.getByText('2.929,2', { exact: false }).first(),
  ).toBeVisible()
  await page.screenshot({
    path: `test-results/fleet-pricing-${info.project.name}.png`,
    fullPage: true,
  })
})

test('accesul direct la dashboard trimite contul nou la configurare', async ({
  page,
}) => {
  await backend(page, fixture())
  await page.goto('/app/dashboard-srl')
  await expect(page).toHaveURL(/onboarding-srl/)
  await expect(page.getByLabel('CUI / CIF')).toBeVisible()
})

test('revenirea de la Stripe nu acordă singură acces', async ({ page }) => {
  await backend(page, fixture(7))
  await page.goto('/onboarding-srl?payment=returned')
  await expect(
    page.getByText('Așteptăm confirmarea plății.', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Intră în dashboard', exact: true }),
  ).toHaveCount(0)
})

test('confirmarea de pe server afișează recapitularea și accesul', async ({
  page,
}) => {
  const state = fixture(7)
  state.progress.completedAtUtc = '2026-09-06T10:00:00Z'
  state.dashboardAllowed = true
  await backend(page, state)
  await page.goto('/onboarding-srl?payment=returned')
  await expect(page.getByText('Totul este pregătit.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Intră în dashboard' }),
  ).toBeVisible()
  await expect(page.getByText('Oblio · De configurat')).toBeVisible()
})
