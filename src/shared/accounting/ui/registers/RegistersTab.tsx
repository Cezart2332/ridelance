import { Fragment, useState } from 'react'
import {
  Box,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { KeyboardArrowDown, KeyboardArrowUp, WarningAmberRounded } from '@mui/icons-material'

import { accountingApi } from '../../api/accountingApi'
import type { RefRow } from '../../api/types'
import { formatAmount, formatDate, formatPeriod } from '../../format'
import { BANK_CLASSIFICATION_LABEL, REF_STATUS, REGISTER_EXCEPTION_LABEL } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock } from '../components'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { downloadBlob, useApi } from '../useApi'
import { AssetsCard } from './AssetsCard'
import { InventoryCard } from './InventoryCard'
import { RegisterStatusBar } from './RegisterStatusBar'
import { YearCard } from './YearCard'
import { exportName } from './exportName'
import { ExportButtons, YearSelect } from './registerParts'

const cell = (value: number) => (value ? formatAmount(value) : '')

/** Anii pentru selectoare: de la începutul colaborării până la anul curent al dosarului. */
function yearsOf(startDate: string, lastYear: number): number[] {
  const first = Number(startDate.slice(0, 4))
  return Array.from({ length: lastYear - first + 1 }, (_, index) => lastYear - index)
}

function RjipCard({ summary, year, version }: DossierTabProps & { year: number; version: number }) {
  const { busy, run } = useAction()
  const [onlyExceptions, setOnlyExceptions] = useState(false)
  const [mode, setMode] = useState<'year' | 'month' | 'custom'>('year')
  const [month, setMonth] = useState(summary.currentPeriod)
  const [from, setFrom] = useState(`${year}-01-01`)
  const [to, setTo] = useState(`${year}-12-31`)
  const monthEnd = (period: string) => {
    const [y, m] = period.split('-').map(Number)
    return `${period}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  }
  const range =
    mode === 'year' ? { from: `${year}-01-01`, to: `${year}-12-31` } : mode === 'month' ? { from: `${month}-01`, to: monthEnd(month) } : { from, to }
  const rjip = useApi(() => accountingApi.registers.getRjip(summary.id, range), [summary.id, range.from, range.to, version])
  const data = rjip.data
  const totals = new Map((data?.monthTotals ?? []).map((total) => [total.period, total]))
  const periods = [...new Set((data?.rows ?? []).map((row) => row.date.slice(0, 7)))]

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h2">Registrul-jurnal de încasări și plăți</Typography>
          <ExportButtons
            csv
            busy={busy !== null}
            onExport={(format) =>
              run('rjip', async () => {
                const blob = await accountingApi.registers.exportRjip(summary.id, range, format)
                downloadBlob(blob, exportName(`RJIP_${summary.cui}_${range.from}_${range.to}`, blob, format))
              })
            }
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
          <TextField select size="small" label="Interval" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} sx={{ minWidth: 160 }}>
            <MenuItem value="year">Anul {year}</MenuItem>
            <MenuItem value="month">O lună</MenuItem>
            <MenuItem value="custom">Interval</MenuItem>
          </TextField>
          {mode === 'month' && (
            <TextField type="month" size="small" label="Luna" value={month} onChange={(event) => setMonth(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          )}
          {mode === 'custom' && (
            <>
              <TextField type="date" size="small" label="De la" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" size="small" label="Până la" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </>
          )}
          <FormControlLabel
            control={<Switch size="small" checked={onlyExceptions} onChange={(event) => setOnlyExceptions(event.target.checked)} />}
            label="Doar excepții"
          />
        </Stack>
      </Stack>
      {rjip.error && <ErrorBlock message={rjip.error} onRetry={rjip.reload} />}
      {!data && !rjip.error && <LoadingBlock />}
      {data && data.rows.length === 0 && (
        <Stack sx={{ px: 2.5, pb: 2.5 }}>
          <EmptyText>Nicio operațiune în interval.</EmptyText>
        </Stack>
      )}
      {data && data.rows.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto', maxHeight: 480 }}>
          <Table size="small" stickyHeader sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>Nr. crt.</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Document</TableCell>
                <TableCell sx={{ minWidth: 240 }}>Explicații</TableCell>
                <TableCell align="right">Încasări numerar</TableCell>
                <TableCell align="right">Încasări bancă</TableCell>
                <TableCell align="right">Plăți numerar</TableCell>
                <TableCell align="right">Plăți bancă</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.map((period) => {
                const total = totals.get(period)
                return (
                  <Fragment key={period}>
                    {data.rows
                      .filter((row) => row.date.startsWith(period) && (!onlyExceptions || row.exception))
                      .map((row, index) => (
                        <TableRow key={`${row.ledgerEntryId}-${index}`} sx={row.exception ? { bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06) } : undefined}>
                          <TableCell sx={{ color: 'text.secondary' }}>{row.no ?? ''}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.document}</TableCell>
                          <TableCell>
                            <Tooltip title={row.bankDetails ?? ''} disableHoverListener={!row.bankDetails} enterTouchDelay={0}>
                              <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                                {row.exception && <WarningAmberRounded fontSize="small" color="warning" aria-hidden />}
                                <span>{row.operation}</span>
                              </Stack>
                            </Tooltip>
                            {row.exception && (
                              <Typography variant="caption" color="warning.dark" component="div">
                                {row.proposal ? `Propunere: ${BANK_CLASSIFICATION_LABEL[row.proposal]}` : REGISTER_EXCEPTION_LABEL[row.exception]}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{cell(row.cashIn)}</TableCell>
                          <TableCell align="right">{cell(row.bankIn)}</TableCell>
                          <TableCell align="right">{cell(row.cashOut)}</TableCell>
                          <TableCell align="right">{cell(row.bankOut)}</TableCell>
                        </TableRow>
                      ))}
                    {total && !onlyExceptions && (
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 600 }}>
                          Total {formatPeriod(period)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.cashIn)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.bankIn)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.cashOut)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.bankOut)}</TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

/** Un rând REF cu drill-down până la înregistrări și lunile de amortizare. */
function RefRowView({ row }: { row: RefRow }) {
  const [open, setOpen] = useState(false)
  const contributions = row.contributions ?? []
  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 48 }}>
          {contributions.length > 0 && (
            <IconButton size="small" aria-label={open ? 'Ascunde detaliile' : 'Arată detaliile'} onClick={() => setOpen((value) => !value)}>
              {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>{row.calculationElement}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(row.value)}</TableCell>
      </TableRow>
      {contributions.length > 0 && (
        <TableRow>
          <TableCell colSpan={3} sx={{ p: 0, borderBottom: open ? undefined : 'none' }}>
            <Collapse in={open} unmountOnExit>
              <Box sx={{ maxHeight: 320, overflowY: 'auto', px: 2, py: 1 }}>
                <Table size="small">
                  <TableBody>
                    {contributions.map((item, index) => (
                      <TableRow key={`${item.ledgerEntryId ?? item.assetId}-${index}`}>
                        <TableCell sx={{ whiteSpace: 'nowrap', width: 110 }}>{formatDate(item.date)}</TableCell>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align="right">{formatAmount(item.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function RefCard({ summary, year }: DossierTabProps & { year: number }) {
  const { busy, run } = useAction()
  const ref = useApi(() => accountingApi.registers.getRef(summary.id, year), [summary.id, year])
  const data = ref.data

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h2">Registrul de evidență fiscală {year}</Typography>
            {data && (
              <AccountingBadge
                descriptor={data.status === 'INTERMEDIATE' ? { ...REF_STATUS.INTERMEDIATE, label: `Situație intermediară la ${formatDate(data.asOf)}` } : REF_STATUS[data.status]}
              />
            )}
          </Stack>
          <ExportButtons
            busy={busy !== null}
            onExport={(format) =>
              run('ref', async () => {
                const blob = await accountingApi.registers.exportRef(summary.id, year, format, data?.asOf ?? undefined)
                downloadBlob(blob, exportName(`REF_${summary.cui}_${year}`, blob, format))
              })
            }
          />
        </Stack>
      </Stack>
      {ref.error && <ErrorBlock message={ref.error} onRetry={ref.reload} />}
      {!data && !ref.error && <LoadingBlock />}
      {data && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Element de calcul</TableCell>
                <TableCell align="right">Valoare</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((row) => (
                <RefRowView key={row.calculationElement} row={row} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

/** Tabul „Registre”: starea, RJIP, REF, activele, inventarul și anul contabil (spec registre §3–§8). */
export function RegistersTab(props: DossierTabProps) {
  const lastYear = Number(props.summary.currentPeriod.slice(0, 4))
  const years = yearsOf(props.summary.engagement.startDate, lastYear)
  const [year, setYear] = useState(years[0])
  const [version, setVersion] = useState(0)
  const changed = () => setVersion((value) => value + 1)

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <YearSelect years={years} year={year} onChange={setYear} />
        <RegisterStatusBar pfaId={props.summary.id} year={year} version={version} readOnly={props.summary.readOnly} onChanged={changed} />
      </Stack>
      <RjipCard key={`rjip-${year}`} {...props} year={year} version={version} />
      <RefCard key={`ref-${year}-${version}`} {...props} year={year} />
      <AssetsCard {...props} onChanged={changed} />
      <InventoryCard {...props} year={year} onChanged={changed} />
      <YearCard key={`year-${year}-${version}`} {...props} year={year} onChanged={changed} />
    </Stack>
  )
}
