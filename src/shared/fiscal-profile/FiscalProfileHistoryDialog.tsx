import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import {
  fiscalProfileService,
  type FiscalProfileMode,
  type FiscalProfileRevision,
} from '../../services/fiscalProfile.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { ROLE_LABEL, answerLabel, fieldLabel } from './schema'

interface Props {
  open: boolean
  mode: FiscalProfileMode
  taxYear: number
  pfaId?: string
  onClose: () => void
}

/** Istoricul reviziilor: când, cine (nume și rol), ce s-a schimbat (vechi → nou) și de ce. */
export function FiscalProfileHistoryDialog({ open, mode, taxYear, pfaId, onClose }: Props) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [state, setState] = useState<{ items: FiscalProfileRevision[] | null; error: string | null }>({ items: null, error: null })

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    fiscalProfileService
      .revisions(mode, taxYear, pfaId)
      .then((items) => !cancelled && setState({ items, error: null }))
      .catch((err: unknown) => !cancelled && setState({ items: [], error: getErrorMessage(err, 'Nu am putut încărca istoricul.') }))
    return () => {
      cancelled = true
      setState({ items: null, error: null })
    }
  }, [open, mode, taxYear, pfaId])

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby="fp-history-title">
      <DialogTitle id="fp-history-title" sx={{ fontWeight: 700 }}>
        Istoric profil fiscal {taxYear}
      </DialogTitle>
      <DialogContent dividers>
        {state.items === null && (
          <Stack sx={{ alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        )}
        {state.error && <Alert severity="error">{state.error}</Alert>}
        {state.items?.length === 0 && !state.error && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nicio modificare încă. Istoricul începe la confirmarea profilului.
          </Typography>
        )}
        <Stack spacing={2}>
          {state.items?.map((revision) => (
            <Box
              key={revision.revision}
              component="article"
              sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04) }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {new Date(revision.createdAtUtc).toLocaleString('ro-RO', { dateStyle: 'medium', timeStyle: 'short' })}
                {' · '}
                {revision.actor.name} ({ROLE_LABEL[revision.actor.role] ?? revision.actor.role})
              </Typography>
              {revision.reason && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Motiv: {revision.reason}
                </Typography>
              )}
              <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, mt: 1, mb: 0 }}>
                {revision.changes.length === 0 && (
                  <Typography component="li" variant="body2">
                    Confirmare fără modificări.
                  </Typography>
                )}
                {revision.changes.map((change) => (
                  <Typography key={change.field} component="li" variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                    {fieldLabel(change.field, taxYear)}: <s>{answerLabel(change.field, change.oldValue)}</s> →{' '}
                    <strong>{answerLabel(change.field, change.newValue)}</strong>
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>
    </Dialog>
  )
}
