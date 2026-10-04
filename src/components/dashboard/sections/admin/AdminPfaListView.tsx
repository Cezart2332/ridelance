import { Box, Button, CircularProgress, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import { panelTableSx, usePaged, type PanelTone } from '../../../panel/panelUtils'
import { Badge, DataPanel, FilterTabs, PageHeading, PersonCell, RowActions, SearchField, StatCard, StatGrid, TablePager, type FilterTab } from '../../../panel/ui'
import type { FiscalProfileStatus } from '../../../../services/fiscalProfile.service'

/** Ce afișează lista despre un client; `PfaSummary` din dashboard-ul de admin. */
export interface AdminPfaRow {
  id: string
  userId: string
  userEmail: string
  userName: string
  fullName: string | null
  phone: string | null
  status: string
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  documentCount: number
  awaitingAdminAction: boolean
  lastActivityAtUtc: string | null
  deletedAtUtc: string | null
  fiscalProfileStatus: FiscalProfileStatus
}

export type EnrolledFilter = 'active' | 'inactive' | 'deleted'
export type FiscalFilter = 'all' | FiscalProfileStatus

const FISCAL_LABEL: Record<FiscalProfileStatus, { label: string; tone: PanelTone }> = {
  NOT_STARTED: { label: 'Necompletat', tone: 'yellow' },
  DRAFT: { label: 'Ciornă', tone: 'yellow' },
  COMPLETED: { label: 'Completat', tone: 'green' },
}

function statusBadge(row: AdminPfaRow): { label: string; tone: PanelTone } {
  if (row.deletedAtUtc) return { label: 'Cont închis', tone: 'red' }
  if (row.awaitingAdminAction) return { label: 'Necesită verificare', tone: 'yellow' }
  switch (row.status.toLowerCase()) {
    case 'approved':
    case 'verified':
      return { label: 'Aprobat', tone: 'green' }
    case 'rejected':
      return { label: 'Respins', tone: 'red' }
    default:
      return { label: 'În așteptare', tone: 'gray' }
  }
}

/**
 * „Onboarding” și „PFA înrolate”: cifrele sus, apoi tabelul cu căutare, filtre, meniul fiecărui rând
 * și paginare. Filtrele și datele vin din dashboard; aici e doar prezentarea.
 */
export function AdminPfaListView({
  mode,
  rows,
  all,
  loading,
  error,
  search,
  onSearch,
  enrolledFilter,
  onEnrolledFilter,
  enrolledCounts,
  fiscalFilter,
  onFiscalFilter,
  onlyAwaitingAdmin,
  onOnlyAwaitingAdmin,
  awaitingAdminCount,
  refreshing,
  onRefresh,
  onOpen,
  onImpersonate,
  onAccountAction,
  planLabel,
  subscriptionLabel,
  activityLabel,
}: {
  mode: 'onboarding' | 'enrolled'
  /** Rândurile după toate filtrele. */
  rows: AdminPfaRow[]
  /** Toți clienții tabului, doar după căutare (pentru cifre). */
  all: AdminPfaRow[]
  loading: boolean
  error: string | null
  search: string
  onSearch: (value: string) => void
  enrolledFilter: EnrolledFilter
  onEnrolledFilter: (value: EnrolledFilter) => void
  enrolledCounts: Record<EnrolledFilter, number>
  fiscalFilter: FiscalFilter
  onFiscalFilter: (value: FiscalFilter) => void
  onlyAwaitingAdmin: boolean
  onOnlyAwaitingAdmin: (value: boolean) => void
  awaitingAdminCount: number
  refreshing: boolean
  onRefresh: () => void
  onOpen: (row: AdminPfaRow) => void
  onImpersonate: (row: AdminPfaRow) => void
  onAccountAction: (row: AdminPfaRow) => void
  planLabel: (row: AdminPfaRow) => string
  subscriptionLabel: (status: string | null) => string
  activityLabel: (row: AdminPfaRow) => string
}) {
  const { rows: page, pager } = usePaged(rows)
  const enrolled = mode === 'enrolled'
  const enrolledTabs: FilterTab<EnrolledFilter>[] = [
    { value: 'active', label: 'Active', count: enrolledCounts.active },
    { value: 'inactive', label: 'Inactive', count: enrolledCounts.inactive },
    { value: 'deleted', label: 'Șterse', count: enrolledCounts.deleted, toneName: 'red' },
  ]
  const onboardingTabs: FilterTab<'all' | 'admin'>[] = [
    { value: 'all', label: 'Toate', count: all.length },
    { value: 'admin', label: 'Așteaptă adminul', count: awaitingAdminCount, toneName: 'yellow' },
  ]
  const notDeleted = all.filter((row) => !row.deletedAtUtc)

  return (
    <Box sx={{ minWidth: 0 }}>
      <PageHeading
        title={enrolled ? 'PFA înrolate' : 'Onboarding'}
        actions={
          <Button variant="outlined" onClick={onRefresh} disabled={refreshing} startIcon={refreshing ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <RefreshRoundedIcon />}>
            Reîmprospătează
          </Button>
        }
      />

      <StatGrid>
        {enrolled ? (
          <>
            <StatCard label="Active" value={enrolledCounts.active} active={enrolledFilter === 'active'} onClick={() => onEnrolledFilter('active')} />
            <StatCard label="Inactive" value={enrolledCounts.inactive} active={enrolledFilter === 'inactive'} onClick={() => onEnrolledFilter('inactive')} />
            <StatCard label="Conturi închise" value={enrolledCounts.deleted} active={enrolledFilter === 'deleted'} onClick={() => onEnrolledFilter('deleted')} />
            <StatCard
              label="Profil fiscal necompletat"
              value={notDeleted.filter((row) => row.fiscalProfileStatus !== 'COMPLETED').length}
              toneName={notDeleted.some((row) => row.fiscalProfileStatus !== 'COMPLETED') ? 'yellow' : undefined}
              active={fiscalFilter === 'NOT_STARTED'}
              onClick={() => onFiscalFilter(fiscalFilter === 'NOT_STARTED' ? 'all' : 'NOT_STARTED')}
            />
          </>
        ) : (
          <>
            <StatCard label="În onboarding" value={all.length} active={!onlyAwaitingAdmin} onClick={() => onOnlyAwaitingAdmin(false)} />
            <StatCard label="Așteaptă adminul" value={awaitingAdminCount} toneName={awaitingAdminCount > 0 ? 'yellow' : undefined} active={onlyAwaitingAdmin} onClick={() => onOnlyAwaitingAdmin(!onlyAwaitingAdmin)} />
            <StatCard label="Fără documente" value={all.filter((row) => row.documentCount === 0).length} />
            <StatCard label="Dosar aprobat" value={all.filter((row) => row.status.toLowerCase() === 'approved').length} toneName="green" />
          </>
        )}
      </StatGrid>

      <DataPanel
        toolbar={
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1, flex: 1, width: { xs: '100%', md: 'auto' }, minWidth: 0, flexWrap: { xs: 'nowrap', md: 'wrap' }, alignItems: { md: 'center' } }}>
              <SearchField value={search} onChange={onSearch} placeholder="Caută după nume sau email" label="Caută client" />
              {enrolled ? (
                <FilterTabs items={enrolledTabs} value={enrolledFilter} onChange={onEnrolledFilter} />
              ) : (
                <FilterTabs items={onboardingTabs} value={onlyAwaitingAdmin ? 'admin' : 'all'} onChange={(value) => onOnlyAwaitingAdmin(value === 'admin')} />
              )}
            </Stack>
            {enrolled && (
              <TextField select label="Profil fiscal" value={fiscalFilter} onChange={(event) => onFiscalFilter(event.target.value as FiscalFilter)} sx={{ minWidth: 160 }}>
                <MenuItem value="all">Toate</MenuItem>
                <MenuItem value="NOT_STARTED">Necompletat</MenuItem>
                <MenuItem value="DRAFT">Ciornă</MenuItem>
                <MenuItem value="COMPLETED">Completat</MenuItem>
              </TextField>
            )}
          </>
        }
        footer={rows.length > 0 ? <TablePager pager={pager} label="clienți" /> : undefined}
      >
        {loading && rows.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={24} sx={{ color: 'var(--rl-text-muted)' }} />
          </Box>
        )}
        {error && <Box sx={{ p: 2, color: 'var(--rl-red-text)', fontSize: 13 }}>{error}</Box>}
        {!loading && !error && rows.length === 0 && (
          <Box sx={{ py: 5, textAlign: 'center', color: 'var(--rl-text-muted)', fontSize: 13 }}>{search ? 'Niciun client nu corespunde căutării.' : 'Niciun client în această categorie.'}</Box>
        )}
        {page.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ ...panelTableSx, minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2 }}>Client</TableCell>
                  <TableCell>Stare</TableCell>
                  {enrolled && <TableCell>Profil fiscal</TableCell>}
                  <TableCell>Plan</TableCell>
                  <TableCell>Abonament</TableCell>
                  <TableCell align="right">Documente</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Activitate</TableCell>
                  <TableCell sx={{ width: 48 }} aria-label="Acțiuni" />
                </TableRow>
              </TableHead>
              <TableBody>
                {page.map((row) => {
                  const status = statusBadge(row)
                  const fiscal = FISCAL_LABEL[row.fiscalProfileStatus] ?? FISCAL_LABEL.NOT_STARTED
                  const name = row.userName || row.fullName || 'PFA fără nume'
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      tabIndex={0}
                      role="link"
                      aria-label={`Deschide dosarul ${name}`}
                      onClick={() => onOpen(row)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') onOpen(row)
                      }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ pl: 2 }}>
                        <PersonCell name={name} meta={[row.userEmail, row.phone].filter(Boolean).join(' · ')} />
                      </TableCell>
                      <TableCell>
                        <Badge toneName={status.tone}>{status.label}</Badge>
                      </TableCell>
                      {enrolled && (
                        <TableCell>{row.deletedAtUtc ? <Box component="span" sx={{ color: 'var(--rl-text-subtle)' }}>—</Box> : <Badge toneName={fiscal.tone}>{fiscal.label}</Badge>}</TableCell>
                      )}
                      <TableCell>{planLabel(row)}</TableCell>
                      <TableCell>{subscriptionLabel(row.subscriptionStatus)}</TableCell>
                      <TableCell align="right">{row.documentCount}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: 'var(--rl-text-muted)', whiteSpace: 'nowrap' }}>{activityLabel(row)}</TableCell>
                      <TableCell align="right" sx={{ pr: 1 }}>
                        <RowActions
                          label={`Acțiuni pentru ${name}`}
                          actions={[
                            { label: 'Deschide dosarul', onClick: () => onOpen(row) },
                            { label: 'Intră în contul clientului', onClick: () => onImpersonate(row), disabled: row.status.toLowerCase() !== 'approved' },
                            ...(enrolled ? [{ label: row.deletedAtUtc ? 'Redeschide contul' : 'Închide contul', onClick: () => onAccountAction(row), danger: !row.deletedAtUtc }] : []),
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataPanel>
    </Box>
  )
}
