import { useState } from 'react'
import { Chip, Stack } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatLei } from '../../format'
import { INVENTORY_STATUS, REF_STATUS } from '../../statusLabels'
import { useApi } from '../useApi'
import { RegisterExceptionsDialog } from './RegisterExceptionsDialog'

/**
 * Registre §8: RJIP de rezolvat · REF · Inventar de confirmat · Active în clasificare. Fiecare insignă
 * cu ceva de făcut duce la lista ei; contorul se reîncarcă după fiecare rezolvare.
 */
export function RegisterStatusBar({
  pfaId,
  year,
  version = 0,
  readOnly = false,
  onChanged,
}: {
  pfaId: string
  year: number
  version?: number
  readOnly?: boolean
  onChanged?: () => void
}) {
  const [own, setOwn] = useState(0)
  const [exceptionsOpen, setExceptionsOpen] = useState(false)
  const status = useApi(() => accountingApi.registers.status(pfaId, year), [pfaId, year, version, own])
  const data = status.data
  if (!data) return null

  const changed = () => {
    setOwn((value) => value + 1)
    onChanged?.()
  }
  const go = (...ids: string[]) => {
    const target = ids.map((id) => document.getElementById(id)).find((element) => element !== null)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const unclassified = data.unclassified ?? 0
  const refLabel =
    unclassified > 0
      ? `REF provizoriu · net ${formatLei(data.refNet)} · ${unclassified} neclasificate`
      : `REF ${REF_STATUS[data.refStatus].label.toLowerCase()} · net ${formatLei(data.refNet)}`

  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Chip
        size="small"
        color={data.rjipOk ? 'success' : 'warning'}
        variant={data.rjipOk ? 'outlined' : 'filled'}
        label={data.rjipOk ? 'RJIP OK' : `RJIP: ${data.rjipExceptions} de rezolvat`}
        onClick={data.rjipOk ? undefined : () => setExceptionsOpen(true)}
      />
      <Chip
        size="small"
        variant="outlined"
        color={unclassified > 0 ? 'warning' : 'default'}
        label={refLabel}
        onClick={unclassified > 0 ? () => setExceptionsOpen(true) : undefined}
      />
      {data.inventory && (
        <Chip size="small" color="warning" label={`Inventar: ${INVENTORY_STATUS[data.inventory].label.toLowerCase()}`} onClick={() => go('registers-inventory')} />
      )}
      <Chip
        size="small"
        color={data.assetsInClassification > 0 ? 'warning' : 'default'}
        variant={data.assetsInClassification > 0 ? 'filled' : 'outlined'}
        label={`Active în clasificare: ${data.assetsInClassification}`}
        onClick={data.assetsInClassification > 0 ? () => go('registers-asset-candidate', 'registers-asset-pending', 'registers-asset-candidates', 'registers-assets') : undefined}
      />
      {data.yearStatus === 'CLOSED' && <Chip size="small" color="success" label={`Anul ${year} închis`} />}
      <RegisterExceptionsDialog
        pfaId={pfaId}
        year={year}
        open={exceptionsOpen}
        readOnly={readOnly}
        onClose={() => setExceptionsOpen(false)}
        onChanged={changed}
      />
    </Stack>
  )
}
