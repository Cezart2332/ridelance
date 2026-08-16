import { useState, useEffect } from 'react'
import { ROUTES } from '../constants/routes'
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  Chip,
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
import { notificationService, type Notification } from '../services/notification.service'
import { userService, type UserProfile } from '../services/user.service'
import { authService } from '../services/auth.service'
import { useNavigate } from 'react-router-dom'

// Icons
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'

import { ProfessionalChatBox } from '../components/dashboard/sections/ProfessionalChatBox'
import { ContabilClientWorkspace, type ContabilClientInfo } from '../components/contabil/ContabilClientWorkspace'
import { displayName } from '../utils/displayName'

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

function relativeTime(utcString: string): string {
  const date = new Date(utcString)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Acum ${mins} minute`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Acum ${hours} ${hours === 1 ? 'oră' : 'ore'}`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ieri'
  return `Acum ${days} zile`
}

function accountStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'activ': return '#10b981'
    case 'inactiv': return '#ef4444'
    default: return '#6366f1'
  }
}

function isActiveClient(client: { accountStatus: string }) {
  return client.accountStatus.toLowerCase() === 'activ'
}

const ROMANIAN_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

export function ContabilDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPfaId, setSelectedPfaId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  const [clients, setClients] = useState<ClientSummary[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [notifsError, setNotifsError] = useState<string | null>(null)

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

  // Month filter for the home page stats
  const now = new Date()
  const [statsYear, setStatsYear] = useState(now.getFullYear())
  const [statsMonth, setStatsMonth] = useState(now.getMonth() + 1)

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
    if (activeTab === 'dashboard' && !selectedPfaId) {
      void loadStats(statsYear, statsMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedPfaId, statsYear, statsMonth])

  // Load clients (PFAs visible to this contabil) — needed on home (active/inactive split) and on the list
  useEffect(() => {
    if (activeTab !== 'clients' && activeTab !== 'dashboard') return
    setClientsLoading(true)
    setClientsError(null)
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
      .catch(() => setClientsError('Nu s-au putut încărca clienții.'))
      .finally(() => setClientsLoading(false))
  }, [activeTab])

  // Load notifications when on that tab
  useEffect(() => {
    if (activeTab !== 'notificari') return
    setNotifsLoading(true)
    setNotifsError(null)
    notificationService.getAll()
      .then(setNotifications)
      .catch(() => setNotifsError('Nu s-au putut încărca notificările.'))
      .finally(() => setNotifsLoading(false))
  }, [activeTab])

  const navItems = [
    { id: 'dashboard', label: 'Acasă', icon: <HomeRoundedIcon /> },
    { id: 'clients', label: 'Clienți PFA', icon: <GroupsRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: alpha(TOKENS.paper, 0.9),
      borderRadius: TOKENS.radius.md,
      '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(TOKENS.primary, 0.6),
        borderWidth: 2,
      },
    },
  }

  const filteredClients = clients.filter(
    (c) =>
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase())
  )

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
        <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>
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
        label: 'PFA-uri active',
        value: activeClients,
        color: '#10b981',
        desc: 'Clienți cu abonament activ',
      },
      {
        key: 'inactiveClients',
        label: 'PFA-uri inactive',
        value: inactiveClients,
        color: '#ef4444',
        desc: 'Clienți suspendați, noi sau fără abonament',
      },
      {
        key: 'docsToVerify',
        label: 'Documente de verificat',
        value: stats.docsToVerify,
        color: '#f59e0b',
        desc: 'Documente încărcate, neverificate',
      },
      {
        key: 'missingMonthlyDocs',
        label: 'Documente lunare lipsă',
        value: stats.missingMonthlyDocs,
        color: '#dc2626',
        desc: 'Clienți cu cel puțin un document lipsă',
      },
      {
        key: 'readyToProcess',
        label: 'Gata de procesare',
        value: stats.readyToProcess,
        color: '#6366f1',
        desc: 'Venituri, cheltuieli și acte validate',
      },
      {
        key: 'processedThisMonth',
        label: 'Procesați în luna aleasă',
        value: stats.processedThisMonth,
        color: '#0f766e',
        desc: 'PFA-uri cu luna închisă',
      },
      {
        key: 'unreadMessages',
        label: 'Mesaje necitite',
        value: stats.unreadMessages,
        color: '#8b5cf6',
        desc: 'Mesaje de asistență necitite',
      },
      {
        key: 'totalClients',
        label: 'Total clienți PFA',
        value: stats.totalClients,
        color: '#3b82f6',
        desc: 'Toate PFA-urile din portofoliul tău',
      },
    ]

    return (
      <Stack spacing={3}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: TOKENS.radius.xl,
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: TOKENS.textSubtle, mb: 0.5, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                Portofoliu contabil
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: TOKENS.primaryStrong, mb: 0.5 }}>
                {stats.monthLabel}
              </Typography>
              <Typography variant="body2" sx={{ color: TOKENS.textMuted, maxWidth: 520 }}>
                Urmărește statusul lunii selectate, procesează documentele primite și răspunde la mesajele clienților.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ width: 150 }}>
                <InputLabel>Lună</InputLabel>
                <Select
                  label="Lună"
                  value={statsMonth}
                  onChange={(e) => setStatsMonth(Number(e.target.value))}
                  sx={{ borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
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
                  sx={{ borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
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
              onClick={() => setActiveTab('clients')}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                borderRadius: TOKENS.radius.lg,
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
              <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontSize: '0.74rem' }}>
                {card.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Stack>
    )
  }

  const renderClientList = () => (
    <Stack spacing={3} component="div">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchRoundedIcon sx={{ color: TOKENS.textSubtle, fontSize: 20 }} />
        <TextField
          variant="outlined"
          size="small"
          placeholder="Caută client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 300 }, maxWidth: '100%', ...inputSx }}
        />
      </Box>

      {clientsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: TOKENS.primary }} />
        </Box>
      )}

      {clientsError && (
        <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>{clientsError}</Alert>
      )}

      {!clientsLoading && !clientsError && filteredClients.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TOKENS.textMuted }}>
            {search ? 'Niciun client găsit.' : 'Nu ai încă clienți în portofoliu.'}
          </Typography>
        </Box>
      )}

      {!clientsLoading && !clientsError && filteredClients.length > 0 && (
        <Stack spacing={3}>
          {[
            { title: 'PFA-uri active', items: filteredClients.filter(isActiveClient), accent: '#10b981' },
            { title: 'PFA-uri inactive', items: filteredClients.filter((c) => !isActiveClient(c)), accent: '#ef4444' },
          ].map((group) => (
            <Box key={group.title}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink }}>
                  {group.title}
                </Typography>
                <Chip
                  label={group.items.length}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    color: group.accent,
                    bgcolor: alpha(group.accent, 0.1),
                  }}
                />
              </Stack>

              {group.items.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px dashed ${alpha(TOKENS.ink, 0.14)}` }}
                >
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                    Niciun client în această categorie.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {group.items.map((client) => (
                    <Paper
                      key={client.id}
                      elevation={0}
                      onClick={() => setSelectedPfaId(client.id)}
                      sx={{
                        p: 2.25,
                        cursor: 'pointer',
                        borderRadius: TOKENS.radius.lg,
                        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                        bgcolor: TOKENS.paper,
                        transition: 'all 0.2s',
                        minWidth: 0,
                        '&:hover': {
                          borderColor: alpha(TOKENS.primary, 0.4),
                          boxShadow: TOKENS.shadow.md,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }} component="div">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, fontWeight: 700 }}>
                          {client.userName[0] ?? '?'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{client.userName}</Typography>
                          <Typography variant="caption" sx={{ color: TOKENS.textMuted }} noWrap>{client.userEmail}</Typography>
                        </Box>
                        <Chip
                          label={client.accountStatus}
                          size="small"
                          sx={{
                            flexShrink: 0,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            bgcolor: alpha(accountStatusColor(client.accountStatus), 0.1),
                            color: accountStatusColor(client.accountStatus),
                          }}
                        />
                      </Stack>

                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }} component="div">
                        <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                          {client.registrationType}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                          {relativeTime(client.createdAtUtc)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )

  const renderClientDetail = () => {
    const client = clients.find((c) => c.id === selectedPfaId)
    if (!client) return null

    const clientInfo: ContabilClientInfo = {
      id: client.id,
      userId: client.userId,
      userName: client.userName,
      userEmail: client.userEmail,
      status: client.status,
    }

    return (
      <ContabilClientWorkspace
        client={clientInfo}
        onBack={() => {
          setSelectedPfaId(null)
          void loadStats() // Refresh stats when returning from a client workspace
        }}
        chatSlot={
          <ProfessionalChatBox clientUserId={client.userId} clientName={client.userName} />
        }
      />
    )
  }

  const renderNotifications = () => (
    <Stack spacing={1.5} sx={{ maxWidth: 600 }}>
      {notifsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
        </Box>
      )}
      {notifsError && (
        <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>{notifsError}</Alert>
      )}
      {!notifsLoading && !notifsError && notifications.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TOKENS.textMuted }}>
            Nu ai notificări momentan.
          </Typography>
        </Box>
      )}
      {!notifsLoading && !notifsError && notifications.map((n) => (
        <Paper
          key={n.id}
          elevation={0}
          onClick={() => {
            if (!n.isRead) {
              notificationService.markAsRead(n.id).then(() => {
                setNotifications((prev) =>
                  prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
                )
              })
            }
          }}
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            bgcolor: n.isRead ? alpha(TOKENS.paper, 0.86) : alpha(TOKENS.primary, 0.04),
            boxShadow: TOKENS.shadow.sm,
            cursor: n.isRead ? 'default' : 'pointer',
            '&:hover': { borderColor: alpha(TOKENS.primary, 0.28), bgcolor: TOKENS.paper },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: TOKENS.radius.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(TOKENS.primary, 0.08),
              color: TOKENS.primaryStrong,
            }}
          >
            <NotificationsActiveRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: n.isRead ? 600 : 800, color: TOKENS.ink, fontSize: '0.85rem' }}>
              {n.text}
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontSize: '0.75rem' }}>
              {relativeTime(n.createdAtUtc)}
            </Typography>
          </Box>
          {!n.isRead && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TOKENS.primary, flexShrink: 0 }} />
          )}
        </Paper>
      ))}
    </Stack>
  )

  const userName = profile ? displayName(profile) : '...'

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => {
        setActiveTab(id)
        if (id !== 'clients') setSelectedPfaId(null)
      }}
      onLogout={handleLogout}
      userName={userName}
      userRole="Contabil"
    >
      {selectedPfaId
        ? renderClientDetail()
        : activeTab === 'notificari'
          ? renderNotifications()
          : activeTab === 'dashboard'
            ? renderGlobalStats()
            : renderClientList()}
    </DashboardLayout>
  )
}
