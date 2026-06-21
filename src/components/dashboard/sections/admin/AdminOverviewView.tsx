import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import DiscountRoundedIcon from '@mui/icons-material/DiscountRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { TOKENS } from '../../../../constants/tokens'
import { PfaFiscalSettingsPanel } from '../../../pfa/PfaFiscalSettingsPanel'
import {
  adminOverviewService,
  type AdminOverviewData,
  type AdminOverviewFilters,
  type AdminOverviewPfaCard,
  type AdminPaymentRow,
  type AdminPfaDetail,
  type AdminPlanFilter,
  type AdminProductFilter,
  type AdminRevenueType,
  type AdminServiceSaleRow,
} from '../../../../services/adminOverview.service'

interface AdminOverviewViewProps {
  onImpersonate: (userId: string) => void
  onOpenChat: () => void
}

type DetailAction = 'plan' | 'discount' | 'suspend' | 'reactivate' | 'note' | null

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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const response = (error as { response?: { data?: { detail?: unknown } } }).response
  return typeof response?.data?.detail === 'string' ? response.data.detail : fallback
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

function PfaDetailDialog({
  pfa,
  detail,
  loading,
  error,
  action,
  actionError,
  actionLoading,
  onClose,
  onImpersonate,
  onOpenChat,
  onActionChange,
  onSubmitAction,
}: {
  pfa: AdminOverviewPfaCard | null
  detail: AdminPfaDetail | null
  loading: boolean
  error: string | null
  action: DetailAction
  actionError: string | null
  actionLoading: boolean
  onClose: () => void
  onImpersonate: (userId: string) => void
  onOpenChat: () => void
  onActionChange: (action: DetailAction) => void
  onSubmitAction: (payload: Record<string, string | number | null>) => void
}) {
  const [plan, setPlan] = useState<AdminPlanFilter>('start')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('10')
  const [note, setNote] = useState('')

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setPlan('start')
      setDiscountType('percent')
      setDiscountValue('10')
      setNote(detail?.internalNote ?? '')
    }, 0)
    return () => window.clearTimeout(resetTimer)
  }, [detail?.id, detail?.internalNote, action])

  const active = detail ?? (pfa
    ? {
        id: pfa.id,
        userId: pfa.userId,
        companyName: pfa.companyName,
        holderName: pfa.holderName,
        email: pfa.email,
        phone: pfa.phone,
        accountStatus: pfa.accountStatus,
        plan: pfa.plan,
        subscriptionStatus: pfa.subscriptionStatus,
        registrationType: '—',
        currentMonthStatus: pfa.currentMonthStatus,
        lastActivityLabel: pfa.lastActivityLabel,
        priceBani: null,
        subscriptionStartedAtUtc: null,
        nextPaymentAtUtc: null,
        lastPaymentAtUtc: null,
        failedPayments: 0,
        activeDiscount: null,
        customerAgeLabel: pfa.customerAgeLabel,
        lastProcessedMonth: null,
        missingMonthlyDocuments: 0,
        documentsToReview: 0,
        internalNote: '',
        activityLog: [],
      }
    : null)

  const renderActionFields = () => {
    if (action === 'plan') {
      return (
        <Stack spacing={2}>
          <TextField select label="Plan nou" value={plan} onChange={(e) => setPlan(e.target.value as AdminPlanFilter)} sx={inputSx}>
            <MenuItem value="solo">Solo</MenuItem>
            <MenuItem value="start">Start</MenuItem>
            <MenuItem value="pro">Pro</MenuItem>
          </TextField>
          <TextField select label="Aplicare" defaultValue="next_cycle" sx={inputSx}>
            <MenuItem value="next_cycle">Din următorul ciclu</MenuItem>
            <MenuItem value="immediate">Imediat</MenuItem>
          </TextField>
        </Stack>
      )
    }

    if (action === 'discount') {
      return (
        <Stack spacing={2}>
          <TextField select label="Tip discount" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')} sx={inputSx}>
            <MenuItem value="percent">Procent</MenuItem>
            <MenuItem value="fixed">Sumă fixă</MenuItem>
          </TextField>
          <TextField label="Valoare" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} sx={inputSx} />
          <TextField label="Notă" value={note} onChange={(e) => setNote(e.target.value)} sx={inputSx} />
        </Stack>
      )
    }

    if (action === 'suspend' || action === 'reactivate' || action === 'note') {
      return (
        <TextField
          label={action === 'note' ? 'Note interne' : 'Notă'}
          multiline
          minRows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
          sx={inputSx}
        />
      )
    }

    return null
  }

  const actionTitle = {
    plan: 'Schimbă plan',
    discount: 'Aplică discount',
    suspend: 'Suspendă cont',
    reactivate: 'Reactivează cont',
    note: 'Note interne',
  }[action ?? 'note']

  return (
    <Dialog open={Boolean(pfa)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>
        Detalii client PFA
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading && (
          <Stack sx={{ py: 8, alignItems: 'center' }}>
            <CircularProgress size={30} sx={{ color: TOKENS.primary }} />
          </Stack>
        )}
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
        {active && !loading && (
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: alpha(TOKENS.primary, 0.04) }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.14), color: TOKENS.primaryStrong, fontWeight: 900 }}>
                    {active.companyName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 950, color: TOKENS.ink }}>{active.companyName}</Typography>
                    <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{active.email} · {active.phone}</Typography>
                  </Box>
                </Stack>
                <StatusChip status={active.accountStatus} />
              </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
              {[
                { label: 'Plan abonament', value: active.plan },
                { label: 'Status abonament', value: active.subscriptionStatus },
                { label: 'Tip înregistrare', value: active.registrationType },
                { label: 'Status lună curentă', value: active.currentMonthStatus },
                { label: 'Ultima activitate', value: active.lastActivityLabel },
              ].map((item) => (
                <Box key={item.label} sx={{ p: 1.5, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.surface, 0.82), border: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
                  <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 850 }}>{item.label}</Typography>
                  <Typography sx={{ color: TOKENS.ink, fontWeight: 850 }}>{item.value || '—'}</Typography>
                </Box>
              ))}
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Button variant="contained" startIcon={<LoginRoundedIcon />} onClick={() => onImpersonate(active.userId)} sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 800 }}>
                Autentificare ca utilizator
              </Button>
              <Button variant="outlined" startIcon={<TrendingUpRoundedIcon />} onClick={() => onActionChange('plan')}>Schimbă plan</Button>
              <Button variant="outlined" startIcon={<DiscountRoundedIcon />} onClick={() => onActionChange('discount')}>Aplică discount</Button>
              <Button variant="outlined" startIcon={<PauseCircleOutlineRoundedIcon />} onClick={() => onActionChange('suspend')}>Suspendă cont</Button>
              <Button variant="outlined" startIcon={<PlayCircleOutlineRoundedIcon />} onClick={() => onActionChange('reactivate')}>Reactivează cont</Button>
              <Button variant="outlined" startIcon={<ChatRoundedIcon />} onClick={onOpenChat}>Chat</Button>
            </Stack>

            <PfaFiscalSettingsPanel pfaId={active.id} editable />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
                <SectionTitle title="Abonament & plăți" />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {[
                    ['Plan actual', active.plan],
                    ['Preț', active.priceBani == null ? '—' : formatLei(active.priceBani)],
                    ['Status abonament', active.subscriptionStatus],
                    ['Data început', formatDate(active.subscriptionStartedAtUtc)],
                    ['Următoarea plată', formatDate(active.nextPaymentAtUtc)],
                    ['Ultima plată', formatDate(active.lastPaymentAtUtc)],
                    ['Plăți eșuate', active.failedPayments.toLocaleString('ro-RO')],
                    ['Reducere activă', active.activeDiscount || '—'],
                    ['Istoric plăți', active.customerAgeLabel],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
                <SectionTitle title="Contabilitate" />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {[
                    ['Status lună curentă', active.currentMonthStatus],
                    ['Ultima lună procesată', active.lastProcessedMonth || '—'],
                    ['Documente lunare lipsă', active.missingMonthlyDocuments.toLocaleString('ro-RO')],
                    ['Documente lunare de verificat', active.documentsToReview.toLocaleString('ro-RO')],
                  ].map(([label, value]) => (
                    <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{label}</Typography>
                      <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 800, textAlign: 'right' }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionTitle title="Istoric activitate" />
                </Stack>
                {active.activityLog.length === 0 ? (
                  <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Nu există activitate înregistrată.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {active.activityLog.slice(0, 8).map((event) => (
                      <Box key={event.id}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: TOKENS.ink }}>{event.description}</Typography>
                        <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                          {event.performedBy} · {formatDate(event.createdAtUtc)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <SectionTitle title="Note interne" />
                  <Button size="small" onClick={() => onActionChange('note')}>Editează</Button>
                </Stack>
                <Typography variant="body2" sx={{ color: active.internalNote ? TOKENS.ink : TOKENS.textMuted, whiteSpace: 'pre-wrap' }}>
                  {active.internalNote || 'Nu există note interne pentru acest client.'}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Închide</Button>
      </DialogActions>

      <Dialog open={Boolean(action)} onClose={() => onActionChange(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{actionTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {renderActionFields()}
            {actionError && <Alert severity="error">{actionError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => onActionChange(null)} disabled={actionLoading}>Anulează</Button>
          <Button
            variant="contained"
            disabled={actionLoading}
            onClick={() => {
              if (action === 'plan') onSubmitAction({ plan, effective: 'next_cycle' })
              else if (action === 'discount') onSubmitAction({ type: discountType, value: Number(discountValue), note })
              else onSubmitAction({ note })
            }}
            sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 800 }}
          >
            {actionLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Salvează'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export function AdminOverviewView({ onImpersonate, onOpenChat }: AdminOverviewViewProps) {
  const [filters, setFilters] = useState<AdminOverviewFilters>(initialFilters)
  const [data, setData] = useState<AdminOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPfa, setSelectedPfa] = useState<AdminOverviewPfaCard | null>(null)
  const [pfaDetail, setPfaDetail] = useState<AdminPfaDetail | null>(null)
  const [pfaDetailLoading, setPfaDetailLoading] = useState(false)
  const [pfaDetailError, setPfaDetailError] = useState<string | null>(null)
  const [action, setAction] = useState<DetailAction>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  const openPfaDetail = async (pfa: AdminOverviewPfaCard) => {
    setSelectedPfa(pfa)
    setPfaDetail(null)
    setPfaDetailError(null)
    setPfaDetailLoading(true)
    try {
      const detail = await adminOverviewService.getPfaDetails(pfa.id)
      setPfaDetail(detail)
    } catch {
      setPfaDetailError('Detaliile extinse vor fi disponibile după publicarea endpointului admin. Afișez datele existente din overview.')
    } finally {
      setPfaDetailLoading(false)
    }
  }

  const submitAction = async (payload: Record<string, string | number | null>) => {
    if (!selectedPfa || !action) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (action === 'plan') {
        await adminOverviewService.changePfaPlan(
          selectedPfa.id,
          payload.plan as 'solo' | 'start' | 'pro',
          payload.effective as 'immediate' | 'next_cycle',
        )
      } else if (action === 'discount') {
        await adminOverviewService.applyPfaDiscount(selectedPfa.id, {
          type: payload.type as 'percent' | 'fixed',
          value: Number(payload.value),
          note: String(payload.note ?? ''),
        })
      } else if (action === 'suspend') {
        await adminOverviewService.suspendPfa(selectedPfa.id, String(payload.note ?? ''))
      } else if (action === 'reactivate') {
        await adminOverviewService.reactivatePfa(selectedPfa.id, String(payload.note ?? ''))
      } else if (action === 'note') {
        await adminOverviewService.updatePfaInternalNote(selectedPfa.id, String(payload.note ?? ''))
      }
      setAction(null)
      await loadOverview()
      const detail = await adminOverviewService.getPfaDetails(selectedPfa.id).catch(() => null)
      if (detail) setPfaDetail(detail)
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Acțiunea nu a putut fi salvată. Verifică endpointul backend și încearcă din nou.'))
    } finally {
      setActionLoading(false)
    }
  }

  const financialCards = useMemo(() => {
    if (!data) return []
    return [
      {
        label: 'Venit total luna curentă',
        value: formatLei(data.financialKpis.totalCurrentMonthRevenueBani),
        icon: <AccountBalanceWalletRoundedIcon />,
        color: '#0f766e',
      },
      {
        label: 'Venit recurent lunar estimat',
        value: formatLei(data.financialKpis.estimatedMonthlyRecurringRevenueBani),
        icon: <TrendingUpRoundedIcon />,
        color: '#2563eb',
      },
      {
        label: 'Venit one-time luna curentă',
        value: formatLei(data.financialKpis.oneTimeCurrentMonthRevenueBani),
        icon: <ReceiptLongRoundedIcon />,
        color: '#7c3aed',
      },
      {
        label: 'Comisioane parteneri',
        value: formatLei(data.financialKpis.partnerCommissionsBani),
        icon: <SavingsRoundedIcon />,
        color: '#0891b2',
      },
      {
        label: 'Plăți reușite',
        value: data.financialKpis.successfulPayments.toLocaleString('ro-RO'),
        icon: <CreditCardRoundedIcon />,
        color: '#047857',
      },
      {
        label: 'Plăți eșuate',
        value: data.financialKpis.failedPayments.toLocaleString('ro-RO'),
        icon: <ErrorOutlineRoundedIcon />,
        color: '#dc2626',
      },
    ]
  }, [data])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 950, color: TOKENS.ink, mb: 0.5 }}>
          Overview general platformă RIDElance
        </Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
          Control financiar, abonamente, servicii, anunțuri auto și acțiuni urgente într-un singur panou.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }, gap: 1.5 }}>
            {financialCards.map((card) => <MetricCard key={card.label} {...card} />)}
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              {[
                { label: 'Mașini listate total', value: data.carStats.totalListed, icon: <DirectionsCarFilledRoundedIcon /> },
                { label: 'Anunțuri active plătite', value: data.carStats.paidActive, icon: <CreditCardRoundedIcon />, color: '#047857' },
                { label: 'Anunțuri în verificare', value: data.carStats.pendingReview, icon: <AssignmentTurnedInRoundedIcon />, color: '#b45309' },
                { label: 'Anunțuri cu plată eșuată', value: data.carStats.failedPayment, icon: <ErrorOutlineRoundedIcon />, color: '#dc2626' },
                { label: 'Lead-uri generate', value: data.carStats.leadsGenerated, icon: <PeopleAltRoundedIcon />, color: '#2563eb' },
                { label: 'Venit lunar din anunțuri', value: formatLei(data.carStats.monthlyRevenueBani), icon: <TrendingUpRoundedIcon />, color: '#0f766e' },
              ].map((item) => <MetricCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} />)}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              {[
                { label: 'PFA-uri înscrise total', value: data.pfaStats.totalEnrolled, icon: <PeopleAltRoundedIcon /> },
                { label: 'PFA-uri active', value: data.pfaStats.active, icon: <AssignmentTurnedInRoundedIcon />, color: '#047857' },
                { label: 'Cereri noi', value: data.pfaStats.newRequests, icon: <ReceiptLongRoundedIcon />, color: '#2563eb' },
                { label: 'PFA-uri cu blocaj client', value: data.pfaStats.clientBlocked, icon: <BlockRoundedIcon />, color: '#dc2626' },
                { label: 'PFA-uri inactive', value: data.pfaStats.inactive, icon: <PauseCircleOutlineRoundedIcon />, color: '#64748b' },
                { label: 'PFA-uri plata eșuată', value: data.pfaStats.failedPayment, icon: <ErrorOutlineRoundedIcon />, color: '#dc2626' },
              ].map((item) => <MetricCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} />)}
            </Box>
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
                <Paper key={pfa.id} elevation={0} sx={{ p: 2.5, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm, bgcolor: TOKENS.paper }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.4} sx={{ alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: alpha(TOKENS.primary, 0.14), color: TOKENS.primaryStrong, fontWeight: 900 }}>
                        {pfa.companyName.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 950, color: TOKENS.ink, lineHeight: 1.2 }} title={pfa.companyName}>
                          {pfa.companyName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>{pfa.holderName}</Typography>
                      </Box>
                    </Stack>
                    <Divider />
                    {[
                      ['Email', pfa.email],
                      ['Telefon', pfa.phone],
                      ['Plan / tip abonament', pfa.plan],
                      ['Status abonament', pfa.subscriptionStatus],
                      ['Vechime client', pfa.customerAgeLabel],
                      ['Status cont', pfa.accountStatus],
                      ['Status lună curentă', pfa.currentMonthStatus],
                      ['Ultima activitate', pfa.lastActivityLabel],
                    ].map(([label, value]) => (
                      <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ color: TOKENS.ink, fontWeight: 850, textAlign: 'right' }}>{value}</Typography>
                      </Stack>
                    ))}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button fullWidth variant="contained" onClick={() => openPfaDetail(pfa)} endIcon={<OpenInNewRoundedIcon />} sx={{ boxShadow: 'none', bgcolor: TOKENS.primary, fontWeight: 850 }}>
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

      <PfaDetailDialog
        pfa={selectedPfa}
        detail={pfaDetail}
        loading={pfaDetailLoading}
        error={pfaDetailError}
        action={action}
        actionError={actionError}
        actionLoading={actionLoading}
        onClose={() => {
          setSelectedPfa(null)
          setPfaDetail(null)
          setAction(null)
          setActionError(null)
        }}
        onImpersonate={onImpersonate}
        onOpenChat={() => {
          setSelectedPfa(null)
          onOpenChat()
        }}
        onActionChange={(nextAction) => {
          setAction(nextAction)
          setActionError(null)
        }}
        onSubmitAction={submitAction}
      />
    </Stack>
  )
}
