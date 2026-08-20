import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { HOME_TOKENS, tabularNums } from '../tokens'
import { EMPTY_FIELD, formatDate, formatDistance, formatDuration, formatTime } from '../format'
import { Amount } from '../../ui/Amount'
import type { RidesPage, RideRow } from '../../../../services/pfaDashboard.service'
import type { DashboardFilters } from '../useDashboardFilters'
import { useRidesHistory } from '../useDashboardData'
import { HomeCard } from './HomeCard'
import { CardError } from './states/CardStates'

type SortField = 'date' | 'distance' | 'duration' | 'net'

const PAGE_SIZES = [5, 10, 25] as const

interface RidesHistoryTableProps {
  filters: DashboardFilters
  /** Uber nu expune curse individuale — se spune explicit, o singură dată. */
  uberConnected: boolean
  /** Demo-ul public injectează cursele; atunci nu se mai apelează API-ul. */
  override?: RidesPage
}

/** „Istoric curse" — un singur tabel, cel mai recent sus, 5 curse pe pagină. */
export function RidesHistoryTable({ filters, uberConnected, override }: RidesHistoryTableProps) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'))

  // Pagina e legată de setul de filtre pentru care a fost aleasă: la orice schimbare de
  // filtru, căutare sau dimensiune de pagină, cheia se schimbă și pagina revine la 1
  // fără să fie nevoie de un efect care resetează starea.
  const [pageState, setPageState] = useState({ key: '', page: 1 })
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0])
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDescending, setSortDescending] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const resetKey = `${filters.from}|${filters.to}|${filters.platform}|${filters.payment}|${debouncedSearch}|${pageSize}`
  const page = pageState.key === resetKey ? pageState.page : 1
  const setPage = (next: number) => setPageState({ key: resetKey, page: next })

  const query = useMemo(
    () => ({
      from: filters.from,
      to: filters.to,
      platform: filters.platform,
      payment: filters.payment,
      page,
      pageSize,
      sort: `${sortDescending ? '-' : ''}${sortField}`,
      q: debouncedSearch,
    }),
    [filters, page, pageSize, sortField, sortDescending, debouncedSearch],
  )

  const fetched = useRidesHistory(query, !override)
  const { isLoading, isFetching, error, reload } = override
    ? { isLoading: false, isFetching: false, error: null, reload: () => {} }
    : fetched
  const data = override ?? fetched.data

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, total)
  const hasNextPage = page * pageSize < total

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDescending((previous) => !previous)
      return
    }
    setSortField(field)
    setSortDescending(true)
  }

  return (
    <HomeCard
      title="Istoric curse"
      subtitle={
        uberConnected
          ? 'Uber raportează doar totaluri lunare, deci cursele listate vin din Bolt.'
          : undefined
      }
      action={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isCompact ? 'Caută rută' : 'Caută preluare sau destinație'}
            slotProps={{
              htmlInput: { 'aria-label': 'Caută după preluare sau destinație' },
              input: {
                startAdornment: (
                  <SearchRoundedIcon sx={{ fontSize: 17, mr: 0.8, color: HOME_TOKENS.text.tertiary }} />
                ),
              },
            }}
            sx={{
              width: { xs: 160, sm: 240 },
              '& .MuiOutlinedInput-root': {
                height: 34,
                fontSize: '0.8rem',
                borderRadius: HOME_TOKENS.radius.input,
                '& fieldset': { borderColor: HOME_TOKENS.border.subtle },
                '&.Mui-focused fieldset': { borderColor: HOME_TOKENS.brand[600], borderWidth: 2 },
              },
            }}
          />
        </Stack>
      }
    >
      {error && !data ? (
        <CardError message={error} onRetry={reload} />
      ) : (
        <Box sx={{ opacity: isFetching && data ? 0.55 : 1, transition: 'opacity 150ms ease-out' }}>
          {isLoading ? (
            <Stack spacing={1}>
              {Array.from({ length: pageSize }).map((_, index) => (
                <Box
                  key={index}
                  sx={{ height: 56, borderRadius: '10px', bgcolor: HOME_TOKENS.bg.surface2 }}
                />
              ))}
            </Stack>
          ) : items.length === 0 ? (
            <Stack sx={{ py: 5, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.88rem', color: HOME_TOKENS.text.secondary }}>
                {debouncedSearch
                  ? 'Nicio cursă nu se potrivește căutării.'
                  : 'Nicio cursă în perioada selectată.'}
              </Typography>
            </Stack>
          ) : isCompact ? (
            <RideCardList items={items} />
          ) : (
            <RideTable
              items={items}
              sortField={sortField}
              sortDescending={sortDescending}
              onToggleSort={toggleSort}
            />
          )}

          {total > 0 && (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                mt: 1.8,
                pt: 1.5,
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                rowGap: 1,
                borderTop: `1px solid ${HOME_TOKENS.border.subtle}`,
              }}
            >
              <Typography
                aria-live="polite"
                sx={{ ...tabularNums, fontSize: '0.78rem', color: HOME_TOKENS.text.secondary }}
              >
                Afișez {firstRow}–{lastRow} din {total}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  slotProps={{ input: { 'aria-label': 'Curse pe pagină' } }}
                  sx={{
                    height: 32,
                    fontSize: '0.78rem',
                    borderRadius: HOME_TOKENS.radius.input,
                    '& fieldset': { borderColor: HOME_TOKENS.border.subtle },
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <MenuItem key={size} value={size} sx={{ fontSize: '0.8rem' }}>
                      {size} / pagină
                    </MenuItem>
                  ))}
                </Select>

                <IconButton
                  size="small"
                  aria-label="Pagina anterioară"
                  disabled={page === 1 || isFetching}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  sx={paginationButtonSx}
                >
                  <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Pagina următoare"
                  disabled={!hasNextPage || isFetching}
                  onClick={() => setPage(page + 1)}
                  sx={paginationButtonSx}
                >
                  <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
                {isFetching && <CircularProgress size={14} sx={{ color: HOME_TOKENS.text.tertiary }} />}
              </Stack>
            </Stack>
          )}
        </Box>
      )}
    </HomeCard>
  )
}

/* ── Tabelul de desktop ───────────────────────────────────────────────────── */

interface RideTableProps {
  items: RideRow[]
  sortField: SortField
  sortDescending: boolean
  onToggleSort: (field: SortField) => void
}

function RideTable({ items, sortField, sortDescending, onToggleSort }: RideTableProps) {
  const SortIcon = sortDescending ? ArrowDownwardRoundedIcon : ArrowUpwardRoundedIcon

  const sortableHeader = (field: SortField, label: string, align: 'left' | 'right' = 'left') => (
    <Box component="th" scope="col" sx={{ ...headCellSx, textAlign: align }}>
      <Box
        component="button"
        type="button"
        onClick={() => onToggleSort(field)}
        aria-label={`Sortează după ${label}`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.3,
          border: 'none',
          background: 'none',
          p: 0,
          cursor: 'pointer',
          font: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
          color: sortField === field ? HOME_TOKENS.text.secondary : 'inherit',
          '&:focus-visible': { outline: `2px solid ${HOME_TOKENS.brand[600]}`, outlineOffset: 2 },
        }}
      >
        {label}
        {sortField === field && <SortIcon aria-hidden sx={{ fontSize: 13 }} />}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', minWidth: 860, borderCollapse: 'collapse' }}>
        <Box component="caption" sx={visuallyHidden}>
          Istoricul curselor din perioada selectată
        </Box>
        <Box component="thead" sx={{ position: 'sticky', top: 0, bgcolor: HOME_TOKENS.bg.surface2, zIndex: 1 }}>
          <Box component="tr">
            {sortableHeader('date', 'Data')}
            <Box component="th" scope="col" sx={headCellSx}>
              Ora
            </Box>
            <Box component="th" scope="col" sx={headCellSx}>
              Platformă
            </Box>
            <Box component="th" scope="col" sx={headCellSx}>
              Categorie
            </Box>
            <Box component="th" scope="col" sx={headCellSx}>
              Preluare
            </Box>
            <Box component="th" scope="col" sx={headCellSx}>
              Destinație
            </Box>
            {sortableHeader('distance', 'Distanță', 'right')}
            {sortableHeader('duration', 'Durată', 'right')}
            <Box component="th" scope="col" sx={headCellSx}>
              Plată
            </Box>
            {sortableHeader('net', 'Net (lei)', 'right')}
          </Box>
        </Box>
        <Box component="tbody">
          {items.map((ride) => (
            <Box
              component="tr"
              key={ride.id}
              sx={{ height: 56, '&:hover': { bgcolor: HOME_TOKENS.bg.surface2 } }}
            >
              <Box component="td" sx={{ ...bodyCellSx, ...tabularNums, whiteSpace: 'nowrap' }}>
                {formatDate(ride.startedAtUtc)}
              </Box>
              <Box component="td" sx={{ ...bodyCellSx, ...tabularNums, color: HOME_TOKENS.text.secondary }}>
                {formatTime(ride.startedAtUtc)}
              </Box>
              <Box component="td" sx={bodyCellSx}>
                <PlatformBadge platform={ride.platform} />
              </Box>
              <Box component="td" sx={bodyCellSx}>
                <Truncated value={ride.category} maxWidth={120} />
              </Box>
              <Box component="td" sx={bodyCellSx}>
                <Truncated value={ride.pickup} maxWidth={180} />
              </Box>
              <Box component="td" sx={bodyCellSx}>
                <Truncated value={ride.dropoff} maxWidth={180} />
              </Box>
              <Box component="td" sx={{ ...bodyCellSx, ...tabularNums, textAlign: 'right' }}>
                {ride.distanceKm === null ? <Missing /> : formatDistance(ride.distanceKm)}
              </Box>
              <Box component="td" sx={{ ...bodyCellSx, ...tabularNums, textAlign: 'right' }}>
                {ride.durationMin === null ? <Missing /> : formatDuration(ride.durationMin)}
              </Box>
              <Box component="td" sx={bodyCellSx}>
                <PaymentBadge payment={ride.paymentType} />
              </Box>
              <Box
                component="td"
                sx={{ ...bodyCellSx, textAlign: 'right', whiteSpace: 'nowrap' }}
              >
                <Amount value={ride.net} size="row" weight={500} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

/* ── Lista de carduri, sub 900px ─────────────────────────────────────────── */

function RideCardList({ items }: { items: RideRow[] }) {
  return (
    <Stack spacing={1}>
      {items.map((ride) => (
        <Stack
          key={ride.id}
          direction="row"
          spacing={1.4}
          sx={{
            alignItems: 'center',
            p: 1.5,
            borderRadius: '12px',
            border: `1px solid ${HOME_TOKENS.border.subtle}`,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', mb: 0.4 }}>
              <Typography sx={{ ...tabularNums, fontSize: '0.78rem', color: HOME_TOKENS.text.secondary }}>
                {formatDate(ride.startedAtUtc)} · {formatTime(ride.startedAtUtc)}
              </Typography>
              <PlatformBadge platform={ride.platform} />
            </Stack>
            <Typography noWrap sx={{ fontSize: '0.85rem', color: HOME_TOKENS.text.primary }}>
              {ride.pickup ?? EMPTY_FIELD} → {ride.dropoff ?? EMPTY_FIELD}
            </Typography>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Typography sx={{ ...tabularNums, fontSize: '0.74rem', color: HOME_TOKENS.text.tertiary }}>
                {ride.distanceKm === null ? EMPTY_FIELD : formatDistance(ride.distanceKm)} ·{' '}
                {ride.durationMin === null ? EMPTY_FIELD : formatDuration(ride.durationMin)}
              </Typography>
              <PaymentBadge payment={ride.paymentType} />
            </Stack>
          </Box>
          <Amount value={ride.net} unit="lei" size="card" sx={{ flexShrink: 0 }} />
        </Stack>
      ))}
    </Stack>
  )
}

/* ── Bucăți mici ──────────────────────────────────────────────────────────── */

function PlatformBadge({ platform }: { platform: 'bolt' | 'uber' }) {
  const color = platform === 'bolt' ? HOME_TOKENS.platform.bolt : HOME_TOKENS.platform.uber
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box aria-hidden sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.8rem', color: HOME_TOKENS.text.primary }}>
        {platform === 'bolt' ? 'Bolt' : 'Uber'}
      </Typography>
    </Stack>
  )
}

function PaymentBadge({ payment }: { payment: 'card' | 'cash' }) {
  const isCard = payment === 'card'
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.9,
        py: 0.2,
        borderRadius: HOME_TOKENS.radius.pill,
        fontSize: '0.72rem',
        fontWeight: 500,
        bgcolor: isCard ? HOME_TOKENS.brand[50] : HOME_TOKENS.warn[50],
        color: isCard ? HOME_TOKENS.brand[600] : HOME_TOKENS.warn[600],
      }}
    >
      {isCard ? 'Card' : 'Cash'}
    </Box>
  )
}

function Truncated({ value, maxWidth }: { value: string | null; maxWidth: number }) {
  if (!value) return <Missing />
  return (
    <Box
      component="span"
      title={value}
      sx={{ display: 'block', maxWidth, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {value}
    </Box>
  )
}

/** Câmp absent din sursă — „—", niciodată „N/A" și niciodată celulă goală. */
function Missing() {
  return (
    <Box component="span" sx={{ color: HOME_TOKENS.text.tertiary }}>
      {EMPTY_FIELD}
    </Box>
  )
}

const headCellSx = {
  py: 1,
  px: 1,
  fontSize: '0.7rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  color: HOME_TOKENS.text.tertiary,
  borderBottom: `1px solid ${HOME_TOKENS.border.subtle}`,
} as const

const bodyCellSx = {
  py: 1,
  px: 1,
  fontSize: '0.83rem',
  color: HOME_TOKENS.text.primary,
  borderBottom: `1px solid ${HOME_TOKENS.border.subtle}`,
} as const

const paginationButtonSx = {
  border: `1px solid ${HOME_TOKENS.border.subtle}`,
  borderRadius: HOME_TOKENS.radius.input,
  color: HOME_TOKENS.text.secondary,
  '&:hover': { bgcolor: HOME_TOKENS.bg.surface2 },
} as const
