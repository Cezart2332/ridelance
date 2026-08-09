import { Box, Divider, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'

import { HOME_TOKENS } from '../tokens'
import { formatDayCount, formatPeriodLabel } from '../format'
import { useCondensedHeader } from '../useCondensedHeader'
import type { DashboardFilters, PeriodPreset } from '../useDashboardFilters'
import type {
  DashboardPayment,
  DashboardPlatform,
  DashboardSources,
} from '../../../../services/pfaDashboard.service'
import { FilterBar } from './FilterBar'
import { SourcesPill } from './SourcesPill'

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
 * Antetul paginii „Acasă" (spec §2): perioada, starea surselor și filtrele, într-un
 * **singur** container sticky.
 *
 * Titlul „Dashboard PFA" nu apare aici — îl randează deja `AppHeader`, bara aplicației,
 * pentru toate secțiunile. Ce lipsea la scroll era perioada, iar asta se rezolvă mutând-o
 * *în* blocul care rămâne fix, nu deasupra lui.
 *
 * Fundalul e **opac**, nu `rgba(...)` cu `backdrop-filter`. Blur peste un fundal
 * semi-transparent nu ascunde conținutul, doar îl face neclar — exact defectul reclamat.
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

  const periodLabel = formatPeriodLabel(filters.from, filters.to)
  const dayCount = formatDayCount(filters.from, filters.to)

  return (
    <>
      {/* Santinela marchează pragul de 8px din spec. `mb` negativ o scoate din flux,
          ca prezența ei să nu împingă antetul mai jos. */}
      <Box ref={sentinelRef} aria-hidden sx={{ height: 8, mb: '-8px' }} />

      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          // Bara acoperă lățimea completă a zonei de conținut, dincolo de padding-ul paginii.
          mx: { xs: -2, md: -3 },
          px: { xs: 2, md: 3 },
          bgcolor: HOME_TOKENS.bg.app,
          borderBottom: `1px solid ${condensed ? HOME_TOKENS.border.subtle : 'transparent'}`,
          boxShadow: condensed ? HOME_TOKENS.shadow.bar : 'none',
          transition: 'box-shadow 180ms ease-out, border-color 180ms ease-out',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: 1,
            pt: condensed ? 1 : 2,
            pb: condensed ? 0.5 : 1,
            transition: 'padding 180ms ease-out',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={visuallyHidden}>
              Dashboard PFA — {periodLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: condensed ? '0.88rem' : '1.05rem',
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                color: HOME_TOKENS.text.primary,
                transition: 'font-size 180ms ease-out',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }}
            >
              {periodLabel}
              {dayCount && (
                <Box
                  component="span"
                  sx={{ ml: 0.75, fontWeight: 400, color: HOME_TOKENS.text.secondary }}
                >
                  · {dayCount}
                </Box>
              )}
            </Typography>
          </Box>

          {sources && <SourcesPill sources={sources} onOpenSources={onOpenSources} />}
        </Stack>

        {/* Când bara s-a condensat, muchia ei de jos separă deja antetul de conținut. */}
        {!condensed && <Divider sx={{ borderColor: HOME_TOKENS.border.subtle }} />}

        <Box sx={{ py: 1.25 }}>
          <FilterBar
            filters={filters}
            onPeriodChange={onPeriodChange}
            onCustomRangeChange={onCustomRangeChange}
            onPlatformChange={onPlatformChange}
            onPaymentChange={onPaymentChange}
            onReset={onReset}
          />
        </Box>
      </Box>
    </>
  )
}
