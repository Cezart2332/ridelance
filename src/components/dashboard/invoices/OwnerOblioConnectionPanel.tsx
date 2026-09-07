import { useEffect, useState } from 'react'
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { api } from '../../../lib/axios'
import type { OblioConnection } from '../../../services/invoices.service'
import { OblioConnectPanel } from './OblioConnectPanel'

interface Connection extends OblioConnection { accountEmail: string | null; hasApiKey: boolean }

export function OwnerOblioConnectionPanel() {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [error, setError] = useState('')
  const load = () => api.get<Connection>('/invoices/oblio').then(response => {
    setConnection(response.data)
    setError('')
  }).catch(() => setError('Nu am putut încărca conexiunea Oblio.'))
  useEffect(() => { void load() }, [])
  return <Stack spacing={2}>
    {error && <Alert severity="error">{error}</Alert>}
    {!connection && !error && <CircularProgress size={24} />}
    {connection && <>
      <OblioConnectPanel connection={connection} onChanged={() => void load()} />
      {connection.connected && <Stack spacing={0.5}>
        <Typography variant="body2">Email cont Oblio: {connection.accountEmail}</Typography>
        <Typography variant="body2">Cheie API: {connection.hasApiKey ? '•••••••• · Salvată' : 'Lipsește'}</Typography>
      </Stack>}
    </>}
    <Button onClick={() => void load()}>Actualizează starea Oblio</Button>
  </Stack>
}
