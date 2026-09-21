import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { adminAccountsService } from '../../../../services/adminAccounts.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

/**
 * Închiderea sau redeschiderea contului unui client, cu ce înseamnă spus înainte de confirmare.
 *
 * „Ștergerea” e o închidere: accesul se oprește, datele rămân. Dialogul o spune explicit, ca
 * nimeni să nu apese crezând că șterge un client din evidențe — sau, invers, că îi lasă abonamentul
 * să curgă.
 */
export function CloseAccountDialog({
  target,
  onClose,
  onDone,
}: {
  /** Contul și acțiunea. `null` = dialog închis. */
  target: { userId: string; name: string; action: 'close' | 'reopen' } | null
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closing = target?.action === 'close'

  const submit = async () => {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      if (closing) await adminAccountsService.closeAccount(target.userId, reason.trim())
      else await adminAccountsService.reopenAccount(target.userId)
      setReason('')
      onDone(closing ? `Contul „${target.name}” a fost închis. Datele rămân păstrate.` : `Contul „${target.name}” a fost redeschis.`)
    } catch (err) {
      setError(getErrorMessage(err, closing ? 'Nu am putut închide contul.' : 'Nu am putut redeschide contul.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={target !== null} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 650 }}>{closing ? 'Închide contul' : 'Redeschide contul'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {closing ? (
              <>
                Contul <strong>{target?.name}</strong> nu se va mai putea autentifica, abonamentul se oprește în Stripe, iar
                anunțurile publicate se retrag din marketplace. <strong>Nimic nu se șterge</strong>: dosarul, documentele,
                plățile, facturile și istoricul rămân și se văd în continuare la „Șterse”.
              </>
            ) : (
              <>
                Contul <strong>{target?.name}</strong> se va putea autentifica din nou. Abonamentul oprit la închidere nu
                pornește singur — clientul îl alege din nou, iar anunțurile retrase le republică el.
              </>
            )}
          </Typography>
          {closing && (
            <TextField
              label="Motiv (intern)"
              placeholder="Ex: cererea clientului, neplată repetată…"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              multiline
              minRows={2}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={busy}>
          Anulează
        </Button>
        <Button
          variant="contained"
          color={closing ? 'error' : 'primary'}
          disableElevation
          onClick={() => void submit()}
          disabled={busy}
        >
          {busy ? <CircularProgress size={18} color="inherit" /> : closing ? 'Închide contul' : 'Redeschide'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
