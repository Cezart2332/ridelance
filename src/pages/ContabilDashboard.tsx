import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import RuleRoundedIcon from '@mui/icons-material/RuleRounded'

import { RouteFallback } from '../components/common/RouteFallback'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { NotificationsInbox } from '../components/notifications/NotificationsPanel'
import { ROUTES } from '../constants/routes'
import { authService } from '../services/auth.service'
import { userService, type UserProfile } from '../services/user.service'
import { displayName } from '../utils/displayName'
import { reloadOnceOnChunkError } from '../utils/lazyWithRetry'

// Modulul de contabilitate PFA (spec contabilitate), comun cu dashboard-ul de admin.
const AccountingArea = lazy(() => import('../shared/accounting/ui/AccountingArea').catch(reloadOnceOnChunkError))

/** Tab-urile modulului: „De făcut azi”, „Clienți PFA” (lista și fișa clientului), declarații, reguli. */
const ACCOUNTING_TABS = { today: 'azi', pfa: 'clienti', declarations: 'declaratii', rules: 'reguli' }
/** Nume vechi ale tabului de clienți, din notificări și legături salvate. */
const LEGACY_CLIENT_TABS = ['clients', 'pfa']
const VIEW_OF: Record<string, 'today' | 'clients' | 'declarations' | 'rules'> = {
  [ACCOUNTING_TABS.today]: 'today',
  [ACCOUNTING_TABS.pfa]: 'clients',
  [ACCOUNTING_TABS.declarations]: 'declarations',
  [ACCOUNTING_TABS.rules]: 'rules',
}

export function ContabilDashboard() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [manualTab, setActiveTab] = useState(ACCOUNTING_TABS.today)
  const requestedTab = params.get('tab') ?? ''
  const linkedTab = LEGACY_CLIENT_TABS.includes(requestedTab) ? ACCOUNTING_TABS.pfa : requestedTab
  const activeTab = ['notificari', ...Object.values(ACCOUNTING_TABS)].includes(linkedTab) ? linkedTab : manualTab
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService
      .getProfile()
      .then(setProfile)
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  const navItems = [
    { id: ACCOUNTING_TABS.today, label: 'De făcut azi', icon: <ChecklistRoundedIcon /> },
    { id: ACCOUNTING_TABS.pfa, label: 'Clienți PFA', icon: <GroupsRoundedIcon /> },
    { id: ACCOUNTING_TABS.declarations, label: 'Declarații', icon: <DescriptionRoundedIcon /> },
    { id: ACCOUNTING_TABS.rules, label: 'Reguli fiscale', icon: <RuleRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => {
        navigate('/contabil')
        setActiveTab(id)
      }}
      onLogout={handleLogout}
      userName={profile ? displayName(profile) : '...'}
      userRole="Contabil"
    >
      {activeTab === 'notificari' ? (
        <NotificationsInbox />
      ) : (
        <Suspense fallback={<RouteFallback />}>
          <AccountingArea role="Contabil" tabs={ACCOUNTING_TABS} view={VIEW_OF[activeTab] ?? 'today'} />
        </Suspense>
      )}
    </DashboardLayout>
  )
}
