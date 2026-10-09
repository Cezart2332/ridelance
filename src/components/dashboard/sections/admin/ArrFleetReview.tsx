import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import {
  onboardingService,
  type ArrFleetOfficialDocumentType,
  type ArrFleetState,
  type ArrFleetStatus,
} from '../../../../services/onboarding.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { PANEL_COMPAT_TOKENS as TOKENS, fade } from '../../../panel/tokens'

/** Statusurile procedurii, în ordine. „În completare” nu se setează de aici: e redeschiderea. */
const STATUSES: { value: ArrFleetStatus; label: string }[] = [
  { value: 'DocumentsSubmitted', label: 'Documente primite' },
  { value: 'InReview', label: 'În verificare' },
  { value: 'InProgress', label: 'În lucru (ARR / conturi flotă)' },
  { value: 'AuthorizationIssued', label: 'Autorizație obținută' },
  { value: 'CertifiedCopyIssued', label: 'Copie conformă obținută' },
  { value: 'BadgesIssued', label: 'Ecusoane gata' },
  { value: 'Completed', label: 'Finalizat' },
]

const STATUS_LABELS: Record<string, string> = {
  Draft: 'În completare',
  ...Object.fromEntries(STATUSES.map((s) => [s.value, s.label])),
}

const OWNERSHIP_LABELS: Record<string, string> = {
  Ownership: 'Proprietate',
  Loan: 'Comodat (autentificat la notariat)',
  Rental: 'Contract de închiriere',
  Leasing: 'Leasing',
}

const OFFICIAL_LABELS: Record<ArrFleetOfficialDocumentType, string> = {
  TransportAuthorization: 'Autorizație de transport',
  CertifiedCopy: 'Copie conformă',
  UberBadge: 'Ecuson Uber',
  BoltBadge: 'Ecuson Bolt',
}

const lei = (bani: number) => `${(bani / 100).toLocaleString('ro-RO')} lei`

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: { xs: 0.25, sm: 2 }, py: 0.75 }}>
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, minWidth: 190 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.875rem', color: TOKENS.ink }}>{children}</Box>
    </Stack>
  )
}

/**
 * Pasul „ARR & Cont Flotă”, din admin: exact ce a introdus clientul (aceleași entități), statusul
 * procedurii cu jurnalul lui, documentele oficiale obținute și redeschiderea pasului cu motiv.
 */
export function ArrFleetReview({
  pfaId,
  refreshKey,
  onChanged,
  onSnackbar,
}: {
  pfaId: string
  refreshKey: number
  /** După o schimbare: reîncarcă documentele și starea pașilor. */
  onChanged: () => Promise<void> | void
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [state, setState] = useState<ArrFleetState | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<ArrFleetStatus | ''>('')
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [docType, setDocType] = useState<ArrFleetOfficialDocumentType>('TransportAuthorization')
  const [docNumber, setDocNumber] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getAdminArrFleet(pfaId)
      .then((loaded) => {
        if (cancelled) return
        setState(loaded)
        setStatus(loaded.status === 'Draft' ? '' : loaded.status)
        setLoadError(false)
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
  }, [pfaId, refreshKey])

  if (loadError) return <Alert severity="warning">Nu am putut încărca pasul „ARR & Cont Flotă”.</Alert>
  if (!state) return <CircularProgress size={20} />

  const submitted = state.submittedAtUtc !== null
  const officialTypes: ArrFleetOfficialDocumentType[] = [
    'TransportAuthorization',
    'CertifiedCopy',
    ...(state.platforms.includes('Uber') ? (['UberBadge'] as const) : []),
    ...(state.platforms.includes('Bolt') ? (['BoltBadge'] as const) : []),
  ]

  const run = async (key: string, action: () => Promise<ArrFleetState>, success: string) => {
    setBusy(key)
    try {
      const next = await action()
      setState(next)
      setStatus(next.status === 'Draft' ? '' : next.status)
      onSnackbar(success, 'success')
      await onChanged()
      return true
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut salva. Încearcă din nou.'), 'error')
      return false
    } finally {
      setBusy(null)
    }
  }

  const uploadOfficial = async (file: File | undefined) => {
    if (!file) return
    const ok = await run(
      'upload',
      () =>
        onboardingService.uploadArrFleetOfficialDocument(pfaId, {
          file,
          type: docType,
          documentNumber: docNumber.trim() || undefined,
          issuedAt: issuedAt || undefined,
          expiresAt: expiresAt || undefined,
        }),
      `„${OFFICIAL_LABELS[docType]}" a ajuns în dashboardul clientului, la Documente transport.`,
    )
    if (ok) {
      setDocNumber('')
      setIssuedAt('')
      setExpiresAt('')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Ce a completat clientul</Typography>
        <Row label="Platforme">{state.platforms.length > 0 ? state.platforms.join(', ') : '—'}</Row>
        {state.driverAccounts.map((account) => (
          <Row key={account.platform} label={`Cont șofer ${account.platform}`}>
            {account.requiresPhoneCall ? (
              <Chip
                size="small"
                icon={<PhoneInTalkRoundedIcon />}
                label="Necesită apel telefonic — nu are cont"
                sx={{ fontWeight: 700, bgcolor: fade(TOKENS.ink, 0.06) }}
              />
            ) : account.hasAccount ? (
              [account.email, account.phone, account.fullName].filter(Boolean).join(' · ') || '—'
            ) : (
              'Fără răspuns'
            )}
          </Row>
        ))}
        <Row label="Deținerea mașinii">
          {state.vehicleOwnership ? OWNERSHIP_LABELS[state.vehicleOwnership] : '—'}
        </Row>
        <Row label="Agenția ARR">
          {state.agency
            ? `${state.agency.beneficiaryName} · CIF ${state.agency.fiscalCode} · ${state.agency.iban} · ${state.agency.treasury}`
            : (state.agencyError ?? '—')}
        </Row>
        {state.payments.map((payment) => (
          <Row key={payment.kind} label={`Plata: ${payment.label.toLowerCase()}`}>
            {lei(payment.amountBani)} · {payment.proofUploaded ? 'dovadă încărcată' : 'fără dovadă'}
          </Row>
        ))}
        <Row label="Total">{lei(state.paymentAmountBani)}</Row>
        {state.paymentProofOutdated && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Dovada plății ecusoanelor e pentru o sumă veche: clientul a schimbat platformele după ce a încărcat-o.
          </Alert>
        )}
        <Row label="Trimis">
          {submitted ? new Date(state.submittedAtUtc!).toLocaleString('ro-RO') : 'Încă nu'}
        </Row>
        {!submitted && state.missing.length > 0 && <Row label="Mai lipsește">{state.missing.join(', ')}</Row>}
        {state.reopenedReason && <Row label="Redeschis cu motivul">{state.reopenedReason}</Row>}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Statusul procedurii</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: { sm: 'center' } }}>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            disabled={!submitted}
            onChange={(e) => setStatus(e.target.value as ArrFleetStatus)}
            sx={{ minWidth: 280 }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            disabled={!submitted || status === '' || status === state.status || busy !== null}
            onClick={() =>
              status !== '' &&
              void run('status', () => onboardingService.changeArrFleetStatus(pfaId, status), 'Statusul a fost salvat.')
            }
            sx={{ fontWeight: 700, boxShadow: 'none' }}
          >
            Salvează statusul
          </Button>
          <Button
            color="error"
            disabled={!submitted || busy !== null}
            onClick={() => setReopenOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Redeschide pasul
          </Button>
        </Stack>
        {!submitted && (
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 1 }}>
            Statusul se setează după ce clientul trimite pasul.
          </Typography>
        )}
        {state.statusLog.length > 0 && (
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {state.statusLog.map((log) => (
              <Typography key={log.changedAtUtc + log.toStatus} variant="body2" sx={{ color: TOKENS.textMuted }}>
                {new Date(log.changedAtUtc).toLocaleString('ro-RO')} · {STATUS_LABELS[log.fromStatus] ?? log.fromStatus} →{' '}
                {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                {log.changedBy ? ` · ${log.changedBy}` : ''}
              </Typography>
            ))}
          </Stack>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Documente oficiale obținute</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Document"
            value={docType}
            onChange={(e) => setDocType(e.target.value as ArrFleetOfficialDocumentType)}
            sx={{ minWidth: 220 }}
          >
            {officialTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {OFFICIAL_LABELS[type]}
              </MenuItem>
            ))}
          </TextField>
          <TextField size="small" label="Număr (opțional)" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          <TextField
            size="small"
            type="date"
            label="Emis la (opțional)"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="Expiră la (opțional)"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            helperText={docType === 'TransportAuthorization' ? 'Implicit: 3 ani' : docType === 'CertifiedCopy' ? 'Implicit: 1 an' : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            component="label"
            variant="outlined"
            disabled={busy !== null}
            startIcon={busy === 'upload' ? <CircularProgress size={14} /> : <UploadFileRoundedIcon />}
            sx={{ fontWeight: 700, alignSelf: { md: 'flex-start' } }}
          >
            Încarcă
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => void uploadOfficial(e.target.files?.[0])}
            />
          </Button>
        </Stack>
      </Box>

      <Dialog open={reopenOpen} onClose={() => setReopenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Redeschide pasul</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
            Motivul apare clientului pe pas. Pentru un singur act greșit, respinge doar documentul.
          </Typography>
          <TextField label="Motivul" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={3} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenOpen(false)}>Anulează</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!reason.trim() || busy !== null}
            onClick={async () => {
              const ok = await run('reopen', () => onboardingService.reopenArrFleet(pfaId, reason.trim()), 'Pasul a fost redeschis clientului.')
              if (ok) {
                setReopenOpen(false)
                setReason('')
              }
            }}
          >
            Redeschide
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
