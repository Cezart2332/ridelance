import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { TOKENS } from '../../../../constants/tokens'
import { getErrorMessage } from '../../../../utils/errorHandler'
import {
  oblioService,
  type IssuedInvoice,
  type OblioStatus,
} from '../../../../services/oblio.service'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(TOKENS.paper, 0.92),
    borderRadius: TOKENS.radius.md,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

function formatAmount(bani: number): string {
  return `${(bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function invoiceStatusChip(invoice: IssuedInvoice) {
  const ok = invoice.status === 'Issued'
  const color = ok ? '#10b981' : '#ef4444'
  return (
    <Chip
      label={ok ? 'Emisă' : 'Eșuată'}
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

export function OblioAdminView() {
  const [status, setStatus] = useState<OblioStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [invoices, setInvoices] = useState<IssuedInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  const [clientName, setClientName] = useState('Client Test RIDElance')
  const [amountLei, setAmountLei] = useState('1.00')
  const [description, setDescription] = useState('Factură de test RIDElance')
  const [submitting, setSubmitting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; link?: string } | null>(null)

  const loadStatus = useCallback(() => {
    setStatusLoading(true)
    oblioService
      .getStatus()
      .then(setStatus)
      .catch((err) => {
        setStatus({
          configured: false,
          cif: null,
          seriesName: null,
          connectionOk: false,
          companyName: null,
          availableSeries: [],
          error: getErrorMessage(err, 'Nu am putut verifica statusul Oblio.'),
        })
      })
      .finally(() => setStatusLoading(false))
  }, [])

  const loadInvoices = useCallback(() => {
    setInvoicesLoading(true)
    oblioService
      .getInvoices()
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setInvoicesLoading(false))
  }, [])

  useEffect(() => {
    loadStatus()
    loadInvoices()
  }, [loadStatus, loadInvoices])

  const handleTestInvoice = async () => {
    const amount = Number(amountLei.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setTestResult({ ok: false, message: 'Introdu o sumă validă (în lei).' })
      return
    }
    setSubmitting(true)
    setTestResult(null)
    try {
      const result = await oblioService.createTestInvoice({
        clientName: clientName.trim() || undefined,
        amountLei: amount,
        description: description.trim() || undefined,
      })
      setTestResult({
        ok: true,
        message: `Factura ${result.seriesName} ${result.number} a fost emisă cu succes în Oblio.`,
        link: result.link,
      })
    } catch (err) {
      setTestResult({ ok: false, message: getErrorMessage(err, 'Emiterea facturii de test a eșuat.') })
    } finally {
      setSubmitting(false)
      loadInvoices()
    }
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <ReceiptLongRoundedIcon sx={{ color: TOKENS.primaryStrong }} />
        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: TOKENS.ink }}>
          Facturare Oblio
        </Typography>
      </Stack>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.95rem', mb: 3, lineHeight: 1.7 }}>
        Facturile se generează automat în Oblio pentru fiecare tranzacție (abonamente și plăți
        one-time). Momentan facturile NU se trimit în SPV (e-Factura).
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'stretch',
          mb: 4,
        }}
      >
        {/* ── Status conexiune ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>Status conexiune</Typography>
            <Button
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={loadStatus}
              disabled={statusLoading}
              sx={{ fontWeight: 700, textTransform: 'none', color: TOKENS.primaryStrong }}
            >
              Reverifică
            </Button>
          </Stack>

          {statusLoading ? (
            <Stack sx={{ alignItems: 'center', py: 4 }}>
              <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
            </Stack>
          ) : status && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {status.connectionOk ? (
                  <CheckCircleRoundedIcon sx={{ color: '#10b981', fontSize: 22 }} />
                ) : (
                  <ErrorRoundedIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                )}
                <Typography sx={{ fontWeight: 750, color: TOKENS.ink }}>
                  {status.connectionOk
                    ? `Conectat la Oblio${status.companyName ? ` — ${status.companyName}` : ''}`
                    : status.configured
                      ? 'Conexiunea la Oblio a eșuat'
                      : 'Oblio nu este configurat'}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted }}>
                  CIF firmă: <strong>{status.cif || 'nesetat'}</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted }}>
                  Serie facturi: <strong>{status.seriesName || 'nesetată'}</strong>
                </Typography>
                {status.availableSeries.length > 0 && (
                  <Typography sx={{ fontSize: '0.88rem', color: TOKENS.textMuted }}>
                    Serii disponibile în Oblio: <strong>{status.availableSeries.join(', ')}</strong>
                  </Typography>
                )}
              </Stack>

              {status.error && (
                <Alert severity={status.connectionOk ? 'warning' : 'error'} sx={{ borderRadius: 2 }}>
                  {status.error}
                </Alert>
              )}

              {!status.configured && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Setează în backend variabilele: <code>Oblio__ClientId</code> (emailul contului
                  Oblio), <code>Oblio__ClientSecret</code> (token API din Oblio → Setări → Date
                  cont), <code>Oblio__Cif</code> (CIF-ul firmei) și <code>Oblio__SeriesName</code>{' '}
                  (seria de facturi, ex. RDL).
                </Alert>
              )}
            </Stack>
          )}
        </Paper>

        {/* ── Factură de test ── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: TOKENS.radius.xl,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ fontWeight: 800, color: TOKENS.ink, mb: 2 }}>
            Emite o factură de test
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Nume client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              size="small"
              fullWidth
              sx={inputSx}
            />
            <TextField
              label="Sumă (lei, TVA inclus)"
              value={amountLei}
              onChange={(e) => setAmountLei(e.target.value)}
              size="small"
              fullWidth
              sx={inputSx}
            />
            <TextField
              label="Descriere serviciu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
              fullWidth
              sx={inputSx}
            />
            <Button
              variant="contained"
              onClick={handleTestInvoice}
              disabled={submitting || statusLoading || !status?.configured}
              sx={{
                fontWeight: 800,
                py: 1.1,
                bgcolor: TOKENS.primary,
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: TOKENS.primaryStrong },
              }}
            >
              {submitting ? 'Se emite…' : 'Emite factura de test'}
            </Button>

            {testResult && (
              <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                {testResult.message}
                {testResult.link && (
                  <>
                    {' '}
                    <Link href={testResult.link} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>
                      Deschide factura
                    </Link>
                  </>
                )}
              </Alert>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* ── Facturi emise ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.sm,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}
        >
          <Typography sx={{ fontWeight: 800, color: TOKENS.ink }}>
            Facturi generate ({invoices.length})
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={loadInvoices}
            disabled={invoicesLoading}
            sx={{ fontWeight: 700, textTransform: 'none', color: TOKENS.primaryStrong }}
          >
            Reîncarcă
          </Button>
        </Stack>

        {invoicesLoading ? (
          <Stack sx={{ alignItems: 'center', py: 5 }}>
            <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
          </Stack>
        ) : invoices.length === 0 ? (
          <Typography sx={{ px: 3, pb: 3, color: TOKENS.textMuted, fontSize: '0.9rem' }}>
            Nu există facturi generate încă. Emite o factură de test sau așteaptă prima tranzacție.
          </Typography>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, color: TOKENS.textMuted, fontSize: '0.75rem' } }}>
                  <TableCell>Data</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Descriere</TableCell>
                  <TableCell align="right">Sumă</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {formatDate(invoice.createdAtUtc)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.82rem' }}>
                      {invoice.seriesName && invoice.number
                        ? `${invoice.seriesName} ${invoice.number}`
                        : '—'}
                      {invoice.isTest && (
                        <Chip
                          label="TEST"
                          size="small"
                          sx={{
                            ml: 0.8,
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            bgcolor: alpha('#8b5cf6', 0.12),
                            color: '#8b5cf6',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>{invoice.clientName}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', maxWidth: 260 }}>
                      {invoice.description}
                      {invoice.errorMessage && (
                        <Typography sx={{ color: '#ef4444', fontSize: '0.72rem', mt: 0.3 }}>
                          {invoice.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.82rem' }}>
                      {formatAmount(invoice.amountBani)}
                    </TableCell>
                    <TableCell>{invoiceStatusChip(invoice)}</TableCell>
                    <TableCell>
                      {invoice.link ? (
                        <Link
                          href={invoice.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontWeight: 700, fontSize: '0.8rem' }}
                        >
                          Vezi <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
