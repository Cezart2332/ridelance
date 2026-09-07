import { useEffect, useState } from 'react'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { api } from '../../../../lib/axios'
import { getErrorMessage } from '../../../../utils/errorHandler'

interface Request {
  userId: string
  email: string
  company: string | null
  cui: string | null
  confirmedAtUtc: string | null
}
export function FleetBcrRequests() {
  const [items, setItems] = useState<Request[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () =>
    api
      .get<Request[]>('/admin/fleet-bcr')
      .then((response) => setItems(response.data))
  useEffect(() => {
    void load().catch(() =>
      setError('Nu am putut încărca solicitările BCR ale flotelor.'),
    )
  }, [])
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">BCR · Flote SRL</Typography>
        <Typography variant="body2" color="text.secondary">
          Confirmă numai conturile eligibile pentru oferta BCR. Pentru un
          abonament deja plătit, reducerea se aplică facturilor următoare.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {items.length === 0 && (
          <Typography variant="body2">Nicio solicitare.</Typography>
        )}
        {items.map((item) => (
          <Stack
            key={item.userId}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between' }}
          >
            <BoxLabel
              company={item.company}
              cui={item.cui}
              email={item.email}
            />
            <Button
              disabled={busy || !!item.confirmedAtUtc}
              onClick={async () => {
                setBusy(true)
                setError('')
                try {
                  await api.post(`/admin/fleet-bcr/${item.userId}/confirm`)
                  await load()
                } catch (e) {
                  setError(getErrorMessage(e, 'Confirmarea nu a reușit.'))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {item.confirmedAtUtc
                ? '✓ Eligibilitate confirmată'
                : 'Confirmă eligibilitatea BCR'}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
function BoxLabel({
  company,
  cui,
  email,
}: Omit<Request, 'userId' | 'confirmedAtUtc'>) {
  return (
    <Stack>
      <Typography>{company ?? email}</Typography>
      <Typography variant="caption" color="text.secondary">
        {cui} · {email}
      </Typography>
    </Stack>
  )
}
