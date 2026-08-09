import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import { Box, Button, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { displaySx, TOKENS } from '../onboardingTheme'

export const SUPPORT_EMAIL = 'contact@ridelance.ro'

interface SupportEmailDialogProps {
  open: boolean
  onClose: () => void
  /** Pasul de la care s-a cerut ajutor — ajunge în subiect, ca să nu mai fie întrebat. */
  stepLabel?: string
  applicationId?: string | null
}

/**
 * Trimiterea unui email către suport.
 *
 * Backendul nu are ticketing (suportul e pe chat, indisponibil în onboarding), așa că nu inventăm
 * un contract: deschidem clientul de email al utilizatorului cu subiectul deja compus. Ce adaugă
 * dialogul față de un `mailto:` gol e contextul — pasul și numărul dosarului, ca răspunsul să nu
 * înceapă cu „la ce pas ești?".
 */
export function SupportEmailDialog({
  open,
  onClose,
  stepLabel,
  applicationId,
}: SupportEmailDialogProps) {
  const [copied, setCopied] = useState(false)

  const subject = `Onboarding RIDElance${stepLabel ? ` — ${stepLabel}` : ''}`
  const body = [
    'Scrie aici întrebarea ta.',
    '',
    '---',
    stepLabel ? `Pas: ${stepLabel}` : null,
    applicationId ? `Dosar: ${applicationId}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const copy = async () => {
    await navigator.clipboard.writeText(SUPPORT_EMAIL)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="support-email-title"
      slotProps={{ paper: { sx: { borderRadius: `${TOKENS.radius.xl}px` } } }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, pt: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: `${TOKENS.radius.md}px`,
              display: 'grid',
              placeItems: 'center',
              color: TOKENS.primaryStrong,
              backgroundColor: TOKENS.primaryTint,
            }}
          >
            <MailOutlineRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            id="support-email-title"
            component="h2"
            sx={{ ...displaySx, fontSize: '1.05rem', fontWeight: 700, color: TOKENS.ink }}
          >
            Trimite un email
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label="Închide" size="small">
          <CloseRoundedIcon sx={{ fontSize: 19, color: TOKENS.textMuted }} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ px: 3, pb: 3, pt: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
            Răspundem în maximum 24 de ore. Atașăm automat pasul la care ai rămas, ca să nu fie
            nevoie să-l descrii.
          </Typography>

          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              borderRadius: `${TOKENS.radius.lg}px`,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.surface,
            }}
          >
            <Typography variant="body2" sx={{ flex: 1, color: TOKENS.ink, fontWeight: 600 }} noWrap>
              {SUPPORT_EMAIL}
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => void copy()}
              sx={{ color: TOKENS.textMuted, flexShrink: 0 }}
            >
              {copied ? 'Copiat' : 'Copiază'}
            </Button>
          </Stack>

          <Button variant="contained" href={mailto} onClick={onClose} fullWidth>
            Deschide clientul de email
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
