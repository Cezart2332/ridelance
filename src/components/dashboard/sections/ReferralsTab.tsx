import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'

import { DASHBOARD_TOKENS as T } from '../dashboardTheme'
import { PageHeader } from '../ui'
import { ReferralList, ReferralStats } from '../../referrals/ReferralHistory'
import { referralsService, type Referrals } from '../../../services/referrals.service'
import { getErrorMessage } from '../../../utils/errorHandler'

const panelSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: `${T.radius.lg}px`,
  border: `1px solid ${T.border}`,
  boxShadow: T.shadow.sm,
}

/** Recomandări: codul clientului, invitația pe email și istoricul invitațiilor, cu stadiul fiecăreia. */
export function ReferralsTab() {
  const [data, setData] = useState<Referrals | null>(null)
  const [loadError, setLoadError] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    let cancelled = false
    referralsService
      .mine()
      .then((value) => {
        if (!cancelled) setData(value)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Nu am putut încărca recomandările.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loading = !data && !loadError

  const copy = async (what: 'code' | 'link') => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(what === 'code' ? data.code : data.link)
      setCopied(what)
    } catch {
      // Clipboard blocat: codul rămâne vizibil, se poate copia de mână.
    }
  }

  const invite = async () => {
    const value = email.trim()
    if (!value) return
    setSending(true)
    setError('')
    setSent('')
    try {
      setData(await referralsService.invite(value))
      setSent(value)
      setEmail('')
    } catch (err) {
      setError(getErrorMessage(err, 'Invitația nu a putut fi trimisă.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader title="Recomandări" />

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ color: T.primary }} />
        </Stack>
      ) : data && (
        <>
          <Paper elevation={0} sx={panelSx}>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: T.textMuted, fontWeight: 600 }}>
                    Codul tău
                  </Typography>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {data.code}
                  </Typography>
                </Box>
                <Tooltip title={copied === 'code' ? 'Copiat' : 'Copiază codul'}>
                  <IconButton onClick={() => void copy('code')} aria-label="Copiază codul">
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button variant="outlined" onClick={() => void copy('link')}>
                  {copied === 'link' ? 'Link copiat' : 'Copiază linkul'}
                </Button>
              </Stack>

              <Stack
                component="form"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                onSubmit={(event) => {
                  event.preventDefault()
                  void invite()
                }}
              >
                <TextField
                  label="Email prieten"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  size="small"
                  fullWidth
                  autoComplete="off"
                />
                <Button type="submit" variant="contained" disabled={sending || !email.trim()} sx={{ minWidth: 160, boxShadow: 'none' }}>
                  {sending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : 'Trimite invitația'}
                </Button>
              </Stack>
              {error && <Alert severity="error">{error}</Alert>}
              {sent && <Alert severity="success">Invitație trimisă către {sent}</Alert>}
            </Stack>
          </Paper>

          <ReferralStats referrals={data.referrals} />

          <Paper elevation={0} sx={panelSx}>
            <Typography sx={{ fontWeight: 750, mb: 1 }}>Invitații</Typography>
            <ReferralList referrals={data.referrals} />
          </Paper>
        </>
      )}
    </Stack>
  )
}
