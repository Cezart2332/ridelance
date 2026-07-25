import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { documentService } from '../../services/document.service'
import {
  onboardingService,
  type ArrState,
  type ArrSubmissionMethod,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Inițiată',
  DossierGenerated: 'Dosar generat',
  Submitted: 'Depusă la ARR',
  Issued: 'Autorizație emisă',
  Rejected: 'Respinsă',
}

export default function OnboardingArrPage() {
  const navigate = useNavigate()
  const { state } = useOnboardingState()

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arr, setArr] = useState<ArrState | null>(null)

  const [agencyName, setAgencyName] = useState('')
  const [method, setMethod] = useState<ArrSubmissionMethod>('InPersonByClient')

  useEffect(() => {
    onboardingService
      .getArrState()
      .then((a) => {
        if (!a) return
        setArr(a)
        setAgencyName(a.agencyName ?? '')
        setMethod(a.submissionMethod)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const saveRequest = () => run(async () => setArr(await onboardingService.submitArrRequest(agencyName || null, method)))
  const generate = () => run(async () => setArr(await onboardingService.generateArrDossier()))
  const markSubmitted = () =>
    run(async () => {
      await onboardingService.markArrSubmitted()
      setArr(await onboardingService.getArrState())
    })

  if (loading) {
    return (
      <OnboardingLayout state={state} activeKey="autorizatietransport">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  const fee = ((arr?.feeSnapshotBani ?? 30000) / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })

  return (
    <OnboardingLayout state={state} activeKey="autorizatietransport">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Autorizație de transport alternativ (ARR)
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Pregătim dosarul cu documentele tale și îl depui la agenția ARR. Taxa ARR este de {fee} lei.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 0.5 }}>
            Documentele pentru autorizație
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', mb: 1.5 }}>
            Încarcă certificatul de înregistrare, atestatul, cazierul, adeverința medicală și dovada
            de plată ARR, apoi trimite-le la validare. Sunt necesare pentru înrolare.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/onboarding/sections/AutorizatieTransport')}
            sx={{ textTransform: 'none', fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}>
            Deschide documentele
          </Button>
        </Paper>

        {arr && (
          <Chip
            label={`Status: ${STATUS_LABELS[arr.status] ?? arr.status}`}
            sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            color={arr.status === 'Issued' ? 'success' : 'default'}
          />
        )}

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Stack spacing={2}>
            <TextField label="Agenție ARR (județ)" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} sx={inputSx} fullWidth />
            <TextField
              select
              label="Metodă de depunere"
              value={method}
              onChange={(e) => setMethod(e.target.value as ArrSubmissionMethod)}
              sx={inputSx}
              fullWidth
            >
              <MenuItem value="InPersonByClient">Depun personal la ARR</MenuItem>
              <MenuItem value="OnlineByRidelance">Depunere online prin RIDElance</MenuItem>
            </TextField>
            <Box>
              <Button variant="outlined" onClick={saveRequest} disabled={busy}
                sx={{ textTransform: 'none', fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}>
                Salvează cererea
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink, mb: 1.5 }}>
            Dosarul ARR
          </Typography>
          {arr?.hasDossier && arr.dossierDocumentId ? (
            <Stack spacing={1.5}>
              <Alert icon={<CheckCircleOutlineRoundedIcon />} severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                Dosarul a fost generat.
              </Alert>
              <Button
                startIcon={<DescriptionRoundedIcon />}
                onClick={() => documentService.openInNewTab(arr.dossierDocumentId!, 'Dosar_ARR.pdf')}
                sx={{ textTransform: 'none', fontWeight: 700, color: TOKENS.primaryStrong, alignSelf: 'flex-start' }}
              >
                Vezi dosarul
              </Button>
              <Button onClick={generate} disabled={busy} sx={{ textTransform: 'none', color: TOKENS.textMuted, alignSelf: 'flex-start' }}>
                Regenerează
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={generate} disabled={busy || !arr}
              sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
              {busy ? 'Se generează...' : 'Generează dosarul'}
            </Button>
          )}

          {arr?.hasDossier && (
            <>
              <Divider sx={{ my: 2 }} />
              {arr.submittedAtUtc ? (
                <Typography sx={{ color: '#2e7d32', fontWeight: 700 }}>
                  Ai marcat dosarul ca depus la ARR.
                </Typography>
              ) : (
                <Button variant="contained" onClick={markSubmitted} disabled={busy}
                  sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
                  Am depus dosarul la ARR
                </Button>
              )}
            </>
          )}
        </Paper>

        {arr?.status === 'Issued' && (
          <Alert severity="success" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
            Autorizație emisă{arr.authorizationNumber ? ` (nr. ${arr.authorizationNumber})` : ''}
            {arr.authorizationExpiresOn ? `, valabilă până la ${arr.authorizationExpiresOn}` : ''}.
          </Alert>
        )}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/onboarding')} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
            Înapoi
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/onboarding')}
            sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}
          >
            Trimite datele
          </Button>
        </Stack>
      </Stack>
    </OnboardingLayout>
  )
}
