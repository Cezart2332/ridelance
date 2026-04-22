import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { Button, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'

type ExpensesRecurringTabProps = {
  expenses: string[]
  expenseSelection: string
  expenseFileName: string
  onExpenseSelectionChange: (value: string) => void
  onExpenseFileChange: (value: string) => void
  onAddExpense: () => void
}

const placeholderOptions = [
  'Lorem ipsum dolor',
  'Lorem ipsum sit amet',
  'Lorem ipsum consectetur',
  'Lorem ipsum adipiscing elit',
]

export function ExpensesRecurringTab({
  expenseSelection,
  expenseFileName,
  onExpenseSelectionChange,
  onExpenseFileChange,
}: ExpensesRecurringTabProps) {
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
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Cheltuieli deductibile</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
        <Select
          fullWidth
          displayEmpty
          value={expenseSelection}
          onChange={(event) => onExpenseSelectionChange(event.target.value)}
          sx={dashboardInputSx}
          renderValue={(selected) =>
            selected ? selected : 'Selecteaza cheltuiala (lorem ipsum)'
          }
        >
          {placeholderOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>

        <Button
          component="label"
          startIcon={<UploadFileRoundedIcon fontSize="small" />}
          sx={{
            borderRadius: DASHBOARD_TOKENS.radius.full,
            px: 2,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.primaryStrong,
            border: `1px solid ${DASHBOARD_TOKENS.borderHover}`,
            backgroundColor: DASHBOARD_TOKENS.surface,
            '&:hover': {
              backgroundColor: DASHBOARD_TOKENS.surfaceAlt,
            },
          }}
        >
          {expenseFileName || 'Incarca fisier'}
          <input
            hidden
            type="file"
            onChange={(event) => onExpenseFileChange(event.target.files?.[0]?.name || '')}
          />
        </Button>
      </Stack>
    </Paper>
  )
}
