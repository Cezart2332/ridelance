import { Button, Stack, Typography } from '@mui/material'

/** Text și, dacă există ceva de făcut, o acțiune. Fără ilustrații. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <Stack spacing={1} sx={{ py: 3, alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled">
          {description}
        </Typography>
      )}
      {action && (
        <Button size="small" variant="text" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  )
}
