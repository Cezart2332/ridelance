import { useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

import { HOME_TOKENS } from '../tokens'
import type { DashboardFilters, PeriodPreset } from '../useDashboardFilters'
import { SegmentedControl, type SegmentOption } from './SegmentedControl'
import type { DashboardPayment, DashboardPlatform } from '../../../../services/pfaDashboard.service'

const PERIOD_OPTIONS: readonly SegmentOption<PeriodPreset>[] = [
  { value: 'week', label: 'Săpt. curentă' },
  { value: 'month', label: 'Luna curentă' },
  { value: 'prevMonth', label: 'Luna anterioară' },
  { value: 'year', label: 'An curent' },
  { value: 'custom', label: 'Interval' },
]

const PLATFORM_OPTIONS: readonly SegmentOption<DashboardPlatform>[] = [
  { value: 'all', label: 'Toate' },
  { value: 'bolt', label: 'Bolt', dot: HOME_TOKENS.platform.bolt },
  { value: 'uber', label: 'Uber', dot: HOME_TOKENS.platform.uber },
]

const PAYMENT_OPTIONS: readonly SegmentOption<DashboardPayment>[] = [
  { value: 'all', label: 'Toate' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
]

interface FilterBarProps {
  filters: DashboardFilters
  onPeriodChange: (period: PeriodPreset) => void
  onCustomRangeChange: (from: string, to: string) => void
  onPlatformChange: (platform: DashboardPlatform) => void
  onPaymentChange: (payment: DashboardPayment) => void
  onReset: () => void
}

const dateFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 34,
    borderRadius: HOME_TOKENS.radius.input,
    bgcolor: HOME_TOKENS.bg.surface,
    fontSize: '0.8rem',
    '& fieldset': { borderColor: HOME_TOKENS.border.subtle },
    '&:hover fieldset': { borderColor: HOME_TOKENS.border.strong },
    '&.Mui-focused fieldset': { borderColor: HOME_TOKENS.brand[600], borderWidth: 2 },
  },
} as const

/**
 * Bara de filtre (spec §3). E pur layout: fundalul, muchia și comportamentul sticky
 * aparțin lui `DashboardHeader`, care face fix **întreg** blocul de antet. Dacă ar fi
 * sticky doar rândul ăsta, perioada ar rămâne deasupra și ar dispărea la scroll.
 *
 * Pe ecrane înguste cele trei segmented control-uri nu încap pe un rând, așa că se mută
 * într-un bottom-sheet deschis de butonul „Filtre" — mai bine decât un scroll orizontal
 * ascuns.
 */
export function FilterBar({
  filters,
  onPeriodChange,
  onCustomRangeChange,
  onPlatformChange,
  onPaymentChange,
  onReset,
}: FilterBarProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'))
  const [sheetOpen, setSheetOpen] = useState(false)

  const activeCount =
    (filters.period === 'month' ? 0 : 1) +
    (filters.platform === 'all' ? 0 : 1) +
    (filters.payment === 'all' ? 0 : 1)

  const customRange = filters.period === 'custom' && (
    <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
      <TextField
        type="date"
        size="small"
        value={filters.from}
        slotProps={{ htmlInput: { 'aria-label': 'Data de început' } }}
        onChange={(event) => onCustomRangeChange(event.target.value, filters.to)}
        sx={dateFieldSx}
      />
      <Typography sx={{ color: HOME_TOKENS.text.tertiary, fontSize: '0.8rem' }}>–</Typography>
      <TextField
        type="date"
        size="small"
        value={filters.to}
        slotProps={{ htmlInput: { 'aria-label': 'Data de sfârșit' } }}
        onChange={(event) => onCustomRangeChange(filters.from, event.target.value)}
        sx={dateFieldSx}
      />
    </Stack>
  )

  const resetButton = !filters.isDefault && (
    <Button
      variant="text"
      size="small"
      startIcon={<RestartAltRoundedIcon sx={{ fontSize: 16 }} />}
      onClick={onReset}
      sx={{
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.8rem',
        color: HOME_TOKENS.text.secondary,
        '&:hover': { bgcolor: 'transparent', color: HOME_TOKENS.brand[600] },
      }}
    >
      Resetează filtrele
    </Button>
  )

  return (
    <Box>
      {isCompact ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setSheetOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderRadius: HOME_TOKENS.radius.input,
              borderColor: HOME_TOKENS.border.strong,
              color: HOME_TOKENS.text.primary,
            }}
          >
            Filtre{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
          {resetButton}
        </Stack>
      ) : (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1.2 }}
        >
          {/* `gap: 12px` între cele trei grupuri — §3.1. */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.2 }}>
            <SegmentedControl
              label="Perioadă"
              value={filters.period}
              options={PERIOD_OPTIONS}
              onChange={onPeriodChange}
              trailing={customRange || undefined}
            />
            <SegmentedControl
              label="Platformă"
              value={filters.platform}
              options={PLATFORM_OPTIONS}
              onChange={onPlatformChange}
            />
            <SegmentedControl
              label="Tip plată"
              value={filters.payment}
              options={PAYMENT_OPTIONS}
              onChange={onPaymentChange}
            />
          </Stack>
          {resetButton}
        </Stack>
      )}

      <Drawer
        anchor="bottom"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: HOME_TOKENS.radius.card,
              borderTopRightRadius: HOME_TOKENS.radius.card,
              p: 2.5,
              pb: 'calc(20px + env(safe-area-inset-bottom))',
            },
          },
        }}
      >
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: HOME_TOKENS.text.primary, mb: 2 }}>
          Filtre
        </Typography>

        <Stack spacing={2.4}>
          <FilterGroup label="Perioadă">
            <SegmentedControl
              label="Perioadă"
              value={filters.period}
              options={PERIOD_OPTIONS}
              onChange={onPeriodChange}
            />
            {customRange}
          </FilterGroup>

          <FilterGroup label="Platformă">
            <SegmentedControl
              label="Platformă"
              value={filters.platform}
              options={PLATFORM_OPTIONS}
              onChange={onPlatformChange}
            />
          </FilterGroup>

          <FilterGroup label="Tip plată">
            <SegmentedControl
              label="Tip plată"
              value={filters.payment}
              options={PAYMENT_OPTIONS}
              onChange={onPaymentChange}
            />
          </FilterGroup>
        </Stack>

        <Stack direction="row" spacing={1.2} sx={{ mt: 3 }}>
          {!filters.isDefault && (
            <Button
              variant="outlined"
              fullWidth
              onClick={onReset}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: HOME_TOKENS.radius.input,
                borderColor: HOME_TOKENS.border.strong,
                color: HOME_TOKENS.text.primary,
              }}
            >
              Resetează
            </Button>
          )}
          <Button
            variant="contained"
            disableElevation
            fullWidth
            onClick={() => setSheetOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: HOME_TOKENS.radius.input,
              bgcolor: HOME_TOKENS.brand[600],
            }}
          >
            Vezi rezultatele
          </Button>
        </Stack>
      </Drawer>
    </Box>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: HOME_TOKENS.text.secondary, mb: 1 }}>
        {label}
      </Typography>
      <Stack spacing={1.2} sx={{ alignItems: 'flex-start' }}>
        {children}
      </Stack>
    </Box>
  )
}
