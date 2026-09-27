import { useSearchParams } from 'react-router-dom'
import { NotificationsInbox } from '../components/notifications/NotificationsPanel'
import { useState, useEffect, lazy, Suspense } from 'react'
import { ROUTES } from '../constants/routes'
import {
  Box,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { TOKENS } from '../constants/tokens'
import { pfaService } from '../services/pfa.service'

import { userService, type UserProfile } from '../services/user.service'
import { authService } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

// Icons
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'

import { displayName } from '../utils/displayName'
import { reloadOnceOnChunkError } from '../utils/lazyWithRetry'
import { RouteFallback } from '../components/common/RouteFallback'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import RuleRoundedIcon from '@mui/icons-material/RuleRounded'

// Modulul de contabilitate PFA (spec contabilitate), comun cu dashboard-ul de admin.
const AccountingArea = lazy(() => import('../shared/accounting/ui/AccountingArea').catch(reloadOnceOnChunkError))
// „Clienți PFA” e tabul `pfa` al modulului: lista și profilul clientului, cu dosarul contabil.
const ACCOUNTING_TABS = { pfa: 'clienti', declarations: 'declaratii', rules: 'reguli' }
/** Nume vechi ale tabului de clienți, din notificări și legături salvate. */
const LEGACY_CLIENT_TABS = ['clients', 'pfa']
import { requestedAccountingMonth } from '../utils/accountingPeriod'

interface ClientSummary {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: string
  accountStatus: string
  subscriptionStatus: string | null
  registrationType: string
  documentCount: number
  createdAtUtc: string
}

function isActiveClient(client: { accountStatus: string }) {
  return client.accountStatus.toLowerCase() === 'activ'
}

const ROMANIAN_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

export function ContabilDashboard() {
  const [notificationParams] = useSearchParams()

  const navigate = useNavigate()
  const [manualTab, setActiveTab] = useState('dashboard')
  const requestedTab = notificationParams.get('tab') ?? ''
  const linkedTab = LEGACY_CLIENT_TABS.includes(requestedTab) ? ACCOUNTING_TABS.pfa : requestedTab
  const activeTab = ['notificari', ...Object.values(ACCOUNTING_TABS)].includes(linkedTab) ? linkedTab : manualTab

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  const [clients, setClients] = useState<ClientSummary[]>([])

  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [stats, setStats] = useState<{
    totalClients: number
    docsToVerify: number
    missingMonthlyDocs: number
    readyToProcess: number
    processedThisMonth: number
    unreadMessages: number
    monthLabel: string
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Luna pentru statisticile de pe Acasă: luna contabilă deschisă acum (până pe 25, luna trecută).
  const now = new Date()
  const [statsYear, setStatsYear] = useState(() => requestedAccountingMonth().year)
  const [statsMonth, setStatsMonth] = useState(() => requestedAccountingMonth().month)

  // Load user profile
  useEffect(() => {
    userService.getProfile()
      .then(setProfile)
      .catch(() => {/* silently fail */})
  }, [])

  // Load stats
  const loadStats = async (year = statsYear, month = statsMonth) => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await pfaService.getContabilStats(year, month)
      setStats(data)
    } catch {
      setStatsError('Nu s-au putut încărca statisticile.')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      void loadStats(statsYear, statsMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statsYear, statsMonth])

  // Clienții alocați contabilului: pe Acasă, pentru împărțirea activi / inactivi.
  useEffect(() => {
    if (activeTab !== 'dashboard') return
    pfaService.getAll()
      .then((data) => {
        const items = data?.items ?? data ?? []
        setClients(items.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail,
          status: item.status,
          accountStatus: item.accountStatus ?? 'Nou',
          subscriptionStatus: item.subscriptionStatus ?? null,
          registrationType: item.registrationType,
          documentCount: item.documentCount,
          createdAtUtc: item.createdAtUtc,
        })))
      })
      .catch(() => setClients([]))
  }, [activeTab])

  const navItems = [
    { id: 'dashboard', label: 'Acasă', icon: <HomeRoundedIcon /> },
    { id: ACCOUNTING_TABS.pfa, label: 'Clienți PFA', icon: <GroupsRoundedIcon /> },
    { id: ACCOUNTING_TABS.declarations, label: 'Declarații', icon: <DescriptionRoundedIcon /> },
    { id: ACCOUNTING_TABS.rules, label: 'Reguli fiscale', icon: <RuleRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const renderGlobalStats = () => {
    if (statsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} sx={{ color: TOKENS.primary }} />
        </Box>
      )
    }

    if (statsError) {
      return (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {statsError}
        </Alert>
      )
    }

    if (!stats) return null

    const activeClients = clients.filter(isActiveClient).length
    const inactiveClients = clients.length - activeClients

    const statCards = [
      {
        key: 'activeClients',
        label: 'Abonament activ',
        value: activeClients,
        color: '#10b981',
      },
      {
        key: 'inactiveClients',
        label: 'Fără abonament activ',
        value: inactiveClients,
        color: '#ef4444',
      },
      {
        key: 'docsToVerify',
        label: 'Documente de verificat',
        value: stats.docsToVerify,
        color: '#f59e0b',
      },
      {
        key: 'missingMonthlyDocs',
        label: 'Documente lunare lipsă',
        value: stats.missingMonthlyDocs,
        color: '#dc2626',
      },
      {
        key: 'readyToProcess',
        label: 'Gata de procesare',
        value: stats.readyToProcess,
        color: '#6366f1',
      },
      {
        key: 'processedThisMonth',
        label: 'Procesați în luna aleasă',
        value: stats.processedThisMonth,
        color: '#0f766e',
      },
      {
        key: 'unreadMessages',
        label: 'Mesaje necitite',
        value: stats.unreadMessages,
        color: '#8b5cf6',
      },
      {
        key: 'totalClients',
        label: 'Total clienți PFA',
        value: stats.totalClients,
        color: '#3b82f6',
      },
    ]

    return (
      <Stack spacing={3}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: `${TOKENS.radius.xl}px`,
            background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.08)} 0%, ${alpha(TOKENS.paper, 0.6)} 100%)`,
            border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: TOKENS.primaryStrong, mb: 0.5 }}>
                {stats.monthLabel}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Lună</InputLabel>
                <Select
                  label="Lună"
                  value={statsMonth}
                  onChange={(e) => setStatsMonth(Number(e.target.value))}
                  sx={{ borderRadius: `${TOKENS.radius.md}px`, bgcolor: TOKENS.paper }}
                >
                  {ROMANIAN_MONTHS.map((m, idx) => (
                    <MenuItem key={m} value={idx + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>An</InputLabel>
                <Select
                  label="An"
                  value={statsYear}
                  onChange={(e) => setStatsYear(Number(e.target.value))}
                  sx={{ borderRadius: `${TOKENS.radius.md}px`, bgcolor: TOKENS.paper }}
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {statCards.map((card) => (
            <Paper
              key={card.key}
              elevation={0}
              onClick={() => setActiveTab(ACCOUNTING_TABS.pfa)}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                borderRadius: `${TOKENS.radius.lg}px`,
                border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                boxShadow: TOKENS.shadow.sm,
                background: TOKENS.paper,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minWidth: 0,
                '&:hover': {
                  borderColor: alpha(card.color, 0.4),
                  boxShadow: TOKENS.shadow.md,
                  transform: 'translateY(-3px)',
                  '& .value-text': {
                    color: card.color,
                  },
                },
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKENS.textSubtle, mb: 0.75, fontSize: '0.8rem' }}>
                  {card.label}
                </Typography>
                <Typography
                  className="value-text"
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: TOKENS.ink,
                    transition: 'color 0.2s',
                    mb: 0.75,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Stack>
    )
  }

  const renderNotifications = () => <NotificationsInbox />

  const userName = profile ? displayName(profile) : '...'

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => {
        navigate('/contabil')
        setActiveTab(id)
      }}
      onLogout={handleLogout}
      userName={userName}
      userRole="Contabil"
    >
      {Object.values(ACCOUNTING_TABS).includes(activeTab)
        ? (
          <Suspense fallback={<RouteFallback />}>
            <AccountingArea
              role="Contabil"
              tabs={ACCOUNTING_TABS}
              view={activeTab === ACCOUNTING_TABS.pfa ? 'clients' : activeTab === ACCOUNTING_TABS.declarations ? 'declarations' : 'rules'}
            />
          </Suspense>
        )
        : activeTab === 'notificari'
          ? renderNotifications()
          : renderGlobalStats()}
    </DashboardLayout>
  )
}
