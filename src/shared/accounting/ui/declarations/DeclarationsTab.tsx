import { Stack } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { ErrorBlock, LoadingBlock, PeriodSelect } from '../components'
import { useAccountingNav } from '../navigation'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { useApi } from '../useApi'
import { DeclarationCard } from './DeclarationCard'

/** F4: declarațiile lunii în dosarul PFA — câte un card pentru D100, D301 și D390. */
export function DeclarationsTab({ summary, onSummaryChanged }: DossierTabProps) {
  const nav = useAccountingNav()
  const period = nav.period ?? summary.currentPeriod
  const declarations = useApi(() => accountingApi.declarations.list(summary.id, period), [summary.id, period])

  const changed = () => {
    declarations.reload()
    onSummaryChanged()
  }

  return (
    <Stack spacing={3}>
      <PeriodSelect pfaId={summary.id} value={period} onChange={(value) => nav.setParam('luna', value)} />
      {declarations.error && <ErrorBlock message={declarations.error} onRetry={declarations.reload} />}
      {!declarations.data && !declarations.error && <LoadingBlock />}
      {declarations.data?.map((declaration) => (
        <DeclarationCard key={declaration.type} summary={declaration} readOnly={summary.readOnly} onChanged={changed} />
      ))}
    </Stack>
  )
}
