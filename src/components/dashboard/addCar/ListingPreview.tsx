import { Box, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'

import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { Amount } from '../ui'
import type { CarDraft } from './wizardModel'

/**
 * Cum va arăta anunțul în marketplace, actualizat în timp ce se completează formularul.
 *
 * Nu e decor: prețul, titlul și fotografia principală sunt tot ce vede cineva care derulează
 * lista, iar diferența dintre „Tesla Model 3" și „Tesla Model 3 Dual Motor, 2021" se observă
 * abia când o vezi în cardul real.
 */
interface ListingPreviewProps {
  draft: CarDraft
  /** Obiect-URL al primei fotografii alese. Lipsa lui e cazul obișnuit la început. */
  coverUrl: string | null
  photoCount: number
}

export function ListingPreview({ draft, coverUrl, photoCount }: ListingPreviewProps) {
  const title = [draft.brand, draft.model].filter(Boolean).join(' ')
  const meta = [draft.location, draft.engine, draft.transmission, draft.status].filter(Boolean)
  const price = Number(draft.pricePerWeek)

  return (
    <Box
      sx={{
        borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          aspectRatio: '4 / 3',
          bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.04),
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
        }}
      >
        {coverUrl ? (
          <Box
            component="img"
            src={coverUrl}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Stack spacing={0.8} sx={{ alignItems: 'center' }}>
            <DirectionsCarFilledRoundedIcon sx={{ fontSize: 40, color: DASHBOARD_TOKENS.textSubtle }} />
            <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle }}>
              Fotografia principală
            </Typography>
          </Stack>
        )}

        {photoCount > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              px: 1,
              py: 0.3,
              borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
              bgcolor: alpha(DASHBOARD_TOKENS.paper, 0.92),
              fontSize: '0.7rem',
              fontWeight: 700,
              color: DASHBOARD_TOKENS.ink,
            }}
          >
            {photoCount} poze
          </Box>
        )}
      </Box>

      <Stack spacing={0.8} sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: DASHBOARD_TOKENS.ink }}>
          {title || 'Marcă și model'}
          {draft.year ? `, ${draft.year}` : ''}
        </Typography>

        <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
          {meta.length > 0 ? meta.join(' · ') : 'Detaliile apar pe măsură ce le completezi'}
        </Typography>

        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'baseline', pt: 0.5 }}>
          {Number.isFinite(price) && price > 0 ? (
            <Amount value={price} unit="lei/săpt." size="card" decimals={0} />
          ) : (
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: DASHBOARD_TOKENS.textSubtle }}>
              — lei/săpt.
            </Typography>
          )}
        </Stack>

        {draft.badges.length > 0 && (
          <Stack direction="row" spacing={0.6} useFlexGap sx={{ flexWrap: 'wrap', pt: 0.5 }}>
            {draft.badges.map((badge) => (
              <Box
                key={badge}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: DASHBOARD_TOKENS.textMuted,
                }}
              >
                {badge}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
