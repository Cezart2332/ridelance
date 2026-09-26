import { Suspense } from 'react'
import { Box, Button, CssBaseline, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { useSearchParams } from 'react-router-dom'

import { adminTheme } from '../../../theme/adminTheme'
import type { AccountingRole } from '../api/types'
import AccountingArea from '../ui/AccountingArea'
import AccountingDebugPage from './AccountingDebugPage'

/** Numele tab-urilor ca în dashboard-ul fiecărui rol, ca navigarea să fie cea reală. */
const TABS: Record<AccountingRole, { pfa: string; declarations: string; rules: string }> = {
  Admin: { pfa: 'contab_pfa', declarations: 'contab_declaratii', rules: 'contab_reguli' },
  Contabil: { pfa: 'pfa', declarations: 'declaratii', rules: 'reguli' },
}

/**
 * Doar în dev: modulul de contabilitate montat fără autentificare și fără backend, pe mock, cu
 * comutator de rol. Aceleași componente ca în `/admin` și `/contabil`.
 */
export default function AccountingDevShell() {
  const [params, setParams] = useSearchParams()
  const role: AccountingRole = params.get('rol') === 'Contabil' ? 'Contabil' : 'Admin'
  const tabs = TABS[role]
  const tab = params.get('tab')
  const view = tab === tabs.declarations ? 'declarations' : tab === tabs.rules ? 'rules' : tab === tabs.pfa ? 'pfa' : null

  const open = (nextTab: string | null, nextRole: AccountingRole = role) => {
    const next = new URLSearchParams()
    next.set('rol', nextRole)
    if (nextTab) next.set('tab', nextTab)
    setParams(next)
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Stack
          direction="row"
          sx={{ gap: 1, px: { xs: 2, md: 4 }, py: 1.5, alignItems: 'center', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            Dev · contabilitate (mock)
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={role}
            onChange={(_, value: AccountingRole | null) => value && open(view ? TABS[value][view === 'pfa' ? 'pfa' : view] : null, value)}
          >
            <ToggleButton value="Admin">Admin</ToggleButton>
            <ToggleButton value="Contabil">Contabil</ToggleButton>
          </ToggleButtonGroup>
          <Button size="small" variant={view === 'pfa' ? 'contained' : 'text'} onClick={() => open(tabs.pfa)}>
            PFA
          </Button>
          <Button size="small" variant={view === 'declarations' ? 'contained' : 'text'} onClick={() => open(tabs.declarations)}>
            Declarații
          </Button>
          <Button size="small" variant={view === 'rules' ? 'contained' : 'text'} onClick={() => open(tabs.rules)}>
            Reguli fiscale
          </Button>
          <Button size="small" variant={view === null ? 'contained' : 'text'} onClick={() => open(null)}>
            Fixtures
          </Button>
        </Stack>
        {view ? (
          <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <Suspense fallback={null}>
              <AccountingArea key={role} role={role} tabs={tabs} view={view} />
            </Suspense>
          </Box>
        ) : (
          <AccountingDebugPage />
        )}
      </Box>
    </ThemeProvider>
  )
}
