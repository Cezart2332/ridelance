import { Suspense, lazy, type ComponentProps } from 'react'
import { Skeleton } from '@mui/material'

import { reloadOnceOnChunkError } from '../../../utils/lazyWithRetry'
import { TOKENS } from '../../../constants/tokens'
import type { FleetMap as FleetMapType } from './FleetMap'
import type { PinPicker as PinPickerType } from './PinPicker'
import type { PlaceMap as PlaceMapType } from './PlaceMap'

/**
 * Hărțile, încărcate abia când se văd.
 *
 * `mapbox-gl` are 1,8 MB. Legat static, îl descarcă și cine deschide lista de mașini fără să
 * atingă vreodată harta, sau cine completează primii doi pași din adăugarea unei mașini. Aici
 * ajunge pe fir doar când componenta chiar se randează.
 */

// `lazy` direct, nu `lazyWithRetry`: helperul acceptă doar componente fără props. Politica de
// reîncărcare la chunk lipsă e aceeași, refolosită din el.
const FleetMapLazy = lazy(() =>
  import('./FleetMap').then((m) => ({ default: m.FleetMap })).catch(reloadOnceOnChunkError),
)

const PinPickerLazy = lazy(() =>
  import('./PinPicker').then((m) => ({ default: m.PinPicker })).catch(reloadOnceOnChunkError),
)

const PlaceMapLazy = lazy(() =>
  import('./PlaceMap').then((m) => ({ default: m.PlaceMap })).catch(reloadOnceOnChunkError),
)

function MapSkeleton({ height }: { height: number | string }) {
  return (
    <Skeleton
      variant="rectangular"
      sx={{ height, width: '100%', borderRadius: `${TOKENS.radius.lg}px` }}
    />
  )
}

export function FleetMap(props: ComponentProps<typeof FleetMapType>) {
  return (
    <Suspense fallback={<MapSkeleton height={props.height ?? '100%'} />}>
      <FleetMapLazy {...props} />
    </Suspense>
  )
}

export function PinPicker(props: ComponentProps<typeof PinPickerType>) {
  return (
    <Suspense fallback={<MapSkeleton height={props.height ?? 300} />}>
      <PinPickerLazy {...props} />
    </Suspense>
  )
}

export function PlaceMap(props: ComponentProps<typeof PlaceMapType>) {
  return (
    <Suspense fallback={<MapSkeleton height={props.height ?? 280} />}>
      <PlaceMapLazy {...props} />
    </Suspense>
  )
}
