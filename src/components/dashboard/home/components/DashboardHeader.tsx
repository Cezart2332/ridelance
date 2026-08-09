import { Box, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'

import { HOME_TOKENS } from '../tokens'
import { formatPeriodLabel } from '../format'
import { useCondensedHeader } from '../useCondensedHeader'
import type { DashboardFilters, PeriodPreset } from '../useDashboardFilters'
import type {
  DashboardPayment,
  DashboardPlatform,
  DashboardSources,
} from '../../../../services/pfaDashboard.service'
import { FilterBar } from './FilterBar'
import { SourcesPill } from './SourcesPill'

/**
 * Padding-ul de sus al zonei de conținut (`<main>` din AppLayout), în px per breakpoint.
 *
 * Offsetul unui element `sticky` se măsoară față de **padding box**-ul containerului de scroll,
 * nu față de marginea lui. Cu `top: 0`, bara se oprea la 24px sub antetul aplicației și prin fâșia
 * aceea se vedea conținutul derulând. Un `top` negativ egal cu padding-ul o lipește de antet.
 */
const MAIN_PADDING_TOP = { xs: -16, md: -24 }

interface DashboardHeaderProps {
  filters: DashboardFilters
  sources: DashboardSources | null
  onOpenSources: () => void
  onPeriodChange: (period: PeriodPreset) => void
  onCustomRangeChange: (from: string, to: string) => void
  onPlatformChange: (platform: DashboardPlatform) => void
  onPaymentChange: (payment: DashboardPayment) => void
  onReset: () => void
}

/**
 * Antetul paginii „Acasă" (spec §2): filtrele, lipite sub bara aplicației.
 *
 * Nu conține nici titlu, nici perioada scrisă mare. Titlul „Dashboard PFA" e deja în `AppHeader`,
 * iar perioada e scrisă pe pastila „Luna curentă" din filtre — repetată alături, nu adăuga nimic
 * și mai și rupea bara în două rânduri, cu un gol între ele.
 *
 * Fundalul e **opac**, nu `rgba(...)` cu `backdrop-filter`. Blur peste un fundal semi-transparent
 * nu ascunde conținutul, doar îl încețoșează — exact defectul reclamat.
 */
export function DashboardHeader({
  filters,
  sources,
  onOpenSources,
  onPeriodChange,
  onCustomRangeChange,
  onPlatformChange,
  onPaymentChange,
  onReset,
}: DashboardHeaderProps) {
  const { sentinelRef, condensed } = useCondensedHeader()

  return (
    <>
      {/* Santinela marchează pragul de 8px. `mb` negativ o scoate din flux, ca prezența ei să nu
          împingă antetul mai jos. */}
      <Box ref={sentinelRef} aria-hidden sx={{ height: 8, mb: '-8px' }} />

      <Box
        sx={{
          position: 'sticky',
          top: MAIN_PADDING_TOP,
          zIndex: 20,
          // Bara acoperă lățimea completă a zonei de conținut, dincolo de padding-ul paginii, și
          // se întinde în sus peste padding-ul lui `<main>`, ca să nu rămână nicio fâșie liberă.
          mx: { xs: -2, md: -3 },
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          pb: 1.5,
          bgcolor: HOME_TOKENS.bg.app,
          borderBottom: `1px solid ${condensed ? HOME_TOKENS.border.subtle : 'transparent'}`,
          boxShadow: condensed ? HOME_TOKENS.shadow.bar : 'none',
          transition: 'box-shadow 180ms ease-out, border-color 180ms ease-out',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {/* Perioada rămâne singurul context al cifrelor pentru cititoarele de ecran. */}
        <Typography component="h1" sx={visuallyHidden}>
          Dashboard PFA — {formatPeriodLabel(filters.from, filters.to)}
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <FilterBar
              filters={filters}
              onPeriodChange={onPeriodChange}
              onCustomRangeChange={onCustomRangeChange}
              onPlatformChange={onPlatformChange}
              onPaymentChange={onPaymentChange}
              onReset={onReset}
            />
          </Box>

          {sources && <SourcesPill sources={sources} onOpenSources={onOpenSources} />}
        </Stack>
      </Box>
    </>
  )
}
