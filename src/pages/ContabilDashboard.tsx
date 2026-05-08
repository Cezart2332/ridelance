import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
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
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import InboxRoundedIcon from '@mui/icons-material/InboxRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

import { documentService, type DocumentSummary } from '../services/document.service'
import { ProfessionalChatBox } from '../components/dashboard/sections/ProfessionalChatBox'

interface ClientSummary {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: string
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

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'approved': return '#10b981'
    case 'verified': return '#10b981'
    case 'rejected': return '#ef4444'
    default: return '#f59e0b'
  }
}

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'approved': return 'Aprobat'
    case 'verified': return 'Verificat'
    case 'rejected': return 'Respins'
    default: return 'În așteptare'
  }
}

export function ContabilDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('clients')
  const [selectedPfaId, setSelectedPfaId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('Aprilie')
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

  // Load user profile
  useEffect(() => {
    userService.getProfile()
      .then(setProfile)
      .catch(() => {/* silently fail */})
  }, [])

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

  // Documents
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (!selectedPfaId) return
    const client = clients.find(c => c.id === selectedPfaId)
    if (!client) return

    setDocsLoading(true)
    setDocsError(null)
    documentService.getByUser(client.userId)
      .then(setDocuments)
      .catch(() => setDocsError('Ne pare rău, documentele nu au putut fi încărcate. Te rugăm să verifici conexiunea și să încerci din nou.'))
      .finally(() => setDocsLoading(false))
  }, [selectedPfaId, clients])

  const handleDownload = async (doc: DocumentSummary) => {
    setDownloadingId(doc.id)
    try {
      await documentService.downloadAndSave(doc.id, doc.originalFileName)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleUpdateDocStatus = async (id: string, status: 'Verified' | 'Rejected') => {
    setStatusUpdatingId(id)
    try {
      await documentService.updateStatus(id, status)
      setDocuments(docs => docs.map(d => d.id === id ? { ...d, status } : d))
      setSnackbar({ open: true, message: `Documentul a fost ${status === 'Verified' ? 'aprobat' : 'respins'} cu succes.`, severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Nu am putut actualiza statusul documentului. Te rugăm să încerci din nou.', severity: 'error' })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const navItems = [
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
          sx={{ width: 300, ...inputSx }}
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
    return (
      <Stack spacing={4} component="div">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setSelectedPfaId(null)}
            size="small"
            sx={{
              bgcolor: alpha(TOKENS.paper, 0.9),
              border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
              '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08) },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{client?.userName}</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{client?.userEmail}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 24 }}>
          <Box>
            <Stack spacing={4} component="div">
              {/* Incomes section — no backend endpoint yet */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: TOKENS.radius.xl,
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  boxShadow: TOKENS.shadow.sm,
                  background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 35%)`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Venituri Client</Typography>
                  <Select
                    size="small"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    sx={{ width: 140, borderRadius: TOKENS.radius.md, bgcolor: TOKENS.paper }}
                  >
                    {['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'].map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <InboxRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                    Nu există date de venituri disponibile pentru {selectedMonth}.
                  </Typography>
                </Box>
              </Paper>

              {/* Documente PFA */}
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: TOKENS.radius.xl, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Documente de verificat</Typography>
                </Box>
                
                {docsLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
                  </Box>
                )}
                {docsError && <Alert severity="error">{docsError}</Alert>}
                {!docsLoading && !docsError && documents.length === 0 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <InboxRoundedIcon sx={{ fontSize: 40, color: TOKENS.textSubtle, mb: 1 }} />
                    <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                      Niciun document încărcat de client.
                    </Typography>
                  </Box>
                )}
                {!docsLoading && !docsError && documents.length > 0 && (
                  <Stack spacing={2} component="div">
                    {documents.map((doc) => (
                      <Paper
                        key={doc.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          borderRadius: TOKENS.radius.md,
                          bgcolor: alpha(TOKENS.surface, 0.5),
                          border: `1px solid ${alpha(TOKENS.ink, 0.08)}`
                        }}
                      >
                        <InsertDriveFileRoundedIcon sx={{ color: TOKENS.primary, fontSize: 24 }} />
                        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap title={doc.originalFileName}>
                            {doc.originalFileName}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                              {doc.category}
                            </Typography>
                            <Chip
                              label={statusLabel(doc.status)}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700, bgcolor: alpha(statusColor(doc.status), 0.1), color: statusColor(doc.status) }}
                            />
                          </Stack>
                        </Box>
                        
                        <Stack direction="row" spacing={1}>
                          {doc.status.toLowerCase() === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateDocStatus(doc.id, 'Verified')}
                                disabled={statusUpdatingId === doc.id}
                                sx={{ color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.1) } }}
                                title="Aprobă document"
                              >
                                {statusUpdatingId === doc.id ? <CircularProgress size={18} color="inherit" /> : <CheckCircleRoundedIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateDocStatus(doc.id, 'Rejected')}
                                disabled={statusUpdatingId === doc.id}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}
                                title="Respinge document"
                              >
                                <CancelRoundedIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            startIcon={downloadingId === doc.id ? <CircularProgress size={16} /> : <FileDownloadRoundedIcon />}
                            sx={{ textTransform: 'none', borderRadius: TOKENS.radius.full }}
                          >
                            Descarcă
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Box>

          <Box>
            {/* Chat Section */}
            {client && (
              <ProfessionalChatBox clientUserId={client.userId} clientName={client.userName} />
            )}
          </Box>
        </Box>
      </Stack>
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
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            bgcolor: n.isRead ? alpha(TOKENS.paper, 0.86) : alpha(TOKENS.primary, 0.04),
            boxShadow: TOKENS.shadow.sm,
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
          : renderClientList()}
          
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: TOKENS.radius.md, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  )
}
