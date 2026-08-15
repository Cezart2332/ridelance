import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'

import { DASHBOARD_TOKENS, dashboardInputSx, responsiveTableContainerSx } from '../../dashboardTheme'
import { PageHeader, StatusChip, formatLei, type StatusTone } from '../../ui'
import { tabularNums } from '../../home/tokens'
import { documentService } from '../../../../services/document.service'
import { expenseService, type DeductibleExpense } from '../../../../services/expense.service'
import { deductibleExpensesData } from '../../../../data/cheltuieliDeductibile'
import { getErrorMessage } from '../../../../utils/errorHandler'
import { AddExpenseDialog } from './AddExpenseDialog'

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

type StatusFilter = 'all' | 'Confirmed' | 'Draft'

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Ce arată chip-ul de status. Confirmarea utilizatorului decide dacă cheltuiala intră în
 * profit; verificarea RIDElance e un al doilea semnal, care nu blochează calculul dar nici
 * nu se ascunde — altfel profitul ar părea mai sigur decât e.
 */
function statusOf(expense: DeductibleExpense): { label: string; tone: StatusTone } {
  if (expense.status === 'Draft') return { label: 'Ciornă', tone: 'neutral' }
  if (expense.documentStatus === 'Rejected') return { label: 'Document respins', tone: 'error' }
  if (expense.documentStatus === 'Verified') return { label: 'Confirmată', tone: 'active' }
  return { label: 'Confirmată · în verificare', tone: 'neutral' }
}

/**
 * Contabilitate → Cheltuieli. Aici utilizatorul își introduce și gestionează cheltuielile
 * deductibile; cele confirmate alimentează imediat profitul real estimat de pe Acasă și din
 * Situație financiară.
 */
export function ExpensesPage({ pfaRegistrationId }: { pfaRegistrationId: string | null }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState<number | 'all'>(now.getMonth() + 1)
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const key = `${pfaRegistrationId}|${year}|${month}|${reloadToken}`
  const [loaded, setLoaded] = useState<{ key: string; items: DeductibleExpense[]; error: string | null }>({
    key: '',
    items: [],
    error: null,
  })

  useEffect(() => {
    if (!pfaRegistrationId) return undefined

    let cancelled = false
    expenseService
      .getByPfa(pfaRegistrationId, year, month === 'all' ? undefined : month)
      .then((items) => {
        if (!cancelled) setLoaded({ key, items: items ?? [], error: null })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoaded({ key, items: [], error: getErrorMessage(cause, 'Nu am putut încărca cheltuielile.') })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, pfaRegistrationId, year, month])

  // Fără PFA nu există ce încărca — ecranul nu rămâne blocat pe spinner.
  const loading = pfaRegistrationId !== null && loaded.key !== key

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return loaded.items.filter((expense) => {
      if (status !== 'all' && expense.status !== status) return false
      if (category !== 'all' && expense.catalogCategory !== category) return false
      if (!needle) return true
      return (
        expense.itemName.toLowerCase().includes(needle) ||
        (expense.supplierName ?? '').toLowerCase().includes(needle)
      )
    })
  }, [loaded.items, status, category, search])

  const confirmedTotal = visible
    .filter((expense) => expense.status === 'Confirmed')
    .reduce((sum, expense) => sum + (expense.amountRon ?? 0), 0)

  const years = Array.from({ length: 5 }, (_, index) => now.getFullYear() - index)

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Cheltuieli"
        subtitle="Cheltuielile deductibile ale PFA-ului. Cele confirmate intră imediat în profitul real estimat."
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            disabled={!pfaRegistrationId}
            sx={{
              textTransform: 'none',
              fontWeight: 750,
              borderRadius: DASHBOARD_TOKENS.radius.full,
              px: 2.5,
              bgcolor: DASHBOARD_TOKENS.primary,
              color: DASHBOARD_TOKENS.ink,
              boxShadow: 'none',
              '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
            }}
          >
            Adaugă cheltuială
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <TextField select size="small" label="An" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={dashboardInputSx}>
            {years.map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Lună"
            value={month}
            onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            sx={dashboardInputSx}
          >
            <MenuItem value="all">Toate lunile</MenuItem>
            {MONTHS.map((label, index) => (
              <MenuItem key={label} value={index + 1}>{label}</MenuItem>
            ))}
          </TextField>

          <TextField select size="small" label="Categorie" value={category} onChange={(e) => setCategory(e.target.value)} sx={dashboardInputSx}>
            <MenuItem value="all">Toate categoriile</MenuItem>
            {deductibleExpensesData.map((cat) => (
              <MenuItem key={cat.name} value={cat.name}>{cat.name}</MenuItem>
            ))}
          </TextField>

          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} sx={dashboardInputSx}>
            <MenuItem value="all">Toate</MenuItem>
            <MenuItem value="Confirmed">Confirmate</MenuItem>
            <MenuItem value="Draft">Ciorne</MenuItem>
          </TextField>

          <TextField
            size="small"
            label="Caută"
            placeholder="Furnizor sau denumire"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={dashboardInputSx}
          />
        </Box>
      </Paper>

      {loaded.error && (
        <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md }}>
          {loaded.error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
          </Stack>
        ) : visible.length === 0 ? (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 6, px: 3, textAlign: 'center' }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 750 }}>
              Nicio cheltuială pentru filtrele alese
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem' }}>
              Încarcă un bon sau o factură și îți completăm noi datele.
            </Typography>
          </Stack>
        ) : (
          <Box sx={responsiveTableContainerSx}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` }}>
                  {['Data', 'Furnizor', 'Categorie', 'Document', 'Sumă', 'Status'].map((label, index) => (
                    <Box
                      key={label}
                      component="th"
                      sx={{
                        px: 2,
                        py: 1.4,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: DASHBOARD_TOKENS.textSubtle,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        // Cifrele se citesc pe coloană, deci se aliniază la dreapta.
                        textAlign: index === 4 ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box component="tbody">
                {visible.map((expense) => {
                  const chip = statusOf(expense)
                  return (
                    <Box
                      key={expense.id}
                      component="tr"
                      sx={{ borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`, '&:last-of-type': { borderBottom: 'none' } }}
                    >
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                        {formatDate(expense.expenseDate)}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.86rem' }}>
                        {expense.supplierName ?? '—'}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.86rem' }}>
                        {expense.catalogCategory}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5 }}>
                        <Button
                          size="small"
                          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() =>
                            void documentService.openInNewTab(expense.documentId, expense.originalFileName)
                          }
                          sx={{ textTransform: 'none', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                          {expense.documentTypeLabel ?? 'Vezi'}
                        </Button>
                      </Box>
                      <Box
                        component="td"
                        sx={{ px: 2, py: 1.5, fontSize: '0.86rem', fontWeight: 700, textAlign: 'right', ...tabularNums }}
                      >
                        {expense.amountRon === null ? '—' : formatLei(expense.amountRon)}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5 }}>
                        <StatusChip tone={chip.tone} label={chip.label} size="sm" />
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {!loading && visible.length > 0 && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', textAlign: 'right', ...tabularNums }}>
          Total confirmat: <strong>{formatLei(confirmedTotal)}</strong>
        </Typography>
      )}

      {dialogOpen && (
        <AddExpenseDialog
          pfaRegistrationId={pfaRegistrationId}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setReloadToken((token) => token + 1)}
        />
      )}
    </Stack>
  )
}
