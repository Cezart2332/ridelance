import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import type { ScoreSuggestion } from '../../../services/cars.service'

/**
 * Scorul anunțului, așa cum îl vede proprietarul (spec §5.2, ultimul paragraf).
 *
 * Scorul brut nu e public: apare doar în dashboard, pe anunțul propriu. Iar cifra singură nu
 * ajută pe nimeni — „72/100" fără „ce fac ca să crească" e o notă, nu un instrument. De aceea
 * sugestiile vin cu punctajul lor și componenta nu se randează fără ele.
 */

interface ListingScoreIndicatorProps {
  score: number
  suggestions: ScoreSuggestion[]
}

/**
 * Culoarea barei. Nu e o stare semantică — e o măsură — deci rămâne în rampa de accent, cu
 * opacitatea purtând diferența. Un scor mic nu e o eroare.
 */
function barColor(score: number): string {
  if (score >= 70) return DASHBOARD_TOKENS.accent
  if (score >= 40) return alpha(DASHBOARD_TOKENS.accent, 0.6)
  return alpha(DASHBOARD_TOKENS.accent, 0.35)
}

export function ListingScoreIndicator({ score, suggestions }: ListingScoreIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))

  return (
    <Tooltip
      arrow
      title={
        suggestions.length === 0 ? (
          'Anunțul are tot ce trebuie.'
        ) : (
          <Box sx={{ py: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', mb: 0.6 }}>
              Cum crește scorul
            </Typography>
            <Stack spacing={0.4}>
              {suggestions.map((suggestion) => (
                <Typography key={suggestion.id} sx={{ fontSize: '0.72rem' }}>
                  {suggestion.label}: +{suggestion.points}
                </Typography>
              ))}
            </Stack>
          </Box>
        )
      }
    >
      <Stack spacing={0.5} sx={{ minWidth: 108, cursor: 'help' }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
            Scor anunț
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
            {clamped}/100
          </Typography>
          {suggestions.length > 0 && (
            <TipsAndUpdatesRoundedIcon sx={{ fontSize: 13, color: DASHBOARD_TOKENS.textSubtle }} />
          )}
        </Stack>

        <Box
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Scorul anunțului"
          sx={{
            height: 5,
            borderRadius: DASHBOARD_TOKENS.radius.full,
            bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.08),
            overflow: 'hidden',
          }}
        >
          <Box sx={{ width: `${clamped}%`, height: '100%', bgcolor: barColor(clamped) }} />
        </Box>
      </Stack>
    </Tooltip>
  )
}
