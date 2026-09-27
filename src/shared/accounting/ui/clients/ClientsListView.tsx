import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { visuallyHidden } from '@mui/utils'

import { ActionMenu, StatusBadge } from '../../../../components/admin'
import { pfaService } from '../../../../services/pfa.service'
import { accountingApi } from '../../api/accountingApi'
import type { CashRegisterStatus, PfaMonthStatus, Period, Platform } from '../../api/types'
import { EMPTY, formatPeriod } from '../../format'
import { CASH_REGISTER_STATUS, PFA_MONTH_STATUS, PLATFORM_LABEL } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav, type ClientSection } from '../navigation'
import { useApi } from '../useApi'
import { fold } from './text'
import { ClientAvatar } from './ui'

type ClientStatus = 'ACTIVE' | 'ONBOARDING' | 'INACTIVE'

interface ClientRow {
  id: string
  name: string
  cui: string
  email: string
  userId: string
  platforms: Platform[]
  status: ClientStatus
  monthStatus: PfaMonthStatus | null
  cashStatus: CashRegisterStatus | null
}

/**
 * Rândul din lista veche (`/pfa-registrations`): portofoliul contabilului, adică PFA-urile alocate
 * lui, inclusiv cele încă în onboarding. Spațiul de lucru (venituri, bancă, note) e limitat la ele.
 */
interface LegacyClient {
  id: string
  userId: string
  userName: string
  userEmail: string
}

const STATUS_LABEL: Record<ClientStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  ACTIVE: { label: 'Activ', tone: 'success' },
  ONBOARDING: { label: 'În onboarding', tone: 'warning' },
  INACTIVE: { label: 'Inactiv', tone: 'neutral' },
}

const FILTERS: { value: ClientStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Toți' },
  { value: 'ACTIVE', label: 'Activi' },
  { value: 'ONBOARDING', label: 'În onboarding' },
  { value: 'INACTIVE', label: 'Inactivi' },
]

/** Ordinea de sortare a statusului lunii: întâi ce cere atenție. */
const MONTH_ORDER: Record<PfaMonthStatus, number> = { MISSING_DOCUMENTS: 0, NEEDS_REVIEW: 1, NOT_PROCESSED: 2, READY: 3 }

type SortKey = 'name' | 'month' | 'status'

const ROW_ACTIONS: { section: ClientSection; label: string }[] = [
  { section: 'prezentare', label: 'Deschide profilul' },
  { section: 'declaratii', label: 'Declarații' },
  { section: 'documente', label: 'Documente' },
  { section: 'mesaje', label: 'Mesaje' },
]

/** Secțiunea din legăturile vechi (`?section=documents|chat`), din notificări. */
const LEGACY_SECTION: Record<string, ClientSection> = { documents: 'documente', chat: 'mesaje' }

async function loadPortfolio(): Promise<LegacyClient[]> {
  const data = await pfaService.getAll()
  const items: LegacyClient[] = data?.items ?? data ?? []
  return items.filter((item) => item.id)
}

/** „Clienți PFA”: toți clienții contabilului, cu statusul lunii fiscale și al casei de marcat. */
export function ClientsListView() {
  const nav = useAccountingNav()
  const [params, setParams] = useSearchParams()
  const accounting = useApi(() => accountingApi.pfas.list(), [])
  const portfolio = useApi(loadPortfolio, [])

  const [search, setSearch] = useState('')
  const query = fold(useDeferredValue(search.trim()))
  const [filter, setFilter] = useState<ClientStatus | 'ALL'>(nav.listTab === 'inactive' ? 'INACTIVE' : 'ALL')
  const [monthFilter, setMonthFilter] = useState<PfaMonthStatus | 'ALL'>('ALL')
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const period: Period | null = accounting.data?.[0]?.currentPeriod ?? null

  const rows = useMemo<ClientRow[]>(() => {
    const accountingById = new Map((accounting.data ?? []).map((pfa) => [pfa.id, pfa]))
    return (portfolio.data ?? []).map((client): ClientRow => {
      const pfa = accountingById.get(client.id)
      if (!pfa) {
        return {
          id: client.id,
          name: client.userName,
          cui: '',
          email: client.userEmail,
          userId: client.userId,
          platforms: [],
          status: 'ONBOARDING',
          monthStatus: null,
          cashStatus: null,
        }
      }
      const inactive = pfa.engagementStatus === 'INACTIVE'
      return {
        id: pfa.id,
        name: pfa.name,
        cui: pfa.cui,
        email: pfa.client.email,
        userId: pfa.client.userId,
        platforms: pfa.platforms,
        status: inactive ? 'INACTIVE' : 'ACTIVE',
        monthStatus: inactive ? null : pfa.currentMonthStatus,
        cashStatus: pfa.cashStatus,
      }
    })
  }, [accounting.data, portfolio.data])

  // Legăturile din notificări (`?user={userId}&section=…`) deschid direct profilul.
  const linkedUser = params.get('user')
  useEffect(() => {
    if (!linkedUser || !accounting.data || !portfolio.data) return
    const row = rows.find((item) => item.userId === linkedUser)
    if (row) {
      const section = LEGACY_SECTION[params.get('section') ?? ''] ?? 'prezentare'
      nav.openPfa(row.id, section)
    } else {
      const next = new URLSearchParams(params)
      next.delete('user')
      next.delete('section')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedUser, rows, accounting.data, portfolio.data])

  const count = (status: ClientStatus | 'ALL') => (status === 'ALL' ? rows.length : rows.filter((row) => row.status === status).length)

  const visible = rows
    .filter((row) => filter === 'ALL' || row.status === filter)
    .filter((row) => monthFilter === 'ALL' || row.monthStatus === monthFilter)
    .filter((row) => !query || fold(row.name).includes(query) || row.cui.includes(query) || fold(row.email).includes(query))
    .sort((a, b) => {
      const sign = sort.direction === 'asc' ? 1 : -1
      if (sort.key === 'month') return sign * ((a.monthStatus ? MONTH_ORDER[a.monthStatus] : 9) - (b.monthStatus ? MONTH_ORDER[b.monthStatus] : 9))
      if (sort.key === 'status') return sign * STATUS_LABEL[a.status].label.localeCompare(STATUS_LABEL[b.status].label, 'ro')
      return sign * a.name.localeCompare(b.name, 'ro')
    })
  const pageRows = visible.slice(page * pageSize, page * pageSize + pageSize)

  const sortBy = (key: SortKey) =>
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  const sortLabel = (key: SortKey, label: string) => (
    <TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.direction : 'asc'} onClick={() => sortBy(key)}>
      {label}
    </TableSortLabel>
  )

  const open = (row: ClientRow, section: ClientSection = 'prezentare') => nav.openPfa(row.id, section)
  const error = accounting.error ?? portfolio.error
  const ready = Boolean(accounting.data && portfolio.data)
  const loading = !ready && !error
  const hideOnMobile = { display: { xs: 'none', md: 'table-cell' } }

  return (
    <Stack spacing={3}>
      <Typography variant="h1">Clienți PFA</Typography>

      <Paper sx={{ overflow: 'hidden' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ p: 2, gap: 1.5, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: { sm: 'center' }, minWidth: 0 }}>
            <TextField
              placeholder="Caută după nume, CUI sau email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              sx={{ width: { xs: '100%', sm: 300 } }}
              slotProps={{
                htmlInput: { 'aria-label': 'Caută client' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, value: ClientStatus | 'ALL' | null) => {
                if (!value) return
                setFilter(value)
                setPage(0)
              }}
              aria-label="Status client"
              sx={{
                flexWrap: 'wrap',
                '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: 13, fontWeight: 600, textTransform: 'none', color: 'text.secondary' },
                '& .Mui-selected': { color: 'text.primary !important', bgcolor: 'primary.light !important' },
              }}
            >
              {FILTERS.map((option) => (
                <ToggleButton key={option.value} value={option.value}>
                  {option.label}
                  <Box component="span" sx={{ ml: 0.75, color: 'text.secondary', fontWeight: 500 }}>
                    {count(option.value)}
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          <TextField
            select
            label={period ? `Status ${formatPeriod(period)}` : 'Status lună'}
            value={monthFilter}
            onChange={(event) => {
              setMonthFilter(event.target.value as PfaMonthStatus | 'ALL')
              setPage(0)
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="ALL">Toate</MenuItem>
            {(Object.keys(PFA_MONTH_STATUS) as PfaMonthStatus[]).map((status) => (
              <MenuItem key={status} value={status}>
                {PFA_MONTH_STATUS[status].label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {error && (
          <Box sx={{ px: 2, pb: 2 }}>
            <ErrorBlock
              message={error}
              onRetry={() => {
                accounting.reload()
                portfolio.reload()
              }}
            />
          </Box>
        )}
        {loading && <LoadingBlock />}
        {ready && visible.length === 0 && (
          <Box sx={{ px: 2.5, pb: 2 }}>
            <EmptyText>{query ? 'Niciun client nu corespunde căutării.' : 'Niciun client.'}</EmptyText>
          </Box>
        )}
        {ready && visible.length > 0 && (
          <>
            <TableContainer sx={{ overflowX: 'auto', borderTop: 1, borderColor: 'divider' }}>
              <Table
                size="small"
                sx={{
                  '& .MuiTableCell-root': { py: 1.25, px: 2 },
                  '& .MuiTableCell-head': { bgcolor: 'transparent', py: 1.25 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>{sortLabel('name', 'Client')}</TableCell>
                    <TableCell sx={hideOnMobile}>CUI</TableCell>
                    <TableCell sx={hideOnMobile}>Email</TableCell>
                    <TableCell sx={hideOnMobile}>Platforme</TableCell>
                    <TableCell>{sortLabel('month', period ? `Luna ${formatPeriod(period)}` : 'Luna')}</TableCell>
                    <TableCell sx={hideOnMobile}>Numerar</TableCell>
                    <TableCell sx={hideOnMobile}>{sortLabel('status', 'Status')}</TableCell>
                    <TableCell align="right" sx={{ width: 56 }}>
                      <Box component="span" sx={visuallyHidden}>
                        Acțiuni
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      tabIndex={0}
                      role="link"
                      aria-label={`Deschide dosarul ${row.name}`}
                      onClick={() => open(row)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') open(row)
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 0 }}>
                          <ClientAvatar name={row.name} />
                          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: { md: 'nowrap' } }}>
                            {row.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={hideOnMobile}>{row.cui || EMPTY}</TableCell>
                      <TableCell sx={{ ...hideOnMobile, color: 'text.secondary' }}>{row.email || EMPTY}</TableCell>
                      <TableCell sx={hideOnMobile}>{row.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ') || EMPTY}</TableCell>
                      <TableCell>
                        {row.monthStatus ? <AccountingBadge descriptor={PFA_MONTH_STATUS[row.monthStatus]} /> : EMPTY}
                      </TableCell>
                      <TableCell sx={hideOnMobile}>
                        {!row.cashStatus ? EMPTY : row.cashStatus === 'NOT_REQUIRED_CURRENT_CONFIGURATION' ? 'Nu' : <AccountingBadge descriptor={CASH_REGISTER_STATUS[row.cashStatus]} />}
                      </TableCell>
                      <TableCell sx={hideOnMobile}>
                        <StatusBadge label={STATUS_LABEL[row.status].label} tone={STATUS_LABEL[row.status].tone} />
                      </TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Acțiuni ${row.name}`}
                          items={ROW_ACTIONS.map((action) => ({ key: action.section, label: action.label, onClick: () => open(row, action.section) }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={visible.length}
              page={Math.min(page, Math.max(0, Math.ceil(visible.length / pageSize) - 1))}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(_, next) => setPage(next)}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(0)
              }}
              labelRowsPerPage="Rânduri pe pagină"
              labelDisplayedRows={({ from, to, count: total }) => `${from}–${to} din ${total}`}
              getItemAriaLabel={(type) => (type === 'next' ? 'Pagina următoare' : type === 'previous' ? 'Pagina anterioară' : type === 'first' ? 'Prima pagină' : 'Ultima pagină')}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </>
        )}
      </Paper>
    </Stack>
  )
}
