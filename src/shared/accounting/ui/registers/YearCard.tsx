import { useState } from 'react'
import { Button, Paper, Stack, Typography } from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import { formatDateTime } from '../../format'
import { AccountingBadge, ErrorBlock, LoadingBlock, ReasonDialog } from '../components'
import { useAction } from '../notify'
import type { DossierTabProps } from '../pfa/PfaDossierView'
import { downloadBlob, useApi } from '../useApi'

/** Registre §7: „Închide anul”, redeschiderea (Admin, cu motiv) și pachetul anual. */
export function YearCard({ summary, year, onChanged }: DossierTabProps & { year: number; onChanged: () => void }) {
  const { busy, run } = useAction()
  const state = useApi(() => accountingApi.years.get(summary.id, year), [summary.id, year])
  const [reopening, setReopening] = useState(false)
  const data = state.data
  const closed = data?.status === 'CLOSED'

  return (
    <Paper>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h2">Anul {year}</Typography>
            {data && <AccountingBadge descriptor={closed ? { label: 'Închis', tone: 'success' } : { label: 'Deschis', tone: 'neutral' }} />}
          </Stack>
          <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
            {data && !closed && !summary.readOnly && (
              <Button
                size="small"
                variant="contained"
                disabled={busy !== null || data.missing.length > 0}
                onClick={() =>
                  run(
                    'close',
                    async () => {
                      await accountingApi.years.close(summary.id, year)
                      state.reload()
                      onChanged()
                    },
                    `Anul ${year} e închis.`,
                  )
                }
              >
                Închide anul
              </Button>
            )}
            {closed && data.hasPackage && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy !== null}
                onClick={() => run('package', async () => downloadBlob(await accountingApi.years.package(summary.id, year), `RIDElance_Registre_${summary.cui}_${year}.zip`))}
              >
                Pachetul anual
              </Button>
            )}
            {closed && !summary.readOnly && (
              <Button size="small" color="inherit" onClick={() => setReopening(true)}>
                Redeschide
              </Button>
            )}
          </Stack>
        </Stack>
        {state.error && <ErrorBlock message={state.error} onRetry={state.reload} />}
        {!data && !state.error && <LoadingBlock />}
        {data && !closed && data.missing.length > 0 && (
          <Stack component="ul" sx={{ m: 0, pl: 2.5 }}>
            {data.missing.map((item) => (
              <Typography key={item} component="li" variant="body2">
                {item}
              </Typography>
            ))}
          </Stack>
        )}
        {closed && data.closedAt && (
          <Typography variant="body2">
            Închis {formatDateTime(data.closedAt)}
            {data.closedBy ? ` · ${data.closedBy.name}` : ''}
          </Typography>
        )}
      </Stack>

      <ReasonDialog
        open={reopening}
        title={`Redeschide anul ${year}`}
        reasonLabel="Motivul redeschiderii"
        destructive
        onClose={() => setReopening(false)}
        onSubmit={async (reason) => {
          await accountingApi.years.reopen(summary.id, year, reason)
          state.reload()
          onChanged()
        }}
      />
    </Paper>
  )
}
