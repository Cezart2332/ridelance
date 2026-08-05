import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Alert, Box, Button, FormControlLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import {
  onboardingService,
  type EligibilityProfile,
  type EligibilityStatus,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { StepDocument } from './StepDocument'
import { useOnboarding } from './useOnboarding'
import { stateColors, TOKENS } from './onboardingTheme'
import { PanelActions, PanelCard, PanelHeading } from './PanelCard'

function statusVisual(status: EligibilityStatus) {
  switch (status) {
    case 'Eligible':
      return { ...stateColors('success'), label: 'Eligibil' }
    case 'Ineligible':
      return { ...stateColors('danger'), label: 'Neeligibil' }
    default:
      return { ...stateColors('pending'), label: 'De verificat' }
  }
}

export default function OnboardingEligibilityPage() {
  // Profilul de eligibilitate vine deja din provider — nu-l mai cerem încă o dată.
  const { eligibility, refresh } = useOnboarding()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<EligibilityProfile | null>(null)

  const result = submitted ?? eligibility

  // Răspunsul urmărește serverul până când userul îl atinge — apoi rămâne al lui.
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)
  const hasDriverCertificate = answer ?? (result?.hasDriverCertificate === false ? 'no' : 'yes')
  const setHasDriverCertificate = setAnswer

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      // Trimitem doar răspunsul la întrebare — restul datelor se citesc din documente (OCR).
      const profile = await onboardingService.submitEligibility({
        dateOfBirth: null,
        categoryBObtainedOn: null,
        drivingCategories: null,
        drivingLicenceExpiresOn: null,
        hasDriverCertificate: hasDriverCertificate === 'yes',
        driverCertificateExpiresOn: null,
      })
      setSubmitted(profile)
      await refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const visual = result ? statusVisual(result.status) : null

  return (
    <Stack spacing={3}>
      <PanelHeading title="Eligibilitate" />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

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
            color: visual.fg,
            backgroundColor: visual.bg,
            '& .MuiAlert-icon': { color: visual.fg },
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

      {/* Document-first: userul doar încarcă; datele se citesc pe backend (OCR) */}
      <PanelCard title="Documentele tale">
        <Stack spacing={2.5}>
          <StepDocument step="eligibility" category="CarteIdentitate" label="Cartea de identitate" />
          <StepDocument step="eligibility" category="PermisConducere" label="Permisul de conducere" />
        </Stack>
      </PanelCard>

      {/* Întrebarea stă deasupra documentului pe care îl cere — nu invers. */}
      <PanelCard>
        <Stack spacing={2.5}>
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
            <StepDocument
              step="eligibility"
              category="AtestatSofer"
              label="Atestatul de transport alternativ"
            />
          )}

          {/* Fără atestat nu se poate continua — singurul lucru de spus e de unde se obține. */}
          {hasDriverCertificate === 'no' && (
            <Alert
              severity="warning"
              sx={{ borderRadius: `${TOKENS.radius.md}px` }}
              action={
                <Button
                  size="small"
                  color="warning"
                  href="https://www.arr.ro"
                  target="_blank"
                  rel="noopener"
                  sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  ARR
                </Button>
              }
            >
              Ai nevoie de atestat ca să continui.
            </Alert>
          )}
        </Stack>
      </PanelCard>

      <PanelActions>
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
          {saving ? 'Se trimite...' : 'Trimite datele'}
        </Button>
      </PanelActions>
    </Stack>
  )
}
