import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import {
  onboardingService,
  type ExistingAccountAnswer,
  type PlatformAccount,
  type PlatformOnboardingState,
  type PlatformProvider,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboarding, useOnboardingResource } from './useOnboarding'
import { PanelCard, PanelHeading } from './PanelCard'

const STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Neînceput',
  Selected: 'Selectat',
  AccountLinked: 'Cont legat',
  ContractSigned: 'Contract semnat',
  Active: 'Activ',
  Skipped: 'Nefolosit',
}

/** Conturile cerute sunt cele de flotă, nu cele de șofer — numele o spune direct. */
const FLEET_LABELS: Record<PlatformProvider, string> = {
  Uber: 'Uber Fleet',
  Bolt: 'Bolt Fleet',
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
  // Un dosar vechi salvat cu „nu știu" pornește fără nimic bifat: răspunsul se dă din nou.
  const saved = account?.existingAccountAnswer
  const [answer, setAnswer] = useState<ExistingAccountAnswer | ''>(
    saved && saved !== 'Unknown' ? saved : account?.hasExistingAccount ? 'HasOperatorAccount' : '',
  )
  const [operatorId, setOperatorId] = useState(account?.operatorAccountId ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [phone, setPhone] = useState(account?.phone ?? '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Are deja cont de flotă: cerem credențialele lui. Nu are: cerem ce vrea să aibă contul pe
  // care i-l deschidem noi. Câmpurile sunt aceleași, se schimbă doar ce înseamnă.
  const hasFleetAccount = answer === 'HasOperatorAccount'

  const save = async () => {
    if (answer === '') return
    setBusy(true)
    setError(null)
    try {
      const next = await onboardingService.submitPlatformAccount({
        provider,
        hasExistingAccount: hasFleetAccount,
        operatorAccountId: operatorId || null,
        existingAccountAnswer: answer,
        email: email || null,
        phone: phone || null,
        // Gol înseamnă „păstreaz-o pe cea salvată" — serverul nu ne-o trimite înapoi.
        password: password || null,
      })
      setPassword('')
      onSaved(next)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PanelCard
      title={FLEET_LABELS[provider]}
      action={
        account && (
          <Chip
            size="small"
            label={STATUS_LABELS[account.onboardingStatus] ?? account.onboardingStatus}
            sx={{ fontWeight: 700 }}
          />
        )
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 0.5 }}>
        Ai deja cont de {FLEET_LABELS[provider]}?
      </Typography>
      <RadioGroup value={answer} onChange={(e) => setAnswer(e.target.value as ExistingAccountAnswer)}>
        <FormControlLabel value="HasOperatorAccount" control={<Radio />} label="Da, am cont de flotă" />
        <FormControlLabel
          value="DriverOnly"
          control={<Radio />}
          label="Am cont de șofer, dar nu de flotă"
        />
        <FormControlLabel value="None" control={<Radio />} label="Nu am cont" />
      </RadioGroup>

      {answer !== '' && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>
            {hasFleetAccount
              ? `Datele contului tău de ${FLEET_LABELS[provider]}.`
              : `Datele cu care îți deschidem contul de ${FLEET_LABELS[provider]}.`}
          </Typography>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={inputSx}
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Telefon"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={inputSx}
            fullWidth
            autoComplete="tel"
          />
          <TextField
            label={hasFleetAccount ? 'Parola contului' : 'Parola dorită'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={
              account?.hasPassword
                ? 'O parolă este deja salvată. Completeaz-o doar dacă vrei s-o schimbi.'
                : undefined
            }
            sx={inputSx}
            fullWidth
            autoComplete="new-password"
          />

          <TextField
            label={`ID cont ${FLEET_LABELS[provider]} (opțional)`}
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            sx={inputSx}
            fullWidth
          />
        </Stack>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={save}
          disabled={busy || answer === ''}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            backgroundColor: TOKENS.primary,
            '&:hover': { backgroundColor: TOKENS.primaryStrong },
          }}
        >
          {busy ? 'Se salvează...' : 'Salvează'}
        </Button>
      </Box>
    </PanelCard>
  )
}

export default function OnboardingPlatformsPage() {
  const { refresh } = useOnboarding()
  const { data: loaded } = useOnboardingResource('platforms', () => onboardingService.getPlatformOnboarding())

  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<PlatformOnboardingState | null>(null)
  const data = saved ?? loaded

  // Bifele urmăresc datele de pe server până când userul le atinge — apoi rămân ale lui.
  const [selection, setSelection] = useState<{ uber: boolean; bolt: boolean } | null>(null)
  const serverSelection = {
    uber: data?.platforms.find((p) => p.provider === 'Uber')?.isSelectedByUser ?? false,
    bolt: data?.platforms.find((p) => p.provider === 'Bolt')?.isSelectedByUser ?? false,
  }
  const { uber, bolt } = selection ?? serverSelection

  const applyData = (d: PlatformOnboardingState) => {
    setSaved(d)
    setSelection(null)
    void refresh()
  }

  const saveSelection = async () => {
    setError(null)
    try {
      applyData(await onboardingService.selectPlatforms(uber, bolt))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const uberAccount = data?.platforms.find((p) => p.provider === 'Uber')
  const boltAccount = data?.platforms.find((p) => p.provider === 'Bolt')

  return (
    <Stack spacing={3}>
      <PanelHeading title="Conturi Uber Fleet & Bolt Fleet" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      <PanelCard title="Pe ce platforme vrei să lucrezi?">
        <Stack>
          <FormControlLabel
            control={
              <Checkbox checked={uber} onChange={(e) => setSelection({ uber: e.target.checked, bolt })} />
            }
            label="Uber Fleet"
          />
          <FormControlLabel
            control={
              <Checkbox checked={bolt} onChange={(e) => setSelection({ uber, bolt: e.target.checked })} />
            }
            label="Bolt Fleet"
          />
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            onClick={saveSelection}
            sx={{ fontWeight: 700, borderColor: TOKENS.primary, color: TOKENS.primaryStrong }}
          >
            Salvează selecția
          </Button>
        </Box>
      </PanelCard>

      {uber && <PlatformCard provider="Uber" account={uberAccount} onSaved={applyData} />}
      {bolt && <PlatformCard provider="Bolt" account={boltAccount} onSaved={applyData} />}
    </Stack>
  )
}
