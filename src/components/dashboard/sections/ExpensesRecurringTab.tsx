import { Box } from '@mui/material'

import { DeductibleExpensesPanel } from './DeductibleExpensesPanel'
import { RecurringDocumentationPanel } from './RecurringDocumentationPanel'

type ExpensesRecurringTabProps = {
  pfaRegistrationId?: string | null
  viewMode?: 'expenses' | 'doc_recurring'
  onSnackbar?: (message: string, severity: 'success' | 'error') => void
}

export function ExpensesRecurringTab({
  pfaRegistrationId,
  viewMode,
  onSnackbar,
}: ExpensesRecurringTabProps) {
  const showExpenses = !viewMode || viewMode === 'expenses'
  const showDocRecurring = !viewMode || viewMode === 'doc_recurring'

  return (
    <Box
      sx={{
        maxWidth: viewMode ? 720 : '100%',
        display: 'grid',
        gridTemplateColumns: !viewMode ? { xs: '1fr', lg: '1fr 1fr' } : '1fr',
        gap: 2,
      }}
    >
      {showExpenses && (
        <DeductibleExpensesPanel pfaRegistrationId={pfaRegistrationId ?? null} onSnackbar={onSnackbar} />
      )}
      {showDocRecurring && <RecurringDocumentationPanel onSnackbar={onSnackbar} />}
    </Box>
  )
}
