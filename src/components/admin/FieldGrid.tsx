import { Box, Button, FormControlLabel, Stack, Switch, Typography } from '@mui/material'
import { useState } from 'react'

import { Field, type FieldSpec } from './Field'
import { isEmptyValue } from './emptyValue'

/**
 * Un grup de câmpuri, cu golurile ascunse din start.
 *
 * Un câmp necompletat ocupa înainte exact cât unul plin, deci jumătate din suprafață nu spunea
 * nimic. Acum se ascund, iar dacă tot grupul e gol rămâne un singur rând care spune cât e.
 */
export function FieldGrid({
  fields,
  columns = 3,
}: {
  fields: FieldSpec[]
  columns?: 2 | 3
}) {
  const [showEmpty, setShowEmpty] = useState(false)

  const emptyCount = fields.filter((f) => isEmptyValue(f.value)).length
  const visible = showEmpty ? fields : fields.filter((f) => !isEmptyValue(f.value))

  if (emptyCount === fields.length && !showEmpty) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {fields.length} câmpuri necompletate
        </Typography>
        <Button size="small" variant="text" onClick={() => setShowEmpty(true)}>
          Arată
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {emptyCount > 0 && (
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={!showEmpty}
              onChange={(e) => setShowEmpty(!e.target.checked)}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Ascunde câmpurile necompletate ({emptyCount})
            </Typography>
          }
        />
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: `repeat(${columns}, minmax(0, 1fr))`,
          },
          columnGap: 2.5,
          rowGap: 2,
        }}
      >
        {visible.map((field) => (
          <Field key={field.label} {...field} />
        ))}
      </Box>
    </Stack>
  )
}
