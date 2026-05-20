import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
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
import { alpha } from '@mui/material/styles'
import { TOKENS } from '../../../../constants/tokens'
import { serviceOrdersService, type ServiceOrder } from '../../../../services/serviceOrders.service'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(TOKENS.paper, 0.92),
    borderRadius: TOKENS.radius.md,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

function formatAmount(bani: number | null): string {
  if (bani == null) return '—'
  return `${(bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`
}

function statusChip(status: string) {
  const paid = status.toLowerCase() === 'paid'
  const color = paid ? '#10b981' : '#f59e0b'
  const label = paid ? 'Plătit' : 'În așteptare'
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: '0.68rem',
        bgcolor: alpha(color, 0.1),
        color,
        border: `1px solid ${alpha(color, 0.25)}`,
      }}
    />
  )
}

export function ServicesAdminView() {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    serviceOrdersService
      .getAllAdmin(statusFilter || undefined)
      .then(setOrders)
      .catch(() => setError('Nu s-au putut încărca comenzile de servicii.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          Comenzi servicii (landing)
        </Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
          Plăți fără cont — contactul furnizat de client și serviciul ales.
        </Typography>
      </Box>

      <TextField
        select
        size="small"
        label="Filtru status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ maxWidth: 220, ...inputSx }}
      >
        <MenuItem value="">Toate</MenuItem>
        <MenuItem value="Paid">Plătite</MenuItem>
        <MenuItem value="Pending">În așteptare</MenuItem>
      </TextField>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: TOKENS.primary }} />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && orders.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: TOKENS.textMuted }}>Nicio comandă de serviciu.</Typography>
        </Box>
      )}
      {!loading && !error && orders.length > 0 && (
        <TableContainer
          sx={{
            borderRadius: TOKENS.radius.lg,
            border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(TOKENS.surface, 0.7) }}>
                <TableCell sx={{ fontWeight: 800 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Serviciu</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Sumă</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: alpha(TOKENS.primary, 0.03) } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800 }}>{order.customerName}</Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textSubtle, display: 'block' }}>
                      {order.customerEmail}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TOKENS.textSubtle }}>
                      {order.customerPhone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {order.serviceTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatAmount(order.amountBani)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>
                      {(order.paidAtUtc ?? order.createdAtUtc)
                        ? new Date(order.paidAtUtc ?? order.createdAtUtc).toLocaleString('ro-RO')
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{statusChip(order.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
