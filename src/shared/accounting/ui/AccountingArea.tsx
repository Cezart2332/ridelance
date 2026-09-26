import { useCallback, useMemo, useState } from 'react'
import { Alert, Box, Snackbar } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { adminTheme } from '../../../theme/adminTheme'
import type { AccountingRole } from '../api/types'
import { MonthDashboardView } from './month/MonthDashboardView'
import { AccountingConfigContext, useAccountingNav, type AccountingTabs } from './navigation'
import { NotifyContext, type Notice, type NotifySeverity } from './notify'
import { PfaDossierView } from './pfa/PfaDossierView'
import { PfaListView } from './pfa/PfaListView'
import { TaxRulesView } from './rules/TaxRulesView'

export type AccountingView = 'pfa' | 'declarations' | 'rules'

function AccountingContent({ view }: { view: AccountingView }) {
  const nav = useAccountingNav()
  if (view === 'declarations') return <MonthDashboardView />
  if (view === 'rules') return <TaxRulesView />
  return nav.pfaId ? <PfaDossierView key={nav.pfaId} pfaId={nav.pfaId} /> : <PfaListView />
}

/**
 * Modulul de contabilitate PFA, același în dashboard-ul ADMIN și în cel al contabilului
 * (spec §0 pct. 6): rolul și numele tab-urilor vin ca props, restul e comun.
 *
 * Tema e cea de admin, aplicată și sub layout-ul contabilului, ca modulul să arate la fel oriunde.
 */
export default function AccountingArea({ role, view, tabs }: { role: AccountingRole; view: AccountingView; tabs: AccountingTabs }) {
  const config = useMemo(() => ({ role, tabs }), [role, tabs])
  const [notice, setNotice] = useState<Notice | null>(null)
  const notify = useCallback((message: string, severity: NotifySeverity = 'success') => {
    setNotice({ id: Date.now(), message, severity })
  }, [])

  return (
    <ThemeProvider theme={adminTheme}>
      <AccountingConfigContext.Provider value={config}>
        <NotifyContext.Provider value={notify}>
          <Box sx={{ minWidth: 0 }}>
            <AccountingContent view={view} />
          </Box>
          <Snackbar
            key={notice?.id}
            open={notice !== null}
            autoHideDuration={5000}
            onClose={() => setNotice(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={notice?.severity ?? 'success'} onClose={() => setNotice(null)} sx={{ width: '100%' }}>
              {notice?.message}
            </Alert>
          </Snackbar>
        </NotifyContext.Provider>
      </AccountingConfigContext.Provider>
    </ThemeProvider>
  )
}
