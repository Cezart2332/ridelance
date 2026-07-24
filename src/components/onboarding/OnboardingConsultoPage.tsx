import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { onboardingService, type PartnerLead } from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const HOUSING_TYPES = ['Proprietate personală', 'Chirie', 'Comodat', 'Spațiu pus la dispoziție de partener']

const STATUS_LABELS: Record<string, string> = {
  RequestSent: 'Cerere trimisă',
  Contacted: 'Contactat de partener',
  InProgress: 'În lucru',
  PfaCreated: 'PFA înființat',
  Cancelled: 'Anulat',
}

export default function OnboardingConsultoPage() {
  const navigate = useNavigate()
  const { state, loading: stateLoading } = useOnboardingState()

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [county, setCounty] = useState('')
  const [housingType, setHousingType] = useState('')
  const [consent, setConsent] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lead, setLead] = useState<PartnerLead | null>(null)

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await onboardingService.submitPartnerLead({
        phone: phone || null,
        email: email || null,
        county: county || null,
        housingType: housingType || null,
        dataSharingConsent: consent,
      })
      setLead(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (stateLoading) {
    return (
      <OnboardingLayout state={state} activeKey="pfa">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout state={state} activeKey="pfa">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Înființare PFA prin partener
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Trimitem datele tale către partenerul nostru de înființare (Consulto), care te contactează
            și se ocupă de tot procesul. Nu-ți cerem nicio parolă.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        {lead ? (
          <Alert
            icon={<CheckCircleOutlineRoundedIcon />}
            severity="success"
            sx={{ borderRadius: `${TOKENS.radius.md}px` }}
          >
            Cererea a fost trimisă către {lead.provider}. Status curent:{' '}
            <strong>{STATUS_LABELS[lead.status] ?? lead.status}</strong>. Te contactăm în cel mai scurt timp.
          </Alert>
        ) : (
          <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
            <Stack spacing={2.5}>
              <TextField label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} sx={inputSx} fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputSx} fullWidth />
              <TextField label="Județ" value={county} onChange={(e) => setCounty(e.target.value)} sx={inputSx} fullWidth />
              <TextField
                select
                label="Găzduire sediu social"
                value={housingType}
                onChange={(e) => setHousingType(e.target.value)}
                sx={inputSx}
                fullWidth
              >
                {HOUSING_TYPES.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </TextField>

              <FormControlLabel
                control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                label={
                  <Typography sx={{ fontSize: '0.88rem', color: TOKENS.ink }}>
                    Sunt de acord ca datele mele să fie transmise partenerului de înființare PFA.
                  </Typography>
                }
              />
            </Stack>
          </Paper>
        )}

        {!lead && (
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
            <Button onClick={() => navigate('/onboarding')} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
              Înapoi
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || !consent}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              {saving ? 'Se trimite...' : 'Trimite cererea'}
            </Button>
          </Stack>
        )}
      </Stack>
    </OnboardingLayout>
  )
}
