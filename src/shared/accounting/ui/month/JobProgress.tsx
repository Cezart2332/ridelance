import { useState } from 'react'
import { Alert, Box, Button, Collapse, LinearProgress, Stack, Typography } from '@mui/material'

import type { Job } from '../../api/types'
import { JOB_STATUS, JOB_TYPE_LABEL } from '../../statusLabels'
import { AccountingBadge } from '../components'

/** Progresul unui job și rezumatul de la final, cu detaliile pe PFA la cerere. */
export function JobProgress({ job, onClose }: { job: Job; onClose: () => void }) {
  const [details, setDetails] = useState(false)
  const done = job.status === 'COMPLETED' || job.status === 'FAILED'
  const percent = job.progress.total ? (job.progress.done / job.progress.total) * 100 : 100
  const items = [...job.errors.map((item) => ({ ...item, error: true })), ...job.results.map((item) => ({ ...item, error: false }))]

  return (
    <Stack spacing={1} role="status">
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="subtitle2">{JOB_TYPE_LABEL[job.type]}</Typography>
        <AccountingBadge descriptor={JOB_STATUS[job.status]} />
        <Typography variant="body2" color="text.secondary">
          {job.progress.done} / {job.progress.total}
        </Typography>
      </Stack>
      {!done && <LinearProgress variant="determinate" value={percent} />}
      {done && (
        <Alert
          severity={job.errors.length > 0 ? 'warning' : 'success'}
          onClose={onClose}
          action={
            items.length > 0 && (
              <Button color="inherit" size="small" onClick={() => setDetails((current) => !current)}>
                {details ? 'Ascunde' : 'Detalii'}
              </Button>
            )
          }
        >
          {job.progress.total === 0
            ? 'Nu era nimic de făcut.'
            : `${job.results.length} ${job.results.length === 1 ? 'reușit' : 'reușite'}${job.errors.length ? `, ${job.errors.length} cu probleme` : ''}.`}
        </Alert>
      )}
      <Collapse in={done && details} unmountOnExit>
        <Box sx={{ maxHeight: 240, overflowY: 'auto', px: 1 }}>
          {items.map((item, index) => (
            <Typography key={`${item.pfaId}-${index}`} variant="body2" color={item.error ? 'error.main' : 'text.primary'}>
              <strong>{item.pfaName ?? 'Job'}</strong>: {item.message}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Stack>
  )
}
