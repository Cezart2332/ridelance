import { expect, test, type Page } from '@playwright/test'
import { notificationDestination } from '../../src/components/notifications/notificationDestination'
import { requestedAccountingMonth } from '../../src/utils/accountingPeriod'

const PFA_ID = '11111111-1111-1111-1111-111111111111'
const CLIENT_USER_ID = '22222222-2222-2222-2222-222222222222'

async function mock(page: Page, sent: unknown[]) {
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'contabil', role: 'Contabil' } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Ana', lastName: 'Contabil', email: 'ana@example.test', role: 'Contabil' } }))
  await page.route(/\/pfa-registrations(\?.*)?$/, (route) => route.fulfill({
    json: { items: [{ id: PFA_ID, userId: CLIENT_USER_ID, userName: 'Ion Popescu', userEmail: 'ion@example.test', status: 'Approved' }] },
  }))
  // Doar trimiterea; restul fișei (venituri, note, documente) nu contează aici.
  await page.route(`**/pfa-registrations/${PFA_ID}/client-notifications`, async (route) => {
    sent.push(route.request().postDataJSON())
    await route.fulfill({ json: { notificationId: '33333333-3333-3333-3333-333333333333', pushSent: 1 } })
  })
}

test('notificarea contabilului duce clientul în secțiunea aleasă', () => {
  const base = { id: 'n', type: 'AccountantMessage', text: 'Salut', isRead: false, createdAtUtc: '2026-09-22T08:00:00Z' }
  expect(notificationDestination({ ...base, sectionKey: 'RecurringDocuments' }, 'Client')).toBe('/app/dashboard/documente/recurente')
  expect(notificationDestination({ ...base, sectionKey: null }, 'Client')).toBeNull()
})

test('luna contabilă: până pe 25 luna trecută, de pe 26 luna curentă (ora României)', () => {
  expect(requestedAccountingMonth(new Date('2026-10-25T20:59:00Z'))).toEqual({ year: 2026, month: 9 })
  expect(requestedAccountingMonth(new Date('2026-09-25T21:00:00Z'))).toEqual({ year: 2026, month: 9 })
  expect(requestedAccountingMonth(new Date('2026-09-25T20:59:00Z'))).toEqual({ year: 2026, month: 8 })
  expect(requestedAccountingMonth(new Date('2026-01-10T10:00:00Z'))).toEqual({ year: 2025, month: 12 })
})

test('contabilul trimite o notificare clientului din fișa lui', async ({ page }, info) => {
  const sent: unknown[] = []
  await mock(page, sent)
  await page.goto(`/contabil?tab=clients&user=${CLIENT_USER_ID}`)

  await page.getByRole('button', { name: 'Trimite notificare', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Documente lunare', exact: true }).click()
  await expect(dialog.getByLabel('Mesaj')).toHaveValue(/Te rog să încarci documentele pentru .+ până pe 25 /)
  await page.screenshot({ path: `test-results/contabil-client-notification-${info.project.name}.png` })
  await dialog.getByRole('button', { name: 'Trimite', exact: true }).click()

  await expect(page.getByText('Notificarea a fost trimisă, inclusiv pe telefon.')).toBeVisible()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ destination: 'RecurringDocuments' })
})
