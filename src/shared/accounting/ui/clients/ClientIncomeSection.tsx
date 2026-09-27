import { useState } from 'react'
import { Button, Stack } from '@mui/material'

import { PfaMonthlyIncomeForm } from '../../../../components/contabil/PfaMonthlyIncomeForm'
import { PriorPeriodPanel } from '../../../fiscal-estimates'
import { pfaService } from '../../../../services/pfa.service'
import { formatPeriod } from '../../format'
import { ConfirmDialog } from '../components'
import { useNotify } from '../notify'
import { useApi } from '../useApi'
import { StatusBadge } from '../../../../components/admin'

/** Veniturile lunii (raportul lunar) și marcarea lunii ca procesată, care îl anunță pe client. */
export function ClientIncomeSection({ pfaId, year, month }: { pfaId: string; year: number; month: number }) {
  const notify = useNotify()
  const income = useApi(
    () => pfaService.getMonthlyIncome(pfaId, year, month).then((data) => data.isProcessed, () => false),
    [pfaId, year, month],
  )
  const processed = income.data
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const period = `${year}-${String(month).padStart(2, '0')}`

  const setProcessedTo = async (value: boolean) => {
    setBusy(true)
    try {
      const updated = await pfaService.processMonthlyIncome(pfaId, year, month, value)
      income.reload()
      notify(updated.isProcessed ? 'Luna a fost marcată ca procesată.' : 'Procesarea lunii a fost anulată.', 'success')
    } catch {
      notify('Modificarea statusului de procesare a eșuat.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {processed !== null && <StatusBadge label={processed ? 'Procesat' : 'Neprocesat'} tone={processed ? 'success' : 'neutral'} />}
        <Button
          variant={processed ? 'outlined' : 'contained'}
          disabled={busy || processed === null}
          onClick={() => (processed ? void setProcessedTo(false) : setConfirming(true))}
        >
          {processed ? 'Anulează procesarea' : 'Marchează ca procesat'}
        </Button>
      </Stack>
      <PfaMonthlyIncomeForm pfaRegistrationId={pfaId} year={year} month={month} readOnly />
      <PriorPeriodPanel mode="accounting" pfaId={pfaId} />
      <ConfirmDialog
        open={confirming}
        title={`Procesezi ${formatPeriod(period)}?`}
        message="Clientul primește notificare."
        confirmLabel="Confirmă procesarea"
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false)
          await setProcessedTo(true)
        }}
      />
    </Stack>
  )
}
