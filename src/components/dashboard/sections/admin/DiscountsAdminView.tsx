import { usePageTabs } from '../../../admin'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { TOKENS } from '../../../../constants/tokens'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { discountsService, type DiscountCode } from '../../../../services/discounts.service'
import { DateField } from '../../../common/DateField'
import { FleetBcrRequests } from './FleetBcrRequests'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(TOKENS.paper, 0.92),
    borderRadius: `${TOKENS.radius.md}px`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.08) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.16) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.6), borderWidth: 2 },
  },
}

type DiscountKind = 'percent' | 'amount'

function formatReduction(code: DiscountCode): string {
  if (code.percentOff !== null) {
    return `-${code.percentOff}%`
  }
  if (code.amountOffBani !== null) {
    return `-${(code.amountOffBani / 100).toLocaleString('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} lei`
  }
  return '—'
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusChip(code: DiscountCode) {
  const exhausted = code.maxRedemptions !== null && code.timesRedeemed >= code.maxRedemptions
  const expired = code.expiresAtUtc !== null && new Date(code.expiresAtUtc) <= new Date()

  let label = 'Activ'
  let color = '#10b981'

  if (!code.active) {
    label = 'Dezactivat'
    color = '#94a3b8'
  } else if (exhausted) {
    label = 'Epuizat'
    color = '#f59e0b'
  } else if (expired) {
    label = 'Expirat'
    color = '#f59e0b'
  }

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

export function DiscountsAdminView() {
  const [view, tabs] = usePageTabs({ paramName: 'view', tabs: [
    { value: 'coduri', label: 'Coduri existente' }, { value: 'nou', label: 'Creează un cod' }, { value: 'bcr', label: 'Solicitări BCR' },
  ] })
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [kind, setKind] = useState<DiscountKind>('percent')
  const [value, setValue] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [appliesToAllPayments, setAppliesToAllPayments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formResult, setFormResult] = useState<{ ok: boolean; message: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setListError(null)
    discountsService
      .list()
      .then(setCodes)
      .catch((err) => setListError(getErrorMessage(err, 'Nu am putut încărca codurile de reducere.')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const handleCreate = async () => {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      setFormResult({ ok: false, message: 'Introdu un cod.' })
      return
    }

    const numericValue = Number(value.replace(',', '.'))
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setFormResult({ ok: false, message: 'Introdu o valoare validă pentru reducere.' })
      return
    }
    if (kind === 'percent' && numericValue > 100) {
      setFormResult({ ok: false, message: 'Procentul nu poate depăși 100.' })
      return
    }

    let redemptions: number | null = null
    if (maxRedemptions.trim()) {
      redemptions = Number(maxRedemptions)
      if (!Number.isInteger(redemptions) || redemptions < 1) {
        setFormResult({ ok: false, message: 'Numărul maxim de utilizări trebuie să fie un întreg pozitiv.' })
        return
      }
    }

    setSubmitting(true)
    setFormResult(null)
    try {
      const created = await discountsService.create({
        code: trimmedCode,
        percentOff: kind === 'percent' ? numericValue : null,
        amountOffBani: kind === 'amount' ? Math.round(numericValue * 100) : null,
        maxRedemptions: redemptions,
        appliesToAllPayments,
        expiresAtUtc: expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null,
      })
      setFormResult({ ok: true, message: `Codul ${created.code} a fost creat.` })
      setCode('')
      setValue('')
      setMaxRedemptions('')
      setExpiresAt('')
      load()
    } catch (err) {
      setFormResult({ ok: false, message: getErrorMessage(err, 'Crearea codului a eșuat.') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (target: DiscountCode) => {
    try {
      const updated = await discountsService.setActive(target.id, !target.active)
      setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      setListError(getErrorMessage(err, 'Nu am putut actualiza codul.'))
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <LocalOfferRoundedIcon sx={{ color: TOKENS.primaryStrong }} />
        <Typography variant="h1">
          Coduri de reducere
        </Typography>
      </Stack>
      <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mb: 3, lineHeight: 1.7 }}>
        Codurile se introduc de client direct în pagina de plată și se aplică atât abonamentelor, cât și
        serviciilor individuale.
      </Typography>

      <Box sx={{ mb: 3 }}>{tabs}</Box>
      {view === 'bcr' && <FleetBcrRequests />}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* ── Cod nou ── */}
        {view === 'nou' && <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${TOKENS.radius.xl}px`,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>Cod nou</Typography>

          <Stack spacing={2}>
            <TextField
              label="Cod"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RIDE20"
              fullWidth
              size="small"
              sx={inputSx}
            />

            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={kind}
              onChange={(_, next: DiscountKind | null) => next && setKind(next)}
              sx={{
                '& .MuiToggleButton-root': {
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: `${TOKENS.radius.md}px`,
                  borderColor: alpha(TOKENS.ink, 0.08),
                },
                '& .Mui-selected': {
                  backgroundColor: alpha(TOKENS.primary, 0.12),
                  color: TOKENS.primaryStrong,
                },
              }}
            >
              <ToggleButton value="percent">Procent</ToggleButton>
              <ToggleButton value="amount">Sumă fixă</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={kind === 'percent' ? 'Reducere (%)' : 'Reducere (lei)'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              size="small"
              sx={inputSx}
            />

            <TextField
              label="Număr maxim de utilizări"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              helperText="Lasă gol pentru utilizări nelimitate."
              fullWidth
              size="small"
              sx={inputSx}
            />

            <DateField
              label="Expiră la"
              value={expiresAt}
              onChange={setExpiresAt}
              fullWidth
              size="small"
              sx={inputSx}
            />

            <TextField
              select
              label="La abonamente se aplică"
              value={appliesToAllPayments ? 'all' : 'first'}
              onChange={(e) => setAppliesToAllPayments(e.target.value === 'all')}
              helperText="La plățile unice nu are efect."
              fullWidth
              size="small"
              sx={inputSx}
            >
              <MenuItem value="first">Doar prima plată</MenuItem>
              <MenuItem value="all">Toate plățile</MenuItem>
            </TextField>

            {formResult && (
              <Alert severity={formResult.ok ? 'success' : 'error'} sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                {formResult.message}
              </Alert>
            )}

            <Button
              variant="contained"
              disabled={submitting}
              onClick={handleCreate}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: TOKENS.primary,
                boxShadow: 'none',
                borderRadius: `${TOKENS.radius.md}px`,
                '&:hover': { bgcolor: TOKENS.primaryStrong, boxShadow: 'none' },
              }}
            >
              {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Creează codul'}
            </Button>
          </Stack>
        </Paper>}

        {/* ── Coduri existente ── */}
        {view === 'coduri' && <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${TOKENS.radius.xl}px`,
            border: `1px solid ${TOKENS.border}`,
            boxShadow: TOKENS.shadow.sm,
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 650, color: TOKENS.ink }}>Coduri existente</Typography>
            <Button
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={load}
              disabled={loading}
              sx={{ fontWeight: 700, textTransform: 'none', color: TOKENS.primaryStrong }}
            >
              Reîncarcă
            </Button>
          </Stack>

          {listError && (
            <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px`, mb: 2 }}>
              {listError}
            </Alert>
          )}

          {loading ? (
            <Stack sx={{ alignItems: 'center', py: 6 }}>
              <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
            </Stack>
          ) : codes.length === 0 ? (
            <Typography sx={{ color: TOKENS.textMuted, py: 6, textAlign: 'center' }}>
              Nu există coduri de reducere.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 650 }}>Cod</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>Reducere</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>Utilizări</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>Abonamente</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>Expiră</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {codes.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 650, letterSpacing: 0.4 }}>{c.code}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatReduction(c)}</TableCell>
                      <TableCell>
                        {c.timesRedeemed} / {c.maxRedemptions ?? '∞'}
                      </TableCell>
                      <TableCell sx={{ color: TOKENS.textMuted, fontSize: '0.82rem' }}>
                        {c.appliesToAllPayments ? 'Toate plățile' : 'Prima plată'}
                      </TableCell>
                      <TableCell sx={{ color: TOKENS.textMuted, fontSize: '0.82rem' }}>
                        {formatDate(c.expiresAtUtc)}
                      </TableCell>
                      <TableCell>{statusChip(c)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => handleToggleActive(c)}
                          sx={{ fontWeight: 700, textTransform: 'none', color: TOKENS.primaryStrong }}
                        >
                          {c.active ? 'Dezactivează' : 'Activează'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>}
      </Box>
    </Box>
  )
}
