import { Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { monthlyRequiredDocuments } from '../dashboardData'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'

type ExpensesRecurringTabProps = {
  expenses: string[]
  expenseInput: string
  onExpenseChange: (value: string) => void
  onAddExpense: () => void
  viewMode?: 'expenses' | 'doc_recurring'
}

export function ExpensesRecurringTab({
  expenses,
  expenseInput,
  onExpenseChange,
  onAddExpense,
  viewMode,
}: ExpensesRecurringTabProps) {
  const showExpenses = !viewMode || viewMode === 'expenses'
  const showDocRecurring = !viewMode || viewMode === 'doc_recurring'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: !viewMode ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
        gap: 16,
        maxWidth: !viewMode ? '100%' : 700,
      }}
    >
      {showExpenses && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Cheltuieli</Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.7, fontSize: '0.9rem' }}>
            Adauga cheltuieli pentru facturare pe PFA (leasing, service, piese auto, internet, chirie masina, asigurari etc.).
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              value={expenseInput}
              onChange={(e) => onExpenseChange(e.target.value)}
              placeholder="Introdu numele cheltuielii"
              sx={dashboardInputSx}
            />
            <Button
              variant="contained"
              component="label"
              sx={{
                borderRadius: DASHBOARD_TOKENS.radius.full,
                px: 2.5,
                height: 48,
                color: '#fff',
                whiteSpace: 'nowrap',
                backgroundColor: DASHBOARD_TOKENS.primary,
                fontWeight: 700,
                boxShadow: DASHBOARD_TOKENS.shadow.glow,
                '&:hover': { backgroundColor: DASHBOARD_TOKENS.primaryStrong },
              }}
            >
              Adauga
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddExpense()
                  }
                }}
              />
            </Button>
          </Stack>

          <Stack spacing={1} sx={{ mt: 2 }}>
            {expenses.map((expense, idx) => (
              <Paper
                key={`${expense}-${idx}`}
                elevation={0}
                sx={{
                  p: 1.3,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 650 }}>{expense}</Typography>
                  <Chip
                    label="In Verificare"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: '#ED6C02',
                      backgroundColor: alpha('#ED6C02', 0.1),
                      borderRadius: DASHBOARD_TOKENS.radius.sm,
                      height: 24,
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {showDocRecurring && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Documente lunare obligatorii</Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.7, fontSize: '0.9rem' }}>
            Pentru inchiderea lunara ai nevoie de extrase bancare si rapoartele de venit din Uber si Bolt.
          </Typography>

          <Stack spacing={1.2} sx={{ mt: 2 }}>
            {monthlyRequiredDocuments.map((documentName) => (
              <Paper
                key={documentName}
                elevation={0}
                sx={{
                  p: 1.4,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  backgroundColor: DASHBOARD_TOKENS.surface,
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{documentName}</Typography>
                  <Chip
                    label="Obligatoriu"
                    size="small"
                    sx={{
                      borderRadius: DASHBOARD_TOKENS.radius.full,
                      fontWeight: 700,
                      color: '#2e7d32',
                      backgroundColor: alpha('#2e7d32', 0.1),
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
    </div>
  )
}
