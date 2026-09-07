import { expect, test, type Page } from '@playwright/test'
import { notificationDestination } from '../../src/components/notifications/notificationDestination'
import type { Notification } from '../../src/services/notification.service'

function items(): Notification[] {
  return [
    { id: '00000000-0000-0000-0000-000000000001', type: 'TaxThreshold', text: 'Update taxe 2026: profit estimat YTD 56.197 lei. CAS: ai trecut pragul de 12 salarii; mai ai 41.003 lei până la pragul de 24 salarii.', isRead: false, createdAtUtc: '2026-09-07T08:00:00Z' },
    { id: '00000000-0000-0000-0000-000000000002', type: 'RecurringDocumentation', text: 'Te rugăm să încarci documentația recurentă pentru august 2026: extrase bancare, raport venituri Uber și Bolt.', isRead: false, createdAtUtc: '2026-09-07T07:00:00Z' },
  ]
}

async function mock(page: Page, role: string) {
  let notifications = items()
  await page.route('**/users/refresh-token', (route) => route.fulfill({ json: { accessToken: 'test', userId: 'owner', role } }))
  await page.route('**/users/profile', (route) => route.fulfill({ json: { firstName: 'Ion', lastName: 'Pop', email: 'ion@example.test', role } }))
  await page.route('**/pfa-registrations', (route) => route.fulfill({ json: { items: [] } }))
  await page.route(/\/notifications(?:\/.*)?$/, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.includes('/src/')) { await route.fallback(); return }
    if (route.request().method() === 'DELETE') notifications = notifications.filter((n) => !path.endsWith(n.id))
    if (route.request().method() === 'PUT') notifications = notifications.map((n) => path.endsWith('read-all') || path.includes(n.id) ? { ...n, isRead: true } : n)
    await route.fulfill({ json: notifications })
  })
}

test('destinațiile respectă tipul notificării și rolul', () => {
  const n = items()[0]
  expect(notificationDestination(n, 'Client')).toBe('/app/dashboard/contabilitate/taxe-declaratii')
  expect(notificationDestination({ ...n, type: 'DocumentExpiringSoon', sectionKey: 'RCA' }, 'Client')).toBe('/app/dashboard/documente/masina')
  expect(notificationDestination({ ...n, type: 'ChatRoomMessage', sectionKey: 'Contabil' }, 'Client')).toBe('/app/dashboard/contabilitate/chat-contabil')
  expect(notificationDestination({ ...n, type: 'ChatRoomMessage', relatedUserId: 'client-1' }, 'Admin')).toBe('/admin?tab=chat&user=client-1&section=chat')
  expect(notificationDestination({ ...n, type: 'BankConnection' }, 'CarPoster')).toBe('/app/dashboard-srl/financiar/cont-bancar')
  expect(notificationDestination({ ...n, type: 'unknown' }, 'Client')).toBeNull()
})

for (const role of ['Admin', 'Contabil']) {
  test(`${role}: ștergere persistentă, citire în bloc și sincronizare cu clopoțelul`, async ({ page }, info) => {
    await mock(page, role)
    const root = role === 'Admin' ? '/admin' : '/contabil'
    await page.goto(`${root}?tab=notificari`)
    await expect(page.getByText(items()[0].text)).toBeVisible()
    await page.getByRole('button', { name: 'Șterge notificarea', exact: true }).first().click()
    await expect(page.getByText(items()[0].text)).toHaveCount(0)
    await page.getByRole('button', { name: 'Marchează toate ca citite', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Necitite (0)', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText(items()[0].text)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Necitite (0)', exact: true })).toBeVisible()
    await page.getByLabel('Notificări', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'Necitite (0)', exact: true })).toBeVisible()
    await expect(page.locator('.MuiPopover-paper')).toHaveCSS('opacity', '1')
    await page.screenshot({ path: `test-results/notifications-${role}-${info.project.name}.png` })
    await expect(page.getByRole('button', { name: 'Deschide', exact: true }).last()).toBeVisible()
    await page.getByRole('button', { name: 'Deschide', exact: true }).last().click()
    await expect(page).toHaveURL(new RegExp(`${root}\\?tab=${role === 'Admin' ? 'pfa' : 'clients'}`))
  })
}
