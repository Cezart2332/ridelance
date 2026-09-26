import { useState, type ReactNode } from 'react'
import { Alert, Stack, TextField, Typography } from '@mui/material'

import type { ActionMenuItem } from '../../../../components/admin'
import { accountingApi } from '../../api/accountingApi'
import type { PfaAccountingSummary } from '../../api/types'
import { ReasonDialog } from '../components'
import { useNotify } from '../notify'
import { HandoverDialog } from './HandoverDialog'

/** Acțiunile din meniul „⋯” al dosarului și dialogurile lor (F7: inactivare, dosar de predare). */
export function useDossierMenu(summary: PfaAccountingSummary | null, onChanged: () => void): { items: ActionMenuItem[]; dialogs: ReactNode } {
  const notify = useNotify()
  const [dialog, setDialog] = useState<'deactivate' | 'handover' | null>(null)
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  if (!summary) return { items: [], dialogs: null }

  const items: ActionMenuItem[] = [
    { key: 'handover', label: 'Generează dosar de predare', onClick: () => setDialog('handover') },
    ...(summary.readOnly
      ? []
      : [{ key: 'deactivate', label: 'Inactivează PFA', destructive: true, dividerBefore: true, onClick: () => setDialog('deactivate') }]),
  ]

  const dialogs = (
    <>
      {dialog === 'handover' && <HandoverDialog summary={summary} onClose={() => setDialog(null)} />}
      <ReasonDialog
        open={dialog === 'deactivate'}
        title={`Inactivează ${summary.name}`}
        description={
          <Stack spacing={1.5}>
            <Typography variant="body2">
              După confirmare, dosarul devine read-only: nu se mai importă operațiuni de după data de sfârșit și nu se mai pot modifica datele.
            </Typography>
            <Alert severity="info">Datele contabile nu se șterg. Termenul de păstrare obligatorie apare în dosar după inactivare.</Alert>
          </Stack>
        }
        requireReason={false}
        showReason={false}
        canSubmit={Boolean(endDate)}
        confirmLabel="Inactivează"
        destructive
        onClose={() => setDialog(null)}
        onSubmit={async () => {
          await accountingApi.pfas.deactivate(summary.id, { accountingEndDate: endDate })
          notify(`${summary.name} a fost inactivat.`, 'success')
          onChanged()
        }}
      >
        <TextField
          type="date"
          label="Sfârșitul perioadei contabile"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </ReasonDialog>
    </>
  )

  return { items, dialogs }
}
