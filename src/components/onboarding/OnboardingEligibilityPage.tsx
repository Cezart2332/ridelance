import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Alert,
  Box,
  Button,
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
  type EligibilityProfile,
  type EligibilityStatus,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

function statusVisual(status: EligibilityStatus): { color: string; bg: string; label: string } {
  switch (status) {
    case 'Eligible':
      return { color: '#2e7d32', bg: 'rgba(46,125,50,0.08)', label: 'Eligibil' }
    case 'Ineligible':
      return { color: '#b71c1c', bg: 'rgba(211,47,47,0.08)', label: 'Neeligibil' }
    default:
      return { color: '#b54708', bg: 'rgba(237,108,2,0.1)', label: 'De verificat' }
  }
}

export default function OnboardingEligibilityPage() {
  const navigate = useNavigate()
  const { state } = useOnboardingState()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EligibilityProfile | null>(null)

  const [dateOfBirth, setDateOfBirth] = useState('')
  const [categoryBObtainedOn, setCategoryBObtainedOn] = useState('')
  const [drivingCategories, setDrivingCategories] = useState('')
  const [drivingLicenceExpiresOn, setDrivingLicenceExpiresOn] = useState('')
  const [hasDriverCertificate, setHasDriverCertificate] = useState<'yes' | 'no'>('yes')
  const [driverCertificateExpiresOn, setDriverCertificateExpiresOn] = useState('')

  useEffect(() => {
    let active = true
    onboardingService
      .getEligibility()
      .then((p) => {
        if (!active || !p) return
        setResult(p)
        setDateOfBirth(p.dateOfBirth ?? '')
        setCategoryBObtainedOn(p.categoryBObtainedOn ?? '')
        setDrivingCategories(p.drivingCategories ?? '')
        setDrivingLicenceExpiresOn(p.drivingLicenceExpiresOn ?? '')
        setHasDriverCertificate(p.hasDriverCertificate ? 'yes' : 'no')
        setDriverCertificateExpiresOn(p.driverCertificateExpiresOn ?? '')
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const profile = await onboardingService.submitEligibility({
        dateOfBirth: dateOfBirth || null,
        categoryBObtainedOn: categoryBObtainedOn || null,
        drivingCategories: drivingCategories || null,
        drivingLicenceExpiresOn: drivingLicenceExpiresOn || null,
        hasDriverCertificate: hasDriverCertificate === 'yes',
        driverCertificateExpiresOn:
          hasDriverCertificate === 'yes' ? driverCertificateExpiresOn || null : null,
      })
      setResult(profile)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <OnboardingLayout state={state} activeKey="eligibility">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  const visual = result ? statusVisual(result.status) : null

  return (
    <OnboardingLayout state={state} activeKey="eligibility">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Eligibilitate
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Verificăm câteva condiții de bază: vârsta de minimum 21 de ani, categoria B deținută
            de cel puțin 2 ani și atestatul de transport alternativ valabil.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        {visual && (
          <Alert
            icon={
              result?.status === 'Eligible' ? (
                <CheckCircleOutlineRoundedIcon />
              ) : result?.status === 'Ineligible' ? (
                <ErrorOutlineRoundedIcon />
              ) : (
                <InfoOutlinedIcon />
              )
            }
            sx={{
              borderRadius: `${TOKENS.radius.md}px`,
              color: visual.color,
              backgroundColor: visual.bg,
              '& .MuiAlert-icon': { color: visual.color },
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>{visual.label}</Typography>
            {result && result.reasons.length > 0 && (
              <Box component="ul" sx={{ m: '4px 0 0', pl: 2.2 }}>
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </Box>
            )}
          </Alert>
        )}

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Stack spacing={2.5}>
            <TextField
              label="Data nașterii"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={inputSx}
              fullWidth
            />
            <TextField
              label="Data obținerii categoriei B"
              type="date"
              value={categoryBObtainedOn}
              onChange={(e) => setCategoryBObtainedOn(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={inputSx}
              fullWidth
            />
            <TextField
              label="Categorii permis (ex. B, BE)"
              value={drivingCategories}
              onChange={(e) => setDrivingCategories(e.target.value)}
              sx={inputSx}
              fullWidth
            />
            <TextField
              label="Permisul expiră la"
              type="date"
              value={drivingLicenceExpiresOn}
              onChange={(e) => setDrivingLicenceExpiresOn(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={inputSx}
              fullWidth
            />

            <Box>
              <Typography sx={{ fontWeight: 700, color: TOKENS.ink, mb: 0.5 }}>
                Ai atestat de transport alternativ?
              </Typography>
              <RadioGroup
                row
                value={hasDriverCertificate}
                onChange={(e) => setHasDriverCertificate(e.target.value as 'yes' | 'no')}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Da" />
                <FormControlLabel value="no" control={<Radio />} label="Nu" />
              </RadioGroup>
            </Box>

            {hasDriverCertificate === 'yes' && (
              <TextField
                label="Atestatul expiră la"
                type="date"
                value={driverCertificateExpiresOn}
                onChange={(e) => setDriverCertificateExpiresOn(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={inputSx}
                fullWidth
              />
            )}
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/onboarding')} sx={{ textTransform: 'none', color: TOKENS.textMuted }}>
            Înapoi
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: TOKENS.primary,
              '&:hover': { backgroundColor: TOKENS.primaryStrong },
            }}
          >
            {saving ? 'Se salvează...' : 'Salvează și verifică'}
          </Button>
        </Stack>
      </Stack>
    </OnboardingLayout>
  )
}
