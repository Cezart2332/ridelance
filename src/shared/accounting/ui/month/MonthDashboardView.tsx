import { useState } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { DECLARATION_TYPES, type OverviewRow, type Period, type PlatformMonthFigures } from '../../api/types'
import { EMPTY, formatLei, formatPeriod } from '../../format'
import { DECLARATION_STATUS, PFA_MONTH_STATUS } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAccountingNav } from '../navigation'
import { useAction } from '../notify'
import { useApi } from '../useApi'
import { JobProgress } from './JobProgress'
import { useJobRunner } from './useJobRunner'

/** Ultimele 12 luni, până la `last` inclusiv, cea mai recentă prima. */
function recentPeriods(last: Period): Period[] {
  const [year, month] = last.split('-').map(Number)
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, month - 1 - index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

/** Un rând e excepție dacă nu e gata sau dacă o declarație a picat ori a fost respinsă. */
function isException(row: OverviewRow): boolean {
  return (
    row.status !== 'READY' ||
    DECLARATION_TYPES.some((type) => {
      const status = row.declarations[type].status
      return status === 'VALIDATION_FAILED' || status === 'REJECTED'
    })
  )
}

/** Motivul afișat sub nume: blocarea din pre-check sau declarația care a picat / a fost respinsă. */
function firstReason(row: OverviewRow): string | null {
  if (row.blockingReasons[0]) return row.blockingReasons[0]
  const failed = DECLARATION_TYPES.find((type) => row.declarations[type].status === 'VALIDATION_FAILED')
  if (failed) return `${failed}: validarea a picat.`
  const rejected = DECLARATION_TYPES.find((type) => row.declarations[type].status === 'REJECTED')
  return rejected ? `${rejected}: respinsă.` : null
}

function Figures({ figures }: { figures: PlatformMonthFigures | null }) {
  if (!figures) return <>{EMPTY}</>
  return (
    <>
      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
        {formatLei(figures.income)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        comision {formatLei(figures.commission)}
      </Typography>
    </>
  )
}

function Stat({ label, value, active, onClick }: { label: string; value: number | undefined; active?: boolean; onClick?: () => void }) {
  return (
    <Paper
      component={onClick ? 'button' : 'div'}
      onClick={onClick}
      sx={{
        p: 2,
        textAlign: 'left',
        font: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'primary.light' : 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">{value ?? EMPTY}</Typography>
    </Paper>
  )
}

/** F3: luna fiscală pe toate PFA-urile — procesare, confirmare, generare, validare. */
export function MonthDashboardView() {
  const nav = useAccountingNav()
  const { busy, run } = useAction()
  const reference = useApi(() => accountingApi.pfas.list({ status: 'active' }), [])
  const currentPeriod = reference.data?.[0]?.currentPeriod ?? null
  const period = nav.period ?? currentPeriod
  const overview = useApi(() => (period ? accountingApi.months.getOverview(period) : Promise.resolve(null)), [period])
  const jobs = useJobRunner(overview.reload)
  const [statusFilter, setStatusFilter] = useState<OverviewRow['status'] | null>(null)

  if (!period) return reference.error ? <ErrorBlock message={reference.error} onRetry={reference.reload} /> : <LoadingBlock />

  const data = overview.data
  const rows = (data?.rows ?? [])
    .filter((row) => !nav.onlyExceptions || isException(row))
    .filter((row) => !statusFilter || row.status === statusFilter)
  const canGenerate = data?.rows.some((row) => row.status === 'READY' && DECLARATION_TYPES.every((type) => row.declarations[type].declarationId === null)) ?? false
  const canValidate = data?.rows.some((row) => DECLARATION_TYPES.some((type) => row.declarations[type].status === 'GENERATED')) ?? false
  const disabled = jobs.running || busy !== null

  const toggleStatus = (status: OverviewRow['status']) => setStatusFilter((current) => (current === status ? null : status))

  const openRow = (row: OverviewRow) =>
    nav.openPfa(row.pfaId, row.status === 'READY' ? 'declaratii' : 'documente', { luna: period })

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', alignItems: { md: 'flex-end' } }}>
        <Stack spacing={0.5}>
          <Typography variant="h1">Declarații · {formatPeriod(period)}</Typography>
          <Typography variant="body2" color="text.secondary">
            D100, D301 și D390 pentru toate PFA-urile active în lună.
          </Typography>
        </Stack>
        <TextField select label="Luna" value={period} onChange={(event) => nav.openMonth(event.target.value, nav.onlyExceptions)} sx={{ minWidth: 200 }}>
          {recentPeriods(currentPeriod ?? period).map((option) => (
            <MenuItem key={option} value={option}>
              {formatPeriod(option)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
        <Stat label="Total" value={data?.stats.total} active={statusFilter === null} onClick={() => setStatusFilter(null)} />
        <Stat label="Gata" value={data?.stats.ready} active={statusFilter === 'READY'} onClick={() => toggleStatus('READY')} />
        <Stat label="Necesită verificare" value={data?.stats.needsReview} active={statusFilter === 'NEEDS_REVIEW'} onClick={() => toggleStatus('NEEDS_REVIEW')} />
        <Stat label="Document lipsă" value={data?.stats.missingDocuments} active={statusFilter === 'MISSING_DOCUMENTS'} onClick={() => toggleStatus('MISSING_DOCUMENTS')} />
        <Stat label="Neprocesate" value={data?.stats.notProcessed} active={statusFilter === 'NOT_PROCESSED'} onClick={() => toggleStatus('NOT_PROCESSED')} />
      </Box>

      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" disabled={disabled} onClick={() => jobs.start(() => accountingApi.months.process(period))}>
              Procesează luna
            </Button>
            <Button
              variant="outlined"
              disabled={disabled || !data || data.stats.needsReview === 0}
              onClick={() =>
                run('confirm', async () => {
                  const result = await accountingApi.months.confirmCleanDocuments(period)
                  overview.reload()
                  return result
                }, 'Documentele fără probleme au fost confirmate.')
              }
            >
              {busy === 'confirm' ? 'Se confirmă…' : 'Confirmă documentele fără probleme'}
            </Button>
            <Button variant="outlined" disabled={disabled || !canGenerate} onClick={() => jobs.start(() => accountingApi.months.generate(period))}>
              Generează declarațiile
            </Button>
            <Button variant="outlined" disabled={disabled || !canValidate} onClick={() => jobs.start(() => accountingApi.months.validate(period))}>
              Validează toate
            </Button>
          </Stack>
          {jobs.job && <JobProgress job={jobs.job} onClose={jobs.clear} />}
        </Stack>
      </Paper>

      <Paper>
        <Stack direction="row" sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h2">PFA-uri</Typography>
          <FormControlLabel
            control={<Switch checked={nav.onlyExceptions} onChange={(event) => nav.openMonth(period, event.target.checked)} />}
            label="Doar excepții"
          />
        </Stack>
        {overview.error && <ErrorBlock message={overview.error} onRetry={overview.reload} />}
        {!data && !overview.error && <LoadingBlock />}
        {data && rows.length === 0 && (
          <Stack sx={{ px: 2.5 }}>
            <EmptyText>{nav.onlyExceptions || statusFilter ? 'Nicio excepție în filtrul curent.' : 'Niciun PFA activ în această lună.'}</EmptyText>
          </Stack>
        )}
        {rows.length > 0 && (
          <TableContainer sx={{ overflowX: 'auto', opacity: overview.loading ? 0.6 : 1 }}>
            <Table sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell>PFA</TableCell>
                  <TableCell>Bolt</TableCell>
                  <TableCell>Uber</TableCell>
                  {DECLARATION_TYPES.map((type) => (
                    <TableCell key={type}>{type}</TableCell>
                  ))}
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.pfaId}
                    hover
                    tabIndex={0}
                    role="link"
                    aria-label={`Deschide dosarul ${row.pfaName}`}
                    onClick={() => openRow(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') openRow(row)
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.pfaName}
                      </Typography>
                      {firstReason(row) && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          {firstReason(row)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Figures figures={row.bolt} />
                    </TableCell>
                    <TableCell>
                      <Figures figures={row.uber} />
                    </TableCell>
                    {DECLARATION_TYPES.map((type) => {
                      const cell = row.declarations[type]
                      return (
                        <TableCell key={type}>
                          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                              {cell.amount === null ? EMPTY : formatLei(cell.amount)}
                            </Typography>
                            <AccountingBadge descriptor={cell.status ? DECLARATION_STATUS[cell.status] : null} />
                          </Stack>
                        </TableCell>
                      )
                    })}
                    <TableCell>
                      <AccountingBadge descriptor={PFA_MONTH_STATUS[row.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  )
}
