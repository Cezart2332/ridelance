import { Box, Skeleton, Stack } from '@mui/material'

import { VDP } from './vdpLayout'

/**
 * Scheletul paginii.
 *
 * Are exact dimensiunile variantei finale — galeria cu raportul 16/10, titlul pe două rânduri,
 * cardul lateral la 293px. Altfel conținutul sare la sosire, adică fix ce încearcă raportul fix din
 * galerie să prevină.
 */
export function VehicleDetailSkeleton() {
  return (
    <Stack spacing={4} sx={{ pt: 3 }}>
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          aspectRatio: { xs: '4 / 3', md: '16 / 10' },
          borderRadius: `${VDP.radius.image}px`,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: `minmax(0, 1fr) ${VDP.rightColumn}px` },
          columnGap: `${VDP.columnGap}px`,
          rowGap: 4,
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="text" sx={{ fontSize: 38, width: '55%' }} />
          <Skeleton variant="text" sx={{ width: '35%' }} />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={110}
                height={40}
                sx={{ borderRadius: 999 }}
              />
            ))}
          </Stack>
          <Skeleton
            variant="rectangular"
            height={160}
            sx={{ borderRadius: `${VDP.radius.card}px`, mt: 3 }}
          />
        </Stack>

        <Skeleton
          variant="rectangular"
          height={420}
          sx={{ borderRadius: `${VDP.radius.card}px`, display: { xs: 'none', lg: 'block' } }}
        />
      </Box>
    </Stack>
  )
}
