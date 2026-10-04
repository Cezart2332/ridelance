import { useDeferredValue, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { panelTableSx, usePaged } from '../../../../components/panel/panelUtils'
import {
  Badge,
  DataPanel,
  FilterTabs,
  PageHeading,
  PersonCell,
  RowActions,
  SearchField,
  StatCard,
  StatGrid,
  TablePager,
  type FilterTab,
} from '../../../../components/panel/ui'
import { accountingApi } from '../../api/accountingApi'
import type { ClientWorkspaceRow, FiscalOverviewRow, FiscalThresholds } from '../../api/types'
import { formatLei } from '../../format'
import { EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav, type ClientSection } from '../navigation'
import { useApi } from '../useApi'
import { casThreshold, profileBadge, vatRisk } from './fiscal'
import { MonthSelect } from './parts'
import { UnassignedDocuments, UploadDocumentsDialog } from './PlatformInbox'
import { bankCell, currentFiscalPeriod, DECLARATION_TYPES, declarationCell, documentsCell, type Cell } from './status'

type Filter = 'ALL' | 'MISSING' | 'REVIEW' | 'READY' | 'INACTIVE' | 'CAS' | 'VAT'
type Columns = 'fiscal' | 'luna'
type SortKey = 'name' | 'grossIncome' | 'netIncome'

const COLUMNS_KEY = 'rl-clients-columns'

/** Secțiunea din legăturile vechi (`?section=documents|chat`), din notificări. */
const LEGACY_SECTION: Record<string, ClientSection> = { documents: 'luna', chat: 'mesaje' }

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function storedColumns(): Columns {
  try {
    return window.localStorage.getItem(COLUMNS_KEY) === 'luna' ? 'luna' : 'fiscal'
  } catch {
    return 'fiscal'
  }
}

function CellBadge({ cell }: { cell: Cell | null }) {
  if (!cell) return <Dash />
  return (
    <Badge toneName={cell.tone} title={cell.title}>
      {cell.label}
    </Badge>
  )
}

function Dash() {
  return (
    <Box component="span" sx={{ color: 'var(--rl-text-subtle)' }}>
      —
    </Box>
  )
}

function Money({ value }: { value: number | null | undefined }) {
  return value === null || value === undefined ? <Dash /> : <Box component="span" sx={{ fontWeight: 500, color: 'var(--rl-fg-soft)', whiteSpace: 'nowrap' }}>{formatLei(value)}</Box>
}

function FiscalCells({ row, thresholds }: { row: FiscalOverviewRow | undefined; thresholds: FiscalThresholds | null }) {
  const profile = profileBadge(row)
  const cas = row ? casThreshold(row, thresholds) : null
  const vat = row ? vatRisk(row, thresholds) : null
  return (
    <>
      <TableCell>
        <Badge toneName={profile.tone}>{profile.label}</Badge>
      </TableCell>
      <TableCell align="right">
        <Money value={row?.grossIncome} />
      </TableCell>
      <TableCell align="right">
        <Money value={row?.netIncome} />
      </TableCell>
      <TableCell align="right">
        <Stack sx={{ alignItems: 'flex-end' }}>
          <Money value={row?.cas} />
          {cas?.near && <Typography sx={{ fontSize: 11, color: 'var(--rl-yellow-text)' }}>aproape de {cas.label}</Typography>}
        </Stack>
      </TableCell>
      <TableCell align="right">
        <Money value={row?.cass} />
      </TableCell>
      <TableCell align="right">
        <Money value={row?.incomeTax} />
      </TableCell>
      <TableCell align="right">
        {vat ? (
          <Stack sx={{ alignItems: 'flex-end' }}>
            <Money value={row?.grossIncome} />
            <Typography sx={{ fontSize: 11, color: vat.tone ? `var(--rl-${vat.tone}-text)` : 'var(--rl-text-subtle)', whiteSpace: 'nowrap' }}>
              {Math.round(vat.ratio * 100)}% din plafon
            </Typography>
          </Stack>
        ) : (
          <Dash />
        )}
      </TableCell>
    </>
  )
}

function MonthCells({ row }: { row: ClientWorkspaceRow }) {
  return (
    <>
      <TableCell>{row.stage === 'INACTIVE' ? <Badge>Inactiv</Badge> : <CellBadge cell={documentsCell(row)} />}</TableCell>
      <TableCell>
        <CellBadge cell={bankCell(row.bankStatus)} />
      </TableCell>
      {DECLARATION_TYPES.map((type) => {
        const cell = row.declarations[type]
        const word = declarationCell(cell)
        return (
          <TableCell key={type} sx={{ whiteSpace: 'nowrap' }}>
            {word ? (
              <Stack sx={{ gap: 0.25 }}>
                {type !== 'D390' && cell?.amount !== null && cell?.amount !== undefined && <Money value={cell.amount} />}
                <Box component="span" sx={{ color: `var(--rl-${word.tone}-text)`, fontWeight: 600, fontSize: 12 }}>
                  {word.label}
                </Box>
              </Stack>
            ) : (
              <Dash />
            )}
          </TableCell>
        )
      })}
      <TableCell align="right">
        {row.unreadMessages > 0 ? (
          <Box component="span" sx={{ px: 1, py: '2px', borderRadius: 999, bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', fontWeight: 700, fontSize: 11 }}>
            {row.unreadMessages}
          </Box>
        ) : (
          <Dash />
        )}
      </TableCell>
    </>
  )
}

/** „Clienți PFA”: cifrele anului sus, apoi un rând pe client, cu luna de lucru sau coloanele fiscale. */
export function ClientsTableView() {
  const nav = useAccountingNav()
  const [params, setParams] = useSearchParams()
  const current = currentFiscalPeriod()
  const period = nav.period ?? current
  const year = Number(period.slice(0, 4))
  const clients = useApi(() => accountingApi.clients.list(period), [period])
  const fiscal = useApi(() => accountingApi.fiscal.overview(year), [year])
  const inbox = useApi(() => accountingApi.platformInbox.list(), [])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const query = fold(useDeferredValue(search.trim()))
  const [filter, setFilter] = useState<Filter>(nav.listTab === 'inactive' ? 'INACTIVE' : 'ALL')
  const [columns, setColumnsState] = useState<Columns>(storedColumns)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })
  const changeSort = (key: SortKey) => setSort((previous) => ({ key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' }))
  const setColumns = (next: Columns) => {
    setColumnsState(next)
    try {
      window.localStorage.setItem(COLUMNS_KEY, next)
    } catch {
      // Fără stocare: alegerea ține până la reîncărcare.
    }
  }

  // Legăturile din notificări (`?user={userId}&section=…`) deschid direct clientul.
  const linkedUser = params.get('user')
  useEffect(() => {
    if (!linkedUser || !clients.data) return
    const row = clients.data.find((item) => item.userId === linkedUser)
    if (row) {
      nav.openPfa(row.pfaId, LEGACY_SECTION[params.get('section') ?? ''] ?? 'luna')
    } else {
      const next = new URLSearchParams(params)
      next.delete('user')
      next.delete('section')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedUser, clients.data])

  const thresholds = fiscal.data?.thresholds ?? null
  const fiscalOf = new Map((fiscal.data?.rows ?? []).map((row) => [row.pfaId, row]))
  // Clienții în onboarding nu au încă lună de lucru: nu apar în tabel.
  const rows = (clients.data ?? []).filter((row) => row.stage !== 'ONBOARDING')
  const active = rows.filter((row) => row.stage !== 'INACTIVE')
  const nearCas = (row: ClientWorkspaceRow) => {
    const figures = fiscalOf.get(row.pfaId)
    return Boolean(figures && casThreshold(figures, thresholds)?.near)
  }
  const vatAtRisk = (row: ClientWorkspaceRow) => {
    const figures = fiscalOf.get(row.pfaId)
    return Boolean(figures && vatRisk(figures, thresholds)?.tone)
  }
  const matches: Record<Filter, (row: ClientWorkspaceRow) => boolean> = {
    ALL: (row) => row.stage !== 'INACTIVE',
    MISSING: (row) => row.monthStatus === 'MISSING_DOCUMENTS',
    REVIEW: (row) => row.monthStatus === 'NEEDS_REVIEW',
    READY: (row) => row.monthStatus === 'READY',
    INACTIVE: (row) => row.stage === 'INACTIVE',
    CAS: (row) => row.stage !== 'INACTIVE' && nearCas(row),
    VAT: (row) => row.stage !== 'INACTIVE' && vatAtRisk(row),
  }
  const count = (value: Filter) => (clients.data ? rows.filter(matches[value]).length : undefined)
  const tabs: FilterTab<Filter>[] = [
    { value: 'ALL', label: 'Active', count: count('ALL') },
    { value: 'MISSING', label: 'Blocați', count: count('MISSING'), toneName: 'red' },
    { value: 'REVIEW', label: 'De verificat', count: count('REVIEW'), toneName: 'yellow' },
    { value: 'READY', label: 'Gata', count: count('READY'), toneName: 'green' },
    { value: 'INACTIVE', label: 'Inactive', count: count('INACTIVE') },
  ]
  const visible = rows
    .filter(matches[filter])
    .filter((row) => !query || fold(row.name).includes(query) || row.cui.includes(query) || fold(row.email).includes(query))
    .sort((a, b) => {
      if (sort.key === 'name') return a.name.localeCompare(b.name, 'ro') * (sort.direction === 'asc' ? 1 : -1)
      const first = fiscalOf.get(a.pfaId)?.[sort.key]
      const second = fiscalOf.get(b.pfaId)?.[sort.key]
      // Valorile absente rămân la final, în ambele sensuri.
      if (first == null || second == null) return first == null ? second == null ? 0 : 1 : -1
      return (first - second) * (sort.direction === 'asc' ? 1 : -1)
    })
  const { rows: page, pager } = usePaged(visible)
  const open = (row: ClientWorkspaceRow, section: ClientSection = 'luna') => nav.openPfa(row.pfaId, section, { luna: period })
  const toggleFilter = (value: Filter) => setFilter((currentFilter) => (currentFilter === value ? 'ALL' : value))
  const reloadAll = () => {
    inbox.reload()
    clients.reload()
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <PageHeading
        title="Clienți PFA"
        status={thresholds && <Badge toneName="green">Parametri fiscali {year}</Badge>}
        actions={
          <>
            <MonthSelect value={period} current={current} onChange={(value) => nav.setParam('luna', value)} />
            <Button variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={() => setUploading(true)} sx={{ whiteSpace: 'nowrap' }}>
              Încarcă documente
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="PFA active" value={clients.data ? active.length : '—'} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <StatCard label="Inactive" value={clients.data ? rows.length - active.length : '—'} active={filter === 'INACTIVE'} onClick={() => toggleFilter('INACTIVE')} />
        <StatCard
          label={`Aproape de prag CAS`}
          value={fiscal.data ? active.filter(nearCas).length : '—'}
          toneName={fiscal.data && active.some(nearCas) ? 'yellow' : undefined}
          active={filter === 'CAS'}
          onClick={() => toggleFilter('CAS')}
        />
        <StatCard
          label="Risc plafon TVA"
          value={fiscal.data ? active.filter(vatAtRisk).length : '—'}
          toneName={fiscal.data && active.some(vatAtRisk) ? 'red' : undefined}
          active={filter === 'VAT'}
          onClick={() => toggleFilter('VAT')}
        />
      </StatGrid>

      {uploading && <UploadDocumentsDialog open period={period} current={current} onClose={() => setUploading(false)} onUploaded={reloadAll} />}

      <UnassignedDocuments items={inbox.data ?? []} clients={rows} onChanged={reloadAll} />

      {fiscal.error && <Box sx={{ mb: 2 }}><ErrorBlock message={`Datele fiscale pentru ${year} nu au putut fi actualizate. ${fiscal.error}`} onRetry={fiscal.reload} /></Box>}

      <DataPanel
        toolbar={
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1, flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0, flexWrap: { xs: 'nowrap', md: 'wrap' }, alignItems: { md: 'center' } }}>
              <SearchField value={search} onChange={setSearch} placeholder="Caută după nume, CUI sau email" label="Caută client" />
              <FilterTabs items={tabs} value={filter} onChange={setFilter} />
            </Stack>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={columns}
              onChange={(_, value: Columns | null) => value && setColumns(value)}
              aria-label="Coloane"
              sx={{
                alignSelf: { xs: 'flex-start', md: 'center' },
                '& .MuiToggleButton-root': { height: 32, px: 1.25, fontSize: 12, fontWeight: 600, textTransform: 'none', color: 'var(--rl-text-muted)', borderColor: 'var(--rl-border-strong)', bgcolor: 'var(--rl-input)' },
                '& .MuiToggleButton-root.Mui-selected': { color: 'var(--rl-fg)', bgcolor: 'var(--rl-muted)' },
              }}
            >
              <ToggleButton value="fiscal">Fiscal {year}</ToggleButton>
              <ToggleButton value="luna">Luna</ToggleButton>
            </ToggleButtonGroup>
          </>
        }
        footer={visible.length > 0 ? <TablePager pager={pager} label="clienți" /> : undefined}
      >
        {clients.error && (
          <Box sx={{ p: 2 }}>
            <ErrorBlock message={clients.error} onRetry={clients.reload} />
          </Box>
        )}
        {!clients.data && !clients.error && <LoadingBlock />}
        {clients.data && visible.length === 0 && (
          <Box sx={{ px: 2.5, py: 3 }}>
            <EmptyText>{query ? 'Niciun client nu corespunde căutării.' : 'Niciun client în această categorie.'}</EmptyText>
          </Box>
        )}
        {page.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto', opacity: clients.loading ? 0.6 : 1 }}>
            <Table sx={{ ...panelTableSx, minWidth: columns === 'fiscal' ? 880 : 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2 }} sortDirection={sort.key === 'name' ? sort.direction : false}>
                    <TableSortLabel active={sort.key === 'name'} direction={sort.direction} onClick={() => changeSort('name')}>PFA</TableSortLabel>
                  </TableCell>
                  {columns === 'fiscal' ? (
                    <>
                      <TableCell>Profil fiscal</TableCell>
                      <TableCell align="right" sortDirection={sort.key === 'grossIncome' ? sort.direction : false}>
                        <TableSortLabel active={sort.key === 'grossIncome'} direction={sort.key === 'grossIncome' ? sort.direction : 'asc'} onClick={() => changeSort('grossIncome')}>Venit brut</TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sortDirection={sort.key === 'netIncome' ? sort.direction : false}>
                        <TableSortLabel active={sort.key === 'netIncome'} direction={sort.key === 'netIncome' ? sort.direction : 'asc'} onClick={() => changeSort('netIncome')}>Venit net</TableSortLabel>
                      </TableCell>
                      <TableCell align="right">CAS</TableCell>
                      <TableCell align="right">
                        CASS
                      </TableCell>
                      <TableCell align="right">
                        Impozit
                      </TableCell>
                      <TableCell align="right">TVA art. 310</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Documente</TableCell>
                      <TableCell>Bancă</TableCell>
                      {DECLARATION_TYPES.map((type) => (
                        <TableCell key={type}>
                          {type}
                        </TableCell>
                      ))}
                      <TableCell align="right">Mesaje</TableCell>
                    </>
                  )}
                  <TableCell sx={{ width: 48 }} aria-label="Acțiuni" />
                </TableRow>
              </TableHead>
              <TableBody>
                {page.map((row) => (
                  <TableRow
                    key={row.pfaId}
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
                    <TableCell sx={{ pl: 2 }}>
                      <PersonCell name={row.name} meta={[row.cui, row.email].filter(Boolean).join(' · ')} />
                    </TableCell>
                    {columns === 'fiscal' ? <FiscalCells row={fiscalOf.get(row.pfaId)} thresholds={thresholds} /> : <MonthCells row={row} />}
                    <TableCell align="right" sx={{ pr: 1 }}>
                      <RowActions
                        label={`Acțiuni pentru ${row.name}`}
                        actions={[
                          { label: 'Deschide dosarul', onClick: () => open(row) },
                          { label: 'Sinteză fiscală', onClick: () => open(row, 'fiscal') },
                          { label: 'Taxe', onClick: () => open(row, 'fiscal') },
                          { label: 'Bancă', onClick: () => open(row, 'banca') },
                          { label: 'Registre', onClick: () => open(row, 'registre') },
                          { label: 'Mesaje', onClick: () => open(row, 'mesaje') },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataPanel>
    </Box>
  )
}
