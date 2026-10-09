import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { getErrorMessage } from '../../../utils/errorHandler'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'
import { TOKENS } from '../onboardingTheme'

/**
 * Un ecran al cărui conținut e o singură acțiune: generează dosarul, marchează depunerea,
 * conectează Oblio, trimite la verificare.
 *
 * Butonul e ecranul, nu footerul. Odată executată, acțiunea nu mai are ce oferi: se transformă
 * în confirmare, iar mersul mai departe rămâne pe „Continuă". Așa nu se poate apăsa de două ori
 * ceva care a mers deja.
 *
 * `lines` explică ce se întâmplă la click, când asta nu e evident din eticheta butonului — cazul
 * Oblio, unde apăsarea creează un cont pe numele userului.
 */
export function MicroActionStep({
  def,
  context,
  done,
  onDone,
}: {
  def: MicroStepDef
  context: MicroStepContext
  /** `isDone` din config, citit din starea serverului — nu din faptul că s-a apăsat. */
  done: boolean
  onDone: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!def.action) return null

  const enabled = def.action.enabledWhen?.(context) ?? true

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await def.action?.run(context)
      if (def.action?.successDialog) setDialogOpen(true)
      await onDone()
    } catch (err) {
      setError(getErrorMessage(err, 'Nu am putut face asta. Încearcă din nou.'))
    } finally {
      setBusy(false)
    }
  }

  const lines = def.lines?.(context) ?? []

  return (
    <Stack spacing={2}>
      {lines.map((line) => (
        <Typography key={line} sx={{ fontSize: '0.9rem', color: TOKENS.textMuted, lineHeight: 1.6 }}>
          {line}
        </Typography>
      ))}

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {done ? (
        <Alert
          icon={<CheckCircleRoundedIcon />}
          severity="success"
          sx={{ borderRadius: `${TOKENS.radius.md}px` }}
        >
          Gata.
        </Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={() => void run()}
          disabled={busy || !enabled}
          sx={{
            alignSelf: 'flex-start',
            py: 1.2,
            px: 3.5,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: `${TOKENS.radius.full}px`,
            backgroundColor: TOKENS.primary,
            boxShadow: `0 6px 16px -6px ${TOKENS.primaryEdge}`,
            '&:hover': { backgroundColor: TOKENS.primaryStrong, boxShadow: `0 8px 20px -6px ${TOKENS.primaryEdge}` },
          }}
        >
          {busy ? def.action.busyLabel : def.action.label}
        </Button>
      )}

      {def.action.successDialog && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{def.action.successDialog.title}</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.6 }}>{def.action.successDialog.message}</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" onClick={() => setDialogOpen(false)}>
              Am înțeles
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  )
}
