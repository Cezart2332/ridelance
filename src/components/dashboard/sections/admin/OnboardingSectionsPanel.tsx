import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ONBOARDING_SECTIONS } from '../../../../constants/documentSections'
import { TOKENS } from '../../../../constants/tokens'
import AdminExtractedFields from './AdminExtractedFields'
import type { DocumentSummary } from '../../../../services/document.service'
import {
  onboardingService,
  type OnboardingSectionStatus,
  type OnboardingState,
  type PlatformOnboardingState,
  type PlatformOnboardingStatus,
  type PlatformProvider,
} from '../../../../services/onboarding.service'
import { formatDocumentCategory } from '../../../../utils/formatters'

interface OnboardingSectionsPanelProps {
  pfaId: string
  pfaStatus: string
  documents: DocumentSummary[]
  statusUpdatingDocId: string | null
  openingId: string | null
  downloadingId: string | null
  onUpdateDocStatus: (id: string, status: 'Verified' | 'Rejected') => void
  onOpenDocument: (doc: DocumentSummary) => void
  onDownload: (doc: DocumentSummary) => void
  onOpenPfaApproveDialog: () => void
  onOpenPfaRejectDialog: () => void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
  /** Incrementat de părinte după aprobarea PFA, ca panoul să-și reîncarce starea. */
  refreshKey?: number
}

function sectionStatusLabel(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Locked': return 'Blocat'
    case 'InProgress': return 'În completare'
    case 'AwaitingValidation': return 'În validare'
    case 'Validated': return 'Validat'
    case 'Rejected': return 'Respins'
    default: return status
  }
}

function sectionStatusColor(status: OnboardingSectionStatus): string {
  switch (status) {
    case 'Validated': return '#10b981'
    case 'AwaitingValidation': return '#f59e0b'
    case 'Rejected': return '#ef4444'
    case 'InProgress': return TOKENS.primaryStrong
    default: return 'rgba(26,26,46,0.45)'
  }
}

/** Sub-secțiune de documente care se validează de admin (cheie de secțiune server). */
interface AdminStepSection {
  key: string
  label?: string
}

/** Cei 6 pași văzuți de admin — oglinda pașilor clientului. Documentele se grupează pe pas;
 *  validarea rămâne pe secțiunile server care declanșează înrolarea. */
interface AdminStep {
  key: string
  order: number
  label: string
  categories: string[]
  pfa?: boolean
  sections?: AdminStepSection[]
  guidedNote?: string
}

const ADMIN_STEPS: AdminStep[] = [
  {
    key: 'eligibility', order: 0, label: 'Eligibilitate',
    categories: ['Buletin', 'CarteIdentitate', 'PermisConducere', 'AtestatSofer', 'AtestatTransport'],
    guidedNote: 'Documentele de eligibilitate (CI, permis, atestat). Verificarea automată + de admin se face la nivel de document. Avizele medical și psihologic se cer la pasul ARR.',
  },
  {
    key: 'pfa', order: 1, label: 'PFA',
    categories: ['CertificatInregistrare', 'CertificatConstatator'],
    pfa: true,
  },
  {
    key: 'fiscal', order: 2, label: 'Fiscal, bancă & semnături',
    categories: ['ExtrasBancar', 'DecontTvaIntracomunitar', 'DecontTaxaNerezident', 'CertificatTvaIntracomunitar', 'DocumenteSemnate'],
    guidedNote: 'TVA, cont bancar și cont Oblio le completează clientul. Pachetul de semnături îl trimiți în afara aplicației; clientul îl încarcă semnat mai sus, la documente. Pasul se închide când validezi secțiunea, mai jos.',
  },
  {
    key: 'arr', order: 3, label: 'Autorizație transport (ARR)',
    categories: ['CazierJudiciar', 'AdeverintaMedicala', 'AvizPsihologic', 'DovadaPlataArr', 'AutorizatieTransportAlternativ', 'DosarAutorizatieArr'],
    sections: [{ key: 'AutorizatieTransport' }],
  },
  {
    key: 'platforms', order: 4, label: 'Uber & Bolt',
    categories: [],
    guidedNote: 'Pasul n-are documente: clientul completează conturile de flotă și de șofer, iar avansul până la „Activ" îl faci tu, mai jos.',
  },
  {
    key: 'vehicle', order: 5, label: 'Vehicul, copie conformă & ecusoane',
    categories: ['Talon', 'CarteIdentitateAuto', 'ContractVehicul', 'AcordLeasing', 'ITP', 'RCA', 'CopieConforma', 'EcusonUber', 'EcusonBolt', 'DovadaPlataCopieConformaEcusoane', 'AsigurareCalatori', 'DosarCopieConformaEcusoane'],
    sections: [{ key: 'CopieConforma', label: 'Copie conformă & ecusoane' }, { key: 'Vehicul', label: 'Documentele mașinii' }],
  },
]

function pfaSectionStatus(pfaStatus: string): OnboardingSectionStatus {
  const s = pfaStatus.toLowerCase()
  if (s === 'approved') return 'Validated'
  if (s === 'rejected') return 'Rejected'
  return 'AwaitingValidation'
}

/** Statusul de afișat pe capul pasului: agregat din secțiunile server (dacă are), altfel din pasul derivat pe server. */
function aggregateStepStatus(group: AdminStep, state: OnboardingState | null, pfaStatus: string): OnboardingSectionStatus {
  const statuses: OnboardingSectionStatus[] = []
  if (group.pfa) statuses.push(pfaSectionStatus(pfaStatus))
  for (const s of group.sections ?? []) {
    statuses.push(state?.sections.find((x) => x.key === s.key)?.status ?? 'Locked')
  }

  if (statuses.length > 0) {
    if (statuses.includes('Rejected')) return 'Rejected'
    if (statuses.includes('AwaitingValidation')) return 'AwaitingValidation'
    if (statuses.every((s) => s === 'Validated')) return 'Validated'
    if (statuses.includes('InProgress')) return 'InProgress'
    return 'Locked'
  }

  const st = state?.steps.find((s) => s.key === group.key)?.status
  if (st === 'Completed') return 'Validated'
  if (st === 'AwaitingValidation') return 'AwaitingValidation'
  if (st === 'Locked') return 'Locked'
  return 'InProgress'
}

function docStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return '#10b981'
  if (s === 'pending') return '#f59e0b'
  return '#ef4444'
}

function docStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return 'Verificat'
  if (s === 'pending') return 'În verificare'
  return 'Respins'
}

/** Statusurile de onboarding ale unui cont de platformă, în ordinea în care se parcurg. */
const PLATFORM_STATUSES: { value: PlatformOnboardingStatus; label: string }[] = [
  { value: 'NotStarted', label: 'Neînceput' },
  { value: 'Selected', label: 'Selectat' },
  { value: 'AccountLinked', label: 'Cont legat' },
  { value: 'ContractSigned', label: 'Contract semnat' },
  { value: 'Active', label: 'Activ' },
  { value: 'Skipped', label: 'Sărit' },
]

const EXISTING_ACCOUNT_LABELS: Record<string, string> = {
  HasOperatorAccount: 'Are deja cont de operator',
  None: 'Nu are cont',
  DriverOnly: 'Are doar cont de șofer',
  Unknown: 'Nu știe',
}

/**
 * Ce a completat clientul la pasul Uber & Bolt.
 *
 * Pasul e singurul din onboarding fără documente, deci grupul lui arăta „Niciun document încărcat"
 * și atât — adminul nu vedea nici platformele alese, nici conturile, deși totul era salvat de mult.
 * Tot de aici se face și avansul manual: endpointul exista, dar nu-l apela nimeni.
 */
function PlatformAccountsReview({
  pfaId,
  busy,
  onSnackbar,
}: {
  pfaId: string
  busy: boolean
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [platforms, setPlatforms] = useState<PlatformOnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Starea se scrie doar din lanțul de promisiuni, niciodată sincron în efect: un `setState`
  // direct în corpul efectului declanșează randări în cascadă (regula react-hooks din proiect).
  useEffect(() => {
    let cancelled = false
    onboardingService
      .getPlatformOnboardingForRegistration(pfaId)
      .then((data) => {
        if (!cancelled) setPlatforms(data)
      })
      .catch(() => {
        if (!cancelled) setPlatforms(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pfaId])

  const advance = async (provider: PlatformProvider, status: PlatformOnboardingStatus) => {
    setSaving(provider)
    try {
      await onboardingService.advancePlatformOnboarding(pfaId, provider, status)
      setPlatforms(await onboardingService.getPlatformOnboardingForRegistration(pfaId))
      onSnackbar(`Contul ${provider} a fost mutat pe „${status}".`, 'success')
    } catch {
      onSnackbar(`Nu am putut schimba statusul contului ${provider}.`, 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ px: 2.5, pb: 2 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  const chosen = (platforms?.platforms ?? []).filter((p) => p.isSelectedByUser)

  if (chosen.length === 0) {
    return (
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Alert severity="info">Clientul nu a ales încă nicio platformă.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ px: 2.5, pb: 2 }}>
      <Stack spacing={2}>
        {chosen.map((account) => {
          const rows: { label: string; value: string }[] = [
            {
              label: 'Are cont?',
              value: EXISTING_ACCOUNT_LABELS[account.existingAccountAnswer ?? ''] ?? '—',
            },
            { label: 'Email flotă', value: account.email ?? '—' },
            { label: 'Telefon flotă', value: account.phone ?? '—' },
            { label: 'Parolă flotă', value: account.hasPassword ? 'Salvată' : 'Lipsește' },
            { label: 'ID operator', value: account.operatorAccountId ?? '—' },
            { label: 'Nume șofer', value: account.driverFullName ?? '—' },
            { label: 'Email șofer', value: account.driverEmail ?? '—' },
            { label: 'Telefon șofer', value: account.driverPhone ?? '—' },
          ]

          return (
            <Box key={account.provider}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                  {account.provider}
                </Typography>
                <Chip
                  label={
                    PLATFORM_STATUSES.find((s) => s.value === account.onboardingStatus)?.label ??
                    account.onboardingStatus
                  }
                  size="small"
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    bgcolor: alpha(account.onboardingStatus === 'Active' ? '#10b981' : '#f59e0b', 0.1),
                    color: account.onboardingStatus === 'Active' ? '#10b981' : '#f59e0b',
                  }}
                />
              </Stack>

              {rows.map((row) => (
                <Stack
                  key={row.label}
                  direction="row"
                  sx={{ justifyContent: 'space-between', gap: 2, py: 0.5 }}
                >
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                    {row.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                    {row.value}
                  </Typography>
                </Stack>
              ))}

              <TextField
                select
                size="small"
                label="Status onboarding"
                value={account.onboardingStatus}
                disabled={busy || saving === account.provider}
                onChange={(e) =>
                  void advance(account.provider, e.target.value as PlatformOnboardingStatus)
                }
                slotProps={{ select: { native: true } }}
                sx={{ mt: 1.5, minWidth: 200 }}
              >
                {PLATFORM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </TextField>
            </Box>
          )
        })}

        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            label={
              platforms?.fleetAccountsAccepted
                ? 'Permisiune conturi fleet: acceptată'
                : 'Permisiune conturi fleet: lipsă'
            }
            sx={{ fontSize: '0.62rem', fontWeight: 700 }}
          />
          {chosen.some((p) => p.provider === 'Bolt') && (
            <Chip
              size="small"
              label={
                platforms?.boltApiAccepted ? 'Bolt Fleet API: acceptat' : 'Bolt Fleet API: lipsă'
              }
              sx={{ fontSize: '0.62rem', fontWeight: 700 }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

/**
 * RL-02 — pasul fiscal nu poate fi închis de client: pachetul de împuterniciri îl alocăm noi.
 * Blocul ăsta e singurul loc din care pasul se finalizează sau se întoarce la client.
 */
function SignaturePacketReview({
  pfaId,
  stepState,
  busy,
  onDone,
  onSnackbar,
}: {
  pfaId: string
  stepState: string | undefined
  busy: boolean
  onDone: () => Promise<void>
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const complete = async () => {
    setSaving(true)
    try {
      // Fără niciun câmp: pachetul se pregătește și se trimite în afara aplicației, iar tot ce
      // ținea formularul (denumire, număr de semnături, expirare) era retranscris de mână din
      // altă unealtă — informație duplicată, care se învechea aici prima.
      await onboardingService.completeSignaturePacket(pfaId, {
        provider: 'EasyStreamTransSped',
        packageName: null,
        signatureCount: null,
        expiresAtUtc: null,
        adminNote: null,
      })
      onSnackbar('Secțiunea a fost validată. Pasul următor al clientului este deblocat.', 'success')
      await onDone()
    } catch {
      onSnackbar('Nu am putut finaliza pasul. Încearcă din nou.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const reject = async () => {
    if (!reason.trim()) return
    setSaving(true)
    try {
      await onboardingService.rejectSignaturePacket(pfaId, reason.trim(), null)
      onSnackbar('Pasul a fost întors clientului, cu motivul specificat.', 'success')
      setRejectOpen(false)
      setReason('')
      await onDone()
    } catch {
      onSnackbar('Nu am putut respinge pasul. Încearcă din nou.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (stepState === 'completed') {
    return (
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Alert severity="success">Secțiunea e validată, pasul e finalizat.</Alert>
      </Box>
    )
  }

  const disabled = busy || saving

  return (
    <Box sx={{ px: 2.5, pb: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: TOKENS.ink }}>
          Pachet de semnături
        </Typography>
        <Chip
          label={stepState === 'pending_admin' ? 'Așteaptă acțiunea ta' : 'La client'}
          size="small"
          sx={{
            fontSize: '0.62rem',
            fontWeight: 700,
            bgcolor: alpha(stepState === 'pending_admin' ? '#f59e0b' : TOKENS.textMuted, 0.1),
            color: stepState === 'pending_admin' ? '#f59e0b' : TOKENS.textMuted,
          }}
        />
      </Stack>

      {stepState === 'rejected' && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Pasul e la client, cu observațiile trimise. Îl poți valida oricum, dacă s-a rezolvat pe alt canal.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 1.5 }}>
        Pachetul se pregătește și se trimite clientului în afara aplicației. Clientul îl semnează și
        încarcă documentele semnate la „Pachetul de semnături, semnat", mai sus. Verifică-le, apoi
        validează secțiunea — asta îi deblochează pasul ARR.
      </Alert>

      <Stack direction="row" spacing={1.5}>
        <Button
          size="small"
          variant="contained"
          startIcon={<CheckCircleRoundedIcon />}
          onClick={complete}
          disabled={disabled}
          sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
        >
          Validează secțiunea
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CancelRoundedIcon />}
          onClick={() => setRejectOpen(true)}
          disabled={disabled}
          sx={{
            fontWeight: 700,
            borderColor: '#ef4444',
            color: '#ef4444',
            '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' },
          }}
        >
          Respinge
        </Button>
      </Stack>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Întoarce pasul la client</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
            Motivul se afișează clientului pe pasul fiscal, deci scrie-l ca instrucțiune.
          </Typography>
          <TextField
            label="Motivul respingerii"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Anulează</Button>
          <Button onClick={reject} disabled={!reason.trim() || saving} color="error" variant="contained">
            Respinge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/** Originea documentului, pentru rândurile pe care clientul nu le vede (RL-07). */
const ORIGIN_LABELS: Record<DocumentSummary['origin'], string> = {
  UserUpload: 'Încărcat de client',
  Prefilled: 'Precompletat',
  Inherited: 'Moștenit',
  SystemGenerated: 'Generat de sistem',
}

/** Chip cu verdictul prevalidării AI + tooltip cu detaliile extrase. */
function AiVerdictChip({ doc }: { doc: DocumentSummary }) {
  const config: Record<string, { label: string; color: string }> = {
    Queued: { label: 'AI: în curs', color: TOKENS.primaryStrong },
    Processing: { label: 'AI: în curs', color: TOKENS.primaryStrong },
    Passed: { label: 'AI: OK', color: '#10b981' },
    Failed: { label: 'AI: respins', color: '#ef4444' },
    Error: { label: 'AI: indisponibil', color: 'rgba(26,26,46,0.45)' },
  }
  const entry = config[doc.aiStatus]
  if (!entry) return null

  const details = [
    doc.aiSummary,
    doc.aiDetectedType ? `Detectat: ${doc.aiDetectedType}` : null,
    doc.aiExtractedExpiresAtUtc
      ? `Expirare citită din document: ${new Date(doc.aiExtractedExpiresAtUtc).toLocaleDateString('ro-RO')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const chip = (
    <Chip
      label={entry.label}
      size="small"
      variant="outlined"
      sx={{
        fontSize: '0.66rem',
        fontWeight: 700,
        borderColor: alpha(entry.color, 0.35),
        bgcolor: alpha(entry.color, 0.06),
        color: entry.color,
        flexShrink: 0,
      }}
    />
  )

  return details ? <Tooltip title={details}>{chip}</Tooltip> : chip
}

export function OnboardingSectionsPanel({
  pfaId,
  pfaStatus,
  documents,
  statusUpdatingDocId,
  openingId,
  downloadingId,
  onUpdateDocStatus,
  onOpenDocument,
  onDownload,
  onOpenPfaApproveDialog,
  onOpenPfaRejectDialog,
  onSnackbar,
  refreshKey = 0,
}: OnboardingSectionsPanelProps) {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionBusy, setActionBusy] = useState(false)
  const [confirmValidate, setConfirmValidate] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const loadState = useCallback(async () => {
    try {
      const next = await onboardingService.getForRegistration(pfaId)
      setState(next)
      setError(null)
      // Deschide implicit pasul care are o secțiune de validat (sau primul neîncheiat).
      const current =
        ADMIN_STEPS.find((g) => {
          const st = aggregateStepStatus(g, next, pfaStatus)
          return st === 'AwaitingValidation' || st === 'Rejected'
        }) ?? ADMIN_STEPS.find((g) => aggregateStepStatus(g, next, pfaStatus) === 'InProgress')
      if (current) {
        setExpanded((prev) => ({ ...prev, [current.key]: true }))
      }
    } catch {
      setError('Nu am putut încărca starea de onboarding a acestui dosar.')
    } finally {
      setLoading(false)
    }
  }, [pfaId, pfaStatus])

  useEffect(() => {
    setLoading(true)
    void loadState()
  }, [loadState, refreshKey])

  // Documentele care nu aparțin niciunui pas (ex. rapoarte lunare, facturi comision)
  const sectionCategories = useMemo(() => {
    const cats = new Set<string>()
    ADMIN_STEPS.forEach((s) => s.categories.forEach((c) => cats.add(c)))
    return cats
  }, [])
  const otherDocuments = documents.filter((d) => !sectionCategories.has(d.category))

  const handleValidate = async (key: string) => {
    setActionBusy(true)
    try {
      await onboardingService.validateSection(pfaId, key)
      onSnackbar('Secțiunea a fost validată. Următorul pas al clientului este deblocat.', 'success')
      setConfirmValidate(null)
      await loadState()
    } catch {
      onSnackbar('Nu am putut valida secțiunea. Încearcă din nou.', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const handleReject = async (key: string) => {
    if (!rejectNote.trim()) return
    setActionBusy(true)
    try {
      await onboardingService.rejectSection(pfaId, key, rejectNote.trim())
      onSnackbar('Secțiunea a fost respinsă. Clientul a fost notificat.', 'success')
      setRejectDialog(null)
      setRejectNote('')
      await loadState()
    } catch {
      onSnackbar('Nu am putut respinge secțiunea. Încearcă din nou.', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const renderDocRow = (doc: DocumentSummary) => (
    <Box key={doc.id} sx={{ borderTop: `1px solid ${alpha(TOKENS.ink, 0.05)}` }}>
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.2,
      }}
    >
      <Box sx={{ width: 30, height: 30, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.primaryStrong, flexShrink: 0 }}>
        <InsertDriveFileRoundedIcon sx={{ fontSize: 15 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 650 }} noWrap title={doc.originalFileName}>
          {doc.originalFileName}
        </Typography>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          {formatDocumentCategory(doc.category)}
          {doc.expiresAtUtc ? ` · Expiră ${new Date(doc.expiresAtUtc).toLocaleDateString('ro-RO')}` : ''}
          {/* RL-07 — clientul nu vede tot ce e în dosar; adminul trebuie să știe care sunt alea. */}
          {!doc.isUserFacing && ` · ${ORIGIN_LABELS[doc.origin]} · ascuns clientului`}
        </Typography>
      </Box>
      <AiVerdictChip doc={doc} />
      <Chip
        label={docStatusLabel(doc.status)}
        size="small"
        sx={{ fontSize: '0.66rem', fontWeight: 700, bgcolor: alpha(docStatusColor(doc.status), 0.1), color: docStatusColor(doc.status), flexShrink: 0 }}
      />
      {doc.status.toLowerCase() === 'pending' && (
        <>
          <IconButton
            size="small"
            onClick={() => onUpdateDocStatus(doc.id, 'Verified')}
            disabled={statusUpdatingDocId === doc.id}
            sx={{ color: '#10b981', '&:hover': { bgcolor: alpha('#10b981', 0.1) } }}
            title="Aprobă document"
          >
            {statusUpdatingDocId === doc.id ? <CircularProgress size={15} color="inherit" /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onUpdateDocStatus(doc.id, 'Rejected')}
            disabled={statusUpdatingDocId === doc.id}
            sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}
            title="Respinge document"
          >
            <CancelRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </>
      )}
      <IconButton
        size="small"
        onClick={() => onOpenDocument(doc)}
        disabled={openingId === doc.id}
        title="Deschide"
        sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
      >
        {openingId === doc.id ? <CircularProgress size={15} sx={{ color: TOKENS.primary }} /> : <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />}
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDownload(doc)}
        disabled={downloadingId === doc.id}
        title="Descarcă"
        sx={{ color: TOKENS.primaryStrong, '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1) } }}
      >
        {downloadingId === doc.id ? <CircularProgress size={15} sx={{ color: TOKENS.primary }} /> : <FileDownloadRoundedIcon sx={{ fontSize: 18 }} />}
      </IconButton>
    </Stack>
    <AdminExtractedFields documentId={doc.id} />
    </Box>
  )

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} sx={{ color: TOKENS.primary }} />
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Se încarcă secțiunile de onboarding...</Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Onboarding pe secțiuni</Typography>
        <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
          Verifică documentele fiecărei secțiuni, apoi validează secțiunea pentru a debloca pasul următor al clientului.
        </Typography>
      </Box>

      {error && <Alert severity="warning" sx={{ m: 2 }}>{error}</Alert>}

      {ADMIN_STEPS.map((group) => {
        const status = aggregateStepStatus(group, state, pfaStatus)
        const color = sectionStatusColor(status)
        const groupDocs = documents.filter((d) => group.categories.includes(d.category))
        const pendingCount = groupDocs.filter((d) => d.status.toLowerCase() === 'pending').length
        const isOpen = expanded[group.key] ?? false

        return (
          <Box key={group.key} sx={{ borderTop: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
            <Stack
              direction="row"
              onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
              sx={{
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.8,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) },
              }}
            >
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color, 0.12), color, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                {group.order}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                  {group.label}
                </Typography>
                <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                  {groupDocs.length} documente
                  {pendingCount > 0 ? ` · ${pendingCount} de verificat` : ''}
                </Typography>
              </Box>
              <Chip
                label={sectionStatusLabel(status)}
                size="small"
                sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: alpha(color, 0.1), color, flexShrink: 0 }}
              />
              <ExpandMoreRoundedIcon
                sx={{ color: TOKENS.textMuted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </Stack>

            <Collapse in={isOpen}>
              {groupDocs.length === 0 ? (
                <Typography variant="body2" sx={{ color: TOKENS.textMuted, px: 2.5, pb: group.guidedNote ? 1 : 2 }}>
                  Niciun document încărcat pentru acest pas.
                </Typography>
              ) : (
                <Box sx={{ pb: 1 }}>{groupDocs.map(renderDocRow)}</Box>
              )}

              {group.guidedNote && (
                <Typography variant="body2" sx={{ color: TOKENS.textMuted, px: 2.5, pb: 2, fontStyle: 'italic' }}>
                  {group.guidedNote}
                </Typography>
              )}

              {/* Pasul PFA — aprobare/respingere dosar */}
              {group.pfa && pfaStatus.toLowerCase() === 'pending' && (
                <Stack direction="row" spacing={1.5} sx={{ px: 2.5, pb: 2, pt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<CheckCircleRoundedIcon />}
                    onClick={onOpenPfaApproveDialog}
                    sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
                  >
                    Validează PFA (aprobă dosarul)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CancelRoundedIcon />}
                    onClick={onOpenPfaRejectDialog}
                    sx={{ fontWeight: 700, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' } }}
                  >
                    Respinge
                  </Button>
                </Stack>
              )}

              {/* Pasul fiscal — alocarea pachetului de semnături (RL-02) */}
              {group.key === 'fiscal' && (
                <SignaturePacketReview
                  pfaId={pfaId}
                  stepState={state?.steps.find((s) => s.key === 'fiscal')?.state}
                  busy={actionBusy}
                  onDone={loadState}
                  onSnackbar={onSnackbar}
                />
              )}

              {/* Pasul 5 — conturile Uber/Bolt și avansul lor manual */}
              {group.key === 'platforms' && (
                <PlatformAccountsReview pfaId={pfaId} busy={actionBusy} onSnackbar={onSnackbar} />
              )}

              {/* Secțiuni de documente care se validează (declanșează înrolarea) */}
              {group.sections?.map((sec) => {
                const secState = state?.sections.find((s) => s.key === sec.key)
                const secStatus: OnboardingSectionStatus = secState?.status ?? 'Locked'
                const canAct = secStatus === 'AwaitingValidation' || secStatus === 'InProgress' || secStatus === 'Rejected'

                return (
                  <Box key={sec.key} sx={{ px: 2.5, pb: 2 }}>
                    {(sec.label || group.sections!.length > 1) && (
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: TOKENS.ink }}>
                          {sec.label ?? group.label}
                        </Typography>
                        <Chip
                          label={sectionStatusLabel(secStatus)}
                          size="small"
                          sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: alpha(sectionStatusColor(secStatus), 0.1), color: sectionStatusColor(secStatus) }}
                        />
                      </Stack>
                    )}
                    {secState?.note && secStatus === 'Rejected' && (
                      <Alert severity="error" sx={{ mb: 1.5 }}>Motivul respingerii: {secState.note}</Alert>
                    )}
                    {canAct && (
                      <Stack direction="row" spacing={1.5}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={actionBusy || secStatus === 'Rejected'}
                          startIcon={<CheckCircleRoundedIcon />}
                          onClick={() => setConfirmValidate(sec.key)}
                          sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
                        >
                          Validează
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={actionBusy || secStatus === 'Rejected'}
                          startIcon={<CancelRoundedIcon />}
                          onClick={() => { setRejectNote(''); setRejectDialog(sec.key) }}
                          sx={{ fontWeight: 700, borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.06), borderColor: '#dc2626' } }}
                        >
                          Respinge
                        </Button>
                      </Stack>
                    )}
                  </Box>
                )
              })}
            </Collapse>
          </Box>
        )
      })}

      {/* Documente care nu aparțin secțiunilor de onboarding */}
      {otherDocuments.length > 0 && (
        <Box sx={{ borderTop: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
          <Box sx={{ px: 2.5, py: 1.8 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>
              Alte documente
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              Documente din afara secțiunilor de onboarding (buletin, rapoarte lunare etc.)
            </Typography>
          </Box>
          <Box sx={{ pb: 1 }}>{otherDocuments.map(renderDocRow)}</Box>
        </Box>
      )}

      {/* Confirmare validare secțiune */}
      <Dialog open={!!confirmValidate} onClose={() => setConfirmValidate(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Validează secțiunea</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Secțiunea va fi marcată ca validată și clientului i se deblochează pasul următor.
          </Typography>
          {confirmValidate && (() => {
            const cfg = ONBOARDING_SECTIONS.find((s) => s.key === confirmValidate)
            const docsInSection = documents.filter((d) => cfg?.docs?.some((c) => c.categories.includes(d.category)))
            const pending = docsInSection.filter((d) => d.status.toLowerCase() === 'pending').length
            return pending > 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {pending} documente din această secțiune nu sunt încă verificate. Poți valida oricum, dar verifică-le mai întâi dacă e cazul.
              </Alert>
            ) : null
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmValidate(null)} disabled={actionBusy}>Anulează</Button>
          <Button
            variant="contained"
            disabled={actionBusy}
            onClick={() => confirmValidate && handleValidate(confirmValidate)}
            sx={{ fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: 'none' }}
          >
            {actionBusy ? 'Se validează...' : 'Validează'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Respingere secțiune cu motiv */}
      <Dialog open={!!rejectDialog} onClose={() => setRejectDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Respinge secțiunea</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
            Clientul va primi o notificare cu motivul respingerii și va putea corecta documentele.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Motivul respingerii (obligatoriu)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)} disabled={actionBusy}>Anulează</Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionBusy || !rejectNote.trim()}
            onClick={() => rejectDialog && handleReject(rejectDialog)}
            sx={{ fontWeight: 700, boxShadow: 'none' }}
          >
            {actionBusy ? 'Se trimite...' : 'Respinge'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
