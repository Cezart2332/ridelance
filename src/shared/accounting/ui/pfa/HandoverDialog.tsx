import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'

import { accountingApi } from '../../api/accountingApi'
import type { PfaAccountingSummary } from '../../api/types'
import { JobProgress } from '../month/JobProgress'
import { useJobRunner } from '../month/useJobRunner'
import { useAction } from '../notify'
import { downloadBlob } from '../useApi'

/**
 * Structura arhivei de predare, pentru previzualizare. Structura exactă vine din documentul
 * clientului, secțiunea 13 (încă nu e în repo): de confirmat înainte de B8.
 */
function handoverTree(cui: string, year: number, intermediate: boolean): string {
  return [
    `RIDElance_PFA_${cui}_${year}.zip`,
    '├── Registre/',
    `│   ├── RJIP_${year}.pdf, .xlsx`,
    `│   ├── REF_${year}.pdf, .xlsx${intermediate ? ' (situație intermediară)' : ''}`,
    `│   └── Registru_inventar_${year}.pdf, .xlsx`,
    `├── Ledger_${year}.xlsx`,
    '├── Documente originale/',
    '│   └── {lună}/ facturi și rapoarte Uber/Bolt, documente de cheltuieli, rapoarte Z',
    '├── Declaratii/',
    '│   └── {lună}/ D100, D301, D390 (XML + PDF) și recipisele',
    '└── Sumar_predare.pdf',
  ].join('\n')
}

/** F7: dosarul de predare — previzualizarea structurii, jobul și descărcarea arhivei. */
export function HandoverDialog({ summary, onClose }: { summary: PfaAccountingSummary; onClose: () => void }) {
  const { busy, run } = useAction()
  const jobs = useJobRunner(() => undefined)
  const year = Number((summary.engagement.endDate ?? summary.currentPeriod).slice(0, 4))
  const job = jobs.job
  const done = job?.status === 'COMPLETED' && job.file

  const download = () =>
    run('download', async () => {
      if (!job?.file) return
      const blob = await accountingApi.jobs.getFile(job.id)
      // Mock-ul întoarce conținutul arhivei ca text, nu un ZIP real.
      downloadBlob(blob, blob.type.startsWith('text/plain') ? job.file.fileName.replace(/\.zip$/, '.txt') : job.file.fileName)
    })

  return (
    <Dialog open onClose={jobs.running ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dosar de predare · {summary.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2">Arhiva conține registrele, ledger-ul, documentele originale și declarațiile cu recipise:</Typography>
          <Box
            component="pre"
            sx={{ m: 0, p: 2, bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto', typography: 'caption', fontFamily: 'ui-monospace, Consolas, monospace' }}
          >
            {handoverTree(summary.cui, year, true)}
          </Box>
          <Typography variant="caption" color="text.secondary">
            REF și RJIP sunt „situație intermediară” dacă anul nu e închis. Structura exactă e DE CONFIRMAT din documentul clientului.
          </Typography>
          {job && <JobProgress job={job} onClose={() => undefined} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={jobs.running}>
          Închide
        </Button>
        {done ? (
          <Button variant="contained" onClick={download} disabled={busy !== null}>
            Descarcă arhiva
          </Button>
        ) : (
          <Button variant="contained" disabled={jobs.running} onClick={() => jobs.start(() => accountingApi.pfas.createHandoverPackage(summary.id))}>
            {jobs.running ? 'Se generează…' : 'Generează dosarul'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
