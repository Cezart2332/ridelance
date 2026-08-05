import { Chip } from '@mui/material'

export type StatusTone = 'success' | 'warning' | 'error' | 'neutral'

/**
 * Fundal subtil + text colorat, atât. Nu bulină + text + bordură simultan — trei semnale
 * pentru aceeași informație.
 */
const tones: Record<StatusTone, { color: string; bgcolor: string; borderColor: string }> = {
  success: { color: 'success.main', bgcolor: 'success.light', borderColor: 'success.dark' },
  warning: { color: 'warning.main', bgcolor: 'warning.light', borderColor: 'warning.dark' },
  error: { color: 'error.main', bgcolor: 'error.light', borderColor: 'error.dark' },
  neutral: { color: 'text.secondary', bgcolor: 'grey.100', borderColor: 'grey.200' },
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <Chip size="small" variant="outlined" label={label} sx={{ ...tones[tone], fontWeight: 500 }} />
  )
}
