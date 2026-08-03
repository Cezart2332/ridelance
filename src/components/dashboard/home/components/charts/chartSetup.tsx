import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { visuallyHidden } from '@mui/utils'

import { HOME_TOKENS, tabularNums } from '../../tokens'
import { formatCurrency } from '../../format'

export interface TooltipEntry {
  name?: string
  value?: number
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  label?: string
  title?: string
  entries: TooltipEntry[]
  footer?: ReactNode
}

/** Tooltip-ul default al Recharts nu respectă tokenii — toate graficele îl folosesc pe ăsta. */
export function ChartTooltip({ active, title, entries, footer }: ChartTooltipProps) {
  if (!active) return null

  return (
    <Box
      sx={{
        px: 1.4,
        py: 1.1,
        minWidth: 168,
        borderRadius: '12px',
        border: `1px solid ${HOME_TOKENS.border.subtle}`,
        bgcolor: HOME_TOKENS.bg.surface,
        boxShadow: HOME_TOKENS.shadow.hover,
      }}
    >
      {title && (
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: HOME_TOKENS.text.primary, mb: 0.6 }}>
          {title}
        </Typography>
      )}
      <Stack spacing={0.4}>
        {entries.map((entry) => (
          <Stack
            key={`${entry.name}-${entry.dataKey}`}
            direction="row"
            spacing={1.2}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center', minWidth: 0 }}>
              {entry.color && (
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
              )}
              <Typography noWrap sx={{ fontSize: '0.76rem', color: HOME_TOKENS.text.secondary }}>
                {entry.name}
              </Typography>
            </Stack>
            <Typography
              sx={{ ...tabularNums, fontSize: '0.78rem', fontWeight: 600, color: HOME_TOKENS.text.primary }}
            >
              {formatCurrency(entry.value ?? 0)}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {footer && (
        <Typography sx={{ fontSize: '0.72rem', color: HOME_TOKENS.text.tertiary, mt: 0.8 }}>{footer}</Typography>
      )}
    </Box>
  )
}

interface ChartLegendProps {
  items: readonly { label: string; color: string }[]
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <Stack direction="row" spacing={1.6} sx={{ flexWrap: 'wrap', rowGap: 0.6, mb: 1.2 }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
          <Typography sx={{ fontSize: '0.75rem', color: HOME_TOKENS.text.secondary }}>{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * Alternativa textuală a unui grafic: aceleași date, într-un tabel citit doar de screen-reader.
 * Fără ea, cifrele ar exista pe ecran doar ca formă.
 */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: readonly string[]
  rows: readonly (readonly (string | number)[])[]
}) {
  return (
    <Box component="table" sx={visuallyHidden}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Box>
  )
}
