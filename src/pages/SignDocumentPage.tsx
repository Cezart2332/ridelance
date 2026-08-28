import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { useParams } from 'react-router-dom'

import { SignaturePad, type SignatureResult } from '../components/onboarding/companyFormation/SignaturePad'
import { signingService, type SignatureRequest } from '../services/signing.service'
import { TOKENS } from '../constants/tokens'
import logo from '../assets/logo.svg'

/**
 * Pagina pe care o deschide chiriașul din email.
 *
 * Public prin proiectare: cine semnează n-are cont RIDElance și nu trebuie să-și facă unul
 * (spec §7). Linkul e autentificarea, iar pagina nu cere nimic altceva.
 *
 * Documentul se citește înainte de a fi semnat, în aceeași pagină. O semnătură dată peste un
 * fișier pe care nu l-ai deschis nu e o semnătură, e un click.
 */

export function SignDocumentPage() {
  const { token = '' } = useParams()

  const [request, setRequest] = useState<SignatureRequest | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    signingService
      .get(token)
      .then(async (data) => {
        if (cancelled) return
        setRequest(data)
        const blob = await signingService.downloadDocument(token)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setFileUrl(objectUrl)
      })
      .catch((cause) => {
        if (cancelled) return
        const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setError(detail ?? 'Linkul nu mai e valabil.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [token])

  const sign = async () => {
    if (!signature) return
    setSigning(true)
    setError(null)
    try {
      await signingService.sign(token, signature.image)
      setSigned(true)
    } catch (cause) {
      const detail = (cause as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Nu am putut înregistra semnătura.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: TOKENS.surface, py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
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
                Documentul a fost semnat
              </Typography>
              <Typography sx={{ color: TOKENS.textMuted, maxWidth: 420 }}>
                Proprietarul a primit versiunea semnată. Poți închide pagina — linkul nu mai poate
                fi folosit a doua oară.
              </Typography>
            </Stack>
          )}

          {!loading && request && !signed && (
            <>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 850, fontSize: { xs: '1.3rem', md: '1.6rem' }, color: TOKENS.ink }}>
                  {request.documentTitle}
                </Typography>
                <Typography sx={{ color: TOKENS.textMuted, mt: 0.5 }}>
                  {request.companyName} · {request.rentalCode}
                </Typography>
              </Box>

              <Box
                sx={{
                  height: { xs: 380, md: 560 },
                  borderRadius: `${TOKENS.radius.lg}px`,
                  border: `1px solid ${TOKENS.border}`,
                  overflow: 'hidden',
                  bgcolor: TOKENS.paper,
                }}
              >
                {fileUrl ? (
                  <Box
                    component="iframe"
                    src={fileUrl}
                    title={request.documentTitle}
                    sx={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                    <CircularProgress sx={{ color: TOKENS.primary }} />
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: `${TOKENS.radius.lg}px`,
                  border: `1px solid ${TOKENS.border}`,
                  bgcolor: TOKENS.paper,
                }}
              >
                <Typography sx={{ fontWeight: 800, color: TOKENS.ink, mb: 0.5 }}>
                  Semnătura, {request.tenantName}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: TOKENS.textMuted, mb: 2 }}>
                  Semnează cu degetul sau cu mouse-ul. Se înregistrează momentul, adresa IP și
                  dispozitivul, ca dovadă a semnării.
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
                  {signing ? 'Se înregistrează…' : 'Semnez documentul'}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
