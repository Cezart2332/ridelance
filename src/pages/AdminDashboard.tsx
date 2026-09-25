import { useSearchParams } from 'react-router-dom'
import { NotificationsInbox } from '../components/notifications/NotificationsPanel'
import { useState, useEffect, useCallback } from 'react'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { ROUTES } from '../constants/routes'
import {
  Box, Paper, Stack, TextField, Typography, Avatar,
  CircularProgress, Alert, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Snackbar, ThemeProvider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { AdminLayout } from '../components/admin/AdminLayout'
import { adminTheme } from '../theme/adminTheme'
import { pfaService } from '../services/pfa.service'
import { notificationService } from '../services/notification.service'
import { userService, type UserProfile } from '../services/user.service'
import { documentService, type DocumentSummary } from '../services/document.service'
import { authService } from '../services/auth.service'

import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import SupervisedUserCircleRoundedIcon from '@mui/icons-material/SupervisedUserCircleRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { validateRomanianCIF } from '../utils/validation'
import { formatRegistrationType } from '../utils/formatters'

import { AdminChatView } from '../components/dashboard/sections/AdminChatView'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { CompanyPagesAdminView } from '../components/dashboard/sections/admin/CompanyPagesAdminView'
import { ServicesAdminView } from '../components/dashboard/sections/admin/ServicesAdminView'
import { OfficeCalendarAdminView } from '../components/dashboard/sections/admin/OfficeCalendarAdminView'
import { InsuranceTab } from '../components/dashboard/sections/InsuranceTab'
import { OblioAdminView } from '../components/dashboard/sections/admin/OblioAdminView'
import { DiscountsAdminView } from '../components/dashboard/sections/admin/DiscountsAdminView'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import { AdminOverviewView } from '../components/dashboard/sections/admin/AdminOverviewView'
import { SrlAccountsView } from '../components/dashboard/sections/admin/SrlAccountsView'
import { AdminTasksView } from '../components/dashboard/sections/admin/AdminTasksView'
import { CloseAccountDialog } from '../components/dashboard/sections/admin/CloseAccountDialog'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import { PfaDetailView } from './admin/PfaDetailView'
import { displayName } from '../utils/displayName'
import {
  adminOverviewService,
  type AdminOverviewPfaCard,
  type AdminPfaDetail,
  type AdminPlanFilter,
} from '../services/adminOverview.service'
import { openDocument } from '../components/common/documentViewerBus'
import type { FiscalProfileStatus } from '../services/fiscalProfile.service'
import { FiscalProfileStatusChip } from '../shared/fiscal-profile'

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
  /** Completat de OCR din certificatul de înregistrare; adminul îl confirmă la aprobare. */
  cui: string | null
  documentCount: number
  /** Dosarul așteaptă o acțiune de admin (dosar PFA, secțiune sau pachet de semnături). */
  awaitingAdminAction: boolean
  /** Onboarding complet: toți pașii validați. Nu e același lucru cu dosarul PFA aprobat. */
  onboardingCompletedAtUtc: string | null
  /**
   * Fals pentru un client care n-a ajuns la pasul 2, unde se creează dosarul PFA. Atunci `id` e
   * id-ul contului, iar acțiunile care cer un dosar (aprobare, plan, discount) nu au sens.
   */
  hasRegistration: boolean
  createdAtUtc: string
  lastActivityAtUtc: string | null
  /** Contul a fost închis. Datele rămân; lista îl arată la „Șterse”. */
  deletedAtUtc: string | null
  /** Profilul fiscal al anului curent. */
  fiscalProfileStatus: FiscalProfileStatus
}

/** Filtrul listei „PFA înrolate”. */
type EnrolledFilter = 'active' | 'inactive' | 'deleted'

/** Filtrul „Profil fiscal” din lista PFA înrolate. */
type FiscalFilter = 'all' | FiscalProfileStatus

/** Cât de des se reîmprospătează singure lista de dosare PFA și dosarul deschis. */
const PFA_AUTO_REFRESH_MS = 10_000

const FISCAL_FILTERS: { id: FiscalFilter; label: string }[] = [
  { id: 'all', label: 'Toate' },
  { id: 'NOT_STARTED', label: 'Necompletat' },
  { id: 'DRAFT', label: 'Ciornă' },
  { id: 'COMPLETED', label: 'Completat' },
]

const ENROLLED_FILTERS: { id: EnrolledFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'deleted', label: 'Șterse' },
]

/** Activ = abonament plătit. Aceeași regulă ca în privirea de ansamblu. */
function isActiveSubscription(status: string | null): boolean {
  const value = status?.toLowerCase()
  return value === 'active' || value === 'activependingbilling'
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
    cui: item.cui ?? null,
    documentCount: item.documentCount,
    awaitingAdminAction: Boolean(item.awaitingAdminAction),
    onboardingCompletedAtUtc: item.onboardingCompletedAtUtc ?? null,
    hasRegistration: item.hasRegistration !== false,
    createdAtUtc: item.createdAtUtc,
    lastActivityAtUtc: item.lastActivityAtUtc,
    deletedAtUtc: item.deletedAtUtc ?? null,
    fiscalProfileStatus: item.fiscalProfileStatus ?? 'NOT_STARTED',
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
    borderRadius: `${TOKENS.radius.md}px`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

export function AdminDashboard() {
  const [notificationParams] = useSearchParams()

  const navigate = useNavigate()
  const [manualTab, setActiveTab] = useState('overview')
  const linkedTab = notificationParams.get('tab') ?? ''
  const activeTab = ['overview', 'pfa', 'pfa_inrolate', 'srl_inrolate', 'masini', 'pagini_firme', 'servicii', 'facturare', 'reduceri', 'asigurari', 'calendar', 'chat', 'contabili', 'notificari', 'sarcini'].includes(linkedTab) ? linkedTab : manualTab
  const [search, setSearch] = useState('')
  const [onlyAwaitingAdmin, setOnlyAwaitingAdmin] = useState(false)
  const [enrolledFilter, setEnrolledFilter] = useState<EnrolledFilter>('active')
  const [fiscalFilter, setFiscalFilter] = useState<FiscalFilter>('all')
  /** Contul pe care îl închidem sau redeschidem acum. */
  const [accountAction, setAccountAction] = useState<{ userId: string; name: string; action: 'close' | 'reopen' } | null>(null)
  const [pfasReloadToken, setPfasReloadToken] = useState(0)

  // PFA list
  const [pfas, setPfas] = useState<PfaSummary[]>([])
  const [pfasLoading, setPfasLoading] = useState(false)
  const [pfasError, setPfasError] = useState<string | null>(null)

  // PFA detail
  const [manualPfa, setSelectedPfa] = useState<PfaSummary | null>(null)
  const selectedPfa = notificationParams.get('user') && ['pfa', 'pfa_inrolate'].includes(activeTab) ? pfas.find((pfa) => pfa.userId === notificationParams.get('user')) ?? manualPfa : manualPfa
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
  const [onboardingRefreshKey, setOnboardingRefreshKey] = useState(0)
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
  const [testNotifLoading, setTestNotifLoading] = useState(false)

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(() => {})
  }, [])

  const pfaListVisible = (activeTab === 'pfa' || activeTab === 'pfa_inrolate' || activeTab === 'chat') && !selectedPfa

  const fetchPfas = useCallback(async () => {
    const data = await pfaService.getAll()
    const items = data?.items ?? data ?? []
    setPfas(items.map(normalizePfaSummary))
    setPfasError(null)
  }, [])

  useEffect(() => {
    if (!pfaListVisible) return
    setPfasLoading(true)
    setPfasError(null)
    fetchPfas()
      .catch(() => setPfasError('Nu s-au putut încărca înregistrările PFA.'))
      .finally(() => setPfasLoading(false))
  }, [pfaListVisible, fetchPfas, pfasReloadToken])

  // Dosarul deschis: documentele, detaliile și pașii de onboarding, fără spinner — ce e pe
  // ecran rămâne până vin datele noi.
  const refreshSelectedPfa = useCallback(async () => {
    if (!selectedPfa) return
    const [docs, detail] = await Promise.all([
      documentService.getByUser(selectedPfa.userId),
      adminOverviewService.getPfaDetails(selectedPfa.id).catch(() => null),
    ])
    setDocuments(docs)
    setDocsError(null)
    if (detail) setPfaDetail(detail)
    setOnboardingRefreshKey((key) => key + 1)
  }, [selectedPfa])

  // Clienții încarcă acte și avansează în onboarding cât adminul se uită: lista și dosarul se
  // actualizează singure, fără reîncărcarea întregii pagini.
  useAutoRefresh(fetchPfas, PFA_AUTO_REFRESH_MS, pfaListVisible && activeTab !== 'chat')
  useAutoRefresh(refreshSelectedPfa, PFA_AUTO_REFRESH_MS, selectedPfa !== null)

  const [manualRefreshing, setManualRefreshing] = useState(false)
  const handleManualRefresh = async () => {
    setManualRefreshing(true)
    try {
      await (selectedPfa ? refreshSelectedPfa() : fetchPfas())
    } catch {
      setSnackbar({ open: true, message: 'Nu am putut reîmprospăta datele. Încearcă din nou.', severity: 'error' })
    } finally {
      setManualRefreshing(false)
    }
  }

  const refreshButton = (
    <Button
      variant="outlined"
      size="small"
      onClick={() => void handleManualRefresh()}
      disabled={manualRefreshing}
      startIcon={manualRefreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
      sx={{ flexShrink: 0 }}
    >
      Reîmprospătează
    </Button>
  )

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
      openDocument(doc.id, doc.originalFileName)
    } finally {
      setOpeningId(null)
    }
  }, [])

  const handleUpdateDocStatus = async (id: string, status: 'Verified' | 'Rejected', note?: string) => {
    setStatusUpdatingDocId(id)
    try {
      await documentService.updateStatus(id, status, note)
      setDocuments(docs => docs.map(d => d.id === id ? { ...d, status, reviewNote: status === 'Rejected' ? note ?? null : null } : d))
      setSnackbar({ open: true, message: `Documentul a fost ${status === 'Verified' ? 'aprobat' : 'respins'} cu succes.`, severity: 'success' })
      setOnboardingRefreshKey((key) => key + 1)
      return true
    } catch {
      setSnackbar({ open: true, message: 'Nu am putut actualiza statusul documentului. Te rugăm să încerci din nou.', severity: 'error' })
      return false
    } finally {
      setStatusUpdatingDocId(null)
    }
  }

  /** Certificatul pe care clientul l-a încărcat singur — adminul nu-l mai cere încă o dată. */
  const existingCertificate = documents
    .filter((d) => d.category === 'CertificatInregistrare' && d.status.toLowerCase() !== 'rejected')
    .sort((a, b) => new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime())[0]

  const handleOpenStatusDialog = (action: 'Approved' | 'Rejected') => {
    setReviewNote('')
    // La „Am PFA" clientul a încărcat certificatul, iar OCR-ul a completat deja CUI-ul: adminul
    // confirmă, nu retastează. La „Nu am PFA" ambele lipsesc și se completează aici.
    setCui(selectedPfa?.cui ?? '')
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
      if (!certificatFile && !existingCertificate) {
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
      setOnboardingRefreshKey((k) => k + 1)
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
    navigate(ROUTES.login, { replace: true })
  }

  const handleImpersonate = async (userId: string, userName: string) => {
    try {
      await authService.impersonate(userId, userName)
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
      cui: null,
      documentCount: 0,
      // Cardurile din overview vin din dosare.
      hasRegistration: true,
      // Cardul din overview nu poartă semnalul; oricum se citește doar de filtrul din listă.
      awaitingAdminAction: false,
      // Cardul din overview e deja filtrat pe înrolare; data exactă nu se transmite.
      onboardingCompletedAtUtc: new Date().toISOString(),
      createdAtUtc: new Date().toISOString(),
      lastActivityAtUtc: pfa.lastActivityAtUtc,
      // Cardurile din overview sunt doar ale conturilor deschise.
      deletedAtUtc: null,
      fiscalProfileStatus: 'NOT_STARTED',
    })
    setActiveTab('pfa_inrolate')
    navigate(`/admin?tab=pfa_inrolate&user=${pfa.userId}`)
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
      window.dispatchEvent(new Event('ridelance:notifications-changed'))
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Trimiterea notificărilor de test a eșuat.'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setTestNotifLoading(false)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Privire de ansamblu', group: 'Spațiu de lucru', icon: <HomeRoundedIcon /> },
    { id: 'pfa', label: 'Onboarding', group: 'Clienți', icon: <PeopleAltRoundedIcon /> },
    { id: 'pfa_inrolate', label: 'PFA înrolate', group: 'Clienți', icon: <HowToRegRoundedIcon /> },
    { id: 'srl_inrolate', label: 'SRL înrolate', group: 'Clienți', icon: <BusinessRoundedIcon /> },
    { id: 'chat', label: 'Chat', group: 'Clienți', icon: <ChatRoundedIcon /> },
    { id: 'sarcini', label: 'Sarcini', group: 'Clienți', icon: <AssignmentTurnedInRoundedIcon /> },
    { id: 'masini', label: 'Mașini ridesharing', group: 'Activitate comercială', icon: <DirectionsCarFilledRoundedIcon /> },
    // Lângă mașini, nu lângă setări: e tot moderare de conținut public, doar că a firmei.
    { id: 'pagini_firme', label: 'Pagini firme', group: 'Activitate comercială', icon: <LanguageRoundedIcon /> },
    { id: 'servicii', label: 'Servicii', group: 'Activitate comercială', icon: <ShoppingCartRoundedIcon /> },
    { id: 'asigurari', label: 'Asigurări', group: 'Activitate comercială', icon: <ShieldRoundedIcon /> },
    { id: 'facturare', label: 'Facturare Oblio', group: 'Finanțe', icon: <ReceiptLongRoundedIcon /> },
    { id: 'reduceri', label: 'Coduri de reducere', group: 'Finanțe', icon: <LocalOfferRoundedIcon /> },
    { id: 'calendar', label: 'Calendar birou', group: 'Administrare', icon: <EventAvailableRoundedIcon /> },
    { id: 'contabili', label: 'Echipa de contabili', group: 'Administrare', icon: <SupervisedUserCircleRoundedIcon /> },
    { id: 'notificari', label: 'Notificări', group: 'Administrare', icon: <NotificationsActiveRoundedIcon /> },
  ]

  const filteredPfas = pfas.filter(
    (p) => p.userName.toLowerCase().includes(search.toLowerCase()) || p.userEmail.toLowerCase().includes(search.toLowerCase())
  )

  /**
   * Unde cade un client în „PFA înrolate”. Un cont închis merge la „Șterse” oricând s-ar fi
   * închis — și în mijlocul onboardingului: altfel n-ar mai apărea nicăieri, deși datele lui rămân.
   */
  const enrolledFilterOf = (p: PfaSummary): EnrolledFilter | null => {
    if (p.deletedAtUtc) return 'deleted'
    if (p.onboardingCompletedAtUtc === null) return null
    return isActiveSubscription(p.subscriptionStatus) ? 'active' : 'inactive'
  }

  const enrolledCounts = ENROLLED_FILTERS.reduce(
    (acc, entry) => ({ ...acc, [entry.id]: filteredPfas.filter((p) => enrolledFilterOf(p) === entry.id).length }),
    {} as Record<EnrolledFilter, number>,
  )

  const displayPfas = filteredPfas
    // Înrolat = onboarding complet, nu „dosar PFA aprobat": un dosar aprobat poate avea încă
    // patru pași de parcurs, iar tabul de onboarding e chiar locul unde se urmăresc. Conturile
    // închise ies din onboarding și stau la „Șterse”.
    .filter(p =>
      activeTab === 'pfa_inrolate'
        ? enrolledFilterOf(p) === enrolledFilter
        : p.onboardingCompletedAtUtc === null && !p.deletedAtUtc
    )
    // Filtrul rapid din spec: dosarele la care mingea e la noi, nu la client.
    .filter(p => !onlyAwaitingAdmin || p.awaitingAdminAction)
    .filter(p => activeTab !== 'pfa_inrolate' || fiscalFilter === 'all' || p.fiscalProfileStatus === fiscalFilter)

  // Contorul se calculează înainte de filtru, altfel ar arăta mereu numărul afișat.
  const awaitingAdminCount = filteredPfas.filter(p => p.awaitingAdminAction).length

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
    const active = pfaDetail

    return (
      <>
        <PfaDetailView
          key={pfa.id}
          pfa={pfa}
          detail={active}
          detailLoading={pfaDetailLoading}
          detailError={pfaDetailError}
          documents={documents}
          docsLoading={docsLoading}
          docsError={docsError}
          meta={{
            plan: active?.plan ?? pfaPlanLabel(pfa),
            subscription: active?.subscriptionStatus ?? subscriptionStatusLabel(pfa.subscriptionStatus),
            registration: active?.registrationType ?? formatRegistrationType(pfa.registrationType),
            month: active?.currentMonthStatus ?? pfaCurrentMonthStatus(pfa),
            activity: active?.lastActivityLabel ?? (pfa.lastActivityAtUtc ? relativeTime(pfa.lastActivityAtUtc) : 'Fără activitate'),
          }}
          payments={[
            ['Plan actual', active?.plan ?? pfaPlanLabel(pfa)],
            ['Preț', active?.priceBani == null ? '' : formatLei(active.priceBani)],
            ['Status abonament', active?.subscriptionStatus ?? subscriptionStatusLabel(pfa.subscriptionStatus)],
            ['Data început', formatDate(active?.subscriptionStartedAtUtc)],
            ['Următoarea plată', formatDate(active?.nextPaymentAtUtc)],
            ['Ultima plată', formatDate(active?.lastPaymentAtUtc)],
            ['Plăți eșuate', String(active?.failedPayments ?? 0)],
            ['Reducere activă', active?.activeDiscount ?? ''],
            ['Istoric plăți', active?.customerAgeLabel ?? customerAgeLabel(pfa.createdAtUtc)],
          ]}
          accounting={[
            ['Status lună curentă', active?.currentMonthStatus ?? pfaCurrentMonthStatus(pfa)],
            ['Ultima lună procesată', active?.lastProcessedMonth ?? ''],
            ['Documente lunare lipsă', String(active?.missingMonthlyDocuments ?? 0)],
            ['Documente de verificat', String(active?.documentsToReview ?? pfa.documentCount)],
          ]}
          onBack={() => { navigate(`/admin?tab=${activeTab}`); setSelectedPfa(null) }}
          refreshAction={refreshButton}
          onImpersonate={() => handleImpersonate(pfa.userId, pfa.userName || pfa.fullName || pfa.userEmail)}
          onOpenAction={openDetailAction}
          onOpenChat={() => { navigate('/admin?tab=chat&user=' + pfa.userId); setSelectedPfa(null); setActiveTab('chat') }}
          onApprove={() => handleOpenStatusDialog('Approved')}
          onReject={() => handleOpenStatusDialog('Rejected')}
          onDocumentsChanged={async () => {
            // Un act încărcat din admin trebuie să apară imediat în pasul lui, fără reîncărcarea paginii.
            setDocuments(await documentService.getByUser(pfa.userId))
          }}
          onUpdateDocStatus={handleUpdateDocStatus}
          onOpenDocument={handleOpenDocument}
          onDownload={handleDownload}
          onSnackbar={(message, severity) => setSnackbar({ open: true, message, severity })}
          onboardingRefreshKey={onboardingRefreshKey}
          statusUpdatingDocId={statusUpdatingDocId}
          openingId={openingId}
          downloadingId={downloadingId}
        />

        {/* Status update confirm dialog */}
        <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, action: null })} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 650 }}>
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
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 0.5, display: 'block' }} component="p">
                    CERTIFICAT DE ÎNREGISTRARE {existingCertificate ? '' : '*'}
                  </Typography>
                  {existingCertificate && !certificatFile && (
                    <Alert severity="success" sx={{ mb: 1, borderRadius: `${TOKENS.radius.md}px` }}>
                      Clientul a încărcat deja certificatul ({existingCertificate.originalFileName}). Se
                      folosește acesta — atașează unul nou doar dacă vrei să-l înlocuiești.
                    </Alert>
                  )}
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<AttachFileRoundedIcon />}
                    sx={{
                      height: 56,
                      borderRadius: `${TOKENS.radius.md}px`,
                      border: `1px dashed ${alpha(TOKENS.ink, 0.2)}`,
                      color: 'text.secondary',
                      justifyContent: 'flex-start',
                      px: 2,
                      '&:hover': {
                        borderColor: TOKENS.primary,
                        bgcolor: alpha(TOKENS.primary, 0.04)
                      }
                    }}
                  >
                    <Box sx={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {certificatFile
                        ? certificatFile.name
                        : existingCertificate
                          ? 'Înlocuiește certificatul'
                          : 'Atașează Certificat de Înregistrare'}
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
          <DialogTitle sx={{ fontWeight: 650 }}>
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
              sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 650 }}
            >
              {detailActionLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Salvează'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }

  // ─── PFA List ────────────────────────────────────────────────────────────────
  const renderPfaList = () => (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h1">{activeTab === 'pfa_inrolate' ? 'PFA înrolate' : 'Onboarding'}</Typography>
          <Typography color="text.secondary" variant="body1" sx={{ mt: 1 }}>Găsește un client, verifică documentele și urmărește progresul dosarului.</Typography>
        </Box>
        {refreshButton}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SearchRoundedIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <TextField variant="outlined" size="small" label="Caută după nume sau email" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: { xs: '100%', sm: 300 }, maxWidth: '100%', ...inputSx }} />
        </Box>
        {activeTab === 'pfa_inrolate' && ENROLLED_FILTERS.map((entry) => (
          <Chip
            key={entry.id}
            label={`${entry.label} (${enrolledCounts[entry.id]})`}
            onClick={() => setEnrolledFilter(entry.id)}
            variant={enrolledFilter === entry.id ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              cursor: 'pointer',
              ...(enrolledFilter === entry.id
                ? { bgcolor: TOKENS.primary, color: '#fff', '&:hover': { bgcolor: TOKENS.primaryStrong } }
                : { borderColor: alpha(TOKENS.ink, 0.15), color: TOKENS.textMuted }),
            }}
          />
        ))}
        {activeTab === 'pfa_inrolate' && (
          <TextField
            select
            size="small"
            label="Profil fiscal"
            value={fiscalFilter}
            onChange={(e) => setFiscalFilter(e.target.value as FiscalFilter)}
            sx={{ minWidth: 170 }}
          >
            {FISCAL_FILTERS.map((entry) => (
              <MenuItem key={entry.id} value={entry.id}>{entry.label}</MenuItem>
            ))}
          </TextField>
        )}
        {activeTab === 'pfa' && <Chip
          label={`Așteaptă acțiune admin${awaitingAdminCount > 0 ? ` (${awaitingAdminCount})` : ''}`}
          onClick={() => setOnlyAwaitingAdmin((v) => !v)}
          variant={onlyAwaitingAdmin ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 700,
            cursor: 'pointer',
            ...(onlyAwaitingAdmin
              ? { bgcolor: TOKENS.primary, color: '#fff', '&:hover': { bgcolor: TOKENS.primaryStrong } }
              : { borderColor: alpha(TOKENS.ink, 0.15), color: TOKENS.textMuted }),
          }}
        />}
      </Box>

      {pfasLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} sx={{ color: TOKENS.primary }} /></Box>}
      {pfasError && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{pfasError}</Alert>}
      {!pfasLoading && !pfasError && displayPfas.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: TOKENS.textMuted }}>{search ? 'Nicio înregistrare găsită.' : 'Nu există înregistrări PFA.'}</Typography>
        </Box>
      )}
      {!pfasLoading && !pfasError && displayPfas.length > 0 && (
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">{displayPfas.length} clienți afișați</Typography>
          </Box>
          {displayPfas.map((pfa) => (
            <Box component="article" key={pfa.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(220px, 1.6fr) minmax(160px, 1fr) minmax(180px, 1fr) auto' }, gap: 2, p: 2.5, alignItems: 'center', borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: 'grey.50' } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.light', color: 'text.primary', fontSize: 16 }}>{(pfa.userName || pfa.fullName || '?').charAt(0)}</Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>{pfa.userName || pfa.fullName || 'PFA fără nume'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{pfa.userEmail}</Typography>
                  {pfa.phone && <Typography variant="caption" color="text.secondary">{pfa.phone}</Typography>}
                </Box>
              </Stack>
              <Box>
                {pfa.deletedAtUtc
                  ? <Chip label="Cont închis" size="small" sx={{ bgcolor: alpha('#ef4444', 0.08), color: '#ef4444' }} />
                  : <Chip label={pfa.awaitingAdminAction ? 'Necesită verificare' : statusLabel(pfa.status)} size="small" sx={{ bgcolor: alpha(statusColor(pfa.status), 0.08), color: statusColor(pfa.status) }} />}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>{pfa.documentCount} documente · {pfaPlanLabel(pfa)}</Typography>
                {activeTab === 'pfa_inrolate' && !pfa.deletedAtUtc && (
                  <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">Profil fiscal:</Typography>
                    <FiscalProfileStatusChip status={pfa.fiscalProfileStatus} />
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="body2">{subscriptionStatusLabel(pfa.subscriptionStatus)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {pfa.deletedAtUtc
                    ? `Închis la ${new Date(pfa.deletedAtUtc).toLocaleDateString('ro-RO')}`
                    : pfa.lastActivityAtUtc ? relativeTime(pfa.lastActivityAtUtc) : 'Fără activitate'}
                </Typography>
              </Box>
              <Stack direction={{ xs: 'row', lg: 'column' }} sx={{ gap: 0.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Button variant="outlined" size="small" onClick={() => { setSelectedPfa(pfa); navigate('/admin?tab=' + activeTab + '&user=' + pfa.userId) }}>Deschide dosarul</Button>
                <Button size="small" disabled={pfa.status.toLowerCase() !== 'approved'} onClick={() => handleImpersonate(pfa.userId, pfa.userName || pfa.userEmail)}>Intră în contul clientului</Button>
                {activeTab === 'pfa_inrolate' && (
                  <Button
                    size="small"
                    color={pfa.deletedAtUtc ? 'primary' : 'error'}
                    onClick={() => setAccountAction({
                      userId: pfa.userId,
                      name: pfa.userName || pfa.fullName || pfa.userEmail,
                      action: pfa.deletedAtUtc ? 'reopen' : 'close',
                    })}
                  >
                    {pfa.deletedAtUtc ? 'Redeschide contul' : 'Închide contul'}
                  </Button>
                )}
              </Stack>
            </Box>
          ))}
        </Paper>
      )}

      <CloseAccountDialog
        target={accountAction}
        onClose={() => setAccountAction(null)}
        onDone={(message) => {
          setAccountAction(null)
          setSnackbar({ open: true, message, severity: 'success' })
          setPfasReloadToken((token) => token + 1)
        }}
      />
    </Stack>
  )

  // ─── Enroll Contabil ─────────────────────────────────────────────────────────
  const renderContabili = () => (
    <Box sx={{ maxWidth: 600, py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: `${TOKENS.radius.xl}px`, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, background: `linear-gradient(165deg, ${alpha(TOKENS.primary, 0.06)} 0%, ${TOKENS.paper} 35%)` }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 650 }}>Înrolează Contabil Nou</Typography>
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
          borderRadius: `${TOKENS.radius.lg}px`,
          border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
          boxShadow: TOKENS.shadow.sm,
          bgcolor: alpha(TOKENS.primary, 0.04),
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 650, mb: 2 }}>
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

      <NotificationsInbox />
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
      case 'srl_inrolate': return (
        <SrlAccountsView
          onImpersonate={handleImpersonate}
          onSnackbar={(message, severity) => setSnackbar({ open: true, message, severity })}
        />
      )
      case 'masini': return <CarsAdminView />
      case 'pagini_firme': return <CompanyPagesAdminView />
      case 'servicii': return <ServicesAdminView />
      case 'facturare': return <OblioAdminView />
      case 'reduceri': return <DiscountsAdminView />
      case 'asigurari': return <InsuranceTab />
      case 'calendar': return <OfficeCalendarAdminView />
      case 'chat': return <AdminChatView pfas={pfas} />
      case 'contabili': return renderContabili()
      case 'notificari': return renderNotificari()
      case 'sarcini': return (
        <AdminTasksView
          onOpenPfa={(userId) => {
            setActiveTab('pfa_inrolate')
            navigate(`/admin?tab=pfa_inrolate&user=${userId}`)
          }}
        />
      )
      default: return null
    }
  }

  const userName = profile ? displayName(profile) : '...'

  return (
    <ThemeProvider theme={adminTheme}>
    <AdminLayout
      navItems={navItems}
      activeId={activeTab}
      onNavClick={(id) => { navigate(`/admin?tab=${id}`); setActiveTab(id); setSelectedPfa(null); setSearch(''); setOnlyAwaitingAdmin(false) }}
      onLogout={handleLogout}
      userName={userName}
    >
      {renderContent()}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: `${TOKENS.radius.md}px`, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
    </ThemeProvider>
  )
}
