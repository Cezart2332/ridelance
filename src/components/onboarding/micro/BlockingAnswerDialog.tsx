import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { TOKENS } from '../onboardingTheme'

interface BlockingAnswerDialogProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
  onContactSupport: () => void
}

/**
 * De ce nu se poate merge mai departe după un „Nu” care oprește parcursul. Omul rămâne pe
 * întrebare: poate corecta un clic greșit sau ne poate scrie.
 */
export function BlockingAnswerDialog({ open, title, message, onClose, onContactSupport }: BlockingAnswerDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="blocking-answer-title">
      <DialogTitle id="blocking-answer-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <InfoOutlinedIcon sx={{ color: TOKENS.primary }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: TOKENS.textMuted, lineHeight: 1.6 }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={() => {
            onClose()
            onContactSupport()
          }}
        >
          Scrie-ne
        </Button>
        <Button variant="contained" onClick={onClose} autoFocus>
          Am înțeles
        </Button>
      </DialogActions>
    </Dialog>
  )
}
