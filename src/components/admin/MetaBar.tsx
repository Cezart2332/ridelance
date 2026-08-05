import { Divider, Paper, Stack, Typography } from '@mui/material'

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
    <Paper sx={{ px: 2.5, py: 1.5, borderRadius: 0, borderInline: 0 }}>
      <Stack
        direction="row"
        spacing={2.5}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ flexWrap: 'wrap', rowGap: 1.5 }}
      >
        {items.map((item) => (
          <Stack key={item.label} spacing={0.25} sx={{ minWidth: 120 }}>
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
