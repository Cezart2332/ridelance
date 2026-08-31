import { Suspense, lazy, type ComponentProps } from 'react'
import { Skeleton } from '@mui/material'

import { reloadOnceOnChunkError } from '../../utils/lazyWithRetry'
import { TOKENS } from '../../constants/tokens'
import type { CoverageMap as CoverageMapType } from './CoverageMap'
import { MAP_FRAME_SX } from './mapFrame'

/**
 * Harta acoperirii, încărcată abia când se randează.
 *
 * Aceeași politică ca la hărțile din anunțuri (`cars/map/LazyMaps.tsx`): `mapbox-gl` are 1,8 MB,
 * iar pagina asta e una publică, pe care intră lume de pe telefon. Legată static, biblioteca ar
 * fi ajuns în bundle-ul comun și ar fi încetinit fiecare pagină a site-ului, nu doar asta.
 */
const CoverageMapLazy = lazy(() =>
  import('./CoverageMap').then((m) => ({ default: m.CoverageMap })).catch(reloadOnceOnChunkError),
)

export function CoverageMap(props: ComponentProps<typeof CoverageMapType>) {
  return (
    <Suspense
      fallback={
        // Aceeași cutie ca harta, ca pagina să nu tresară când se termină încărcarea.
        <Skeleton
          variant="rectangular"
          sx={{ ...MAP_FRAME_SX, borderRadius: `${TOKENS.radius.xl}px` }}
        />
      }
    >
      <CoverageMapLazy {...props} />
    </Suspense>
  )
}
