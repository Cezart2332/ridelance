import { Box, Skeleton, Stack } from '@mui/material'

import { TOKENS } from '../../../constants/tokens'

/**
 * Scheletul paginii (spec §20).
 *
 * Are exact dimensiunile variantei finale — galeria cu același raport, titlul pe două rânduri,
 * cardul de preț cu aceeași înălțime. Altfel conținutul sare la sosire, adică fix ce încearcă
 * raportul fix din galerie să prevină.
 */
export function VehicleDetailSkeleton() {
  return (
    <Stack spacing={4}>
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          aspectRatio: { xs: '4 / 3', md: '2 / 1' },
          borderRadius: `${TOKENS.radius.xl}px`,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.9fr) minmax(300px, 1fr)' },
          gap: 5,
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="text" sx={{ fontSize: '2.5rem', width: '60%' }} />
          <Skeleton variant="text" sx={{ width: '40%' }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: `${TOKENS.radius.lg}px`, mt: 2 }} />
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: `${TOKENS.radius.lg}px` }} />
        </Stack>

        <Skeleton
          variant="rectangular"
          height={320}
          sx={{ borderRadius: `${TOKENS.radius.xl}px`, display: { xs: 'none', md: 'block' } }}
        />
      </Box>
    </Stack>
  )
}
