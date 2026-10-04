import { useState } from 'react'
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { accountingApi } from '../../api/accountingApi'
import type { LedgerEntry } from '../../api/types'
import { formatLei } from '../../format'
import { ErrorBlock, LoadingBlock } from '../components'
import { useAction } from '../notify'
import { useApi } from '../useApi'

export function D301PaymentDialog({ entry, onClose, onChanged }: { entry: LedgerEntry; onClose: () => void; onChanged: () => void }) {
  const [period, setPeriod] = useState(entry.accountingPeriod)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('Plată D301 verificată în extrasul bancar; TVA nerecuperabil aferent comisioanelor activității.')
  const { busy, run } = useAction()
  // useApi retains previous data while loading; submission checks both the request state and period.
  const declarations = useApi(() => accountingApi.declarations.list(entry.pfaId, period), [entry.pfaId, period])
  const d301 = declarations.data?.find((item) => item.type === 'D301' && item.period === period && item.currentVersionId && item.status !== 'REJECTED')
  return <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Asociază plata cu D301</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2}>
        <Typography variant="body2">Plată bancară: {formatLei(Math.abs(entry.amount))}, la {entry.date}. Se păstrează data și suma din bancă.</Typography>
        <TextField type="month" label="Luna declarației D301" value={period} disabled={busy !== null} onChange={(event) => { setPeriod(event.target.value); setConfirmed(false) }} slotProps={{ inputLabel: { shrink: true } }} />
        {declarations.loading ? <LoadingBlock /> : declarations.error ? <ErrorBlock message={declarations.error} onRetry={declarations.reload} /> :
          d301 ? <Typography variant="body2">D301 v{d301.currentVersionNo}: {formatLei(Math.round(d301.amount ?? 0))} de plată (rotunjit la leu).</Typography> :
            <Alert severity="info">Nu există o D301 generată pentru luna aleasă. Generează declarația în Fiscalitate, apoi revino.</Alert>}
        <Alert severity="info">Declararea taxei nu înregistrează plata. Prin această asociere, plata existentă devine cheltuială deductibilă în anul plății. Impozitul pe venit, CAS, CASS și penalitățile se tratează separat. Pentru o plată care include mai multe taxe, verifică defalcarea înainte de asociere.</Alert>
        <FormControlLabel control={<Checkbox checked={confirmed} disabled={busy !== null} onChange={(event) => setConfirmed(event.target.checked)} />} label="Confirm că întreaga plată reprezintă TVA nerecuperabil din D301, aferent comisioanelor deductibile ale activității." />
        <TextField label="Justificare" multiline minRows={2} value={reason} disabled={busy !== null} onChange={(event) => setReason(event.target.value)} />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button disabled={busy !== null} onClick={onClose}>Închide</Button>
      <Button variant="contained" disabled={busy !== null || declarations.loading || !!declarations.error || !d301 || !confirmed || !reason.trim()} onClick={() => run('associate', async () => {
        await accountingApi.ledger.associateD301Payment(entry.pfaId, entry.id, { versionId: d301!.currentVersionId!, confirmNonRecoverable: confirmed, reason })
        onChanged()
        onClose()
      }, 'Plata D301 a fost asociată și inclusă în cheltuielile deductibile.')}>Asociază plata</Button>
    </DialogActions>
  </Dialog>
}
