import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { ListingQuota } from '../../../services/cars.service'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

/**
 * Câte anunțuri mai poate publica flota din abonament.
 *
 * Aceeași formă ca `StatCard` — etichetă sus, cifră jos — ca să stea în rândul de cifre, plus o
 * bară care arată cât din pachet s-a folosit. Cifra mare e ce a rămas: asta decide dacă mai poate
 * publica o mașină, nu câte a publicat deja.
 */
export function ListingQuotaCard({ quota }: { quota: ListingQuota }) {
  const full = quota.remaining === 0
  const percent = quota.included > 0 ? Math.min(100, (quota.used / quota.included) * 100) : 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
        Anunțuri disponibile
      </Typography>

      <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline', mt: 0.6 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.35rem', md: '1.5rem' },
            fontWeight: 850,
            lineHeight: 1.2,
            color: full ? DASHBOARD_TOKENS.stateWarning : DASHBOARD_TOKENS.ink,
          }}
        >
          {quota.remaining}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: DASHBOARD_TOKENS.textSubtle }}>
          din {quota.included}
        </Typography>
      </Stack>

      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percent}
          aria-label={`${quota.used} din ${quota.included} anunțuri folosite`}
          sx={{
            height: 5,
            bgcolor: DASHBOARD_TOKENS.accentWash,
            '& .MuiLinearProgress-bar': {
              bgcolor: full ? DASHBOARD_TOKENS.stateWarning : DASHBOARD_TOKENS.accent,
            },
          }}
        />
      </Box>

      <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.8 }}>
        {full
          ? 'Toate anunțurile incluse sunt folosite'
          : `${quota.used} ${quota.used === 1 ? 'publicat' : 'publicate'} · incluse în abonament`}
      </Typography>
    </Paper>
  )
}
