import { Alert, Button, Paper } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../onboardingTheme'

/**
 * Dosarul a fost respins. Ecranul are un singur rol: să spună de ce și să redeschidă fluxul de
 * întrebări. Nu e un micro-pas fiindcă nu se parcurge — apare doar când adminul a întors decizia.
 */
export function PfaRejectedCard({
  reviewNote,
  onRetry,
}: {
  reviewNote?: string | null
  onRetry: () => void
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: `${TOKENS.radius.xl}px`,
        border: `1px solid ${alpha('#d32f2f', 0.25)}`,
        backgroundColor: TOKENS.paper,
      }}
    >
      <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px`, mb: 2 }}>
        Dosarul tău PFA a fost respins.{reviewNote ? ` Motiv: ${reviewNote}` : ''}
      </Alert>
      <Button
        variant="contained"
        onClick={onRetry}
        sx={{
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: `${TOKENS.radius.md}px`,
          color: '#fff',
          backgroundColor: TOKENS.primary,
          '&:hover': { backgroundColor: TOKENS.primaryStrong },
        }}
      >
        Completează din nou
      </Button>
    </Paper>
  )
}
