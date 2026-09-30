import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import eldriveLogo from '../../../../assets/partners/eldrive.png'
import { DASHBOARD_TOKENS as T } from '../../dashboardTheme'
import { PageHeader, StatusChip } from '../../ui'
import { eldriveService, type EldriveConnection } from '../../../../services/eldrive.service'
import { userService } from '../../../../services/user.service'
import { getErrorMessage } from '../../../../utils/errorHandler'

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

/**
 * Conexiuni → Eldrive. Conectarea e o invitație în contul de partener RIDElance, trimisă pe
 * adresa contului Eldrive; dacă adresa are deja cont, invitația e acceptată pe loc.
 */
export function EldriveConnectionPage() {
  const [connection, setConnection] = useState<EldriveConnection | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([eldriveService.getConnection(), userService.getProfile().catch(() => null)])
      .then(([current, profile]) => {
        if (cancelled) return
        setConnection(current)
        if (profile?.email) setEmail(profile.email)
      })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'Nu am putut încărca conexiunea Eldrive.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const connect = async () => {
    setSaving(true)
    setError('')
    try {
      setConnection(await eldriveService.connect(email.trim()))
    } catch (err) {
      setError(getErrorMessage(err, 'Conectarea Eldrive nu a reușit.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title="Eldrive" />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: `${T.radius.lg}px`,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow.sm,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Box component="img" src={eldriveLogo} alt="" sx={{ height: 28, width: 'auto' }} />
          <Box sx={{ flex: 1 }} />
          {!loading && (
            <StatusChip
              tone={connection?.connected ? 'active' : 'neutral'}
              label={connection?.connected ? 'Conectat' : 'Neconectat'}
            />
          )}
        </Stack>

        {loading ? (
          <Stack sx={{ alignItems: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: T.primary }} />
          </Stack>
        ) : connection?.connected ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            {[
              { label: 'Email cont Eldrive', value: connection.email ?? '—' },
              { label: 'Conectat din', value: formatDate(connection.connectedAtUtc) },
            ].map((row) => (
              <Box key={row.label} sx={{ p: 2, borderRadius: `${T.radius.md}px`, border: `1px solid ${T.border}` }}>
                <Typography sx={{ color: T.textSubtle, fontSize: '0.75rem' }}>{row.label}</Typography>
                <Typography sx={{ color: T.ink, fontWeight: 800, fontSize: '1rem', mt: 0.4, overflowWrap: 'anywhere' }}>
                  {row.value}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
            <TextField
              label="Email cont Eldrive"
              type="email"
              size="small"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={saving}
              sx={{ flex: 1, maxWidth: { sm: 420 } }}
            />
            <Button
              variant="contained"
              onClick={connect}
              disabled={saving || email.trim().length === 0}
              sx={{ minWidth: 140, height: 40 }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Conectează'}
            </Button>
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Stack>
  )
}
