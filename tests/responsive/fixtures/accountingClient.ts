import type { Page } from '@playwright/test'

/**
 * Profilul unui client din „Clienți PFA” (contabil) pornește din modulul de contabilitate: lista
 * PFA-urilor și antetul dosarului. Testele care deschid profilul le simulează aici; restul
 * cererilor (venituri, chat, taxe) rămân în grija fiecărui test.
 */
export async function mockAccountingClient(
  page: Page,
  client: { pfaId: string; userId: string; name: string; email: string; period?: string },
) {
  const period = client.period ?? '2026-08'
  const contact = { userId: client.userId, email: client.email, phone: null }
  await page.route(/\/accounting\/pfas(\?.*)?$/, (route) =>
    route.fulfill({
      json: [
        {
          id: client.pfaId,
          name: client.name,
          cui: '12345674',
          art317: false,
          platforms: ['UBER', 'BOLT'],
          engagementStatus: 'ACTIVE',
          currentPeriod: period,
          currentMonthStatus: 'NOT_PROCESSED',
          cashStatus: 'NOT_REQUIRED_CURRENT_CONFIGURATION',
          client: contact,
        },
      ],
    }),
  )
  await page.route(`**/accounting/pfas/${client.pfaId}/summary`, (route) =>
    route.fulfill({
      json: {
        id: client.pfaId,
        name: client.name,
        cui: '12345674',
        realSystem: true,
        vatPayer: false,
        art317: false,
        art317ActivationDate: null,
        platforms: ['UBER', 'BOLT'],
        engagement: { status: 'ACTIVE', startDate: '2026-01-01', endDate: null },
        currentPeriod: period,
        currentMonthStatus: 'NOT_PROCESSED',
        cash: { status: 'NOT_REQUIRED_CURRENT_CONFIGURATION', cashRequested: false, cashEnabled: false, activationDate: null, verifiedBy: null, evidenceFile: null },
        readOnly: false,
        retentionUntil: null,
        client: contact,
      },
    }),
  )
  await page.route(`**/accounting/pfas/${client.pfaId}/declarations**`, (route) => route.fulfill({ json: [] }))
  await page.route(`**/accounting/pfas/${client.pfaId}/platform-documents**`, (route) => route.fulfill({ json: [] }))
}

/** Profilul clientului, direct pe o secțiune (`prezentare`, `venituri`, `taxe`, `mesaje`…). */
export const clientProfileUrl = (pfaId: string, section: string) => `/contabil?tab=clienti&pfa=${pfaId}&sectiune=${section}`
