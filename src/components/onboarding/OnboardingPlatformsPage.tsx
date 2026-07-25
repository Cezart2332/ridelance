import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  onboardingService,
  type ExistingAccountAnswer,
  type PlatformAccount,
  type PlatformOnboardingState,
  type PlatformProvider,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Neînceput',
  Selected: 'Selectat',
  AccountLinked: 'Cont legat',
  ContractSigned: 'Contract semnat',
  Active: 'Activ',
  Skipped: 'Nefolosit',
}

function PlatformCard({
  provider,
  account,
  onSaved,
}: {
  provider: PlatformProvider
  account: PlatformAccount | undefined
  onSaved: (s: PlatformOnboardingState) => void
}) {
  const [answer, setAnswer] = useState<ExistingAccountAnswer>(
    account?.existingAccountAnswer ?? (account?.hasExistingAccount ? 'HasOperatorAccount' : 'None'),
  )
  const [operatorId, setOperatorId] = useState(account?.operatorAccountId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const next = await onboardingService.submitPlatformAccount({
        provider,
        hasExistingAccount: answer === 'HasOperatorAccount',
        operatorAccountId: operatorId || null,
        existingAccountAnswer: answer,
      })
      onSaved(next)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink }}>{provider}</Typography>
        {account && <Chip size="small" label={STATUS_LABELS[account.onboardingStatus] ?? account.onboardingStatus} sx={{ fontWeight: 700 }} />}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

      <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 0.5 }}>Ai deja cont pe {provider}?</Typography>
      <RadioGroup value={answer} onChange={(e) => setAnswer(e.target.value as ExistingAccountAnswer)}>
        <FormControlLabel value="HasOperatorAccount" control={<Radio />} label="Da, am cont de operator/fleet" />
        <FormControlLabel value="DriverOnly" control={<Radio />} label="Am cont de șofer, dar nu de operator/fleet" />
        <FormControlLabel value="None" control={<Radio />} label="Nu am cont" />
        <FormControlLabel value="Unknown" control={<Radio />} label="Nu știu ce tip de cont am" />
      </RadioGroup>

      <TextField
        label={`ID cont operator ${provider} (opțional)`}
        value={operatorId}
        onChange={(e) => setOperatorId(e.target.value)}
        sx={{ ...inputSx, mt: 1 }}
        fullWidth
      />

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={save} disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
          {busy ? 'Se salvează...' : 'Salvează'}
        </Button>
      </Box>
    </Paper>
  )
}

export default function OnboardingPlatformsPage() {
  const navigate = useNavigate()
  const { state } = useOnboardingState()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PlatformOnboardingState | null>(null)

  const [uber, setUber] = useState(false)
  const [bolt, setBolt] = useState(false)

  const applyData = (d: PlatformOnboardingState) => {
    setData(d)
    setUber(d.platforms.find((p) => p.provider === 'Uber')?.isSelectedByUser ?? false)
    setBolt(d.platforms.find((p) => p.provider === 'Bolt')?.isSelectedByUser ?? false)
  }

  useEffect(() => {
    onboardingService
      .getPlatformOnboarding()
      .then(applyData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const saveSelection = async () => {
    setError(null)
    try {
      applyData(await onboardingService.selectPlatforms(uber, bolt))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <OnboardingLayout state={state} activeKey="platforms">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  const uberAccount = data?.platforms.find((p) => p.provider === 'Uber')
  const boltAccount = data?.platforms.find((p) => p.provider === 'Bolt')

  return (
    <OnboardingLayout state={state} activeKey="platforms">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Conturi Uber & Bolt
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Alege platformele pe care vrei să lucrezi. Nu-ți cerem parole — doar confirmarea contului de operator.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 1 }}>Pe ce platforme vrei să lucrezi?</Typography>
          <Stack>
            <FormControlLabel control={<Checkbox checked={uber} onChange={(e) => setUber(e.target.checked)} />} label="Uber" />
            <FormControlLabel control={<Checkbox checked={bolt} onChange={(e) => setBolt(e.target.checked)} />} label="Bolt" />
          </Stack>
          <Box sx={{ mt: 1 }}>
            <Button variant="outlined" onClick={saveSelection}
              sx={{ textTransform: 'none', fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}>
              Salvează selecția
            </Button>
          </Box>
        </Paper>

        {uber && <PlatformCard provider="Uber" account={uberAccount} onSaved={applyData} />}
        {bolt && <PlatformCard provider="Bolt" account={boltAccount} onSaved={applyData} />}

        <Stack direction="row">
          <Button onClick={() => navigate('/onboarding')} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
            Înapoi la pași
          </Button>
        </Stack>
      </Stack>
    </OnboardingLayout>
  )
}
