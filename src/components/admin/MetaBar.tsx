import { Paper, Stack, Typography } from '@mui/material'

export interface MetaItem {
  label: string
  value: string
}

/**
 * Metadate pe o linie, sub antet. Înlocuiește rândul de „KPI cards": plan, status, tip
 * înregistrare nu sunt metrici, sunt etichete — nu merită tratament de card.
 */
export function MetaBar({ items }: { items: MetaItem[] }) {
  return (
    <Paper sx={{ px: 2.5, py: 2 }}>
      <Stack
        direction="row"
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 2.5 }}
      >
        {items.map((item) => (
          <Stack key={item.label} spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.value || '—'}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
