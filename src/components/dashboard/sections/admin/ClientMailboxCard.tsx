import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
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
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import {
  clientMailboxService,
  MAILBOX_SERVERS,
  type ClientMailbox,
  type ClientMailboxStatus,
  type MailboxUsage,
  type OpsCredentials,
} from '../../../../services/clientMailbox.service'
import { documentService } from '../../../../services/document.service'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { PANEL_COMPAT_TOKENS as TOKENS, fade } from '../../../panel/tokens'

const STATUS: Record<ClientMailboxStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  NotCreated: { label: 'Necreat', color: 'default' },
  Creating: { label: 'Se creează', color: 'info' },
  Active: { label: 'Activ', color: 'success' },
  Failed: { label: 'Eșuat', color: 'error' },
  Transferred: { label: 'Predat clientului', color: 'default' },
}

/** Cât timp e în coadă, întrebăm din nou: crearea o face un job, la câteva zeci de secunde. */
const POLL_MS = 5000

function CopyValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: { xs: 0.25, sm: 2 }, py: 0.5, alignItems: { sm: 'center' } }}>
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, minWidth: 190 }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '0.875rem', color: TOKENS.ink, wordBreak: 'break-all', fontFamily: mono ? 'ui-monospace, monospace' : undefined }}
        >
          {value}
        </Typography>
        <Tooltip title={copied ? 'Copiat' : 'Copiază'}>
          <IconButton size="small" aria-label={`Copiază ${label.toLowerCase()}`} onClick={() => void copy()}>
            <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}

/**
 * „Email operațional” (spec faza 2): adresa clientului pe pfa.ridelance.ro, cu identitatea prin
 * care intră agentul RIDElance. Parola identității apare doar la cerere, iar fiecare afișare se
 * scrie în jurnal; parola clientului nu apare niciodată aici.
 */
export function ClientMailboxCard({
  pfaId,
  onSnackbar,
}: {
  pfaId: string
  onSnackbar: (message: string, severity: 'success' | 'error') => void
}) {
  const [mailbox, setMailbox] = useState<ClientMailbox | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [credentials, setCredentials] = useState<OpsCredentials | null>(null)
  const [confirmTransfer, setConfirmTransfer] = useState(false)
  const [usage, setUsage] = useState<MailboxUsage | null>(null)

  const load = useCallback(
    () =>
      clientMailboxService
        .get(pfaId)
        .then((loaded) => {
          setMailbox(loaded)
          setLoadError(false)
        })
        .catch(() => setLoadError(true)),
    [pfaId],
  )

  useEffect(() => {
    void load()
  }, [load])

  const creating = mailbox?.status === 'Creating'
  useEffect(() => {
    if (!creating) return undefined
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [creating, load])

  const run = async <T,>(action: () => Promise<T>, apply: (result: T) => void, success?: string) => {
    setBusy(true)
    try {
      apply(await action())
      if (success) onSnackbar(success, 'success')
    } catch (err) {
      onSnackbar(getErrorMessage(err, 'Nu am putut face operația. Încearcă din nou.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loadError) return <Alert severity="warning">Nu am putut încărca emailul operațional.</Alert>
  if (!mailbox) return <CircularProgress size={20} />

  const status = STATUS[mailbox.status]
  const active = mailbox.status === 'Active'

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 800 }}>Email operațional</Typography>
        <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 700 }} />
        {creating && <CircularProgress size={14} />}
      </Stack>

      {mailbox.address && <CopyValue label="Adresa clientului" value={mailbox.address} />}
      {mailbox.status === 'Failed' && mailbox.lastError && (
        <Alert severity="error" sx={{ my: 1 }}>
          {mailbox.lastError}
        </Alert>
      )}

      {active && credentials && (
        <Box sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: fade(TOKENS.ink, 0.04) }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>Configurare Thunderbird</Typography>
          <CopyValue label="Utilizator" value={credentials.address} />
          <CopyValue label="Parola" value={credentials.password} mono />
          <CopyValue label="IMAP" value={`${MAILBOX_SERVERS.imap.host} · port ${MAILBOX_SERVERS.imap.port} · ${MAILBOX_SERVERS.imap.security}`} />
          <CopyValue label="SMTP" value={`${MAILBOX_SERVERS.smtp.host} · port ${MAILBOX_SERVERS.smtp.port} · ${MAILBOX_SERVERS.smtp.security}`} />
        </Box>
      )}

      {usage && (
        <Alert severity={usage.alert ? 'warning' : 'info'} sx={{ mt: 1 }} onClose={() => setUsage(null)}>
          Azi pe domeniu: {usage.incomingToday}/{usage.incomingLimit} primite · {usage.outgoingToday}/{usage.outgoingLimit} trimise ·{' '}
          {usage.storageGb.toLocaleString('ro-RO')} GB{usage.alert ? ' — peste 80% din limită, e timpul de upgrade.' : ''}
        </Alert>
      )}

      <Stack direction="row" sx={{ gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
        {(mailbox.status === 'NotCreated' || mailbox.status === 'Failed') && (
          <Button
            variant="contained"
            size="small"
            disabled={busy}
            onClick={() => void run(() => clientMailboxService.request(pfaId), setMailbox)}
          >
            {mailbox.status === 'Failed' ? 'Reîncearcă' : 'Creează email operațional'}
          </Button>
        )}
        {active && !credentials && (
          <Button
            variant="outlined"
            size="small"
            disabled={busy}
            onClick={() => void run(() => clientMailboxService.revealCredentials(pfaId), setCredentials)}
          >
            Afișează credențiale RIDElance
          </Button>
        )}
        {active && (
          <Button variant="text" size="small" color="error" disabled={busy} onClick={() => setConfirmTransfer(true)}>
            Predare email (offboarding)
          </Button>
        )}
        {mailbox.handoverDocumentId && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => void documentService.downloadAndSave(mailbox.handoverDocumentId!, 'Predare_email.pdf')}
          >
            Document „Predare email”
          </Button>
        )}
        <Button variant="text" size="small" disabled={busy} onClick={() => void run(() => clientMailboxService.usage(), setUsage)}>
          Consum domeniu
        </Button>
      </Stack>

      <Dialog open={confirmTransfer} onClose={() => setConfirmTransfer(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Predai emailul clientului?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Parola mailbox-ului se schimbă, accesul RIDElance se șterge și se generează documentul „Predare email”. Nu se poate anula.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTransfer(false)}>Renunță</Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={() => {
              setConfirmTransfer(false)
              void run(
                () => clientMailboxService.transfer(pfaId),
                (next) => {
                  setMailbox(next)
                  setCredentials(null)
                },
                'Emailul a fost predat. Documentul „Predare email” intră în pachetul de predare.',
              )
            }}
          >
            Predă emailul
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
