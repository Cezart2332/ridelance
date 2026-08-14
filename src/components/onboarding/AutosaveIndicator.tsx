import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded'
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded'
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded'
import { Button, CircularProgress, Stack, Typography } from '@mui/material'

import type { AutosaveStatus } from '../../hooks/useAutosave'
import { autosaveLabel } from '../../hooks/useAutosave'
import { TOKENS, tabularSx } from './onboardingTheme'

/**
 * Starea salvării automate, într-o singură linie discretă (RL-06).
 *
 * Nu e un toast: salvarea se întâmplă de zeci de ori pe pas, iar o notificare la fiecare ar fi
 * zgomot. Singurul caz care cere o acțiune e eșecul, și doar acolo apare un buton.
 */
export function AutosaveIndicator({
  status,
  savedAt,
  onRetry,
}: {
  status: AutosaveStatus
  savedAt: Date | null
  onRetry: () => void
}) {
  const label = autosaveLabel(status, savedAt)
  if (label === null) return null

  const color = status === 'error' ? TOKENS.danger : TOKENS.textMuted

  return (
    <Stack
      direction="row"
      spacing={0.75}
      aria-live="polite"
      sx={{ alignItems: 'center', color, minHeight: 24 }}
    >
      {status === 'saving' ? (
        <CircularProgress size={13} thickness={5} sx={{ color }} />
      ) : status === 'error' ? (
        <CloudOffRoundedIcon sx={{ fontSize: 16 }} />
      ) : (
        <CloudDoneRoundedIcon sx={{ fontSize: 16 }} />
      )}

      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, ...tabularSx }}>{label}</Typography>

      {status === 'error' && (
        <Button
          size="small"
          onClick={onRetry}
          sx={{ minWidth: 0, p: 0, fontSize: '0.8rem', fontWeight: 700, textTransform: 'none' }}
        >
          Reîncearcă
        </Button>
      )}
    </Stack>
  )
}

/** Iconița de „în curs" e folosită doar de bara mobilă; exportată ca să nu se dubleze importul. */
export { CloudSyncRoundedIcon as AutosaveIcon }
