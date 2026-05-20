import { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Stack, TextField, Typography, Card, CardContent,
  CircularProgress, Alert, Chip, Button, IconButton, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { pfaService } from '../services/pfa.service'
import { notificationService, type Notification } from '../services/notification.service'
import { userService, type UserProfile } from '../services/user.service'
import { documentService, type DocumentSummary } from '../services/document.service'
import { authService } from '../services/auth.service'

import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import SupervisedUserCircleRoundedIcon from '@mui/icons-material/SupervisedUserCircleRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import { validateRomanianCIF } from '../utils/validation'
import { formatRegistrationType, formatDocumentCategory } from '../utils/formatters'

import { AdminChatView } from '../components/dashboard/sections/AdminChatView'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { ServicesAdminView } from '../components/dashboard/sections/admin/ServicesAdminView'

interface PfaSummary {
  id: string
  userId: string
  userEmail: string
  userName: string
  registrationType: string
  status: string
  documentCount: number
  createdAtUtc: string
  lastActivityAtUtc: string | null
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(TOKENS.paper, 0.92),
    borderRadius: TOKENS.radius.md,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pfa')
  const [search, setSearch] = useState('')

  // PFA list
  const [pfas, setPfas] = useState<PfaSummary[]>([])
  const [pfasLoading, setPfasLoading] = useState(false)
  const [pfasError, setPfasError] = useState<string | null>(null)

  // PFA detail
  const [selectedPfa, setSelectedPfa] = useState<PfaSummary | null>(null)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusUpdatingDocId, setStatusUpdatingDocId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; action: 'Approved' | 'Rejected' | null }>({ open: false, action: null })
  const [reviewNote, setReviewNote] = useState('')
  const [cui, setCui] = useState('')
  const [certificatFile, setCertificatFile] = useState<File | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Invite accountant
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [notifsError, setNotifsError] = useState<string | null>(null)

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(() => {})
  }, [])

  useEffect(() => {
    if ((activeTab !== 'pfa' && activeTab !== 'pfa_inrolate') || selectedPfa) return
    setPfasLoading(true)
    setPfasError(null)
    pfaService.getAll()
      .then((data) => {
        const items = data?.items ?? data ?? []
        setPfas(items.map((item: any) => ({
          id: item.id, userId: item.userId, userEmail: item.userEmail,
          userName: item.userName, registrationType: item.registrationType,
          status: item.status, documentCount: item.documentCount, createdAtUtc: item.createdAtUtc,
          lastActivityAtUtc: item.lastActivityAtUtc,
        })))
      })
      .catch(() => setPfasError('Nu s-au putut încărca înregistrările PFA.'))
      .finally(() => setPfasLoading(false))
  }, [activeTab, selectedPfa])

  useEffect(() => {
    if (!selectedPfa) return
    setDocsLoading(true)
    setDocsError(null)
    documentService.getByUser(selectedPfa.userId)
      .then(setDocuments)
      .catch(() => setDocsError('Ne pare rău, documentele nu au putut fi încărcate. Te rugăm să verifici conexiunea și să încerci din nou.'))
      .finally(() => setDocsLoading(false))
  }, [selectedPfa])

  useEffect(() => {
    if (activeTab !== 'notificari') return
    setNotifsLoading(true)
    setNotifsError(null)
    notificationService.getAll()
      .then(setNotifications)
      .catch(() => setNotifsError('Nu s-au putut încărca notificările.'))
      .finally(() => setNotifsLoading(false))
  }, [activeTab])

  const handleDownload = useCallback(async (doc: DocumentSummary) => {
    setDownloadingId(doc.id)
    try {
      await documentService.downloadAndSave(doc.id, doc.originalFileName)
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const handleUpdateDocStatus = async (id: string, status: 'Verified' | 'Rejected') => {
    setStatusUpdatingDocId(id)
    try {
      await documentService.updateStatus(id, status)
      setDocuments(docs => docs.map(d => d.id === id ? { ...d, status } : d))
      setSnackbar({ open: true, message: `Documentul a fost ${status === 'Verified' ? 'aprobat' : 'respins'} cu succes.`, severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Nu am putut actualiza statusul documentului. Te rugăm să încerci din nou.', severity: 'error' })
    } finally {
      setStatusUpdatingDocId(null)
    }
  }

  const handleOpenStatusDialog = (action: 'Approved' | 'Rejected') => {
    setReviewNote('')
    setCui('')
    setCertificatFile(null)
    setStatusError(null)
    setStatusDialog({ open: true, action })
  }

  const handleConfirmStatus = async () => {
    if (!selectedPfa || !statusDialog.action) return
    
    if (statusDialog.action === 'Approved') {
      const cuiValidation = validateRomanianCIF(cui);
      if (typeof cuiValidation === 'string') {
        setStatusError(cuiValidation);
        return;
      }
      if (!certificatFile) {
        setStatusError('Certificatul de înregistrare este obligatoriu pentru aprobare.');
        return;
      }
    }

    setStatusUpdating(true);
    setStatusError(null);
    try {
      let documentId: string | undefined;
      
      // Upload certificat if approved
      if (statusDialog.action === 'Approved' && certificatFile) {
        const uploadResponse = await documentService.upload(
          certificatFile,
          'CertificatInregistrare',
          selectedPfa.id,
          selectedPfa.userId
        );
        documentId = uploadResponse.documentId;
      }

      await pfaService.updateStatus(
        selectedPfa.id, 
        statusDialog.action, 
        reviewNote || undefined,
        statusDialog.action === 'Approved' ? cui : undefined,
        documentId
      );
      
      setSelectedPfa((prev) => prev ? { ...prev, status: statusDialog.action! } : prev)
      setStatusDialog({ open: false, action: null })
      setSnackbar({ open: true, message: `Statusul a fost actualizat cu succes.`, severity: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Actualizarea statusului a eșuat. Încearcă din nou.'
      setStatusError(msg)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleInviteContabil = async () => {
    if (!inviteName || !inviteEmail) {
      setSnackbar({ open: true, message: 'Te rugăm să completezi toate câmpurile.', severity: 'error' })
      return
    }

    setInviteLoading(true)
    try {
      await userService.inviteContabil(inviteName, inviteEmail)
      setSnackbar({ open: true, message: `Invitația a fost trimisă cu succes către ${inviteEmail}.`, severity: 'success' })
      setInviteName('')
      setInviteEmail('')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Eroare la trimiterea invitației. Te rugăm să încerci din nou.'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    navigate('/auth', { replace: true })
  }

  const handleImpersonate = async (userId: string) => {
    try {
      await authService.impersonate(userId)
      navigate('/app', { replace: true })
    } catch {
      setStatusError('Eroare la autentificarea ca utilizator.')
    }
  }

  const navItems = [
    { id: 'pfa', label: 'Cereri PFA', icon: <PeopleAltRoundedIcon /> },
    { id: 'pfa_inrolate', label: 'PFA-uri înrolate', icon: <HowToRegRoundedIcon /> },
    { id: 'masini', label: 'Mașini Ridesharing', icon: <DirectionsCarFilledRoundedIcon /> },
    { id: 'servicii', label: 'Servicii', icon: <ShoppingCartRoundedIcon /> },
    { id: 'chat', label: 'Chat Clienți', icon: <ChatRoundedIcon /> },
    { id: 'contabili', label: 'Înrolare Contabili', icon: <SupervisedUserCircleRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const filteredPfas = pfas.filter(
    (p) => p.userName.toLowerCase().includes(search.toLowerCase()) || p.userEmail.toLowerCase().includes(search.toLowerCase())
  )

  const displayPfas = filteredPfas.filter(p =>
    activeTab === 'pfa_inrolate'
      ? p.status.toLowerCase() === 'approved'
      : p.status.toLowerCase() !== 'approved'
  )

  // ─── PFA Detail View ────────────────────────────────────────────────────────
  const renderPfaDetail = () => {
    const pfa = selectedPfa!
    const isPending = pfa.status.toLowerCase() === 'pending'

    return (
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setSelectedPfa(null)}
            size="small"
            sx={{ bgcolor: alpha(TOKENS.paper, 0.9), border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08) } }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.12), color: TOKENS.primaryStrong, fontWeight: 800 }}>
            {pfa.userName[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{pfa.userName}</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{pfa.userEmail}</Typography>
          </Box>
          <Chip
            label={statusLabel(pfa.status)}
            sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: alpha(statusColor(pfa.status), 0.1), color: statusColor(pfa.status), border: `1px solid ${alpha(statusColor(pfa.status), 0.25)}` }}
          />
        </Box>

        {/* Info */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
          <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap' }} component="div">
            <Box>
              <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tip înregistrare</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatRegistrationType(pfa.registrationType)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Documente</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{pfa.documentCount}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Înregistrat</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{relativeTime(pfa.createdAtUtc)}</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Approve / Reject actions */}
        {isPending && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<CheckCircleRoundedIcon />}
              onClick={() => handleOpenStatusDialog('Approved')}
              sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
            >
              Aprobă
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelRoundedIcon />}
              onClick={() => handleOpenStatusDialog('Rejected')}
              sx={{ fontWeight: 700, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' } }}
            >
              Respinge
            </Button>
          </Stack>
        )}

        {/* Impersonate action */}
        {!isPending && pfa.status.toLowerCase() === 'approved' && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => handleImpersonate(pfa.userId)}
              sx={{ fontWeight: 700, bgcolor: TOKENS.primary, '&:hover': { bgcolor: TOKENS.primaryStrong }, boxShadow: 'none' }}
            >
              Autentificare ca utilizator
            </Button>
          </Stack>
        )}

        {/* Documents table */}
        <Paper elevation={0} sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Documente încărcate</Typography>
          </Box>

          {docsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={28} sx={{ color: TOKENS.primary }} />
            </Box>
          )}
          {docsError && <Alert severity="error" sx={{ m: 2 }}>{docsError}</Alert>}
          {!docsLoading && !docsError && documents.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Niciun document încărcat.</Typography>
            </Box>
          )}
          {!docsLoading && !docsError && documents.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(TOKENS.surface, 0.7) }}>
                    <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Fișier</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Categorie</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Mărime</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Încărcat</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: TOKENS.textMuted }}>Descărcare</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} sx={{ '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) } }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }} component="div">
                          <Box sx={{ width: 32, height: 32, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.primaryStrong, flexShrink: 0 }}>
                            <InsertDriveFileRoundedIcon sx={{ fontSize: 16 }} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 200 }} noWrap title={doc.originalFileName}>
                            {doc.originalFileName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>{formatDocumentCategory(doc.category)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>{formatBytes(doc.fileSize)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>{relativeTime(doc.uploadedAtUtc)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel(doc.status)}
                          size="small"
                          sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: alpha(statusColor(doc.status), 0.1), color: statusColor(doc.status) }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }} component="div">
                          {doc.status.toLowerCase() === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateDocStatus(doc.id, 'Verified')}
                                disabled={statusUpdatingDocId === doc.id}
                                sx={{ color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.1) } }}
                                title="Aprobă document"
                              >
                                {statusUpdatingDocId === doc.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon fontSize="small" />}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateDocStatus(doc.id, 'Rejected')}
                                disabled={statusUpdatingDocId === doc.id}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}
                                title="Respinge document"
                              >
                                <CancelRoundedIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            title="Descarcă"
                            sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
                          >
                            {downloadingId === doc.id
                              ? <CircularProgress size={16} sx={{ color: TOKENS.primary }} />
                              : <FileDownloadRoundedIcon fontSize="small" />}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Status update confirm dialog */}
        <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, action: null })} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {statusDialog.action === 'Approved' ? 'Confirmare aprobare' : 'Confirmare respingere'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
              {statusDialog.action === 'Approved'
                ? `Ești sigur că vrei să aprobezi înregistrarea lui ${pfa.userName}?`
                : `Ești sigur că vrei să respingi înregistrarea lui ${pfa.userName}?`}
            </Typography>
            {statusDialog.action === 'Approved' && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="CUI (Cod Unic de Înregistrare)"
                  placeholder="Ex: RO12345678"
                  value={cui}
                  onChange={(e) => setCui(e.target.value)}
                  sx={inputSx}
                  required
                />
                <Box>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 700, mb: 0.5, display: 'block' }} component="p">
                    CERTIFICAT DE ÎNREGISTRARE *
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<AttachFileRoundedIcon />}
                    sx={{
                      height: 56,
                      borderRadius: TOKENS.radius.md,
                      border: `1px dashed ${alpha(TOKENS.ink, 0.2)}`,
                      color: TOKENS.textSubtle,
                      justifyContent: 'flex-start',
                      px: 2,
                      '&:hover': {
                        borderColor: TOKENS.primary,
                        bgcolor: alpha(TOKENS.primary, 0.04)
                      }
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {certificatFile ? certificatFile.name : 'Atașează Certificat de Înregistrare'}
                    </Box>
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setCertificatFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                </Box>
              </Stack>
            )}
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notă pentru utilizator (opțional)"
                placeholder="Ex: Documentele sunt incomplete..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                sx={inputSx}
              />
            </Box>
            {statusError && <Alert severity="error" sx={{ mt: 2 }}>{statusError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setStatusDialog({ open: false, action: null })} disabled={statusUpdating}>Anulează</Button>
            <Button
              variant="contained"
              onClick={handleConfirmStatus}
              disabled={statusUpdating}
              sx={{
                fontWeight: 700, boxShadow: 'none',
                bgcolor: statusDialog.action === 'Approved' ? '#10b981' : '#ef4444',
                '&:hover': { bgcolor: statusDialog.action === 'Approved' ? '#059669' : '#dc2626' },
              }}
            >
              {statusUpdating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : (statusDialog.action === 'Approved' ? 'Aprobă' : 'Respinge')}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    )
  }

  // ─── PFA List ────────────────────────────────────────────────────────────────
  const renderPfaList = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <SearchRoundedIcon sx={{ color: TOKENS.textSubtle, mr: 1, fontSize: 20 }} />
        <TextField variant="outlined" size="small" placeholder="Caută PFA..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 300, ...inputSx }} />
      </Box>

      {pfasLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} sx={{ color: TOKENS.primary }} /></Box>}
      {pfasError && <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>{pfasError}</Alert>}
      {!pfasLoading && !pfasError && displayPfas.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TOKENS.textMuted }}>{search ? 'Nicio înregistrare găsită.' : 'Nu există înregistrări PFA.'}</Typography>
        </Box>
      )}
      {!pfasLoading && !pfasError && displayPfas.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 24 }}>
          {displayPfas.map((pfa) => (
            <Card key={pfa.id} elevation={0} sx={{ border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, borderRadius: TOKENS.radius.lg, boxShadow: TOKENS.shadow.sm, background: `linear-gradient(160deg, ${alpha(TOKENS.primary, 0.05)} 0%, ${TOKENS.paper} 32%)`, transition: 'all 0.2s', '&:hover': { borderColor: alpha(TOKENS.primary, 0.42), boxShadow: TOKENS.shadow.md } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: TOKENS.ink }} noWrap>{pfa.userName}</Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted }} noWrap>{pfa.userEmail}</Typography>
                  </Box>
                  <Chip label={statusLabel(pfa.status)} size="small" sx={{ ml: 1, fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha(statusColor(pfa.status), 0.1), color: statusColor(pfa.status), border: `1px solid ${alpha(statusColor(pfa.status), 0.2)}` }} />
                </Box>
                <Stack direction="row" spacing={2} sx={{ mb: 3, mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>Tip: <strong>{formatRegistrationType(pfa.registrationType)}</strong></Typography>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>Documente: <strong>{pfa.documentCount}</strong></Typography>
                </Stack>
                <Button fullWidth variant="outlined" size="small" onClick={() => setSelectedPfa(pfa)}
                  sx={{ borderColor: alpha(TOKENS.ink, 0.14), color: TOKENS.ink, fontWeight: 700, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08), borderColor: alpha(TOKENS.primary, 0.42) } }}>
                  Vezi detalii
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  )

  // ─── Enroll Contabil ─────────────────────────────────────────────────────────
  const renderContabili = () => (
    <Box sx={{ maxWidth: 600, py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: TOKENS.radius.xl, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.06)} 0%, ${TOKENS.paper} 35%)` }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Înrolează Contabil Nou</Typography>
        <Typography variant="body2" sx={{ mb: 4, color: TOKENS.textMuted }}>Trimite o invitație pe email unui contabil pentru a-i oferi acces la platformă.</Typography>
        <Stack spacing={3}>
          <TextField 
            fullWidth 
            label="Nume complet" 
            placeholder="Ex: Ion Popescu" 
            sx={inputSx} 
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            disabled={inviteLoading}
          />
          <TextField 
            fullWidth 
            label="Adresă email" 
            placeholder="nume@contabil.ro" 
            sx={inputSx} 
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={inviteLoading}
          />
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleInviteContabil}
            disabled={inviteLoading}
            sx={{ py: 1.5, fontWeight: 700, bgcolor: TOKENS.primary, boxShadow: 'none', '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' } }}
          >
            {inviteLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Trimite Invitația'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )

  // ─── Notifications ───────────────────────────────────────────────────────────
  const renderNotificari = () => (
    <Stack spacing={1.5} sx={{ maxWidth: 600 }}>
      {notifsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: TOKENS.primary }} /></Box>}
      {notifsError && <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>{notifsError}</Alert>}
      {!notifsLoading && !notifsError && notifications.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}><Typography variant="body1" sx={{ color: TOKENS.textMuted }}>Nu ai notificări momentan.</Typography></Box>
      )}
      {!notifsLoading && !notifsError && notifications.map((n) => (
        <Paper key={n.id} elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: TOKENS.radius.md, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: n.isRead ? alpha(TOKENS.paper, 0.86) : alpha(TOKENS.primary, 0.04), boxShadow: TOKENS.shadow.sm, transition: '0.2s', '&:hover': { borderColor: alpha(TOKENS.primary, 0.28), bgcolor: TOKENS.paper } }}>
          <Box sx={{ width: 36, height: 36, borderRadius: TOKENS.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(TOKENS.primary, 0.08), color: TOKENS.primaryStrong }}>
            <NotificationsActiveRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: n.isRead ? 600 : 800, color: TOKENS.ink, fontSize: '0.85rem' }}>{n.text}</Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontSize: '0.75rem' }}>{relativeTime(n.createdAtUtc)}</Typography>
          </Box>
          {!n.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TOKENS.primary, flexShrink: 0 }} />}
        </Paper>
      ))}
    </Stack>
  )

  const renderContent = () => {
    if ((activeTab === 'pfa' || activeTab === 'pfa_inrolate') && selectedPfa) return renderPfaDetail()
    switch (activeTab) {
      case 'pfa':
      case 'pfa_inrolate': return renderPfaList()
      case 'masini': return <CarsAdminView />
      case 'servicii': return <ServicesAdminView />
      case 'chat': return <AdminChatView pfas={pfas} />
      case 'contabili': return renderContabili()
      case 'notificari': return renderNotificari()
      default: return null
    }
  }

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : '...'

  return (
    <DashboardLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => { setActiveTab(id); setSelectedPfa(null) }}
      onLogout={handleLogout}
      userName={userName}
      userRole="Admin"
    >
      {renderContent()}
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
