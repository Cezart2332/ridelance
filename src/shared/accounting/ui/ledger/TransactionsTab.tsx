import { Fragment, useRef, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import {
  LEDGER_SOURCES,
  LEDGER_TRANSACTION_TYPES,
  type ExpenseDocumentUploadResult,
  type LedgerEntry,
  type LedgerQuery,
  type LedgerSource,
  type LedgerTransactionType,
  type ZReportUploadResult,
} from '../../api/types'
import { EMPTY, formatAmount, formatDate, formatDateTime, formatLei, formatRate } from '../../format'
import {
  DEDUCTIBILITY_TYPE_LABEL,
  LEDGER_ENTRY_STATUS,
  LEDGER_SOURCE_LABEL,
  LEDGER_TRANSACTION_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
} from '../../statusLabels'
import { AccountingBadge, EmptyText, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAction, useNotify } from '../notify'
import { actionLabel, auditValue, changedFields } from '../pfa/auditLabels'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useApi } from '../useApi'
import { LedgerEntryForm } from './LedgerEntryForm'
import { emptyLedgerForm, ledgerFormFrom, ledgerFormValues, type LedgerFormValues } from './ledgerForm'
import { PeriodsPanel } from './PeriodsPanel'

const PAGE_SIZE = 25

type EntryDialog = { mode: 'edit' | 'correction'; entry: LedgerEntry } | { mode: 'manual' } | null

/** Detaliile unui rând: documentul justificativ, calculul deductibilității și auditul. */
function EntryDetails({ entry, categoryLabel }: { entry: LedgerEntry; categoryLabel: string | null }) {
  const audit = useApi(() => accountingApi.pfas.getAudit(entry.pfaId, { entity: 'LedgerEntry' }), [entry.pfaId, entry.id, entry.rowVersion])
  const entries = (audit.data ?? []).filter((item) => item.entityId === entry.id)
  const rule = entry.deductibilityRule

  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, py: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Document justificativ</Typography>
        <Typography variant="body2">{entry.documentLabel}</Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.sourceDocumentId ? `Document atașat (${entry.sourceDocumentId})` : 'Fără document atașat'}
          {entry.externalId ? ` · import ${entry.externalId}` : ''}
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Deductibilitate</Typography>
        {entry.transactionType !== 'EXPENSE' ? (
          <Typography variant="body2" color="text.secondary">
            Nu e cheltuială.
          </Typography>
        ) : entry.deductiblePercent !== null && entry.deductibleAmount !== null ? (
          <>
            <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatAmount(Math.abs(entry.amount))} × {formatRate(entry.deductiblePercent)} = {formatAmount(entry.deductibleAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryLabel ?? entry.category}
              {rule?.settingKey === 'vehicle_deductibility'
                ? ` · setarea „deductibilitate cheltuieli auto” valabilă de la ${formatDate(rule.validFrom)}`
                : rule
                  ? ` · regula categoriei, valabilă de la ${formatDate(rule.validFrom)}`
                  : ''}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {entry.deductibilityType === 'SPECIAL_RULE'
              ? 'Regim special (DE CONFIRMAT): nu se aplică procentul auto.'
              : entry.category
                ? 'Lipsește setarea de deductibilitate valabilă la data cheltuielii.'
                : 'Neclasificată: alege categoria.'}
          </Typography>
        )}
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Audit</Typography>
        {entries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {audit.data ? 'Nicio modificare manuală.' : 'Se încarcă…'}
          </Typography>
        ) : (
          entries.map((item) => (
            <Box key={item.id}>
              <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
                {formatDateTime(item.at)} · {actionLabel(item.action)} · {item.user.name}
              </Typography>
              {item.reason && (
                <Typography variant="caption" color="text.secondary" component="div">
                  Motiv: {item.reason}
                </Typography>
              )}
              {changedFields(item.before, item.after)
                .filter((field) => !['rowVersion', 'deductibleAmount', 'deductibilityRule', 'accountingPeriod'].includes(field))
                .map((field) => (
                  <Typography key={field} variant="caption" color="text.secondary" component="div" sx={{ overflowWrap: 'anywhere' }}>
                    {field}: {auditValue(item.before?.[field])} → {auditValue(item.after?.[field])}
                  </Typography>
                ))}
            </Box>
          ))
        )}
      </Stack>
    </Box>
  )
}

/** F6: tranzacțiile (ledger) PFA-ului, cu filtre, verificare, modificare cu motiv, încărcări. */
export function TransactionsTab({ summary, onSummaryChanged }: DossierTabProps) {
  const notify = useNotify()
  const { busy, run } = useAction()
  const readOnly = summary.readOnly
  const [filters, setFilters] = useState<{ from: string; to: string; source: LedgerSource | ''; type: LedgerTransactionType | ''; onlyReview: boolean }>({
    from: '',
    to: '',
    source: '',
    type: '',
    onlyReview: false,
  })
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const [dialog, setDialog] = useState<EntryDialog>(null)
  const [form, setForm] = useState<LedgerFormValues>(emptyLedgerForm(''))
  const [expense, setExpense] = useState<ExpenseDocumentUploadResult | null>(null)
  const [zReport, setZReport] = useState<ZReportUploadResult | null>(null)
  const expenseInput = useRef<HTMLInputElement>(null)
  const zInput = useRef<HTMLInputElement>(null)

  const query: LedgerQuery = {
    from: filters.from || undefined,
    to: filters.to || undefined,
    source: filters.source || undefined,
    type: filters.type || undefined,
    status: filters.onlyReview ? 'NEEDS_REVIEW' : undefined,
    page: page + 1,
    pageSize: PAGE_SIZE,
  }
  const ledger = useApi(() => accountingApi.ledger.list(summary.id, query), [summary.id, JSON.stringify(query)])
  const categories = useApi(() => accountingApi.rules.expenseCategories.list(), [])
  const categoryLabel = (code: string | null) => categories.data?.find((item) => item.category === code)?.label ?? code
  const cashActive = summary.cash.status === 'ACTIVE'

  const setFilter = (next: Partial<typeof filters>) => {
    setFilters((current) => ({ ...current, ...next }))
    setPage(0)
  }

  const changed = () => {
    ledger.reload()
    onSummaryChanged()
  }

  const openDialog = (next: EntryDialog) => {
    setForm(next && 'entry' in next ? ledgerFormFrom(next.entry) : emptyLedgerForm(new Date().toISOString().slice(0, 10)))
    setDialog(next)
  }

  const submitDialog = async (reason: string) => {
    const values = ledgerFormValues(form)
    if (!values) throw new Error('Suma nu e validă.')
    if (dialog?.mode === 'manual') {
      await accountingApi.ledger.createManual(summary.id, { ...values, reason })
      notify('Tranzacția a fost adăugată.', 'success')
    } else if (dialog?.mode === 'edit') {
      await accountingApi.ledger.update(dialog.entry.id, { fields: values, reason })
      notify('Tranzacția a fost modificată.', 'success')
    } else if (dialog?.mode === 'correction') {
      await accountingApi.periods.createCorrection(summary.id, dialog.entry.accountingPeriod, {
        ledgerEntryId: dialog.entry.id,
        change: values,
        reason,
      })
      notify('Corecția controlată a fost înregistrată.', 'success')
    }
    changed()
  }

  const uploadExpense = (file: File) =>
    run('expense', async () => {
      setExpense(await accountingApi.ledger.uploadExpenseDocument(summary.id, file))
    })

  const uploadZ = (file: File) =>
    run('z', async () => {
      const result = await accountingApi.ledger.uploadZReport(summary.id, file)
      setZReport(result)
      changed()
    })

  const data = ledger.data
  const formValid = ledgerFormValues(form) !== null && form.description.trim() !== '' && form.date !== ''

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, flexWrap: 'wrap' }}>
            <TextField type="date" label="De la" value={filters.from} onChange={(event) => setFilter({ from: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField type="date" label="Până la" value={filters.to} onChange={(event) => setFilter({ to: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select label="Sursă" value={filters.source} onChange={(event) => setFilter({ source: event.target.value as LedgerSource | '' })} sx={{ minWidth: 160 }}>
              <MenuItem value="">Toate</MenuItem>
              {LEDGER_SOURCES.map((source) => (
                <MenuItem key={source} value={source}>
                  {LEDGER_SOURCE_LABEL[source]}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Tip" value={filters.type} onChange={(event) => setFilter({ type: event.target.value as LedgerTransactionType | '' })} sx={{ minWidth: 160 }}>
              <MenuItem value="">Toate</MenuItem>
              {LEDGER_TRANSACTION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {LEDGER_TRANSACTION_TYPE_LABEL[type]}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Switch checked={filters.onlyReview} onChange={(event) => setFilter({ onlyReview: event.target.checked })} />}
              label="Doar de verificat"
            />
          </Stack>
          {!readOnly && (
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => openDialog({ mode: 'manual' })}>
                Adaugă manual
              </Button>
              <Button variant="outlined" disabled={busy !== null} onClick={() => expenseInput.current?.click()}>
                {busy === 'expense' ? 'Se citește…' : 'Încarcă document cheltuială'}
              </Button>
              {cashActive && (
                <Button variant="outlined" disabled={busy !== null} onClick={() => zInput.current?.click()}>
                  {busy === 'z' ? 'Se citește…' : 'Încarcă raport Z'}
                </Button>
              )}
              <input
                ref={expenseInput}
                hidden
                type="file"
                accept="application/pdf,.pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void uploadExpense(file)
                }}
              />
              <input
                ref={zInput}
                hidden
                type="file"
                accept="application/pdf,.pdf,image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void uploadZ(file)
                }}
              />
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper>
        {ledger.error && <ErrorBlock message={ledger.error} onRetry={ledger.reload} />}
        {!data && !ledger.error && <LoadingBlock />}
        {data && data.items.length === 0 && (
          <Stack sx={{ px: 2.5 }}>
            <EmptyText>Nicio tranzacție pentru filtrele alese.</EmptyText>
          </Stack>
        )}
        {data && data.items.length > 0 && (
          <>
            <TableContainer sx={{ overflowX: 'auto', opacity: ledger.loading ? 0.6 : 1 }}>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Dată</TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell>Sursă</TableCell>
                    <TableCell>Contrapartidă</TableCell>
                    <TableCell>Descriere</TableCell>
                    <TableCell>Tip</TableCell>
                    <TableCell>Metodă</TableCell>
                    <TableCell align="right">Sumă</TableCell>
                    <TableCell align="right">Deductibil</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((entry) => {
                    const expanded = open === entry.id
                    const locked = entry.status === 'LOCKED'
                    return (
                      <Fragment key={entry.id}>
                        <TableRow hover>
                          <TableCell padding="checkbox">
                            <IconButton size="small" aria-label={expanded ? 'Ascunde detaliile' : 'Arată detaliile'} onClick={() => setOpen(expanded ? null : entry.id)}>
                              <ExpandMoreRoundedIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
                              {locked && (
                                <Tooltip title="Lună închisă">
                                  <LockRoundedIcon fontSize="inherit" color="action" aria-label="Lună închisă" />
                                </Tooltip>
                              )}
                              {formatDate(entry.date)}
                            </Stack>
                          </TableCell>
                          <TableCell>{entry.documentLabel}</TableCell>
                          <TableCell>{LEDGER_SOURCE_LABEL[entry.source]}</TableCell>
                          <TableCell>{entry.counterparty ?? EMPTY}</TableCell>
                          <TableCell>
                            {entry.description}
                            {entry.category && (
                              <Typography variant="caption" color="text.secondary" component="div">
                                {categoryLabel(entry.category)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{LEDGER_TRANSACTION_TYPE_LABEL[entry.transactionType]}</TableCell>
                          <TableCell>{PAYMENT_METHOD_LABEL[entry.paymentMethod]}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {formatLei(entry.amount)}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {entry.deductibleAmount !== null ? formatLei(entry.deductibleAmount) : EMPTY}
                            {entry.deductibilityType && (
                              <Typography variant="caption" color="text.secondary" component="div">
                                {DEDUCTIBILITY_TYPE_LABEL[entry.deductibilityType]}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <AccountingBadge descriptor={LEDGER_ENTRY_STATUS[entry.status]} />
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {!readOnly && !locked && entry.status !== 'VERIFIED' && (
                              <Button
                                size="small"
                                disabled={busy !== null}
                                onClick={() =>
                                  run(`verify-${entry.id}`, async () => {
                                    await accountingApi.ledger.verify(entry.id)
                                    changed()
                                  }, 'Tranzacție verificată.')
                                }
                              >
                                Verifică
                              </Button>
                            )}
                            {!readOnly && !locked && (
                              <Button size="small" onClick={() => openDialog({ mode: 'edit', entry })}>
                                Modifică
                              </Button>
                            )}
                            {!readOnly && locked && (
                              <Button size="small" onClick={() => openDialog({ mode: 'correction', entry })}>
                                Corecție controlată
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={12} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
                            <Collapse in={expanded} unmountOnExit>
                              <EntryDetails entry={entry} categoryLabel={categoryLabel(entry.category)} />
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.total}
              page={page}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              onPageChange={(_, next) => setPage(next)}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} din ${count}`}
            />
          </>
        )}
      </Paper>

      <PeriodsPanel summary={summary} onChanged={changed} />

      <ReasonDialog
        open={dialog !== null}
        title={dialog?.mode === 'manual' ? 'Adaugă tranzacție manuală' : dialog?.mode === 'correction' ? 'Corecție controlată' : 'Modifică tranzacția'}
        description={
          dialog?.mode === 'correction' ? (
            <Alert severity="warning">Luna e închisă. Corecția rămâne în istoric, cu motivul ei, iar tranzacția rămâne blocată.</Alert>
          ) : undefined
        }
        reasonLabel={dialog?.mode === 'correction' ? 'Motivul corecției' : 'Motiv'}
        canSubmit={formValid}
        onClose={() => setDialog(null)}
        onSubmit={submitDialog}
      >
        <LedgerEntryForm values={form} categories={categories.data ?? []} onChange={setForm} />
      </ReasonDialog>

      <Dialog open={expense !== null} onClose={() => setExpense(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Document de cheltuială</DialogTitle>
        <DialogContent>
          {expense && (
            <Stack spacing={2}>
              <Typography variant="body2">
                RIDElance a citit: {expense.extracted.merchant ?? 'comerciant necunoscut'}
                {expense.extracted.merchantCui ? ` (CUI ${expense.extracted.merchantCui})` : ''}, {formatDate(expense.extracted.date)},{' '}
                {formatLei(expense.extracted.total)}
                {expense.extracted.items.length > 0 ? ` · ${expense.extracted.items.join(', ')}` : ''}.
              </Typography>
              {expense.proposedMatch ? (
                <Alert severity="info">
                  Potrivire propusă: {formatDate(expense.proposedMatch.date)} · {expense.proposedMatch.counterparty ?? expense.proposedMatch.description} ·{' '}
                  {formatLei(expense.proposedMatch.amount)}. Confirmă dacă documentul justifică această plată.
                </Alert>
              ) : (
                <Alert severity="warning">Nicio tranzacție potrivită. Poți adăuga plata manual.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpense(null)}>Închide</Button>
          {expense?.proposedMatch && (
            <Button
              variant="contained"
              disabled={busy !== null}
              onClick={() =>
                run('match', async () => {
                  await accountingApi.ledger.update(expense.proposedMatch!.id, {
                    fields: { sourceDocumentId: expense.documentId },
                    reason: 'Document de cheltuială atașat (potrivire confirmată)',
                  })
                  setExpense(null)
                  changed()
                }, 'Documentul a fost atașat tranzacției.')
              }
            >
              Confirmă potrivirea
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={zReport !== null} onClose={() => setZReport(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Raport Z</DialogTitle>
        <DialogContent>
          {zReport && (
            <Stack spacing={1}>
              <Typography variant="body2">Data: {formatDate(zReport.extracted.date)}</Typography>
              <Typography variant="body2">Nr. Z: {zReport.extracted.zNumber ?? EMPTY}</Typography>
              <Typography variant="body2">Total: {formatLei(zReport.extracted.total)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Verifică valorile cu raportul; la confirmare, încasarea în numerar intră în registru ca verificată.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZReport(null)}>Mai târziu</Button>
          <Button
            variant="contained"
            disabled={busy !== null}
            onClick={() =>
              run('confirm-z', async () => {
                await accountingApi.ledger.verify(zReport!.ledgerEntry.id)
                setZReport(null)
                changed()
              }, 'Raportul Z a fost confirmat.')
            }
          >
            Confirmă
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
