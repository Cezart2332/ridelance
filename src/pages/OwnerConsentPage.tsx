import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { useParams } from 'react-router-dom'

import { SignaturePad, type SignatureResult } from '../components/onboarding/companyFormation/SignaturePad'
import { api } from '../lib/axios'
import { TOKENS } from '../constants/tokens'
import logo from '../assets/logo.svg'

interface OwnerConsentRequest {
  ownerName: string
  applicantName: string
  officeAddress: string
  consentText: string
  expiresAtUtc: string
}

const errorDetail = (cause: unknown, fallback: string) =>
  (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback

/**
 * Acordul proprietarului sediului, deschis din email. Public: proprietarul n-are cont, iar linkul
 * e autentificarea. Declarația se citește în pagină, apoi se semnează.
 */
export function OwnerConsentPage() {
  const { token = '' } = useParams()

  const [request, setRequest] = useState<OwnerConsentRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<OwnerConsentRequest>(`/owner-consent/${token}`)
      .then((res) => {
        if (!cancelled) setRequest(res.data)
      })
      .catch((cause) => {
        if (!cancelled) setError(errorDetail(cause, 'Linkul nu mai e valabil.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const sign = async () => {
    if (!signature) return
    setSigning(true)
    setError(null)
    try {
      await api.post(`/owner-consent/${token}`, { signatureImage: signature.image })
      setSigned(true)
    } catch (cause) {
      setError(errorDetail(cause, 'Nu am putut înregistra semnătura.'))
    } finally {
      setSigning(false)
    }
  }

  const card = {
    p: { xs: 2, md: 3 },
    borderRadius: `${TOKENS.radius.lg}px`,
    border: `1px solid ${TOKENS.border}`,
    bgcolor: TOKENS.paper,
  } as const

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: TOKENS.surface, py: { xs: 3, md: 6 } }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 34, width: 'auto', alignSelf: 'center' }} />

          {loading && (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: TOKENS.primary }} />
            </Box>
          )}

          {!loading && error && !request && (
            <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.lg}px`, fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          {signed && (
            <Stack spacing={2} sx={{ alignItems: 'center', py: 6, textAlign: 'center' }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 56, color: '#16A34A' }} />
              <Typography sx={{ fontWeight: 850, fontSize: '1.35rem', color: TOKENS.ink }}>
                Acordul a fost semnat
              </Typography>
            </Stack>
          )}

          {!loading && request && !signed && (
            <>
              <Typography
                component="h1"
                sx={{ fontWeight: 850, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: TOKENS.ink, textAlign: 'center' }}
              >
                Acordul proprietarului pentru sediul profesional
              </Typography>

              <Box sx={card}>
                <Typography sx={{ color: TOKENS.ink, lineHeight: 1.7 }}>{request.consentText}</Typography>
              </Box>

              <Box sx={card}>
                <Typography sx={{ fontWeight: 800, color: TOKENS.ink, mb: 2 }}>
                  Semnătura, {request.ownerName}
                </Typography>

                <SignaturePad onChange={setSignature} disabled={signing} />

                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: `${TOKENS.radius.md}px`, fontWeight: 600 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  onClick={() => void sign()}
                  disabled={!signature || signing}
                  sx={{
                    mt: 2.5,
                    py: 1.3,
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: `${TOKENS.radius.md}px`,
                    bgcolor: TOKENS.primary,
                    '&:hover': { bgcolor: TOKENS.primaryStrong },
                  }}
                >
                  {signing ? 'Se înregistrează…' : 'Semnez acordul'}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
