import { useState, useEffect } from 'react'
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

function accountStatusDescription(status: string) {
  switch (status.toLowerCase()) {
    case 'activ': return 'Abonament plătit'
    case 'inactiv': return 'Abonament neplătit'
    default: return 'Onboarding / documente'
  }
}

export function ContabilDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPfaId, setSelectedPfaId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
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

  // Load user profile
  useEffect(() => {
    userService.getProfile()
      .then(setProfile)
      .catch(() => {/* silently fail */})
  }, [])

  // Load stats
  const loadStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await pfaService.getContabilStats()
      setStats(data)
    } catch {
      setStatsError('Nu s-au putut încărca statisticile.')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard' && !selectedPfaId) {
      void loadStats()
    }
  }, [activeTab, selectedPfaId])

  // Load clients (PFAs visible to this contabil)
  useEffect(() => {
    if (activeTab !== 'clients') return
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

    const statCards = [
      {
        key: 'totalClients',
        label: 'Clienți PFA',
        value: stats.totalClients,
        color: '#3b82f6', // blue
        desc: 'Total PFA-uri active asignate',
      },
      {
        key: 'docsToVerify',
        label: 'Documente de verificat',
        value: stats.docsToVerify,
        color: '#f59e0b', // amber
        desc: 'Documente încărcate, neverificate',
      },
      {
        key: 'missingMonthlyDocs',
        label: 'Documente lunare lipsă',
        value: stats.missingMonthlyDocs,
        color: '#ef4444', // red
        desc: 'Clienți cu cel puțin un document lipsă',
      },
      {
        key: 'readyToProcess',
        label: 'Gata de procesare',
        value: stats.readyToProcess,
        color: '#6366f1', // indigo
        desc: 'Venituri, cheltuieli și acte validate',
      },
      {
        key: 'processedThisMonth',
        label: 'Procesați luna curentă',
        value: stats.processedThisMonth,
        color: '#10b981', // emerald
        desc: 'PFA-uri cu luna curentă închisă',
      },
      {
        key: 'unreadMessages',
        label: 'Mesaje necitite',
        value: stats.unreadMessages,
        color: '#8b5cf6', // purple
        desc: 'Mesaje de asistență necitite',
      },
    ]

    return (
      <Stack spacing={4}>
        <Box
          sx={{
            p: 4,
            borderRadius: TOKENS.radius.xl,
            background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.08)} 0%, ${alpha(TOKENS.paper, 0.6)} 100%)`,
            border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
            backdropFilter: 'blur(10px)',
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: TOKENS.textSubtle, mb: 1, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
            Portofoliu Contabil · Perioadă Curentă
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, color: TOKENS.primaryStrong, mb: 1 }}>
            {stats.monthLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Urmărește statusul lunii curente, procesează documentele primite și răspunde la mesajele clienților tăi.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {statCards.map((card) => (
            <Paper
              key={card.key}
              elevation={0}
              onClick={() => setActiveTab('clients')}
              sx={{
                p: 3,
                cursor: 'pointer',
                borderRadius: TOKENS.radius.xl,
                border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                boxShadow: TOKENS.shadow.sm,
                background: TOKENS.paper,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  borderColor: alpha(card.color, 0.4),
                  boxShadow: TOKENS.shadow.md,
                  transform: 'translateY(-3px)',
                  '& .value-text': {
                    color: card.color,
                  },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  bgcolor: card.color,
                },
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKENS.textSubtle, mb: 1 }}>
                  {card.label}
                </Typography>
                <Typography
                  className="value-text"
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: TOKENS.ink,
                    transition: 'color 0.2s',
                    mb: 1,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontSize: '0.75rem' }}>
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
            {search ? 'Niciun client găsit.' : 'Nu ai clienți asignați momentan.'}
          </Typography>
        </Box>
      )}

      {!clientsLoading && !clientsError && filteredClients.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 24 }}>
          {filteredClients.map((client) => (
            <Box key={client.id}>
              <Paper
                elevation={0}
                onClick={() => setSelectedPfaId(client.id)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderRadius: TOKENS.radius.lg,
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  boxShadow: TOKENS.shadow.sm,
                  background: `linear-gradient(160deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 32%)`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: alpha(TOKENS.primary, 0.4),
                    boxShadow: TOKENS.shadow.md,
                  },
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }} component="div">
                  <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, fontWeight: 700 }}>
                    {client.userName[0] ?? '?'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>{client.userName}</Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted }} noWrap>{client.userEmail}</Typography>
                  </Box>
                </Stack>

                <Chip
                  label={`${client.accountStatus} (${accountStatusDescription(client.accountStatus)})`}
                  size="small"
                  sx={{
                    mb: 2,
                    alignSelf: 'flex-start',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: alpha(accountStatusColor(client.accountStatus), 0.1),
                    color: accountStatusColor(client.accountStatus),
                    border: `1px solid ${alpha(accountStatusColor(client.accountStatus), 0.2)}`,
                  }}
                />

                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }} component="div">
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                    {client.registrationType}
                  </Typography>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                    {relativeTime(client.createdAtUtc)}
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          ))}
        </Box>
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

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : '...'

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
