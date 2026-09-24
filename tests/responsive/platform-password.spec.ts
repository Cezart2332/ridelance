import { test, expect, type Route } from '@playwright/test'

const API = 'http://localhost:5000'

const cors = async (route: Route) => ({
  'Access-Control-Allow-Origin': (await route.request().headerValue('origin')) ?? '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
})
const json = (body: () => unknown) => async (route: Route) =>
  route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers: await cors(route) })
    : route.fulfill({ status: 200, contentType: 'application/json', headers: await cors(route), body: JSON.stringify(body()) })

const step = (order: number, key: string, state: string) => ({
  order, key, label: key, status: state === 'completed' ? 'Completed' : 'InProgress', state,
  ownedBy: 'user', userPartDone: state === 'completed', blockReason: null, path: `/onboarding/${key}`,
})

/**
 * Regresie: numărătoarea de avans automat număra tastele în faza de capture, iar React re-randa
 * câmpul cu valoarea veche înainte ca `onChange` să citească tasta — nicio literă nu rămânea.
 */
test('pasul 5: parola contului de flotă se poate tasta', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Același formular pe telefon.')
  const posts: Record<string, unknown>[] = []
  let account = {
    provider: 'Uber', isSelectedByUser: true, hasExistingAccount: false, operatorAccountId: null,
    hasAffiliationContract: false, onboardingStatus: 'Selected', existingAccountAnswer: 'None',
    email: 'ion@example.test', phone: '+40722123456', hasPassword: false, driverHasExistingAccount: null,
    driverEmail: null, driverPhone: null, driverFullName: null, driverExternalId: null,
  }
  const platforms = () => ({ pfaRegistrationId: 'reg-1', platforms: [account], fleetAccountsAccepted: true, boltApiAccepted: false })

  await page.route(`${API}/**`, json(() => null))
  await page.route(`${API}/users/refresh-token`, json(() => ({ accessToken: 't', role: 'Client', userId: 'u1' })))
  await page.route(`${API}/documents**`, json(() => []))
  await page.route(`${API}/onboarding/state`, json(() => ({
    pfaRegistrationId: 'reg-1', pfaStatus: 'Approved', registrationType: 'AmPfa', hasPaidInfiintare: true,
    contactEmail: 'ion@example.test', contactPhone: '0722123456', contactName: 'Ion Pop',
    steps: [step(0, 'eligibility', 'completed'), step(1, 'pfa', 'completed'), step(2, 'fiscal', 'completed'), step(3, 'arr', 'completed'), step(4, 'platforms', 'in_progress'), step(5, 'vehicle', 'locked')],
  })))
  await page.route(`${API}/onboarding/platforms`, json(platforms))
  await page.route(`${API}/onboarding/platforms/account`, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      posts.push(body)
      account = { ...account, hasPassword: account.hasPassword || Boolean(body.password) }
    }
    return json(platforms)(route)
  })

  await page.goto('/onboarding/platforms', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Cont Uber Fleet' }).click()
  await page.getByRole('radio').filter({ hasText: 'Nu' }).click()
  await expect(page.getByRole('heading', { name: 'Datele contului Uber Fleet' })).toBeVisible()
  const password = page.getByLabel('Parola contului')
  // Tasta cu tastă, ca omul: fiecare literă trebuie să rămână în câmp.
  await password.click()
  await page.keyboard.type('Parola1234', { delay: 60 })
  await expect(password).toHaveValue('Parola1234')
  await expect.poll(() => posts.some((p) => p.password === 'Parola1234'), { timeout: 10_000 }).toBe(true)
})

test('pasul 5: cu cont de șofer, datele le scrie omul și pleacă doar la „Continuă”', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'Același formular pe telefon.')
  const account = {
    provider: 'Uber', isSelectedByUser: true, hasExistingAccount: false, operatorAccountId: null,
    hasAffiliationContract: false, onboardingStatus: 'Selected', existingAccountAnswer: 'None',
    email: 'ion@example.test', phone: '+40722123456', hasPassword: true, driverHasExistingAccount: null,
    driverEmail: null, driverPhone: null, driverFullName: null, driverExternalId: null,
  }
  const platforms = () => ({ pfaRegistrationId: 'reg-1', platforms: [account], fleetAccountsAccepted: true, boltApiAccepted: false })
  await page.route(`${API}/**`, json(() => null))
  await page.route(`${API}/users/refresh-token`, json(() => ({ accessToken: 't', role: 'Client', userId: 'u1' })))
  await page.route(`${API}/documents**`, json(() => []))
  await page.route(`${API}/onboarding/state`, json(() => ({
    pfaRegistrationId: 'reg-1', pfaStatus: 'Approved', registrationType: 'AmPfa', hasPaidInfiintare: true,
    contactEmail: 'ion@example.test', contactPhone: '0722123456', contactName: 'Ion Pop',
    steps: [step(0, 'eligibility', 'completed'), step(1, 'pfa', 'completed'), step(2, 'fiscal', 'completed'), step(3, 'arr', 'completed'), step(4, 'platforms', 'in_progress'), step(5, 'vehicle', 'locked')],
  })))
  await page.route(`${API}/onboarding/platforms`, json(platforms))
  await page.route(`${API}/onboarding/platforms/account`, json(platforms))

  await page.goto('/onboarding/platforms', { waitUntil: 'networkidle' })
  // Datele de flotă sunt salvate: de pe ecranul lor, „Continuă” duce la întrebarea despre contul de șofer.
  await page.getByRole('button', { name: 'Uber Fleet', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Datele contului Uber Fleet' })).toBeVisible()
  await expect(page.getByTestId('auto-advance')).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuă' }).click()
  await expect(page.getByRole('heading', { name: 'Ai deja cont de Uber Driver?' })).toBeVisible()
  await page.getByRole('radio').filter({ hasText: 'Da' }).click()
  await expect(page.getByRole('heading', { name: 'Datele contului Uber Driver' })).toBeVisible()

  // Pornesc goale: nu datele contului RIDElance.
  await expect(page.getByLabel('Email')).toHaveValue('')
  await expect(page.getByLabel('Telefon')).toHaveValue('')
  const next = page.getByRole('button', { name: 'Continuă' })
  await expect(next).toBeDisabled()
  await expect(page.getByTestId('auto-advance')).toHaveCount(0)

  await page.getByLabel('Email').fill('sofer.uber@example.test')
  await page.getByLabel('Telefon').fill('0733111222')
  await expect(next).toBeEnabled()
  // Fără numărătoare: ecranul așteaptă omul.
  await page.waitForTimeout(3500)
  await expect(page.getByRole('heading', { name: 'Datele contului Uber Driver' })).toBeVisible()
  await next.click()
  await expect(page.getByRole('heading', { name: 'Datele contului Uber Driver' })).toHaveCount(0)
})
