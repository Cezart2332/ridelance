import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
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
import { alpha } from '@mui/material/styles'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { TOKENS } from '../../../../constants/tokens'
import {
  adminOverviewService,
  type AdminOverviewData,
  type AdminOverviewFilters,
  type AdminOverviewPfaCard,
  type AdminPaymentRow,
  type AdminPlanFilter,
  type AdminProductFilter,
  type AdminRevenueType,
  type AdminServiceSaleRow,
} from '../../../../services/adminOverview.service'

interface AdminOverviewViewProps {
  onImpersonate: (userId: string) => void
  onOpenPfaDetails: (pfa: AdminOverviewPfaCard) => void
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(TOKENS.paper, 0.92),
    borderRadius: TOKENS.radius.md,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

const initialFilters: AdminOverviewFilters = {
  periodPreset: 'current_month',
  revenueType: '',
  product: '',
  paymentStatus: '',
  plan: '',
  city: '',
  partner: '',
}

function formatLei(bani: number | null | undefined) {
  const value = (bani ?? 0) / 100
  return `${value.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} lei`
}

function formatDate(utc: string | null | undefined) {
  if (!utc) return '—'
  return new Date(utc).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusColor(status: string) {
  const s = status.toLowerCase()
  if (s.includes('reuș') || s.includes('activ') || s.includes('plătit') || s === 'paid') return '#047857'
  if (s.includes('eșuat') || s.includes('blocaj') || s.includes('suspend') || s.includes('past')) return '#dc2626'
  if (s.includes('pending') || s.includes('aștept') || s.includes('verificare') || s.includes('trial')) return '#b45309'
  if (s.includes('refund') || s.includes('anulat')) return '#64748b'
  return TOKENS.primaryStrong
}

function StatusChip({ status }: { status: string }) {
  const color = statusColor(status)
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 800,
        fontSize: '0.68rem',
        color,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.22)}`,
      }}
    />
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 900, color: TOKENS.ink, lineHeight: 1.2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.4 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  color = TOKENS.primaryStrong,
}: {
  label: string
  value: string | number
  helper?: string | null
  icon: React.ReactNode
  color?: string
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
        bgcolor: TOKENS.paper,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ color: TOKENS.ink, fontWeight: 950, mt: 0.7, wordBreak: 'break-word' }}>
            {value}
          </Typography>
          {helper && (
            <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 650 }}>
              {helper}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: TOKENS.radius.md,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            color,
            bgcolor: alpha(color, 0.1),
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  )
}

function SmallStatList({ items }: { items: Array<{ label: string; value: number; helper?: string | null }> }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            p: 1.4,
            borderRadius: TOKENS.radius.md,
            bgcolor: alpha(TOKENS.surface, 0.75),
            border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
          }}
        >
          <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800 }}>
            {item.label}
          </Typography>
          <Typography variant="h6" sx={{ color: TOKENS.ink, fontWeight: 950, lineHeight: 1.2 }}>
            {item.value.toLocaleString('ro-RO')}
          </Typography>
          {item.helper && (
            <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
              {item.helper}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

function PaymentsTable({ rows, failedOnly = false }: { rows: AdminPaymentRow[]; failedOnly?: boolean }) {
  if (rows.length === 0) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography sx={{ color: TOKENS.textMuted }}>
          {failedOnly ? 'Nu există plăți eșuate pentru filtrul curent.' : 'Nu există plăți pentru filtrul curent.'}
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(TOKENS.surface, 0.7) }}>
            {['Client', 'Produs / serviciu', 'Tip plată', 'Sumă', 'Status', 'Data', 'Metodă plată'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 850, color: TOKENS.textMuted }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={{ '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) } }}>
              <TableCell sx={{ fontWeight: 750 }}>{row.client}</TableCell>
              <TableCell>{row.productOrService}</TableCell>
              <TableCell>{row.paymentType}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{formatLei(row.amountBani)}</TableCell>
              <TableCell><StatusChip status={row.status} /></TableCell>
              <TableCell>{formatDate(row.dateUtc)}</TableCell>
              <TableCell>{row.paymentMethod}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ServicesTable({ rows }: { rows: AdminServiceSaleRow[] }) {
  if (rows.length === 0) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography sx={{ color: TOKENS.textMuted }}>Nu există servicii individuale pentru filtrul curent.</Typography>
      </Box>
    )
  }

  return (
    <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(TOKENS.surface, 0.7) }}>
            {['Client', 'Serviciu', 'Preț', 'Status plată', 'Status livrare', 'Responsabil', 'Data comandă'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 850, color: TOKENS.textMuted }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} sx={{ '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) } }}>
              <TableCell sx={{ fontWeight: 750 }}>{row.client}</TableCell>
              <TableCell>{row.service}</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>{formatLei(row.priceBani)}</TableCell>
              <TableCell><StatusChip status={row.paymentStatus} /></TableCell>
              <TableCell><StatusChip status={row.deliveryStatus} /></TableCell>
              <TableCell>{row.responsible}</TableCell>
              <TableCell>{formatDate(row.orderedAtUtc)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function DataPaper({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        boxShadow: TOKENS.shadow.sm,
        overflow: 'hidden',
        bgcolor: TOKENS.paper,
      }}
    >
      {children}
    </Paper>
  )
}

export function AdminOverviewView({ onImpersonate, onOpenPfaDetails }: AdminOverviewViewProps) {
  const [filters, setFilters] = useState<AdminOverviewFilters>(initialFilters)
  const [data, setData] = useState<AdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminOverviewService.getOverview(filters)
      setData(result)
    } catch {
      setError('Nu s-au putut încărca datele pentru overview-ul admin.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadOverview()
    }, 0)
    return () => window.clearTimeout(loadTimer)
  }, [loadOverview])

  const updateFilter = <K extends keyof AdminOverviewFilters>(key: K, value: AdminOverviewFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const operationalCards = useMemo(() => {
    if (!data) return []
    return [
      {
        label: 'PFA-uri active',
        value: data.pfaStats.active.toLocaleString('ro-RO'),
        helper: `${data.pfaStats.newRequests.toLocaleString('ro-RO')} cereri noi`,
        icon: <PeopleAltRoundedIcon />,
        color: '#047857',
      },
      {
        label: 'Anunțuri auto plătite',
        value: data.carStats.paidActive.toLocaleString('ro-RO'),
        helper: `${formatLei(data.carStats.monthlyRevenueBani)} lunar`,
        icon: <DirectionsCarFilledRoundedIcon />,
        color: '#0f766e',
      },
      {
        label: 'Servicii one-time',
        value: data.serviceSales.length.toLocaleString('ro-RO'),
        helper: formatLei(data.financialKpis.oneTimeCurrentMonthRevenueBani),
        icon: <ReceiptLongRoundedIcon />,
        color: '#7c3aed',
      },
      {
        label: 'Atenție plăți',
        value: data.financialKpis.failedPayments.toLocaleString('ro-RO'),
        helper: 'plăți eșuate',
        icon: <ErrorOutlineRoundedIcon />,
        color: '#dc2626',
      },
    ]
  }, [data])

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
          boxShadow: TOKENS.shadow.sm,
          background: `linear-gradient(135deg, ${TOKENS.paper} 0%, ${alpha(TOKENS.primary, 0.08)} 100%)`,
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'flex-end' } }}>
          <Box sx={{ maxWidth: 620 }}>
            <Typography variant="overline" sx={{ color: TOKENS.textSubtle, fontWeight: 900, letterSpacing: 1 }}>
              Acasă admin
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950, color: TOKENS.ink, mt: 0.5, mb: 1 }}>
              Acasă
            </Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted, maxWidth: 560 }}>
              Finanțe, abonamente, servicii și alerte importante într-un ecran mai ușor de scanat.
            </Typography>
          </Box>

          {data && !loading && (
            <Box sx={{ minWidth: { xs: '100%', sm: 360 }, p: 2.2, borderRadius: TOKENS.radius.lg, bgcolor: alpha(TOKENS.paper, 0.82), border: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: TOKENS.radius.md, display: 'grid', placeItems: 'center', bgcolor: alpha('#0f766e', 0.1), color: '#0f766e' }}>
                  <AccountBalanceWalletRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 850 }}>Venit luna curentă</Typography>
                  <Typography variant="h4" sx={{ color: TOKENS.ink, fontWeight: 950, fontVariantNumeric: 'tabular-nums' }}>
                    {formatLei(data.financialKpis.totalCurrentMonthRevenueBani)}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                {[
                  ['Recurent', formatLei(data.financialKpis.estimatedMonthlyRecurringRevenueBani)],
                  ['One-time', formatLei(data.financialKpis.oneTimeCurrentMonthRevenueBani)],
                  ['Comisioane', formatLei(data.financialKpis.partnerCommissionsBani)],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ p: 1, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.surface, 0.7) }}>
                    <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800 }}>{label}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: TOKENS.ink, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 1.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.06)}`, boxShadow: TOKENS.shadow.sm, bgcolor: alpha(TOKENS.paper, 0.88) }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
          <TextField select size="small" label="Perioadă" value={filters.periodPreset} onChange={(e) => updateFilter('periodPreset', e.target.value as AdminOverviewFilters['periodPreset'])} sx={inputSx}>
            <MenuItem value="today">Azi</MenuItem>
            <MenuItem value="7d">7 zile</MenuItem>
            <MenuItem value="current_month">Luna curentă</MenuItem>
            <MenuItem value="last_month">Luna trecută</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </TextField>
          {filters.periodPreset === 'custom' && (
            <>
              <TextField size="small" type="date" label="De la" value={filters.dateFrom ?? ''} onChange={(e) => updateFilter('dateFrom', e.target.value)} sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Până la" value={filters.dateTo ?? ''} onChange={(e) => updateFilter('dateTo', e.target.value)} sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />
            </>
          )}
          <TextField select size="small" label="Tip venit" value={filters.revenueType ?? ''} onChange={(e) => updateFilter('revenueType', e.target.value as AdminRevenueType)} sx={inputSx}>
            <MenuItem value="">Toate</MenuItem>
            <MenuItem value="recurring">Recurent</MenuItem>
            <MenuItem value="one_time">One-time</MenuItem>
            <MenuItem value="commission">Comision</MenuItem>
          </TextField>
          <TextField select size="small" label="Produs" value={filters.product ?? ''} onChange={(e) => updateFilter('product', e.target.value as AdminProductFilter)} sx={inputSx}>
            <MenuItem value="">Toate</MenuItem>
            <MenuItem value="pfa">PFA</MenuItem>
            <MenuItem value="cars">Anunțuri auto</MenuItem>
            <MenuItem value="services">Servicii</MenuItem>
            <MenuItem value="partners">Parteneri</MenuItem>
          </TextField>
          <TextField select size="small" label="Status plată" value={filters.paymentStatus ?? ''} onChange={(e) => updateFilter('paymentStatus', e.target.value as AdminOverviewFilters['paymentStatus'])} sx={inputSx}>
            <MenuItem value="">Toate</MenuItem>
            <MenuItem value="succeeded">Reușită</MenuItem>
            <MenuItem value="failed">Eșuată</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="refund">Refund</MenuItem>
          </TextField>
          <TextField select size="small" label="Plan" value={filters.plan ?? ''} onChange={(e) => updateFilter('plan', e.target.value as AdminPlanFilter)} sx={inputSx}>
            <MenuItem value="">Toate</MenuItem>
            <MenuItem value="solo">Solo</MenuItem>
            <MenuItem value="start">Start</MenuItem>
            <MenuItem value="pro">Pro</MenuItem>
          </TextField>
          <TextField size="small" label="Oraș" value={filters.city ?? ''} onChange={(e) => updateFilter('city', e.target.value)} sx={inputSx} />
          <TextField size="small" label="Partener" value={filters.partner ?? ''} onChange={(e) => updateFilter('partner', e.target.value)} sx={inputSx} />
        </Box>
      </Paper>

      {loading && (
        <Stack sx={{ py: 8, alignItems: 'center' }}>
          <CircularProgress size={34} sx={{ color: TOKENS.primary }} />
        </Stack>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {data && !loading && (
        <>
          {data.isFallback && (
            <Alert severity="info" sx={{ borderRadius: TOKENS.radius.md }}>
              Endpointul dedicat `/admin/overview` nu este disponibil încă. Afișez un overview parțial din endpointurile existente.
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            {operationalCards.map((card) => <MetricCard key={card.label} {...card} />)}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 2 }}>
            <DataPaper>
              <Box sx={{ p: 2.5 }}>
                <SectionTitle title="Venituri pe categorii" subtitle="Sursele principale de bani din platformă." />
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {data.revenueCategories.map((category) => (
                    <Box key={category.label}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.7 }}>
                        <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 800 }}>{category.label}</Typography>
                        <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 900 }}>{formatLei(category.amountBani)}</Typography>
                      </Stack>
                      <Box sx={{ height: 8, borderRadius: TOKENS.radius.full, bgcolor: alpha(TOKENS.ink, 0.06), overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.min(100, Math.max(3, category.amountBani / Math.max(1, data.financialKpis.totalCurrentMonthRevenueBani) * 100))}%`, height: '100%', bgcolor: TOKENS.primaryStrong }} />
                      </Box>
                      {category.count != null && (
                        <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>{category.count.toLocaleString('ro-RO')} elemente</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </DataPaper>

            <DataPaper>
              <Box sx={{ p: 2.5 }}>
                <SectionTitle title="Abonamente active" subtitle="PFA-uri recurente și anunțuri auto lunare." />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>PFA-uri</Typography>
                <SmallStatList items={data.pfaSubscriptions} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mt: 2, mb: 1 }}>Anunțuri auto</Typography>
                <SmallStatList items={data.carSubscriptions} />
              </Box>
            </DataPaper>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
            <DataPaper>
              <Box sx={{ p: 2.5 }}>
                <SectionTitle title="Mașini și lead-uri" subtitle="Doar ce contează pentru venitul recurent auto." />
                <Stack spacing={1.4} sx={{ mt: 2 }}>
                  {[
                    ['Listate total', data.carStats.totalListed.toLocaleString('ro-RO')],
                    ['Active plătite', data.carStats.paidActive.toLocaleString('ro-RO')],
                    ['În verificare', data.carStats.pendingReview.toLocaleString('ro-RO')],
                    ['Plată eșuată', data.carStats.failedPayment.toLocaleString('ro-RO')],
                    ['Lead-uri generate', data.carStats.leadsGenerated.toLocaleString('ro-RO')],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </DataPaper>

            <DataPaper>
              <Box sx={{ p: 2.5 }}>
                <SectionTitle title="PFA-uri și blocaje" subtitle="Volum activ și situații care cer follow-up." />
                <Stack spacing={1.4} sx={{ mt: 2 }}>
                  {[
                    ['Înscrise total', data.pfaStats.totalEnrolled.toLocaleString('ro-RO')],
                    ['Active', data.pfaStats.active.toLocaleString('ro-RO')],
                    ['Cereri noi', data.pfaStats.newRequests.toLocaleString('ro-RO')],
                    ['Blocaj client', data.pfaStats.clientBlocked.toLocaleString('ro-RO')],
                    ['Plată eșuată', data.pfaStats.failedPayment.toLocaleString('ro-RO')],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </DataPaper>
          </Box>

          <DataPaper>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
              <SectionTitle title="Plăți recente" subtitle="Ultimele tranzacții din platformă." />
            </Box>
            <PaymentsTable rows={data.recentPayments} />
          </DataPaper>

          <DataPaper>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`, bgcolor: alpha('#dc2626', 0.04) }}>
              <SectionTitle title="Plăți eșuate" subtitle="Risc direct de pierdere venit. Necesită follow-up rapid." />
            </Box>
            <PaymentsTable rows={data.failedPayments} failedOnly />
          </DataPaper>

          <DataPaper>
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
              <SectionTitle title="Servicii individuale vândute" subtitle="Start Ride, deschidere PFA, sediu social, casă de marcat, atestat / partener și consultanță." />
            </Box>
            <ServicesTable rows={data.serviceSales} />
          </DataPaper>

          <Box>
            <SectionTitle title="PFA-uri înrolate" subtitle="Cardurile operaționale pentru clienții PFA activi sau în lucru." />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 2, mt: 2 }}>
              {data.enrolledPfas.map((pfa) => (
                <Paper key={pfa.id} elevation={0} sx={{ p: 2.25, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.07)}`, boxShadow: 'none', bgcolor: TOKENS.paper, '&:hover': { borderColor: alpha(TOKENS.primary, 0.35), boxShadow: TOKENS.shadow.sm } }}>
                  <Stack spacing={1.4}>
                    <Stack direction="row" spacing={1.4} sx={{ alignItems: 'flex-start' }}>
                      <Avatar variant="rounded" sx={{ width: 40, height: 40, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.primary, 0.12), color: TOKENS.primaryStrong, fontWeight: 900 }}>
                        {pfa.companyName.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 950, color: TOKENS.ink, lineHeight: 1.2 }} noWrap title={pfa.companyName}>
                          {pfa.companyName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TOKENS.textMuted, display: 'block' }} noWrap title={pfa.holderName}>
                          {pfa.holderName}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                      {[pfa.plan, pfa.subscriptionStatus, pfa.currentMonthStatus].map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          size="small"
                          sx={{ height: 24, borderRadius: TOKENS.radius.sm, bgcolor: alpha(TOKENS.ink, 0.04), color: TOKENS.ink, fontSize: '0.68rem', fontWeight: 800 }}
                        />
                      ))}
                    </Stack>

                    <Divider sx={{ borderColor: alpha(TOKENS.ink, 0.06) }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                      {[
                        ['Email', pfa.email],
                        ['Telefon', pfa.phone],
                        ['Cont', pfa.accountStatus],
                        ['Activitate', pfa.lastActivityLabel],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 750 }}>{label}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: TOKENS.ink, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button fullWidth variant="contained" onClick={() => onOpenPfaDetails(pfa)} endIcon={<OpenInNewRoundedIcon />} sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 850 }}>
                        Vezi detalii
                      </Button>
                      <Button fullWidth variant="outlined" onClick={() => onImpersonate(pfa.userId)} startIcon={<LoginRoundedIcon />}>
                        Intră în dashboard client
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {data.enrolledPfas.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: TOKENS.radius.lg, border: `1px dashed ${alpha(TOKENS.ink, 0.16)}` }}>
                  <Typography sx={{ color: TOKENS.textMuted }}>Nu există PFA-uri înrolate pentru filtrul curent.</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        </>
      )}

    </Stack>
  )
}
