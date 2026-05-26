import { useCallback, useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'

import { documentService } from '../../../services/document.service'
import { expenseService, type DeductibleExpense } from '../../../services/expense.service'
import {
  deductibleExpenseOptions,
  findDeductibleOption,
  type DeductibleExpenseOption,
} from '../../../utils/deductibleExpenseCatalog'
import { documentStatusColors, documentStatusLabel, normalizeDocumentStatus } from '../../../utils/documentStatus'
import { currentMonthYear } from '../../../utils/monthLabels'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'

type DeductibleExpensesPanelProps = {
  pfaRegistrationId: string | null
  contabilContext?: {
    userId: string
    pfaRegistrationId: string
  }
  onSnackbar?: (message: string, severity: 'success' | 'error') => void
  onChanged?: () => void
}

export function DeductibleExpensesPanel({
  pfaRegistrationId,
  contabilContext,
  onSnackbar,
  onChanged,
}: DeductibleExpensesPanelProps) {
  const effectivePfaId = contabilContext?.pfaRegistrationId ?? pfaRegistrationId
  const { year: defaultYear, month: defaultMonth } = currentMonthYear()

  const [expenses, setExpenses] = useState<DeductibleExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const [selectedOption, setSelectedOption] = useState<DeductibleExpenseOption | null>(null)
  const [customName, setCustomName] = useState('')
  const [amount, setAmount] = useState('')
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)

  const loadExpenses = useCallback(async () => {
    if (!effectivePfaId) {
      setExpenses([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await expenseService.getByPfa(effectivePfaId, year, month)
      setExpenses(data)
    } catch {
      onSnackbar?.('Nu s-au putut încărca cheltuielile.', 'error')
    } finally {
      setLoading(false)
    }
  }, [effectivePfaId, year, month, onSnackbar])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  const handleAdd = async (file: File) => {
    if (!effectivePfaId) {
      onSnackbar?.('Nu există o înregistrare PFA activă.', 'error')
      return
    }

    const name = selectedOption?.name ?? customName.trim()
    if (!name) {
      onSnackbar?.('Selectează sau introdu tipul cheltuielii.', 'error')
      return
    }

    const category = selectedOption?.category ?? 'Altele'
    const deductible = selectedOption?.deductible ?? '—'
    const parsedAmount = amount.trim() ? parseFloat(amount) : null

    setUploading(true)
    try {
      await expenseService.createForPfa(effectivePfaId, {
        catalogCategory: category,
        itemName: name,
        deductibleLabel: deductible,
        amountRon: parsedAmount && !Number.isNaN(parsedAmount) ? parsedAmount : null,
        year,
        month,
        file,
      })

      setSelectedOption(null)
      setCustomName('')
      setAmount('')
      await loadExpenses()
      onChanged?.()
      onSnackbar?.('Cheltuiala a fost adăugată.', 'success')
    } catch {
      onSnackbar?.('Încărcarea cheltuielii a eșuat.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (expense: DeductibleExpense) => {
    setDownloadingId(expense.documentId)
    try {
      await documentService.downloadAndSave(expense.documentId, expense.originalFileName)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleStatus = async (expense: DeductibleExpense, status: 'Verified' | 'Rejected') => {
    if (!contabilContext) return

    setStatusUpdatingId(expense.documentId)
    try {
      await documentService.updateStatus(expense.documentId, status)
      await loadExpenses()
      onChanged?.()
      onSnackbar?.(status === 'Verified' ? 'Cheltuială aprobată.' : 'Cheltuială respinsă.', 'success')
    } catch {
      onSnackbar?.('Actualizarea statusului a eșuat.', 'error')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  if (!effectivePfaId) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
          Nu există o înregistrare PFA activă pentru cheltuieli deductibile.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
        Cheltuieli deductibile
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.7, fontSize: '0.85rem', mb: 2 }}>
        {contabilContext
          ? 'Adaugă facturi deductibile pentru client din catalogul fiscal.'
          : 'Alege tipul din catalog, suma în lei (opțional) și încarcă factura.'}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>An</InputLabel>
          <Select label="An" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[defaultYear - 1, defaultYear, defaultYear + 1].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Lună</InputLabel>
          <Select label="Lună" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Autocomplete
          options={deductibleExpenseOptions}
          groupBy={(o) => o.category}
          getOptionLabel={(o) => o.label}
          value={selectedOption}
          onChange={(_, v) => {
            setSelectedOption(v)
            if (v) setCustomName(v.name)
          }}
          onInputChange={(_, value) => {
            if (!selectedOption) setCustomName(value)
            const match = findDeductibleOption(value)
            if (match) setSelectedOption(match)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tip cheltuială (catalog deductibil)"
              placeholder="ex. Combustibil auto, Chirie auto..."
              sx={dashboardInputSx}
            />
          )}
          slotProps={{
            paper: { sx: { borderRadius: DASHBOARD_TOKENS.radius.md, maxHeight: 320 } },
          }}
        />
        <TextField
          label="Sumă (lei) — opțional"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          sx={dashboardInputSx}
        />
        <Button
          variant="contained"
          component="label"
          disabled={uploading}
          startIcon={
            uploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AddRoundedIcon />
            )
          }
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: DASHBOARD_TOKENS.radius.full,
            bgcolor: DASHBOARD_TOKENS.primary,
            boxShadow: DASHBOARD_TOKENS.shadow.glow,
            '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong },
          }}
        >
          Adaugă factură
          <input
            type="file"
            hidden
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleAdd(file)
              e.target.value = ''
            }}
          />
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
        </Box>
      ) : expenses.length === 0 ? (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
          Nici o cheltuială pentru {month}/{year}.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {expenses.map((expense) => {
            const colors = documentStatusColors(expense.status)
            return (
              <Paper
                key={expense.id}
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  bgcolor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.88rem' }}>
                      {expense.itemName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: DASHBOARD_TOKENS.textMuted }}>
                      {expense.catalogCategory} · {expense.deductibleLabel}
                      {expense.amountRon != null && expense.amountRon > 0
                        ? ` · ${expense.amountRon.toLocaleString('ro-RO')} lei`
                        : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: DASHBOARD_TOKENS.textSubtle }} noWrap>
                      {expense.originalFileName}
                    </Typography>
                  </Box>
                  <Chip
                    label={documentStatusLabel(expense.status)}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: colors.color,
                      bgcolor: colors.bg,
                      borderRadius: DASHBOARD_TOKENS.radius.sm,
                      height: 24,
                    }}
                  />
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDownload(expense)}
                    disabled={downloadingId === expense.documentId}
                    startIcon={
                      downloadingId === expense.documentId ? (
                        <CircularProgress size={14} />
                      ) : (
                        <FileDownloadRoundedIcon sx={{ fontSize: 16 }} />
                      )
                    }
                    sx={{ textTransform: 'none', borderRadius: DASHBOARD_TOKENS.radius.full, fontSize: '0.8rem' }}
                  >
                    Descarcă
                  </Button>
                  {contabilContext && normalizeDocumentStatus(expense.status) === 'pending' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleStatus(expense, 'Verified')}
                        disabled={statusUpdatingId === expense.documentId}
                        sx={{ color: '#10b981' }}
                      >
                        <CheckCircleRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStatus(expense, 'Rejected')}
                        disabled={statusUpdatingId === expense.documentId}
                        sx={{ color: '#ef4444' }}
                      >
                        <CancelRoundedIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}
