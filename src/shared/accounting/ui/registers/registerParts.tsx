import { Button, MenuItem, Stack, TextField } from '@mui/material'

import type { ExportFormat } from '../../api/types'

export function ExportButtons({ onExport, busy, csv = false }: { onExport: (format: ExportFormat) => void; busy: boolean; csv?: boolean }) {
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Button size="small" variant="outlined" disabled={busy} onClick={() => onExport('pdf')}>
        PDF
      </Button>
      <Button size="small" variant="outlined" disabled={busy} onClick={() => onExport('xlsx')}>
        Excel
      </Button>
      {csv && (
        <Button size="small" variant="outlined" disabled={busy} onClick={() => onExport('csv')}>
          CSV
        </Button>
      )}
    </Stack>
  )
}

export function YearSelect({ years, year, onChange }: { years: number[]; year: number; onChange: (year: number) => void }) {
  return (
    <TextField select size="small" label="An" value={year} onChange={(event) => onChange(Number(event.target.value))} sx={{ minWidth: 120 }}>
      {years.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  )
}
