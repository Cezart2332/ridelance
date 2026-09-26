import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { TOKENS } from '../onboardingTheme'

interface AcknowledgeAnswerDialogProps {
  open: boolean
  title: string
  message: string
  onAcknowledge: () => void
}

/**
 * Ce trebuie știut după o alegere care nu oprește parcursul (plățile în numerar). Un singur buton:
 * „Am înțeles” trimite răspunsul și trece mai departe.
 */
export function AcknowledgeAnswerDialog({ open, title, message, onAcknowledge }: AcknowledgeAnswerDialogProps) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="acknowledge-answer-title">
      <DialogTitle id="acknowledge-answer-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <InfoOutlinedIcon sx={{ color: TOKENS.primary }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.6 }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" onClick={onAcknowledge} autoFocus>
          Am înțeles
        </Button>
      </DialogActions>
    </Dialog>
  )
}
