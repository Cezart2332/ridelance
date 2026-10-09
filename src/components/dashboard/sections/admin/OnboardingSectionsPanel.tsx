import { StepAnswers } from './OnboardingAnswersPanel'
import { ADMIN_STEPS, ELIGIBILITY_KEY, PFA_UPLOAD_CATEGORIES, type AdminStep } from '../../../../constants/adminSteps'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { PANEL_COMPAT_TOKENS as TOKENS } from '../../../panel/tokens'
import { fade } from '../../../panel/tokens'
import AdminExtractedFields from './AdminExtractedFields'
import { ArrFleetReview } from './ArrFleetReview'
import { VatRegistrationBlock } from '../../../../shared/accounting/ui/workspace/VatRegistrationCard'
import { DocumentRejectDialog } from './DocumentRejectDialog'
import { DocumentRow, SectionSkeleton } from '../../../admin'
import { documentService, type DocumentSummary } from '../../../../services/document.service'
import {
  onboardingService,
  type AdminFiscalReview,
  type OnboardingAnswerRecord,
  type OnboardingState,
  type OnboardingStep,
} from '../../../../services/onboarding.service'
import { formatDocumentCategory } from '../../../../utils/formatters'
import { getErrorMessage } from '../../../../utils/errorHandler'

/**
 * Verificarea dosarului de onboarding, din admin.
 *
 * Fiecare pas e un card al lui, cu aceleași trei părți: ce a completat clientul, documentele și
 * validarea. Starea pasului vine direct de pe server — aceeași pe care o vede clientul — nu se mai
 * recalculează aici din secțiuni, cum se întâmpla înainte, când adminul putea vedea pasul 3 „în
 * completare" cu pasul 2 încă blocat.
 *
 * De când fiecare pas se deschide doar pe validarea adminului, validarea e acțiunea principală a
 * paginii. Respingerea se face pe document, nu pe pas: un act greșit nu întoarce tot pasul.
 */

interface OnboardingSectionsPanelProps {
  pfaId: string
  pfaStatus: string
  /** Contul clientului: actele încărcate din admin ajung în dosarul lui. */
  clientUserId: string
  /** Fals cât clientul n-a ajuns la pasul 2: `pfaId` e atunci id-ul contului, nu al unui dosar. */
  hasRegistration?: boolean
  documents: DocumentSummary[]
  statusUpdatingDocId: string | null
  openingId: string | null
  downloadingId: string | null
  onUpdateDocStatus: (id: string, status: 'Verified' | 'Rejected', note?: string) => Promise<boolean>
  onOpenDocument: (doc: DocumentSummary) => void
  onDownload: (doc: DocumentSummary) => void
  onOpenPfaApproveDialog: () => void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
  /** Cheamă reîncărcarea documentelor după un upload din admin. */
  onDocumentsChanged?: () => Promise<void> | void
  /** Incrementat de părinte după aprobarea PFA, ca panoul să-și reîncarce starea. */
  refreshKey?: number
  onStateChange?: (state: OnboardingState) => void
}

/* ── Starea pasului, cum o arată adminul ── */

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_COLOR: Record<Tone, string> = {
  success: 'var(--rl-green-text)',
  warning: 'var(--rl-yellow-text)',
  error: 'var(--rl-red-text)',
  info: TOKENS.primaryStrong,
  neutral: 'var(--rl-text-subtle)',
}

/**
 * Vocabularul serverului, tradus pentru admin. „pending_admin" e „De verificat", nu „În validare":
 * de acum e acțiunea adminului, iar eticheta trebuie s-o spună.
 */
const STATE_PRESENTATION: Record<string, { label: string; tone: Tone }> = {
  completed: { label: 'Validat', tone: 'success' },
  pending_admin: { label: 'De verificat', tone: 'warning' },
  rejected: { label: 'Respins', tone: 'error' },
  in_progress: { label: 'La client', tone: 'info' },
  available: { label: 'La client', tone: 'info' },
  locked: { label: 'Blocat', tone: 'neutral' },
}

function presentationOf(step: OnboardingStep | undefined) {
  return STATE_PRESENTATION[step?.state ?? 'locked'] ?? STATE_PRESENTATION.locked
}

function StatePill({ tone, label }: { tone: Tone; label: string }) {
  const color = TONE_COLOR[tone]
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: `${TOKENS.radius.sm}px`,
        bgcolor: fade(color, 0.1),
        color,
        fontSize: '0.75rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      {label}
    </Box>
  )
}

/** Titlul unei subsecțiuni din cardul pasului. */
function Subheading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 2 }}>
      <Typography
        sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: TOKENS.textMuted }}
      >
        {children}
      </Typography>
      {action}
    </Stack>
  )
}

/** Un rând etichetă–valoare, pentru datele completate de client. */
function Fact({ label, value, emphasis }: { label: string; value: ReactNode; emphasis?: Tone }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ py: 1, gap: { xs: 0.25, sm: 2 }, borderBottom: `1px solid ${fade(TOKENS.ink, 0.05)}`, '&:last-of-type': { borderBottom: 0 } }}>
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, width: { sm: 200 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        sx={{ fontWeight: 600, color: emphasis ? TONE_COLOR[emphasis] : TOKENS.ink, wordBreak: 'break-word', minWidth: 0 }}
      >
        {value}
      </Typography>
    </Stack>
  )
}

/** „1 document e încă de verificat" / „3 documente sunt încă de verificat". */
function pendingDocsText(count: number): string {
  return count === 1 ? '1 document e încă de verificat.' : `${count} documente sunt încă de verificat.`
}

function docStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'verified' || s === 'approved') return 'Verificat'
  if (s === 'pending') return 'De verificat'
  return 'Respins'
}

/** Originea documentului, pentru rândurile pe care clientul nu le vede (RL-07). */
const ORIGIN_LABELS: Record<DocumentSummary['origin'], string> = {
  UserUpload: 'Încărcat de client',
  Prefilled: 'Precompletat',
  Inherited: 'Moștenit',
  SystemGenerated: 'Generat de sistem',
  AdminUpload: 'Încărcat de agent',
}

/** Chip cu verdictul prevalidării AI + tooltip cu detaliile extrase. */
function AiVerdictChip({ doc }: { doc: DocumentSummary }) {
  const config: Record<string, { label: string; tone: Tone }> = {
    Queued: { label: 'AI: în curs', tone: 'info' },
    Processing: { label: 'AI: în curs', tone: 'info' },
    Passed: { label: 'AI: OK', tone: 'success' },
    Failed: { label: 'AI: respins', tone: 'error' },
    Error: { label: 'AI: indisponibil', tone: 'neutral' },
  }
  const reasons = doc.aiSuspicionReasons ?? []
  // Trecut, dar suspect: fără ștampilă, PDF din Word, titular diferit de buletin. Nu „AI: OK”.
  const entry =
    doc.aiStatus === 'Passed' && reasons.length > 0
      ? { label: 'AI: suspect', tone: 'warning' as Tone }
      : config[doc.aiStatus]
  if (!entry) return null

  const details = [
    ...reasons,
    doc.aiSummary,
    doc.aiDetectedType ? `Detectat: ${doc.aiDetectedType}` : null,
    doc.aiExtractedExpiresAtUtc
      ? `Expirare citită din document: ${new Date(doc.aiExtractedExpiresAtUtc).toLocaleDateString('ro-RO')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const chip = <StatePill tone={entry.tone} label={entry.label} />
  return details ? <Tooltip title={details}>{chip}</Tooltip> : chip
}

/* ── Pasul 3: ce a completat clientul ── */

const VAT_LABELS: Record<string, string> = {
  Yes: 'Da, are certificat de TVA intracomunitar',
  No: 'Nu',
  DontKnow: 'Nu știe (răspuns vechi)',
}

const BANK_STATUS: Record<string, { label: string; tone: Tone }> = {
  Linked: { label: 'Conectată', tone: 'success' },
  Created: { label: 'Așteaptă autorizarea la bancă', tone: 'warning' },
  Pending: { label: 'Așteaptă autorizarea la bancă', tone: 'warning' },
  Expired: { label: 'Consimțământ expirat', tone: 'error' },
  Revoked: { label: 'Deconectată', tone: 'error' },
  Error: { label: 'Eroare la conectare', tone: 'error' },
}

/**
 * Pasul fiscal aproape n-are documente — TVA-ul „Nu" nu produce niciunul, banca vine prin open
 * banking, pachetul de semnături circulă pe email. Fără blocul ăsta, adminul vedea „niciun
 * document" și n-avea ce verifica înainte să valideze.
 */
function FiscalReview({ pfaId, refreshKey }: { pfaId: string; refreshKey: number }) {
  const [review, setReview] = useState<AdminFiscalReview | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getFiscalReview(pfaId)
      .then((data) => {
        if (!cancelled) setReview(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [pfaId, refreshKey])

  if (failed) return <Alert severity="warning">Nu am putut încărca datele pasului fiscal.</Alert>
  if (!review) return <CircularProgress size={20} />

  const { step2, bank, declaredIban } = review
  const bankStatus = bank ? (BANK_STATUS[bank.status] ?? { label: bank.status, tone: 'neutral' as Tone }) : null

  return (
    <Box>
      <Fact
        label="TVA intracomunitar"
        value={step2.fiscal ? (VAT_LABELS[step2.fiscal.vatAnswer] ?? step2.fiscal.vatAnswer) : 'Fără răspuns'}
        emphasis={step2.fiscal ? undefined : 'warning'}
      />
      {/* „Nu”: codul îl obținem noi, cu D700 generat automat și verificat de contabil. */}
      {step2.fiscal?.vatAnswer === 'No' && (
        <Box sx={{ my: 1.5, p: 2, border: '1px solid var(--rl-border)', borderRadius: 2 }}>
          <VatRegistrationBlock pfaId={pfaId} />
        </Box>
      )}
      <Fact
        label="Bancă (open banking)"
        value={
          bank && bankStatus ? (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <span>{bank.institutionName ?? 'Bancă necunoscută'}</span>
              <StatePill tone={bankStatus.tone} label={bankStatus.label} />
            </Stack>
          ) : (
            'Neconectată'
          )
        }
        emphasis={bank ? undefined : 'warning'}
      />
      {bank?.accounts.map((account, index) => (
        <Fact
          key={`${account.iban ?? 'cont'}-${index}`}
          label={bank.accounts.length > 1 ? `Cont ${index + 1}` : 'Cont'}
          value={[account.iban, account.currency, account.ownerName].filter(Boolean).join(' · ') || '—'}
        />
      ))}
      {declaredIban && <Fact label="IBAN declarat" value={declaredIban} />}
      <Fact
        label="Cont Oblio"
        value={
          step2.oblio
            ? `${step2.oblio.accountEmail ?? 'fără email'} · ${step2.oblio.allConsentsAccepted ? 'acorduri acceptate' : 'acorduri lipsă'}`
            : 'Neconfigurat'
        }
        emphasis={step2.oblio?.allConsentsAccepted ? undefined : 'warning'}
      />
    </Box>
  )
}

/* ── Pasul 2: PFA și avansul ── */

const lei = (bani: number) => `${(bani / 100).toLocaleString('ro-RO', { maximumFractionDigits: 2 })} lei`

const PAYMENT_PRESENTATION: Record<OnboardingState['paymentStatus'], { label: string; tone: Tone }> = {
  PAID: { label: 'Plătit', tone: 'success' },
  FAILED: { label: 'Plata a eșuat', tone: 'error' },
  PENDING: { label: 'Neplătit încă', tone: 'warning' },
  NOT_REQUIRED: { label: 'Nu e cazul', tone: 'neutral' },
}

/**
 * Ramura aleasă la PFA și avansul. Adminul nu vedea dacă clientul plătise, dacă plata picase sau
 * dacă nici nu ajunsese la ea — deci nu știa dacă poate porni înființarea.
 */
function PfaReview({ state }: { state: OnboardingState }) {
  const payment = PAYMENT_PRESENTATION[state.paymentStatus] ?? { label: state.paymentStatus, tone: 'neutral' as Tone }
  const forming = state.companyFormationStatus !== null

  return (
    <Box>
      <Fact label="Ramura aleasă" value={forming ? 'Nu are PFA — îl înființăm noi' : state.pfaRegistrationId ? 'Are deja PFA' : 'Fără răspuns'} />
      <Fact
        label="Avans Start"
        value={
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <span>
              {lei(state.onboardingAdvanceBani)}
              {state.onboardingAdvanceIsRefundable ? ' · returnabil' : ''}
            </span>
            <StatePill tone={payment.tone} label={payment.label} />
          </Stack>
        }
        emphasis={state.paymentStatus === 'FAILED' ? 'error' : undefined}
      />
      {state.paymentStatus === 'PENDING' && (
        <Fact label="Poate plăti?" value={state.canPay ? 'Da — dosarul e semnat' : 'Nu încă — dosarul nu e semnat'} />
      )}
      {forming && <Fact label="Dosar înființare" value={[state.companyFormationStatus, state.companyFormationStage].filter(Boolean).join(' · ')} />}
    </Box>
  )
}

/* ── Pasul 3: pachetul de semnături ── */

/**
 * Pasul fiscal se închide pe pachetul de semnături, care circulă pe email. E singurul pas unde
 * respingerea rămâne la nivel de pas: n-are un document de respins.
 */
function SignaturePacketReview({
  pfaId,
  stepState,
  mandate,
  onDone,
  onMandateRegenerated,
  onSnackbar,
}: {
  pfaId: string
  stepState: string | undefined
  /** Împuternicirea ANAF generată la trimiterea pasului; nota ei spune ce date lipsesc. */
  mandate: DocumentSummary | undefined
  onDone: () => Promise<void>
  onMandateRegenerated: () => Promise<void>
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const complete = async () => {
    setSaving(true)
    try {
      await onboardingService.completeSignaturePacket(pfaId, {
        provider: 'EasyStreamTransSped',
        packageName: null,
        signatureCount: null,
        expiresAtUtc: null,
        adminNote: null,
      })
      onSnackbar('Pasul fiscal e validat. Pasul următor al clientului s-a deschis.', 'success')
      await onDone()
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut valida pasul. Încearcă din nou.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const regenerate = async () => {
    setSaving(true)
    try {
      const result = await onboardingService.regenerateAnafMandate(pfaId)
      onSnackbar(
        result.missing.length === 0
          ? `Împuternicirea ${result.number} e completă.`
          : `Împuternicirea ${result.number}: lipsește ${result.missing.join(', ')}.`,
        result.missing.length === 0 ? 'success' : 'error',
      )
      await onMandateRegenerated()
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut genera împuternicirea ANAF.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const reject = async () => {
    if (!reason.trim()) return
    setSaving(true)
    try {
      await onboardingService.rejectSignaturePacket(pfaId, reason.trim(), null)
      onSnackbar('Pasul a fost întors clientului, cu motivul scris.', 'success')
      setRejectOpen(false)
      setReason('')
      await onDone()
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut întoarce pasul. Încearcă din nou.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (stepState === 'completed' || stepState === 'locked') return null

  return (
    <>
      <ValidateBar
        hint="Pachetul se trimite și se primește semnat pe email. După ce l-ai primit, validează — asta deschide pasul următor."
        warning={mandate?.reviewNote ? `Împuternicire ANAF — ${mandate.reviewNote}` : null}
        busy={saving}
        label="Validează pasul"
        onValidate={() => void complete()}
        secondary={
          <>
            <Button size="small" disabled={saving} onClick={() => void regenerate()}>
              {mandate ? 'Regenerează împuternicirea' : 'Generează împuternicirea'}
            </Button>
            <Button size="small" color="error" disabled={saving} startIcon={<CancelRoundedIcon />} onClick={() => setRejectOpen(true)}>
              Întoarce pachetul
            </Button>
          </>
        }
      />

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Întoarce pachetul de semnături</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
            Motivul apare clientului pe pasul fiscal, deci scrie-l ca instrucțiune.
          </Typography>
          <TextField label="Motivul" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={3} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Anulează</Button>
          <Button onClick={() => void reject()} disabled={!reason.trim() || saving} color="error" variant="contained">
            Întoarce pachetul
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

/* ── Pasul 2: actele PFA, încărcate din admin ── */

/**
 * Actele PFA-ului, încărcate de echipă în dosarul clientului — pe ramura „Nu am PFA" le primim de
 * la Consulto după înființare, iar clientul n-are de unde să le aibă. Ajung pe contul lui, deci le
 * vede și intră în dosarul ARR ca orice act încărcat de el.
 */
function PfaDocumentsUpload({
  pfaId,
  clientUserId,
  onUploaded,
  onSnackbar,
}: {
  pfaId: string
  clientUserId: string
  onUploaded: () => Promise<void> | void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const upload = async (category: string, file: File | undefined) => {
    if (!file) return
    setUploading(category)
    try {
      await documentService.upload(file, category, pfaId, clientUserId)
      onSnackbar(`„${formatDocumentCategory(category)}" a fost adăugat în dosarul clientului.`, 'success')
      await onUploaded()
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut încărca documentul.'), 'error')
    } finally {
      setUploading(null)
      const input = inputs.current[category]
      if (input) input.value = ''
    }
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
      {PFA_UPLOAD_CATEGORIES.map((category) => (
        <Box key={category}>
          <input
            ref={(el) => {
              inputs.current[category] = el
            }}
            type="file"
            accept="application/pdf,image/*"
            hidden
            onChange={(e) => void upload(category, e.target.files?.[0])}
          />
          <Button
            fullWidth
            variant="outlined"
            disabled={uploading !== null}
            startIcon={uploading === category ? <CircularProgress size={16} /> : <UploadFileRoundedIcon />}
            onClick={() => inputs.current[category]?.click()}
            sx={{ justifyContent: 'flex-start', py: 1.1, fontWeight: 600, textAlign: 'left' }}
          >
            {formatDocumentCategory(category)}
          </Button>
        </Box>
      ))}
    </Box>
  )
}

/* ── Bara de validare, aceeași pe fiecare pas ── */

function ValidateBar({
  hint,
  warning,
  busy,
  label,
  onValidate,
  secondary,
}: {
  hint?: string
  warning?: string | null
  busy: boolean
  label: string
  onValidate: () => void
  secondary?: ReactNode
}) {
  return (
    <Box sx={{ mt: 1, p: 2, borderRadius: `${TOKENS.radius.md}px`, bgcolor: fade(TOKENS.ink, 0.025) }}>
      {warning && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {warning}
        </Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        {hint && (
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, maxWidth: 520 }}>
            {hint}
          </Typography>
        )}
        <Stack direction="row" sx={{ gap: 1, flexShrink: 0, justifyContent: 'flex-end' }}>
          {secondary}
          <Button
            variant="contained"
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon />}
            onClick={onValidate}
            sx={{ fontWeight: 700, boxShadow: 'none', bgcolor: TONE_COLOR.success, '&:hover': { bgcolor: 'var(--rl-green-text)', boxShadow: 'none' } }}
          >
            {label}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

/* ── Panoul ── */

export function OnboardingSectionsPanel({
  pfaId,
  pfaStatus,
  clientUserId,
  hasRegistration = true,
  documents,
  statusUpdatingDocId,
  openingId,
  downloadingId,
  onUpdateDocStatus,
  onOpenDocument,
  onDownload,
  onOpenPfaApproveDialog,
  onSnackbar,
  onDocumentsChanged,
  refreshKey = 0,
  onStateChange,
}: OnboardingSectionsPanelProps) {
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  /** Documentul pe care îl respingi acum — motivul ajunge la client lângă document. */
  const [docRejectTarget, setDocRejectTarget] = useState<DocumentSummary | null>(null)
  const [reviewTick, setReviewTick] = useState(0)
  /** Răspunsurile clientului, împărțite pe pași și arătate în cardul fiecăruia. */
  const [answers, setAnswers] = useState<OnboardingAnswerRecord[]>([])

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getAnswersForRegistration(pfaId)
      .then((loaded) => !cancelled && setAnswers(loaded))
      .catch(() => !cancelled && setAnswers([]))
    return () => {
      cancelled = true
    }
  }, [pfaId, reviewTick])

  const loadState = useCallback(async () => {
    try {
      const next = await onboardingService.getForRegistration(pfaId)
      setState(next)
      onStateChange?.(next)
      setError(null)
      setReviewTick((tick) => tick + 1)
      // Se deschide implicit pasul la care adminul are ceva de făcut: întâi cel de verificat, apoi
      // cel la care e clientul.
      const current =
        next.steps.find((s) => s.state === 'pending_admin' || s.state === 'rejected') ??
        next.steps.find((s) => s.state === 'in_progress' || s.state === 'available')
      if (current) setExpanded((prev) => ({ ...prev, [current.key]: true }))
    } catch {
      setError('Nu am putut încărca starea de onboarding a acestui dosar.')
    } finally {
      setLoading(false)
    }
  }, [pfaId, onStateChange])

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getForRegistration(pfaId)
      .then((next) => {
        if (cancelled) return
        setState(next)
        onStateChange?.(next)
        setError(null)
        // La reîmprospătare (manuală sau periodică) se reiau și răspunsurile și verificările pașilor.
        if (refreshKey > 0) setReviewTick((tick) => tick + 1)
        const current =
          next.steps.find((s) => s.state === 'pending_admin' || s.state === 'rejected') ??
          next.steps.find((s) => s.state === 'in_progress' || s.state === 'available')
        if (current) setExpanded((prev) => ({ ...prev, [current.key]: true }))
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca starea de onboarding a acestui dosar.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pfaId, refreshKey, onStateChange])

  // Documentele care nu aparțin niciunui pas (ex. rapoarte lunare, facturi comision).
  const stepCategories = useMemo(() => new Set(ADMIN_STEPS.flatMap((s) => s.categories)), [])
  const otherDocuments = documents.filter((d) => !stepCategories.has(d.category))

  const validated = state?.steps.filter((s) => s.state === 'completed').length ?? 0
  const total = state?.steps.length ?? ADMIN_STEPS.length

  /** Validează secțiunile unui pas; vehiculul are două, validate deodată. */
  const validateSections = async (group: AdminStep) => {
    setActionBusy(group.key)
    try {
      for (const section of group.sections ?? []) {
        if (section.key === ELIGIBILITY_KEY) await onboardingService.validateEligibility(pfaId)
        else await onboardingService.validateSection(pfaId, section.key)
      }
      onSnackbar(`Pasul „${group.label}" e validat. Pasul următor al clientului s-a deschis.`, 'success')
      await loadState()
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut valida pasul. Încearcă din nou.'), 'error')
    } finally {
      setActionBusy(null)
    }
  }

  const renderDocRow = (doc: DocumentSummary) => (
    <Box key={doc.id} sx={{ '& + &': { borderTop: `1px solid ${fade(TOKENS.ink, 0.06)}` } }}>
      <DocumentRow
        name={doc.originalFileName}
        meta={[
          formatDocumentCategory(doc.category),
          doc.expiresAtUtc ? 'Expiră ' + new Date(doc.expiresAtUtc).toLocaleDateString('ro-RO') : null,
          !doc.isUserFacing ? (ORIGIN_LABELS[doc.origin] ?? doc.origin) + ' · ascuns clientului' : null,
          doc.origin === 'AdminUpload' ? ORIGIN_LABELS.AdminUpload : null,
          doc.documentNumber ? `Nr. ${doc.documentNumber}` : null,
          doc.isSuperseded ? 'Înlocuit' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        statusLabel={docStatusLabel(doc.status)}
        statusTone={doc.status.toLowerCase() === 'rejected' ? 'error' : ['verified', 'approved'].includes(doc.status.toLowerCase()) ? 'success' : 'warning'}
        reviewNote={doc.status.toLowerCase() === 'rejected' ? doc.reviewNote : null}
        onApprove={!['verified', 'approved'].includes(doc.status.toLowerCase()) ? () => void onUpdateDocStatus(doc.id, 'Verified') : undefined}
        onReject={doc.status.toLowerCase() !== 'rejected' ? () => setDocRejectTarget(doc) : undefined}
        onOpen={() => onOpenDocument(doc)}
        onDownload={() => onDownload(doc)}
        updatingStatus={statusUpdatingDocId !== null}
        opening={openingId === doc.id}
        downloading={downloadingId === doc.id}
        extra={<AiVerdictChip doc={doc} />}
      />
      <AdminExtractedFields documentId={doc.id} />
    </Box>
  )

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <SectionSkeleton rows={4} />
      </Paper>
    )
  }

  return (
    <Stack spacing={2.5}>
      {/* Antet: unde e dosarul, dintr-o privire */}
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 1.5, mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              Verificarea dosarului
            </Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted, maxWidth: 620 }}>
              Fiecare pas se deschide clientului abia după ce îl validezi. Un document greșit se respinge singur, cu motiv —
              nu întoarce tot pasul.
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, color: TOKENS.ink, whiteSpace: 'nowrap' }}>
            {validated} din {total} pași validați
          </Typography>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`, gap: 0.75 }}>
          {ADMIN_STEPS.map((group) => {
            const step = state?.steps.find((s) => s.key === group.key)
            const { tone, label } = presentationOf(step)
            return (
              <Tooltip key={group.key} title={`${group.order + 1}. ${group.label} — ${label}`}>
                <Box sx={{ height: 6, borderRadius: `${TOKENS.radius.xs}px`, bgcolor: tone === 'neutral' ? fade(TOKENS.ink, 0.08) : fade(TONE_COLOR[tone], tone === 'success' ? 1 : 0.55) }} />
              </Tooltip>
            )
          })}
        </Box>
      </Paper>

      {error && <Alert severity="warning">{error}</Alert>}

      {ADMIN_STEPS.map((group) => {
        const step = state?.steps.find((s) => s.key === group.key)
        const { tone, label } = presentationOf(step)
        const groupDocs = documents.filter((d) => group.categories.includes(d.category))
        const pendingDocs = groupDocs.filter((d) => d.status.toLowerCase() === 'pending').length
        const isOpen = expanded[group.key] ?? false
        const isLocked = step?.state === 'locked'
        const canValidate = step?.state !== 'completed' && !isLocked

        const subtitle = isLocked
          ? step?.blockReason ?? 'Blocat până se validează pasul anterior.'
          : groupDocs.length > 0
            ? `${groupDocs.length} ${groupDocs.length === 1 ? 'document' : 'documente'}${pendingDocs > 0 ? ` · ${pendingDocs} de verificat` : ''}`
            : group.guidedNote
              ? 'Fără documente de încărcat'
              : 'Niciun document încărcat'

        return (
          <Paper
            key={group.key}
            variant="outlined"
            sx={{
              overflow: 'hidden',
              borderColor: step?.state === 'pending_admin' ? fade(TONE_COLOR.warning, 0.45) : undefined,
              opacity: isLocked ? 0.72 : 1,
            }}
          >
            <Stack
              component="button"
              type="button"
              aria-expanded={isOpen}
              aria-controls={`step-${group.key}`}
              direction="row"
              onClick={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
              sx={{
                alignItems: 'center',
                gap: 2,
                px: { xs: 2.5, md: 3 },
                py: 2.25,
                width: '100%',
                textAlign: 'left',
                border: 0,
                background: 'transparent',
                fontFamily: 'inherit',
                cursor: 'pointer',
                '&:hover': { bgcolor: fade(TOKENS.ink, 0.02) },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: `${TOKENS.radius.sm}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: fade(TONE_COLOR[tone], 0.1),
                  color: TONE_COLOR[tone],
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {tone === 'success' ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} /> : group.order + 1}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, color: TOKENS.ink, fontSize: '0.98rem' }}>{group.label}</Typography>
                <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.25 }} noWrap>
                  {subtitle}
                </Typography>
              </Box>
              <StatePill tone={tone} label={label} />
              <ExpandMoreRoundedIcon
                sx={{ color: TOKENS.textMuted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
              />
            </Stack>

            <Collapse in={isOpen} id={`step-${group.key}`}>
              <Divider />
              <Stack spacing={3} sx={{ px: { xs: 2.5, md: 3 }, py: 3 }}>
                {step?.state === 'rejected' && step.checklist?.some((c) => c.state === 'rejected') && (
                  <Alert severity="error">Clientul are documente respinse de refăcut la pasul ăsta.</Alert>
                )}

                {answers.some((a) => a.stepKey === group.key) && (
                  <Box>
                    <Subheading>Răspunsurile clientului</Subheading>
                    <StepAnswers answers={answers.filter((a) => a.stepKey === group.key)} />
                  </Box>
                )}

                {/* Ce a completat clientul — doar la pașii care au date, nu doar acte */}
                {group.key === 'fiscal' && (
                  <Box>
                    <Subheading>Ce a completat clientul</Subheading>
                    <FiscalReview pfaId={pfaId} refreshKey={reviewTick} />
                  </Box>
                )}

                {group.pfa && state && (
                  <Box>
                    <Subheading>Ce a ales clientul</Subheading>
                    <PfaReview state={state} />
                  </Box>
                )}

                {group.key === 'arr_fleet' && hasRegistration && (
                  <ArrFleetReview
                    pfaId={pfaId}
                    refreshKey={reviewTick}
                    onChanged={async () => {
                      await onDocumentsChanged?.()
                      await loadState()
                    }}
                    onSnackbar={onSnackbar}
                  />
                )}

                {/* Documente */}
                {(group.categories.length > 0 || group.pfa) && (
                  <Box>
                    <Subheading>Documente</Subheading>
                    {groupDocs.length === 0 ? (
                      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                        Niciun document încărcat încă.
                      </Typography>
                    ) : (
                      <Box sx={{ border: `1px solid ${fade(TOKENS.ink, 0.08)}`, borderRadius: `${TOKENS.radius.md}px`, overflow: 'hidden' }}>
                        {groupDocs.map(renderDocRow)}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Pasul PFA: actele puse de echipă în dosar */}
                {group.pfa && hasRegistration && (
                  <Box>
                    <Subheading>Adaugă acte PFA în dosarul clientului</Subheading>
                    <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 1.5 }}>
                      Pentru PFA-urile înființate prin Consulto: încarci aici certificatele primite, iar ele intră în dosarul
                      clientului ca și cum le-ar fi încărcat el.
                    </Typography>
                    <PfaDocumentsUpload
                      pfaId={pfaId}
                      clientUserId={clientUserId}
                      onUploaded={async () => {
                        await onDocumentsChanged?.()
                        await loadState()
                      }}
                      onSnackbar={onSnackbar}
                    />
                  </Box>
                )}

                {group.guidedNote && (
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted, fontStyle: 'italic' }}>
                    {group.guidedNote}
                  </Typography>
                )}

                {/* Validarea — acțiunea principală a fiecărui pas */}
                {isLocked && (
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
                    {step?.blockReason ?? 'Pasul se poate valida după ce e validat pasul anterior.'}
                  </Typography>
                )}

                {group.pfa && canValidate && pfaStatus.toLowerCase() === 'pending' && (
                  <ValidateBar
                    hint="Aprobarea dosarului PFA deschide clientului pasul fiscal."
                    warning={pendingDocs > 0 ? pendingDocsText(pendingDocs) : null}
                    busy={false}
                    label="Validează PFA"
                    onValidate={onOpenPfaApproveDialog}
                  />
                )}

                {group.key === 'fiscal' && (
                  <SignaturePacketReview
                    pfaId={pfaId}
                    stepState={step?.state}
                    mandate={documents
                      .filter((d) => d.category === 'ImputernicireAnaf')
                      .sort((a, b) => b.uploadedAtUtc.localeCompare(a.uploadedAtUtc))[0]}
                    onDone={loadState}
                    onMandateRegenerated={async () => {
                      await onDocumentsChanged?.()
                      await loadState()
                    }}
                    onSnackbar={onSnackbar}
                  />
                )}

                {group.sections && canValidate && (
                  <ValidateBar
                    hint={
                      group.sections.length > 1
                        ? 'Validarea bifează ambele secțiuni ale pasului și îl închide.'
                        : 'Validarea bifează pasul la client și deschide pasul următor.'
                    }
                    warning={pendingDocs > 0 ? `${pendingDocsText(pendingDocs)} Poți valida oricum.` : null}
                    busy={actionBusy === group.key}
                    label="Validează pasul"
                    onValidate={() => void validateSections(group)}
                  />
                )}

                {step?.state === 'completed' && (
                  <Typography variant="body2" sx={{ color: TONE_COLOR.success, fontWeight: 700 }}>
                    Pas validat.
                  </Typography>
                )}
              </Stack>
            </Collapse>
          </Paper>
        )
      })}

      {/* Documente din afara pașilor de onboarding */}
      {otherDocuments.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.25 }}>
            <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>Alte documente</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.25 }}>
              Din afara pașilor de onboarding — rapoarte lunare, facturi de comision.
            </Typography>
          </Box>
          <Divider />
          <Box>{otherDocuments.map(renderDocRow)}</Box>
        </Paper>
      )}

      {/* Respingere document cu motiv — singura respingere din pașii cu acte */}
      <DocumentRejectDialog
        key={docRejectTarget?.id ?? 'none'}
        document={docRejectTarget}
        onClose={() => setDocRejectTarget(null)}
        onConfirm={(doc, note) => onUpdateDocStatus(doc.id, 'Rejected', note)}
      />
    </Stack>
  )
}
