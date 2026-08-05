import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { isAxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'

import { TOKENS } from '../../constants/tokens'
import {
  companyFormationService,
  type AdminCompanyFormation,
  type Adresa,
  type PersoanaFizica,
} from '../../services/companyFormation.service'
import { getErrorMessage } from '../../utils/errorHandler'

const STATUS_LABELS: Record<string, string> = {
  Draft: 'În completare',
  Submitted: 'Trimis',
  InReviewConsulto: 'La Consulto',
  InfoRequested: 'Corecturi cerute',
  Approved: 'Aprobat',
  Rejected: 'Respins',
}

function formatAddress(a: Adresa): string {
  const parts = [
    a.strada && `Str. ${a.strada}`,
    a.numar && `nr. ${a.numar}`,
    a.bloc && `bl. ${a.bloc}`,
    a.scara && `sc. ${a.scara}`,
    a.etaj && `et. ${a.etaj}`,
    a.apartament && `ap. ${a.apartament}`,
    a.localitate,
    a.judet && `jud. ${a.judet}`,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, minWidth: 168, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  )
}

/** O persoană din dosar, cu CNP-ul mascat până când operatorul cere explicit valoarea. */
function PersonBlock({
  title,
  persoana,
  revealed,
  onReveal,
  busy,
}: {
  title: string
  persoana: PersoanaFizica
  revealed: string | null
  onReveal: () => void
  busy: boolean
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Row label="Nume" value={`${persoana.nume ?? '—'} ${persoana.prenume ?? ''}`.trim()} />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, minWidth: 168, flexShrink: 0 }}>
          CNP
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {revealed ?? persoana.cnpMasked ?? '—'}
        </Typography>
        {revealed === null && persoana.cnpMasked && (
          <Button
            size="small"
            startIcon={busy ? <CircularProgress size={13} /> : <VisibilityOutlinedIcon fontSize="small" />}
            onClick={onReveal}
            disabled={busy}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Dezvăluie
          </Button>
        )}
      </Stack>

      <Row
        label="Act de identitate"
        value={[persoana.tipAct, persoana.serieAct, persoana.numarAct].filter(Boolean).join(' ')}
      />
      <Row label="Autoritate emitentă" value={persoana.autoritateEmitenta ?? '—'} />
      <Row
        label="Valabilitate"
        value={[persoana.dataEmiterii, persoana.dataExpirarii].filter(Boolean).join(' → ') || '—'}
      />
      <Row label="Domiciliu" value={formatAddress(persoana.domiciliu)} />
    </Stack>
  )
}

/**
 * Dosarul de înființare în fișa PFA din admin. Apare doar pentru ramura „Nu am PFA" — pentru
 * restul clienților nu există dosar și panoul nu se randează deloc.
 */
export function CompanyFormationAdminPanel({ pfaId }: { pfaId: string }) {
  // Se montează cu `key={pfa.id}` în fișa PFA, deci starea locală (inclusiv CNP-urile
  // dezvăluite) nu trece niciodată de la un client la altul.
  const [data, setData] = useState<AdminCompanyFormation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  /** CNP-urile dezvăluite în sesiunea curentă, cheie = id proprietar sau „solicitant". */
  const [revealed, setRevealed] = useState<Record<string, string>>({})

  const [reasonOpen, setReasonOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    try {
      const next = await companyFormationService.getAdminView(pfaId)
      setData(next)
      setError(null)
    } catch (err) {
      // 404 înseamnă că acest client nu e pe ramura „Nu am PFA" — nu e o eroare de afișat.
      if (isAxiosError(err) && err.response?.status === 404) {
        setData(null)
        setError(null)
      } else {
        setError(getErrorMessage(err, 'Nu am putut încărca dosarul de înființare.'))
      }
    }
  }, [pfaId])

  useEffect(() => {
    // Regula nu distinge o încărcare la montare de un setState sincron; aici tot ce scrie
    // starea rulează după răspunsul serverului.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Cât timp nu știm nimic, panoul nu ocupă loc: n-are ce încărca vizibil.
  if (!data && !error) return null

  const reveal = async (key: string, ownerId: string | null) => {
    setBusy(key)
    try {
      const cnp = await companyFormationService.revealCnp(pfaId, ownerId)
      setRevealed((current) => ({ ...current, [key]: cnp }))
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut dezvălui CNP-ul.'))
    } finally {
      setBusy(null)
    }
  }

  const exportPackage = async () => {
    setBusy('export')
    try {
      const blob = await companyFormationService.exportPackage(pfaId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `infiintare-${pfaId}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut genera pachetul.'))
    } finally {
      setBusy(null)
    }
  }

  const requestInfo = async () => {
    setBusy('request-info')
    try {
      setData(await companyFormationService.requestInfo(pfaId, reason))
      setReasonOpen(false)
      setReason('')
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut redeschide dosarul.'))
    } finally {
      setBusy(null)
    }
  }

  const dosar = data?.dosar
  const audit = data?.signatureAudit ?? null

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 850, color: TOKENS.ink }}>
          Dosar de înființare
        </Typography>
        {dosar && (
          <Chip
            size="small"
            label={STATUS_LABELS[dosar.status] ?? dosar.status}
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {dosar && (
        <Stack spacing={2.5}>
          {dosar.adminNote && (
            <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
              Corecturi cerute: {dosar.adminNote}
            </Alert>
          )}

          <PersonBlock
            title="Solicitant"
            persoana={dosar.solicitant}
            revealed={revealed.solicitant ?? null}
            onReveal={() => void reveal('solicitant', null)}
            busy={busy === 'solicitant'}
          />

          {dosar.owners.map((owner, index) => (
            <PersonBlock
              key={owner.id}
              title={`Proprietar ${index + 1}`}
              persoana={owner.persoana}
              revealed={revealed[owner.id] ?? null}
              onReveal={() => void reveal(owner.id, owner.id)}
              busy={busy === owner.id}
            />
          ))}

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Sediu social
            </Typography>
            <Row
              label="Tip"
              value={
                dosar.office.type === 'ConsultoProvided'
                  ? 'Adresă Consulto'
                  : dosar.office.type === 'Own'
                    ? 'Adresă proprie'
                    : '—'
              }
            />
            {dosar.office.type === 'Own' && (
              <>
                <Row label="Adresă" value={formatAddress(dosar.office.adresa)} />
                <Row label="Solicitantul e proprietar" value={dosar.office.isOwner ? 'Da' : 'Nu'} />
              </>
            )}
          </Stack>

          {audit && (
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Semnătură
              </Typography>
              <Row label="Semnat la" value={new Date(audit.signedAtUtc).toLocaleString('ro-RO')} />
              <Row label="Adresă IP" value={audit.ipAddress ?? '—'} />
              <Row
                label="Dispozitiv"
                value={[audit.deviceType, audit.os, audit.browser].filter(Boolean).join(' · ') || '—'}
              />
              <Row label="Hash payload" value={audit.payloadHash} />
              <Row label="Declarații acceptate" value={`${data?.consents.length ?? 0} din 5`} />
            </Stack>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => void exportPackage()}
              disabled={busy !== null || audit === null}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Export pentru Consulto
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ReplayRoundedIcon />}
              onClick={() => setReasonOpen(true)}
              disabled={busy !== null || dosar.status === 'Draft'}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Cere corecturi
            </Button>
          </Box>
        </Stack>
      )}

      <Dialog open={reasonOpen} onClose={() => setReasonOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Cere corecturi</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: `${TOKENS.radius.md}px` }}>
            Consimțămintele și semnătura se șterg — clientul le va da din nou, pe datele corectate.
          </Alert>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Ce trebuie corectat"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonOpen(false)} sx={{ textTransform: 'none' }}>
            Renunță
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => void requestInfo()}
            disabled={reason.trim().length === 0 || busy === 'request-info'}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Redeschide dosarul
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
