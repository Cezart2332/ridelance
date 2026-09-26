import { Fragment, useState } from 'react'
import {
  Button,
  MenuItem,
  Paper,
  Stack,
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
import type { Asset, AssetInput, ExportFormat } from '../../api/types'
import { EMPTY, formatAmount, formatDate, formatPeriod, parseAmount } from '../../format'
import { REF_STATUS } from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { downloadBlob, useApi } from '../useApi'

const cell = (value: number) => (value ? formatAmount(value) : '')

/** Anii pentru selectoare: de la începutul colaborării până la anul curent al dosarului. */
function yearsOf(startDate: string, lastYear: number): number[] {
  const first = Number(startDate.slice(0, 4))
  return Array.from({ length: lastYear - first + 1 }, (_, index) => lastYear - index)
}

function ExportButtons({ onExport, busy }: { onExport: (format: ExportFormat) => void; busy: boolean }) {
  return (
    <Stack direction="row" sx={{ gap: 1 }}>
      <Button size="small" variant="outlined" disabled={busy} onClick={() => onExport('pdf')}>
        Export PDF
      </Button>
      <Button size="small" variant="outlined" disabled={busy} onClick={() => onExport('xlsx')}>
        Export Excel
      </Button>
    </Stack>
  )
}

/** Extensia după conținut: exportul „Excel” al mock-ului e CSV. */
function exportName(base: string, blob: Blob, format: ExportFormat): string {
  return `${base}.${blob.type.startsWith('text/csv') ? 'csv' : format}`
}

function RjipCard({ summary, years }: DossierTabProps & { years: number[] }) {
  const { busy, run } = useAction()
  const [mode, setMode] = useState<'year' | 'custom'>('year')
  const [year, setYear] = useState(years[0])
  const [from, setFrom] = useState(`${years[0]}-01-01`)
  const [to, setTo] = useState(`${years[0]}-12-31`)
  const range = mode === 'year' ? { from: `${year}-01-01`, to: `${year}-12-31` } : { from, to }
  const rjip = useApi(() => accountingApi.registers.getRjip(summary.id, range), [summary.id, range.from, range.to])
  const data = rjip.data
  const totals = new Map((data?.monthTotals ?? []).map((total) => [total.period, total]))
  const periods = [...new Set((data?.rows ?? []).map((row) => row.date.slice(0, 7)))]

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack spacing={0.25}>
            <Typography variant="h2">Registrul-jurnal de încasări și plăți</Typography>
            <Typography variant="caption" color="text.secondary">
              Model 14-1-1/b · sumele efectiv încasate sau plătite · coloanele exacte OMFP 170/2015 DE CONFIRMAT
            </Typography>
          </Stack>
          <ExportButtons
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
          <TextField select label="Interval" value={mode} onChange={(event) => setMode(event.target.value as 'year' | 'custom')} sx={{ minWidth: 160 }}>
            <MenuItem value="year">An</MenuItem>
            <MenuItem value="custom">Interval custom</MenuItem>
          </TextField>
          {mode === 'year' ? (
            <TextField select label="An" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ minWidth: 120 }}>
              {years.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <>
              <TextField type="date" label="De la" value={from} onChange={(event) => setFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="date" label="Până la" value={to} onChange={(event) => setTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </>
          )}
        </Stack>
      </Stack>
      {rjip.error && <ErrorBlock message={rjip.error} onRetry={rjip.reload} />}
      {!data && !rjip.error && <LoadingBlock />}
      {data && data.rows.length === 0 && (
        <Stack sx={{ px: 2.5 }}>
          <EmptyText>Nicio operațiune în interval.</EmptyText>
        </Stack>
      )}
      {data && data.rows.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto', maxHeight: 480 }}>
          <Table size="small" stickyHeader sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Felul operațiunii</TableCell>
                <TableCell align="right">Încasări numerar</TableCell>
                <TableCell align="right">Plăți numerar</TableCell>
                <TableCell align="right">Încasări bancă</TableCell>
                <TableCell align="right">Plăți bancă</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {periods.map((period) => {
                const total = totals.get(period)
                return (
                  <Fragment key={period}>
                    {data.rows
                      .filter((row) => row.date.startsWith(period))
                      .map((row) => (
                        <TableRow key={row.ledgerEntryId}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
                          <TableCell>{row.document}</TableCell>
                          <TableCell>{row.operation}</TableCell>
                          <TableCell align="right">{cell(row.cashIn)}</TableCell>
                          <TableCell align="right">{cell(row.cashOut)}</TableCell>
                          <TableCell align="right">{cell(row.bankIn)}</TableCell>
                          <TableCell align="right">{cell(row.bankOut)}</TableCell>
                        </TableRow>
                      ))}
                    {total && (
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                          Total {formatPeriod(period)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.cashIn)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.cashOut)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatAmount(total.bankIn)}</TableCell>
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

function RefCard({ summary, years }: DossierTabProps & { years: number[] }) {
  const { busy, run } = useAction()
  const [year, setYear] = useState(years[0])
  const ref = useApi(() => accountingApi.registers.getRef(summary.id, year), [summary.id, year])
  const data = ref.data

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack spacing={0.25}>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h2">Registrul de evidență fiscală</Typography>
              {data && (
                <AccountingBadge
                  descriptor={
                    data.status === 'INTERMEDIATE' ? { ...REF_STATUS.INTERMEDIATE, label: `Situație intermediară la ${formatDate(data.asOf)}` } : REF_STATUS[data.status]
                  }
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Model OMFP 3254/2017 · sumele deductibile · denumirile elementelor de calcul DE CONFIRMAT
            </Typography>
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
        <TextField select label="An" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ maxWidth: 160 }}>
          {years.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {ref.error && <ErrorBlock message={ref.error} onRetry={ref.reload} />}
      {!data && !ref.error && <LoadingBlock />}
      {data && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>An</TableCell>
                <TableCell>Rectificare</TableCell>
                <TableCell>Categoria venitului</TableCell>
                <TableCell>Element de calcul</TableCell>
                <TableCell align="right">Valoare</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.calculationElement}>
                  <TableCell>{row.year}</TableCell>
                  <TableCell>{row.rectification ? 'Da' : 'Nu'}</TableCell>
                  <TableCell>{row.incomeCategory}</TableCell>
                  <TableCell>{row.calculationElement}</TableCell>
                  <TableCell align="right">{formatAmount(row.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

interface AssetForm {
  type: string
  description: string
  acquisitionDate: string
  acquisitionValue: string
  status: Asset['status']
  disposedDate: string
}

const emptyAsset: AssetForm = { type: '', description: '', acquisitionDate: '', acquisitionValue: '', status: 'IN_USE', disposedDate: '' }

function InventoryCard({ summary, years }: DossierTabProps & { years: number[] }) {
  const { busy, run } = useAction()
  const [year, setYear] = useState(years[0])
  const inventory = useApi(() => accountingApi.registers.getInventory(summary.id, year), [summary.id, year])
  const [editing, setEditing] = useState<{ asset: Asset | null; form: AssetForm } | null>(null)
  const data = inventory.data

  const toInput = (form: AssetForm, asset: Asset | null): AssetInput => ({
    type: form.type.trim(),
    description: form.description.trim(),
    acquisitionDate: form.acquisitionDate,
    acquisitionValue: parseAmount(form.acquisitionValue) ?? 0,
    document: asset?.document ?? null,
    status: form.status,
    disposedDate: form.status === 'DISPOSED' ? form.disposedDate || null : null,
  })

  const set = (patch: Partial<AssetForm>) => setEditing((current) => current && { ...current, form: { ...current.form, ...patch } })
  const form = editing?.form
  const valid = Boolean(form && form.type.trim() && form.description.trim() && form.acquisitionDate && parseAmount(form.acquisitionValue) && (form.status === 'IN_USE' || form.disposedDate))

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack spacing={0.25}>
            <Typography variant="h2">Registrul-inventar</Typography>
            <Typography variant="caption" color="text.secondary">
              Model 14-1-2/b · la începutul activității, la sfârșitul anului și la încetare
            </Typography>
          </Stack>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {!summary.readOnly && (
              <Button size="small" variant="contained" onClick={() => setEditing({ asset: null, form: emptyAsset })}>
                Adaugă activ
              </Button>
            )}
            <ExportButtons
              busy={busy !== null}
              onExport={(format) =>
                run('inventory', async () => {
                  const blob = await accountingApi.registers.exportInventory(summary.id, year, format)
                  downloadBlob(blob, exportName(`Registru_inventar_${summary.cui}_${year}`, blob, format))
                })
              }
            />
          </Stack>
        </Stack>
        <TextField select label="An" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ maxWidth: 160 }}>
          {years.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {inventory.error && <ErrorBlock message={inventory.error} onRetry={inventory.reload} />}
      {!data && !inventory.error && <LoadingBlock />}
      {data && data.assets.length === 0 && (
        <Stack sx={{ px: 2.5 }}>
          <EmptyText>Niciun activ în {year}.</EmptyText>
        </Stack>
      )}
      {data && data.assets.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tip</TableCell>
                <TableCell>Descriere</TableCell>
                <TableCell>Achiziție</TableCell>
                <TableCell align="right">Valoare</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.assets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{asset.description}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(asset.acquisitionDate)}</TableCell>
                  <TableCell align="right">{formatAmount(asset.acquisitionValue)}</TableCell>
                  <TableCell>{asset.document?.fileName ?? EMPTY}</TableCell>
                  <TableCell>{asset.status === 'IN_USE' ? 'În folosință' : `Ieșit la ${formatDate(asset.disposedDate)}`}</TableCell>
                  <TableCell align="right">
                    {!summary.readOnly && (
                      <Button
                        size="small"
                        onClick={() =>
                          setEditing({
                            asset,
                            form: {
                              type: asset.type,
                              description: asset.description,
                              acquisitionDate: asset.acquisitionDate,
                              acquisitionValue: formatAmount(asset.acquisitionValue),
                              status: asset.status,
                              disposedDate: asset.disposedDate ?? '',
                            },
                          })
                        }
                      >
                        Modifică
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ReasonDialog
        open={editing !== null}
        title={editing?.asset ? 'Modifică activul' : 'Adaugă activ'}
        requireReason={false}
        showReason={false}
        canSubmit={valid}
        onClose={() => setEditing(null)}
        onSubmit={async () => {
          if (!editing) return
          const input = toInput(editing.form, editing.asset)
          if (editing.asset) await accountingApi.assets.update(summary.id, editing.asset.id, input)
          else await accountingApi.assets.create(summary.id, input)
          inventory.reload()
        }}
      >
        {form && (
          <>
            <TextField label="Tip" value={form.type} onChange={(event) => set({ type: event.target.value })} helperText="De ex. Autoturism, Casă de marcat" />
            <TextField label="Descriere" value={form.description} onChange={(event) => set({ description: event.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField type="date" label="Data achiziției" value={form.acquisitionDate} onChange={(event) => set({ acquisitionDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
              <TextField label="Valoarea achiziției (lei)" value={form.acquisitionValue} onChange={(event) => set({ acquisitionValue: event.target.value })} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
              <TextField select label="Status" value={form.status} onChange={(event) => set({ status: event.target.value as Asset['status'] })} fullWidth>
                <MenuItem value="IN_USE">În folosință</MenuItem>
                <MenuItem value="DISPOSED">Ieșit din patrimoniu</MenuItem>
              </TextField>
              {form.status === 'DISPOSED' && (
                <TextField type="date" label="Data ieșirii" value={form.disposedDate} onChange={(event) => set({ disposedDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
              )}
            </Stack>
          </>
        )}
      </ReasonDialog>
    </Paper>
  )
}

/** F6: tabul „Registre” — RJIP, REF și Registru-inventar, cu previzualizare și export. */
export function RegistersTab(props: DossierTabProps) {
  const lastYear = Number(props.summary.currentPeriod.slice(0, 4))
  const years = yearsOf(props.summary.engagement.startDate, lastYear)
  return (
    <Stack spacing={3}>
      <RjipCard {...props} years={years} />
      <RefCard {...props} years={years} />
      <InventoryCard {...props} years={years} />
    </Stack>
  )
}
