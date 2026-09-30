import { Chip, Stack } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatLei } from '../../format'
import { INVENTORY_STATUS, REF_STATUS } from '../../statusLabels'
import { useApi } from '../useApi'

/** Registre §8: RJIP OK · REF calculat · Inventar de confirmat · Active în clasificare. */
export function RegisterStatusBar({ pfaId, year }: { pfaId: string; year: number }) {
  const status = useApi(() => accountingApi.registers.status(pfaId, year), [pfaId, year])
  const data = status.data
  if (!data) return null

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Chip
        size="small"
        color={data.rjipOk ? 'success' : 'warning'}
        variant={data.rjipOk ? 'outlined' : 'filled'}
        label={data.rjipOk ? 'RJIP OK' : `RJIP: ${data.rjipExceptions} excepții`}
      />
      <Chip size="small" variant="outlined" label={`REF ${REF_STATUS[data.refStatus].label.toLowerCase()} · net ${formatLei(data.refNet)}`} />
      {data.inventory && (
        <Chip size="small" color="warning" label={`Inventar: ${INVENTORY_STATUS[data.inventory].label.toLowerCase()}`} onClick={() => go('registers-inventory')} />
      )}
      <Chip
        size="small"
        color={data.assetsInClassification > 0 ? 'warning' : 'default'}
        variant={data.assetsInClassification > 0 ? 'filled' : 'outlined'}
        label={`Active în clasificare: ${data.assetsInClassification}`}
        onClick={data.assetsInClassification > 0 ? () => go('registers-assets') : undefined}
      />
      {data.yearStatus === 'CLOSED' && <Chip size="small" color="success" label={`Anul ${year} închis`} />}
    </Stack>
  )
}
