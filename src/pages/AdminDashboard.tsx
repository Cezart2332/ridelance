import { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Stack, TextField, Typography, Card, CardContent,
  CircularProgress, Alert, Chip, Button, IconButton, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Snackbar,
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
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import DiscountRoundedIcon from '@mui/icons-material/DiscountRounded'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded'
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { validateRomanianCIF } from '../utils/validation'
import { formatRegistrationType, formatDocumentCategory } from '../utils/formatters'

import { AdminChatView } from '../components/dashboard/sections/AdminChatView'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { ServicesAdminView } from '../components/dashboard/sections/admin/ServicesAdminView'
import { AdminOverviewView } from '../components/dashboard/sections/admin/AdminOverviewView'
import { PfaFiscalSettingsPanel } from '../components/pfa/PfaFiscalSettingsPanel'
import {
  adminOverviewService,
  type AdminOverviewPfaCard,
  type AdminPfaDetail,
  type AdminPlanFilter,
} from '../services/adminOverview.service'

interface PfaSummary {
  id: string
  userId: string
  userEmail: string
  userName: string
  registrationType: string
  status: string
  accountStatus: string
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  fullName: string | null
  phone: string | null
  contractDuration: number | null
  street: string | null
  number: string | null
  city: string | null
  county: string | null
  isOwner: boolean
  documentCount: number
  createdAtUtc: string
  lastActivityAtUtc: string | null
}

type DetailAction = 'plan' | 'discount' | 'suspend' | 'reactivate' | 'note' | null

function normalizePfaSummary(item: any): PfaSummary {
  return {
    id: item.id,
    userId: item.userId,
    userEmail: item.userEmail,
    userName: item.userName,
    registrationType: item.registrationType,
    status: item.status,
    accountStatus: item.accountStatus ?? 'Nou',
    subscriptionStatus: item.subscriptionStatus ?? null,
    subscriptionPlan: item.subscriptionPlan ?? null,
    fullName: item.fullName ?? null,
    phone: item.phone ?? null,
    contractDuration: item.contractDuration ?? null,
    street: item.street ?? null,
    number: item.number ?? null,
    city: item.city ?? null,
    county: item.county ?? null,
    isOwner: Boolean(item.isOwner),
    documentCount: item.documentCount,
    createdAtUtc: item.createdAtUtc,
    lastActivityAtUtc: item.lastActivityAtUtc,
  }
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

function formatLei(bani: number | null | undefined) {
  const value = (bani ?? 0) / 100
  return `${value.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} lei`
}

function formatDate(utc: string | null | undefined) {
  if (!utc) return '—'
  return new Date(utc).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const response = (error as { response?: { data?: { detail?: unknown } } }).response
  return typeof response?.data?.detail === 'string' ? response.data.detail : fallback
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
  const [activeTab, setActiveTab] = useState('overview')
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
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [statusUpdatingDocId, setStatusUpdatingDocId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [pfaDetail, setPfaDetail] = useState<AdminPfaDetail | null>(null)
  const [pfaDetailLoading, setPfaDetailLoading] = useState(false)
  const [pfaDetailError, setPfaDetailError] = useState<string | null>(null)
  const [detailAction, setDetailAction] = useState<DetailAction>(null)
  const [detailActionError, setDetailActionError] = useState<string | null>(null)
  const [detailActionLoading, setDetailActionLoading] = useState(false)
  const [planActionValue, setPlanActionValue] = useState<AdminPlanFilter>('start')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('10')
  const [detailActionNote, setDetailActionNote] = useState('')

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
  const [testNotifLoading, setTestNotifLoading] = useState(false)

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(() => {})
  }, [])

  useEffect(() => {
    if ((activeTab !== 'pfa' && activeTab !== 'pfa_inrolate' && activeTab !== 'chat') || selectedPfa) return
    setPfasLoading(true)
    setPfasError(null)
    pfaService.getAll()
      .then((data) => {
        const items = data?.items ?? data ?? []
        setPfas(items.map(normalizePfaSummary))
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
    if (!selectedPfa) {
      setPfaDetail(null)
      setPfaDetailError(null)
      return
    }

    setPfaDetailLoading(true)
    setPfaDetailError(null)
    adminOverviewService.getPfaDetails(selectedPfa.id)
      .then(setPfaDetail)
      .catch(() => setPfaDetailError('Nu am putut încărca detaliile extinse. Afișez datele existente pentru acest PFA.'))
      .finally(() => setPfaDetailLoading(false))
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

  const handleOpenDocument = useCallback(async (doc: DocumentSummary) => {
    setOpeningId(doc.id)
    try {
      await documentService.openInNewTab(doc.id, doc.originalFileName)
    } finally {
      setOpeningId(null)
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

  const handleOpenOverviewPfaDetails = (pfa: AdminOverviewPfaCard) => {
    setSelectedPfa({
      id: pfa.id,
      userId: pfa.userId,
      userEmail: pfa.email,
      userName: pfa.companyName,
      registrationType: '—',
      status: pfa.accountStatus.toLowerCase().includes('activ') ? 'Approved' : 'Pending',
      accountStatus: pfa.accountStatus,
      subscriptionStatus: pfa.subscriptionStatus,
      subscriptionPlan: pfa.plan,
      fullName: pfa.holderName,
      phone: pfa.phone,
      contractDuration: null,
      street: null,
      number: null,
      city: null,
      county: null,
      isOwner: false,
      documentCount: 0,
      createdAtUtc: new Date().toISOString(),
      lastActivityAtUtc: pfa.lastActivityAtUtc,
    })
    setActiveTab('pfa_inrolate')
  }

  const openDetailAction = (action: DetailAction) => {
    setDetailAction(action)
    setDetailActionError(null)
    setPlanActionValue('start')
    setDiscountType('percent')
    setDiscountValue('10')
    setDetailActionNote(action === 'note' ? pfaDetail?.internalNote ?? '' : '')
  }

  const submitDetailAction = async () => {
    if (!selectedPfa || !detailAction) return
    setDetailActionLoading(true)
    setDetailActionError(null)
    try {
      if (detailAction === 'plan') {
        await adminOverviewService.changePfaPlan(selectedPfa.id, planActionValue as 'solo' | 'start' | 'pro', 'next_cycle')
      } else if (detailAction === 'discount') {
        await adminOverviewService.applyPfaDiscount(selectedPfa.id, {
          type: discountType,
          value: Number(discountValue),
          note: detailActionNote,
        })
      } else if (detailAction === 'suspend') {
        await adminOverviewService.suspendPfa(selectedPfa.id, detailActionNote)
      } else if (detailAction === 'reactivate') {
        await adminOverviewService.reactivatePfa(selectedPfa.id, detailActionNote)
      } else if (detailAction === 'note') {
        await adminOverviewService.updatePfaInternalNote(selectedPfa.id, detailActionNote)
      }

      setDetailAction(null)
      setSnackbar({ open: true, message: 'Modificarea a fost salvată.', severity: 'success' })
      const updated = await adminOverviewService.getPfaDetails(selectedPfa.id).catch(() => null)
      if (updated) setPfaDetail(updated)
    } catch (err: unknown) {
      setDetailActionError(getApiErrorMessage(err, 'Acțiunea nu a putut fi salvată. Verifică backend-ul și încearcă din nou.'))
    } finally {
      setDetailActionLoading(false)
    }
  }

  const handleTestRecurringDocumentation = async () => {
    setTestNotifLoading(true)
    try {
      const result = await notificationService.adminTestRecurringDocumentation()
      setSnackbar({
        open: true,
        message: `Test trimis: ${result.inAppCreated} notificări în app, ${result.pushSent} push-uri către ${result.usersNotified} utilizatori.`,
        severity: 'success',
      })
      if (activeTab === 'notificari') {
        const updated = await notificationService.getAll()
        setNotifications(updated)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Trimiterea notificărilor de test a eșuat.'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setTestNotifLoading(false)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Acasă', icon: <HomeRoundedIcon /> },
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

  const customerAgeLabel = (createdAtUtc: string) => {
    const weeks = Math.max(0, Math.floor((Date.now() - new Date(createdAtUtc).getTime()) / (7 * 24 * 60 * 60 * 1000)))
    if (weeks < 1) return 'Client RIDElance activ de sub o săptămână'
    if (weeks === 1) return 'Client RIDElance activ de 1 săptămână'
    return `Client RIDElance activ de ${weeks} săptămâni`
  }

  const subscriptionStatusLabel = (status: string | null) => {
    if (!status) return 'Fără abonament'
    switch (status.toLowerCase()) {
      case 'active':
      case 'activependingbilling':
        return 'Activ'
      case 'paidpendingaccess':
      case 'trial':
        return 'Trial'
      case 'pastdue':
        return 'Plată eșuată'
      case 'cancelled':
      case 'canceled':
        return 'Anulat'
      case 'expired':
      case 'suspended':
        return 'Suspendat'
      default:
        return status
    }
  }

  const pfaCurrentMonthStatus = (pfa: PfaSummary) => {
    if (pfa.status.toLowerCase() !== 'approved') return 'În onboarding'
    return pfa.documentCount > 0 ? 'În verificare' : 'Documente lipsă'
  }

  const pfaPlanLabel = (pfa: PfaSummary) => {
    switch (pfa.subscriptionPlan?.toLowerCase()) {
      case 'solo': return 'Solo'
      case 'start': return 'Start'
      case 'pro': return 'Pro'
      default: return 'Fără plan'
    }
  }

  // ─── PFA Detail View ────────────────────────────────────────────────────────
  const renderPfaDetail = () => {
    const pfa = selectedPfa!
    const isPending = pfa.status.toLowerCase() === 'pending'
    const active = pfaDetail
    const accountStatus = active?.accountStatus ?? pfa.accountStatus
    const detailSummary = [
      { label: 'Plan abonament', value: active?.plan ?? pfaPlanLabel(pfa) },
      { label: 'Status abonament', value: active?.subscriptionStatus ?? subscriptionStatusLabel(pfa.subscriptionStatus) },
      { label: 'Tip înregistrare', value: active?.registrationType ?? formatRegistrationType(pfa.registrationType) },
      { label: 'Status lună curentă', value: active?.currentMonthStatus ?? pfaCurrentMonthStatus(pfa) },
      { label: 'Ultima activitate', value: active?.lastActivityLabel ?? (pfa.lastActivityAtUtc ? relativeTime(pfa.lastActivityAtUtc) : 'Fără activitate') },
    ]

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
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{active?.companyName ?? pfa.userName}</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
              {[active?.email ?? pfa.userEmail, active?.phone ?? pfa.phone].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Chip
            label={accountStatus || statusLabel(pfa.status)}
            sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: alpha(statusColor(pfa.status), 0.1), color: statusColor(pfa.status), border: `1px solid ${alpha(statusColor(pfa.status), 0.25)}` }}
          />
        </Box>

        {pfaDetailLoading && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CircularProgress size={18} sx={{ color: TOKENS.primary }} />
              <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Se încarcă detaliile extinse...</Typography>
            </Stack>
          </Paper>
        )}
        {pfaDetailError && <Alert severity="warning">{pfaDetailError}</Alert>}

        {/* Info */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
            {detailSummary.map((item) => (
              <Box key={item.label} sx={{ p: 1.5, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.surface, 0.72), border: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
                <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 850, color: TOKENS.ink, mt: 0.35 }}>
                  {item.value || '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink, mb: 2 }}>
            Date completate în formular
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {[
              { label: 'Nume formular', value: pfa.fullName || pfa.userName },
              { label: 'Telefon', value: pfa.phone || 'Nu este completat' },
              { label: 'Durată comodat', value: pfa.contractDuration ? `${pfa.contractDuration} ani` : 'Nu se aplică' },
              { label: 'Adresă', value: [pfa.street, pfa.number].filter(Boolean).join(' ') || 'Nu se aplică' },
              { label: 'Localitate', value: [pfa.city, pfa.county].filter(Boolean).join(', ') || 'Nu se aplică' },
              { label: 'Proprietar sediu', value: pfa.isOwner ? 'Da' : 'Nu' },
            ].map((item) => (
              <Box key={item.label} sx={{ p: 1.5, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.surface, 0.72), border: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
                <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 700, mt: 0.4 }}>
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
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

        {!isPending && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant="contained"
              startIcon={<LoginRoundedIcon />}
              onClick={() => handleImpersonate(pfa.userId)}
              sx={{ fontWeight: 800, bgcolor: TOKENS.primary, '&:hover': { bgcolor: TOKENS.primaryStrong }, boxShadow: 'none' }}
            >
              Autentificare ca utilizator
            </Button>
            <Button variant="outlined" startIcon={<TrendingUpRoundedIcon />} onClick={() => openDetailAction('plan')}>Schimbă plan</Button>
            <Button variant="outlined" startIcon={<DiscountRoundedIcon />} onClick={() => openDetailAction('discount')}>Aplică discount</Button>
            <Button variant="outlined" startIcon={<PauseCircleOutlineRoundedIcon />} onClick={() => openDetailAction('suspend')}>Suspendă cont</Button>
            <Button variant="outlined" startIcon={<PlayCircleOutlineRoundedIcon />} onClick={() => openDetailAction('reactivate')}>Reactivează cont</Button>
            <Button variant="outlined" startIcon={<ChatRoundedIcon />} onClick={() => { setSelectedPfa(null); setActiveTab('chat') }}>Chat</Button>
          </Stack>
        )}

        <PfaFiscalSettingsPanel pfaId={pfa.id} editable />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink, mb: 2 }}>Abonament & plăți</Typography>
            <Stack spacing={1.2}>
              {[
                ['Plan actual', active?.plan ?? pfaPlanLabel(pfa)],
                ['Preț', active?.priceBani == null ? '—' : formatLei(active.priceBani)],
                ['Status abonament', active?.subscriptionStatus ?? subscriptionStatusLabel(pfa.subscriptionStatus)],
                ['Data început', formatDate(active?.subscriptionStartedAtUtc)],
                ['Următoarea plată', formatDate(active?.nextPaymentAtUtc)],
                ['Ultima plată', formatDate(active?.lastPaymentAtUtc)],
                ['Plăți eșuate', String(active?.failedPayments ?? 0)],
                ['Reducere activă', active?.activeDiscount || '—'],
                ['Istoric plăți', active?.customerAgeLabel ?? customerAgeLabel(pfa.createdAtUtc)],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink, mb: 2 }}>Contabilitate</Typography>
            <Stack spacing={1.2}>
              {[
                ['Status lună curentă', active?.currentMonthStatus ?? pfaCurrentMonthStatus(pfa)],
                ['Ultima lună procesată', active?.lastProcessedMonth || '—'],
                ['Documente lunare lipsă', String(active?.missingMonthlyDocuments ?? 0)],
                ['Documente lunare de verificat', String(active?.documentsToReview ?? pfa.documentCount)],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink, mb: 2 }}>Istoric activitate</Typography>
            {active?.activityLog?.length ? (
              <Stack spacing={1.5}>
                {active.activityLog.slice(0, 8).map((event) => (
                  <Box key={event.id}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>{event.description}</Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                      {event.performedBy} · {formatDate(event.createdAtUtc)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Nu există activitate înregistrată.</Typography>
            )}
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink }}>Note interne</Typography>
              <Button size="small" onClick={() => openDetailAction('note')}>Editează</Button>
            </Stack>
            <Typography variant="body2" sx={{ color: active?.internalNote ? TOKENS.ink : TOKENS.textMuted, whiteSpace: 'pre-wrap' }}>
              {active?.internalNote || 'Nu există note interne pentru acest client.'}
            </Typography>
          </Paper>
        </Box>

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
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}>
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
                            onClick={() => handleOpenDocument(doc)}
                            disabled={openingId === doc.id}
                            title="Deschide"
                            sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
                          >
                            {openingId === doc.id
                              ? <CircularProgress size={16} sx={{ color: TOKENS.primary }} />
                              : <OpenInNewRoundedIcon fontSize="small" />}
                          </IconButton>
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

        <Dialog open={Boolean(detailAction)} onClose={() => setDetailAction(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 900 }}>
            {{
              plan: 'Schimbă plan',
              discount: 'Aplică discount',
              suspend: 'Suspendă cont',
              reactivate: 'Reactivează cont',
              note: 'Note interne',
            }[detailAction ?? 'note']}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {detailAction === 'plan' && (
                <>
                  <TextField select label="Plan nou" value={planActionValue} onChange={(event) => setPlanActionValue(event.target.value as AdminPlanFilter)} sx={inputSx}>
                    <MenuItem value="solo">Solo</MenuItem>
                    <MenuItem value="start">Start</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                  </TextField>
                  <TextField select label="Aplicare" value="next_cycle" sx={inputSx} disabled>
                    <MenuItem value="next_cycle">Din următorul ciclu</MenuItem>
                  </TextField>
                </>
              )}
              {detailAction === 'discount' && (
                <>
                  <TextField select label="Tip discount" value={discountType} onChange={(event) => setDiscountType(event.target.value as 'percent' | 'fixed')} sx={inputSx}>
                    <MenuItem value="percent">Procent</MenuItem>
                    <MenuItem value="fixed">Sumă fixă</MenuItem>
                  </TextField>
                  <TextField label="Valoare" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} sx={inputSx} />
                  <TextField label="Notă" value={detailActionNote} onChange={(event) => setDetailActionNote(event.target.value)} sx={inputSx} />
                </>
              )}
              {(detailAction === 'suspend' || detailAction === 'reactivate' || detailAction === 'note') && (
                <TextField
                  label={detailAction === 'note' ? 'Note interne' : 'Notă'}
                  multiline
                  minRows={4}
                  value={detailActionNote}
                  onChange={(event) => setDetailActionNote(event.target.value)}
                  fullWidth
                  sx={inputSx}
                />
              )}
              {detailActionError && <Alert severity="error">{detailActionError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDetailAction(null)} disabled={detailActionLoading}>Anulează</Button>
            <Button
              variant="contained"
              disabled={detailActionLoading}
              onClick={submitDetailAction}
              sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 800 }}
            >
              {detailActionLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Salvează'}
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
        <TextField variant="outlined" size="small" placeholder="Caută PFA..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 300 }, maxWidth: '100%', ...inputSx }} />
      </Box>

      {pfasLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} sx={{ color: TOKENS.primary }} /></Box>}
      {pfasError && <Alert severity="error" sx={{ borderRadius: TOKENS.radius.md }}>{pfasError}</Alert>}
      {!pfasLoading && !pfasError && displayPfas.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TOKENS.textMuted }}>{search ? 'Nicio înregistrare găsită.' : 'Nu există înregistrări PFA.'}</Typography>
        </Box>
      )}
      {!pfasLoading && !pfasError && displayPfas.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
          {displayPfas.map((pfa) => {
            const isApproved = pfa.status.toLowerCase() === 'approved'
            const lastActivity = pfa.lastActivityAtUtc ? relativeTime(pfa.lastActivityAtUtc) : 'Fără activitate'

            return (
            <Card key={pfa.id} elevation={0} sx={{ border: `1px solid ${alpha(TOKENS.ink, 0.07)}`, borderRadius: TOKENS.radius.lg, boxShadow: 'none', bgcolor: TOKENS.paper, transition: 'all 0.2s', '&:hover': { borderColor: alpha(TOKENS.primary, 0.35), boxShadow: TOKENS.shadow.sm } }}>
              <CardContent sx={{ p: 2.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: TOKENS.ink, lineHeight: 1.2 }} noWrap title={pfa.userName}>
                      {pfa.userName || pfa.fullName || 'PFA fără nume'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted, display: 'block', mt: 0.35 }} noWrap title={pfa.fullName || pfa.userEmail}>
                      {pfa.fullName || pfa.userEmail}
                    </Typography>
                  </Box>
                  <Chip label={statusLabel(pfa.status)} size="small" sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: alpha(statusColor(pfa.status), 0.1), color: statusColor(pfa.status), border: `1px solid ${alpha(statusColor(pfa.status), 0.2)}` }} />
                </Box>

                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75, mb: 1.6 }}>
                  {[pfaPlanLabel(pfa), subscriptionStatusLabel(pfa.subscriptionStatus), pfaCurrentMonthStatus(pfa)].map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      size="small"
                      sx={{ height: 24, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.ink, 0.04), color: TOKENS.ink, fontSize: '0.68rem', fontWeight: 800 }}
                    />
                  ))}
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.8 }}>
                  {[
                    ['Email', pfa.userEmail],
                    ['Telefon', pfa.phone || '—'],
                    ['Documente', pfa.documentCount.toString()],
                    ['Activitate', lastActivity],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 750 }}>{label}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: TOKENS.ink, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button fullWidth variant="contained" size="small" onClick={() => setSelectedPfa(pfa)}
                    sx={{ bgcolor: TOKENS.primary, boxShadow: 'none', color: TOKENS.ink, fontWeight: 850, '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' } }}>
                    Vezi detalii
                  </Button>
                  <Button fullWidth variant="outlined" size="small" disabled={!isApproved} onClick={() => handleImpersonate(pfa.userId)}
                    sx={{ borderColor: alpha(TOKENS.ink, 0.14), color: TOKENS.ink, fontWeight: 800, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.08), borderColor: alpha(TOKENS.primary, 0.42) } }}>
                    Intră în dashboard client
                  </Button>
                </Stack>
              </CardContent>
            </Card>
            )
          })}
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
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
          boxShadow: TOKENS.shadow.sm,
          bgcolor: alpha(TOKENS.primary, 0.04),
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
          Documentație recurentă (lunar)
        </Typography>
        <Button
          variant="contained"
          disabled={testNotifLoading}
          onClick={handleTestRecurringDocumentation}
          sx={{
            fontWeight: 700,
            bgcolor: TOKENS.primary,
            boxShadow: 'none',
            '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' },
          }}
        >
          {testNotifLoading ? (
            <CircularProgress size={22} sx={{ color: '#fff' }} />
          ) : (
            'Test notifications'
          )}
        </Button>
      </Paper>

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
      case 'overview': return (
        <AdminOverviewView
          onImpersonate={handleImpersonate}
          onOpenPfaDetails={handleOpenOverviewPfaDetails}
        />
      )
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
