import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CssBaseline,
  LinearProgress,
  MenuItem,
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
import { ThemeProvider } from '@mui/material/styles'

import { Section, StatusBadge } from '../../../components/admin'
import { adminTheme } from '../../../theme/adminTheme'
import { accountingApi, accountingApiMode } from '../api/accountingApi'
import { resetMockAccountingDb } from '../api/mock/mockAccountingApi'
import type {
  AccountingPeriod,
  DeclarationSummary,
  DeclarationType,
  Job,
  LedgerEntry,
  PeriodOverview,
  PfaAccountingSettings,
  PfaAccountingSummary,
  PfaListItem,
  PlatformDocumentListItem,
  SupplierTaxProfile,
  VatRate,
  D100Rule,
  ExpenseCategoryRule,
} from '../api/types'
import { DECLARATION_TYPES } from '../api/types'
import { EMPTY, formatDate, formatLei, formatMoney, formatPeriod, formatRate, formatValidity } from '../format'
import {
  ACCOUNTING_PERIOD_STATUS,
  CASH_REGISTER_STATUS,
  DECLARATION_STATUS,
  DEDUCTIBILITY_TYPE_LABEL,
  ENGAGEMENT_STATUS,
  JOB_STATUS,
  JOB_TYPE_LABEL,
  LEDGER_ENTRY_STATUS,
  LEDGER_SOURCE_LABEL,
  LEDGER_TRANSACTION_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
  PFA_MONTH_STATUS,
  PLATFORM_DOCUMENT_STATUS,
  PLATFORM_DOCUMENT_TYPE_LABEL,
  PLATFORM_LABEL,
  type StatusDescriptor,
} from '../statusLabels'

/**
 * Pagina de debug a fundației (spec F0): afișează fixtures prin `accountingApi`, fără să știe ce
 * implementare rulează. Montată doar în dev (`/dev/contabilitate`), nu intră în bundle-ul de producție.
 */

const PERIOD = '2026-08'

function Badge({ descriptor }: { descriptor: StatusDescriptor | null }) {
  return descriptor ? <StatusBadge label={descriptor.label} tone={descriptor.tone} /> : <Typography variant="body2">{EMPTY}</Typography>
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Eroare neașteptată.'
}

// ---------------------------------------------------------------------------------------------
// Luna fiscală
// ---------------------------------------------------------------------------------------------

function MonthSection({ version, onChanged }: { version: number; onChanged: () => void }) {
  const [overview, setOverview] = useState<PeriodOverview | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)

  // `version` crește după fiecare job și la reset: atunci se reîncarcă tabelul.
  useEffect(() => {
    let cancelled = false
    accountingApi.months.getOverview(PERIOD).then(
      (result) => !cancelled && setOverview(result),
      (loadError) => !cancelled && setError(errorText(loadError)),
    )
    return () => {
      cancelled = true
    }
  }, [version])

  const run = async (start: () => Promise<{ jobId: string }>) => {
    setError(null)
    try {
      const { jobId } = await start()
      for (;;) {
        const current = await accountingApi.jobs.get(jobId)
        setJob(current)
        if (current.status === 'COMPLETED' || current.status === 'FAILED') break
      }
      onChanged()
    } catch (runError) {
      setError(errorText(runError))
    }
  }

  const running = job !== null && (job.status === 'QUEUED' || job.status === 'RUNNING')
  const rows = overview?.rows ?? []
  const canGenerate = rows.some((row) => row.status === 'READY' && row.declarations.D100.declarationId === null)
  const canValidate = rows.some((row) => DECLARATION_TYPES.some((type) => row.declarations[type].status === 'GENERATED'))

  return (
    <Section
      title={`Luna fiscală: ${formatPeriod(PERIOD)}`}
      action={
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={running} onClick={() => run(() => accountingApi.months.process(PERIOD))}>
            Procesează luna
          </Button>
          <Button variant="outlined" disabled={running || !canGenerate} onClick={() => run(() => accountingApi.months.generate(PERIOD))}>
            Generează declarațiile
          </Button>
          <Button variant="outlined" disabled={running || !canValidate} onClick={() => run(() => accountingApi.months.validate(PERIOD))}>
            Validează toate
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {overview && (
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Total ${overview.stats.total}`} />
            <Chip label={`Gata ${overview.stats.ready}`} />
            <Chip label={`Necesită verificare ${overview.stats.needsReview}`} />
            <Chip label={`Document lipsă ${overview.stats.missingDocuments}`} />
            <Chip label={`Neprocesate ${overview.stats.notProcessed}`} />
          </Stack>
        )}
        {job && (
          <Stack spacing={1}>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              <Typography variant="subtitle2">{JOB_TYPE_LABEL[job.type]}</Typography>
              <Badge descriptor={JOB_STATUS[job.status]} />
              <Typography variant="body2" color="text.secondary">
                {job.progress.done} / {job.progress.total}
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={job.progress.total ? (job.progress.done / job.progress.total) * 100 : 100} />
            {job.status === 'COMPLETED' && job.errors.length > 0 && (
              <Alert severity="warning">
                {job.errors.map((item) => `${item.pfaName}: ${item.message}`).join(' · ')}
              </Alert>
            )}
          </Stack>
        )}
        {!overview && !error && <LinearProgress />}
        {overview && (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
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
                  <TableRow key={row.pfaId}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.pfaName}
                      </Typography>
                      {row.blockingReasons[0] && (
                        <Typography variant="caption" color="text.secondary">
                          {row.blockingReasons[0]}
                        </Typography>
                      )}
                    </TableCell>
                    {[row.bolt, row.uber].map((figures, index) => (
                      <TableCell key={index}>
                        {figures ? (
                          <>
                            <Typography variant="body2">{formatLei(figures.income)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              comision {formatLei(figures.commission)}
                            </Typography>
                          </>
                        ) : (
                          EMPTY
                        )}
                      </TableCell>
                    ))}
                    {DECLARATION_TYPES.map((type: DeclarationType) => {
                      const cell = row.declarations[type]
                      return (
                        <TableCell key={type}>
                          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                            <Typography variant="body2">{formatLei(cell.amount)}</Typography>
                            <Badge descriptor={cell.status ? DECLARATION_STATUS[cell.status] : null} />
                          </Stack>
                        </TableCell>
                      )
                    })}
                    <TableCell>
                      <Badge descriptor={PFA_MONTH_STATUS[row.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------
// Dosar PFA
// ---------------------------------------------------------------------------------------------

interface PfaDetails {
  summary: PfaAccountingSummary
  settings: PfaAccountingSettings
  documents: PlatformDocumentListItem[]
  declarations: DeclarationSummary[]
  ledger: LedgerEntry[]
  ledgerTotal: number
  periods: AccountingPeriod[]
}

function PfaSection({ pfas, version }: { pfas: PfaListItem[]; version: number }) {
  const [pfaId, setPfaId] = useState<string>('')
  const [details, setDetails] = useState<PfaDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedId = pfaId || pfas.find((pfa) => pfa.name === 'Andrei Dumitrescu')?.id || pfas[0]?.id || ''

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    const load = async () => {
      try {
        const [summary, settings, documents, declarations, ledger, periods] = await Promise.all([
          accountingApi.pfas.getSummary(selectedId),
          accountingApi.pfas.getSettings(selectedId),
          accountingApi.documents.list(selectedId, PERIOD),
          accountingApi.declarations.list(selectedId, PERIOD),
          accountingApi.ledger.list(selectedId, { pageSize: 50 }),
          accountingApi.periods.list(selectedId),
        ])
        if (!cancelled) {
          setDetails({ summary, settings, documents, declarations, ledger: ledger.items, ledgerTotal: ledger.total, periods })
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) setError(errorText(loadError))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [selectedId, version])

  const summary = details?.summary

  return (
    <Section
      title="Dosar PFA"
      action={
        <TextField select label="PFA" value={selectedId} onChange={(event) => setPfaId(event.target.value)} sx={{ minWidth: 260 }}>
          {pfas.map((pfa) => (
            <MenuItem key={pfa.id} value={pfa.id}>
              {pfa.name} · {ENGAGEMENT_STATUS[pfa.engagementStatus].label}
            </MenuItem>
          ))}
        </TextField>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {!details && !error && <LinearProgress />}
        {summary && details && (
          <>
            {summary.readOnly && (
              <Alert severity="info">
                Dosar inactiv, doar consultare. Păstrare obligatorie până la {formatDate(summary.retentionUntil)}.
              </Alert>
            )}
            <Stack direction="row" sx={{ gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="body2">CUI {summary.cui}</Typography>
              <Typography variant="body2">
                Art. 317: {summary.art317 ? `Da, din ${formatDate(summary.art317ActivationDate)}` : 'Nu'}
              </Typography>
              <Typography variant="body2">Platforme: {summary.platforms.map((platform) => PLATFORM_LABEL[platform]).join(', ') || EMPTY}</Typography>
              <Typography variant="body2">
                Colaborare: {formatValidity(summary.engagement.startDate, summary.engagement.endDate)}
              </Typography>
              <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                <Typography variant="body2">Cash:</Typography>
                <Badge descriptor={CASH_REGISTER_STATUS[summary.cash.status]} />
              </Stack>
              <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                <Typography variant="body2">{formatPeriod(summary.currentPeriod)}:</Typography>
                <Badge descriptor={PFA_MONTH_STATUS[summary.currentMonthStatus]} />
              </Stack>
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Documente platformă ({formatPeriod(PERIOD)})
              </Typography>
              {details.documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Niciun document.
                </Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fișier</TableCell>
                        <TableCell>Tip</TableCell>
                        <TableCell>Sumă</TableCell>
                        <TableCell>Verificări picate</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.documents.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>{document.fileName}</TableCell>
                          <TableCell>
                            {PLATFORM_DOCUMENT_TYPE_LABEL[document.documentType]}
                            {document.platform ? ` ${PLATFORM_LABEL[document.platform]}` : ''}
                          </TableCell>
                          <TableCell>{formatMoney(document.mainAmount, document.currency)}</TableCell>
                          <TableCell>{document.failedChecks}</TableCell>
                          <TableCell>
                            <Badge descriptor={PLATFORM_DOCUMENT_STATUS[document.status]} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Stack direction="row" sx={{ gap: 3, flexWrap: 'wrap' }}>
              {details.declarations.map((declaration) => (
                <Stack key={declaration.type} spacing={0.5}>
                  <Typography variant="subtitle2">{declaration.type}</Typography>
                  <Typography variant="body2">
                    {declaration.type === 'D390' && declaration.amount !== null ? '0 lei, doar raportare' : formatLei(declaration.amount)}
                  </Typography>
                  <Badge descriptor={declaration.status ? DECLARATION_STATUS[declaration.status] : null} />
                </Stack>
              ))}
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Setări contabilitate (istoric)
              </Typography>
              <Stack spacing={0.5}>
                {details.settings.history.map((entry) => (
                  <Typography key={entry.id} variant="body2">
                    {entry.key}: {JSON.stringify(entry.value)} · {formatValidity(entry.validFrom, entry.validTo)} · {entry.note}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Tranzacții ({details.ledgerTotal})
              </Typography>
              {details.ledger.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Fără tranzacții în fixtures.
                </Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Document</TableCell>
                        <TableCell>Sursă</TableCell>
                        <TableCell>Contrapartidă</TableCell>
                        <TableCell>Tip</TableCell>
                        <TableCell>Metodă</TableCell>
                        <TableCell align="right">Sumă</TableCell>
                        <TableCell>Deductibil</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.ledger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell>{entry.documentLabel}</TableCell>
                          <TableCell>{LEDGER_SOURCE_LABEL[entry.source]}</TableCell>
                          <TableCell>{entry.counterparty ?? EMPTY}</TableCell>
                          <TableCell>{LEDGER_TRANSACTION_TYPE_LABEL[entry.transactionType]}</TableCell>
                          <TableCell>{PAYMENT_METHOD_LABEL[entry.paymentMethod]}</TableCell>
                          <TableCell align="right">{formatLei(entry.amount)}</TableCell>
                          <TableCell>
                            {entry.deductibilityType ? (
                              <Typography variant="body2">
                                {formatLei(entry.deductibleAmount)}
                                <Typography component="span" variant="caption" color="text.secondary">
                                  {' '}
                                  {DEDUCTIBILITY_TYPE_LABEL[entry.deductibilityType]}
                                </Typography>
                              </Typography>
                            ) : (
                              EMPTY
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge descriptor={LEDGER_ENTRY_STATUS[entry.status]} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Perioade contabile
              </Typography>
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                {details.periods.map((period) => (
                  <StatusBadge
                    key={period.period}
                    label={`${period.period} · ${ACCOUNTING_PERIOD_STATUS[period.status].label}`}
                    tone={ACCOUNTING_PERIOD_STATUS[period.status].tone}
                  />
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------
// Reguli fiscale
// ---------------------------------------------------------------------------------------------

interface Rules {
  suppliers: SupplierTaxProfile[]
  vatRates: VatRate[]
  d100: D100Rule[]
  categories: ExpenseCategoryRule[]
}

function RulesSection({ version }: { version: number }) {
  const [rules, setRules] = useState<Rules | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [suppliers, vatRates, d100, categories] = await Promise.all([
        accountingApi.rules.suppliers.list(),
        accountingApi.rules.vatRates.list(),
        accountingApi.rules.d100.list(),
        accountingApi.rules.expenseCategories.list(),
      ])
      if (!cancelled) setRules({ suppliers, vatRates, d100, categories })
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [version])

  return (
    <Section title="Reguli fiscale">
      {!rules ? (
        <LinearProgress />
      ) : (
        <Stack spacing={2}>
          {rules.suppliers.map((supplier) => (
            <Typography key={supplier.id} variant="body2">
              {supplier.supplierName} · {supplier.country} · {supplier.vatId} · D100 {formatRate(supplier.d100Rate)}
              {supplier.d100RateConfirmed ? '' : ' (neconfirmată)'} · {formatValidity(supplier.validFrom, supplier.validTo)} · certificat{' '}
              {supplier.residenceCertValidTo ? formatValidity(supplier.residenceCertValidFrom ?? '', supplier.residenceCertValidTo) : EMPTY}
            </Typography>
          ))}
          <Typography variant="body2">
            TVA: {rules.vatRates.map((rate) => `${formatRate(rate.rate)} ${formatValidity(rate.validFrom, rate.validTo)}`).join(' · ')}
          </Typography>
          {rules.d100.map((rule) => (
            <Typography key={rule.id} variant="body2">
              {rule.code} · {rule.enabled ? 'activă' : 'dezactivată'}
              {rule.pendingConfirmation ? ' · DE CONFIRMAT' : ''}
            </Typography>
          ))}
          <Typography variant="body2">
            Categorii: {rules.categories.map((category) => `${category.label} (${DEDUCTIBILITY_TYPE_LABEL[category.defaultDeductibility]}${category.vehicleRelated ? ', auto' : ''})`).join(' · ')}
          </Typography>
        </Stack>
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------

export default function AccountingDebugPage() {
  const [pfas, setPfas] = useState<PfaListItem[]>([])
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    void accountingApi.pfas.list().then((items) => {
      if (!cancelled) setPfas(items)
    })
    return () => {
      cancelled = true
    }
  }, [version])

  const reset = () => {
    resetMockAccountingDb()
    setVersion((current) => current + 1)
  }

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
        <Stack spacing={3} sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Stack direction="row" sx={{ gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h1">Contabilitate PFA: fixtures</Typography>
              <Typography variant="body2" color="text.secondary">
                Pagină de debug, doar în dev. Datele vin prin accountingApi, implementarea „{accountingApiMode}”.
              </Typography>
            </Box>
            {accountingApiMode === 'mock' && (
              <Button variant="outlined" onClick={reset}>
                Resetează fixtures
              </Button>
            )}
          </Stack>
          <MonthSection version={version} onChanged={() => setVersion((current) => current + 1)} />
          <PfaSection pfas={pfas} version={version} />
          <RulesSection version={version} />
        </Stack>
      </Box>
    </ThemeProvider>
  )
}
