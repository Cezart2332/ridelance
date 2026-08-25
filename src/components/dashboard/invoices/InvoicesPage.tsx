import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import {
  invoicesService,
  type Invoice,
  type InvoicesOverview,
  type InvoiceStatus,
} from '../../../services/invoices.service'
import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../dashboardTheme'
import { Amount, PageHeader, Panel, StatusChip } from '../ui'
import { NewInvoiceDialog } from './NewInvoiceDialog'
import type { StatusTone } from '../ui'
import { OblioConnectPanel } from './OblioConnectPanel'

/**
 * Facturile emise, citite din contul Oblio al proprietarului.
 *
 * Doar emise. API-ul Oblio nu expune facturile primite — ele există doar în interfața lor,
 * aduse din SPV. Pagina nu pretinde altceva, ca să nu promită un tab care ar rămâne mereu gol.
 *
 * Nimic nu se stochează local: statusul de încasare se citește de fiecare dată din Oblio,
 * fiindcă acolo îl schimbă și contabilul, direct din interfața lor.
 */

const STATUS: Record<InvoiceStatus, { label: string; tone: StatusTone }> = {
  paid: { label: 'Încasată', tone: 'active' },
  partial: { label: 'Parțial', tone: 'warning' },
  unpaid: { label: 'Neîncasată', tone: 'neutral' },
  canceled: { label: 'Anulată', tone: 'error' },
}

const TABS = [
  { id: 'all', label: 'Toate' },
  { id: 'unpaid', label: 'Neîncasate' },
  { id: 'paid', label: 'Încasate' },
  { id: 'canceled', label: 'Anulate' },
] as const

type TabId = (typeof TABS)[number]['id']

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function InvoicesPage() {
  const [data, setData] = useState<InvoicesOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('all')
  const [search, setSearch] = useState('')
  const [composing, setComposing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [busyInvoice, setBusyInvoice] = useState<string | null>(null)

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false

    invoicesService
      .getOverview()
      .then((overview) => {
        if (cancelled) return
        // Un răspuns fără `connection` nu e o pagină goală, e o pagină care crapă: mai departe
        // se citește `connection.connected`. Îl tratăm ca eroare, nu ca date.
        if (!overview?.connection) {
          setError('Răspuns neașteptat de la server.')
          return
        }
        setData(overview)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Nu am putut încărca facturile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const visible = useMemo(() => {
    const invoices = data?.invoices ?? []
    const query = search.trim().toLowerCase()

    return invoices.filter((invoice) => {
      const matchesTab =
        tab === 'all'
          ? true
          : tab === 'unpaid'
            ? invoice.status === 'unpaid' || invoice.status === 'partial'
            : invoice.status === tab

      const matchesQuery =
        !query ||
        invoice.clientName.toLowerCase().includes(query) ||
        `${invoice.seriesName} ${invoice.number}`.toLowerCase().includes(query)

      return matchesTab && matchesQuery
    })
  }, [data, tab, search])

  const collect = async (invoice: Invoice) => {
    const key = `${invoice.seriesName}-${invoice.number}`
    setBusyInvoice(key)
    try {
      // Se încasează restul, nu totalul: o factură parțial plătită are deja o parte înregistrată.
      await invoicesService.collect(
        invoice.seriesName,
        invoice.number,
        invoice.totalBani - invoice.collectedBani,
        'Ordin de plata',
      )
      reload()
    } catch {
      setError('Nu am putut înregistra încasarea.')
    } finally {
      setBusyInvoice(null)
    }
  }

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Skeleton variant="rounded" height={72} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={320} />
      </Stack>
    )
  }

  if (error && !data) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
        <Alert severity="error" sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!data) {
    return null
  }

  const { connection, summary } = data

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Facturi"
        subtitle={
          connection.connected
            ? `Facturile emise pe ${connection.cif}, citite din Oblio.`
            : 'Conectează-ți contul Oblio ca să vezi facturile emise.'
        }
        actions={
          // Apare doar cu contul conectat: fără credențiale n-are pe ce cont să emită.
          connection.connected ? (
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddRoundedIcon />}
              onClick={() => setComposing(true)}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: `${DASHBOARD_TOKENS.radius.md}px` }}
            >
              Factură nouă
            </Button>
          ) : undefined
        }
      />

      {composing && (
        <NewInvoiceDialog
          open
          connection={connection}
          onClose={() => setComposing(false)}
          onIssued={reload}
        />
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: `${DASHBOARD_TOKENS.radius.md}px`, fontWeight: 600 }}>
          {error}
        </Alert>
      )}

      {!connection.connected ? (
        <OblioConnectPanel connection={connection} onChanged={reload} />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Metric
              label="Facturat"
              bani={summary.issuedBani}
              helper={`${summary.issuedCount} ${summary.issuedCount === 1 ? 'factură' : 'facturi'}`}
              accent
            />
            <Metric
              label="Încasat"
              bani={summary.collectedBani}
              helper={`${summary.collectedCount} încasate integral`}
            />
            <Metric
              label="De încasat"
              bani={summary.outstandingBani}
              helper={
                summary.overdueCount > 0
                  ? `${summary.overdueCount} peste scadență`
                  : 'nimic restant'
              }
            />
          </Box>

          <Panel
            title="Facturi emise"
            subtitle="Intervalul implicit e luna trecută și cea curentă."
            action={
              <Tabs
                value={tab}
                onChange={(_, value: TabId) => setTab(value)}
                sx={{
                  minHeight: 0,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    minHeight: 36,
                    color: DASHBOARD_TOKENS.textMuted,
                    '&.Mui-selected': { color: DASHBOARD_TOKENS.primaryStrong },
                  },
                }}
              >
                {TABS.map((t) => (
                  <Tab key={t.id} value={t.id} label={t.label} />
                ))}
              </Tabs>
            }
          >
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după client sau număr…"
              size="small"
              sx={{ ...dashboardInputSx, mb: 2, maxWidth: 320 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchRoundedIcon sx={{ fontSize: 18, color: DASHBOARD_TOKENS.textSubtle, mr: 1 }} />
                  ),
                },
              }}
            />

            {visible.length === 0 ? (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, py: 2 }}>
                {data.invoices.length === 0
                  ? 'Nicio factură emisă în intervalul curent.'
                  : 'Nicio factură nu corespunde filtrelor.'}
              </Typography>
            ) : (
              <Box sx={responsiveTableContainerSx}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <Box component="thead">
                    <Box component="tr">
                      {['Factură', 'Client', 'Emisă', 'Scadență', 'Total', 'Încasat', 'Status', ''].map((h, i) => (
                        <Box component="th" key={h || i} sx={headSx}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {visible.map((invoice) => {
                      const key = `${invoice.seriesName}-${invoice.number}`
                      return (
                        <Box component="tr" key={key}>
                          <Box component="td" sx={{ ...cellSx, fontWeight: 800, fontSize: '0.86rem' }}>
                            {invoice.seriesName} {invoice.number}
                          </Box>
                          <Box component="td" sx={cellSx}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              {invoice.clientName}
                            </Typography>
                            {invoice.clientCif && (
                              <Typography sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textMuted }}>
                                {invoice.clientCif}
                              </Typography>
                            )}
                          </Box>
                          <Box component="td" sx={{ ...cellSx, fontSize: '0.82rem' }}>
                            {formatDate(invoice.issueDate)}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...cellSx,
                              fontSize: '0.82rem',
                              // Scadența depășită e singurul loc din rând unde culoarea spune ceva.
                              color: invoice.overdue ? DASHBOARD_TOKENS.stateError : 'inherit',
                              fontWeight: invoice.overdue ? 800 : 400,
                            }}
                          >
                            {formatDate(invoice.dueDate)}
                          </Box>
                          <Box component="td" sx={cellSx}>
                            <Amount value={invoice.totalBani / 100} unit="lei" size="row" decimals={2} />
                          </Box>
                          <Box component="td" sx={cellSx}>
                            <Amount value={invoice.collectedBani / 100} unit="lei" size="row" decimals={2} />
                          </Box>
                          <Box component="td" sx={cellSx}>
                            <StatusChip
                              label={STATUS[invoice.status].label}
                              tone={STATUS[invoice.status].tone}
                              size="sm"
                              outlined
                            />
                          </Box>
                          <Box component="td" sx={{ ...cellSx, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {invoice.link && (
                              <Tooltip title="Deschide în Oblio">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={invoice.link}
                                  target="_blank"
                                  rel="noopener"
                                  aria-label={`Deschide factura ${key}`}
                                  sx={{ color: DASHBOARD_TOKENS.textMuted }}
                                >
                                  <OpenInNewRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(invoice.status === 'unpaid' || invoice.status === 'partial') && (
                              <Tooltip title="Marchează încasată">
                                <IconButton
                                  size="small"
                                  disabled={busyInvoice === key}
                                  onClick={() => void collect(invoice)}
                                  aria-label={`Marchează încasată factura ${key}`}
                                  sx={{ color: DASHBOARD_TOKENS.accent }}
                                >
                                  <PaidRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            )}
          </Panel>

          <OblioConnectPanel connection={connection} onChanged={reload} />

        </>
      )}
    </Stack>
  )
}

function Metric({ label, bani, helper, accent }: { label: string; bani: number; helper: string; accent?: boolean }) {
  return (
    <Panel dense>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.8 }}>
        <Amount
          value={bani / 100}
          unit="lei"
          size="card"
          decimals={2}
          color={accent ? DASHBOARD_TOKENS.accent : undefined}
        />
      </Box>
      <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.6 }}>
        {helper}
      </Typography>
    </Panel>
  )
}

const headSx = {
  textAlign: 'left' as const,
  py: 1,
  px: 1.2,
  fontSize: '0.75rem',
  fontWeight: 700,
  color: DASHBOARD_TOKENS.textMuted,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
}

const cellSx = {
  py: 1.3,
  px: 1.2,
  borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
  verticalAlign: 'top' as const,
}
