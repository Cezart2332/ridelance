import { Suspense } from 'react'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded'
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded'
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import RuleRoundedIcon from '@mui/icons-material/RuleRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import { useSearchParams } from 'react-router-dom'

import { PanelLayout, type PanelNavItem } from '../../../components/panel/PanelLayout'
import { PanelThemeProvider } from '../../../components/panel/PanelThemeProvider'
import type { AccountingRole } from '../api/types'
import AccountingArea, { type AccountingView } from '../ui/AccountingArea'
import type { AccountingTabs } from '../ui/navigation'
import AccountingDebugPage from './AccountingDebugPage'

/** Numele tab-urilor ca în dashboard-ul fiecărui rol, ca navigarea să fie cea reală. */
const TABS: Record<AccountingRole, Required<AccountingTabs>> = {
  Admin: { today: 'contab_azi', pfa: 'contab_pfa', declarations: 'contab_declaratii', vat: 'contab_cod_tva', anaf: 'contab_anaf', rules: 'contab_reguli' },
  Contabil: { today: 'azi', pfa: 'clienti', declarations: 'declaratii', vat: 'cod-tva', anaf: 'anaf', rules: 'reguli' },
}

const VIEWS: [keyof AccountingTabs, AccountingView, string, PanelNavItem['icon']][] = [
  ['today', 'today', 'Rezumat', <ChecklistRoundedIcon key="today" />],
  ['pfa', 'clients', 'Clienți PFA', <AccountBalanceWalletRoundedIcon key="pfa" />],
  ['declarations', 'declarations', 'Declarații', <DescriptionRoundedIcon key="declarations" />],
  ['vat', 'vat', 'Cod TVA', <VerifiedRoundedIcon key="vat" />],
  ['anaf', 'anaf', 'ANAF', <CloudSyncRoundedIcon key="anaf" />],
  ['rules', 'rules', 'Reguli fiscale', <RuleRoundedIcon key="rules" />],
]

/**
 * Doar în dev: modulul de contabilitate montat fără autentificare și fără backend, pe mock, în
 * cadrul real al panoului, cu comutator de rol. Aceleași componente ca în `/admin` și `/contabil`.
 */
export default function AccountingDevShell() {
  const [params, setParams] = useSearchParams()
  const role: AccountingRole = params.get('rol') === 'Contabil' ? 'Contabil' : 'Admin'
  const tabs = TABS[role]
  const tab = params.get('tab')
  const entry = VIEWS.find(([key]) => tabs[key] === tab)
  // `vedere=dosar`: lista și dosarul vechi, păstrate pentru legăturile existente.
  const view: AccountingView | null = entry ? (entry[1] === 'clients' && params.get('vedere') === 'dosar' ? 'pfa' : entry[1]) : null

  const open = (nextTab: string | null, nextRole: AccountingRole = role) => {
    const next = new URLSearchParams()
    next.set('rol', nextRole)
    if (nextTab) next.set('tab', nextTab)
    setParams(next)
  }

  const navItems: PanelNavItem[] = [
    ...VIEWS.filter(([key]) => role === 'Admin' || key !== 'anaf').map(([key, , label, icon]) => ({ id: tabs[key], label, group: 'Contabilitate', icon })),
    { id: 'fixtures', label: 'Fixtures', group: 'Dev', icon: <BugReportRoundedIcon /> },
  ]

  return (
    <PanelThemeProvider>
      <PanelLayout
        workspace={`Dev · ${role}`}
        navItems={navItems}
        activeId={view ? (tab ?? '') : 'fixtures'}
        onNavClick={(id) => open(id === 'fixtures' ? null : id)}
        onLogout={() => open(null)}
        userName={role}
        userRole="mock"
        actions={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={role}
            onChange={(_, value: AccountingRole | null) => value && open(entry ? TABS[value][entry[0]] : null, value)}
            sx={{ '& .MuiToggleButton-root': { height: 30, px: 1.25, fontSize: 12, textTransform: 'none' } }}
          >
            <ToggleButton value="Admin">Admin</ToggleButton>
            <ToggleButton value="Contabil">Contabil</ToggleButton>
          </ToggleButtonGroup>
        }
      >
        {view ? (
          <Suspense fallback={null}>
            <AccountingArea key={role} role={role} tabs={tabs} view={view} />
          </Suspense>
        ) : (
          <AccountingDebugPage />
        )}
      </PanelLayout>
    </PanelThemeProvider>
  )
}
