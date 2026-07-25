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
import { DocumentFirstUpload } from './DocumentFirstUpload'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS } from './onboardingTheme'
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
  const { state, documents, refresh } = useOnboardingState()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EligibilityProfile | null>(null)

  const [hasDriverCertificate, setHasDriverCertificate] = useState<'yes' | 'no'>('yes')

  useEffect(() => {
    let active = true
    onboardingService
      .getEligibility()
      .then((p) => {
        if (!active || !p) return
        setResult(p)
        setHasDriverCertificate(p.hasDriverCertificate ? 'yes' : 'no')
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
      // Trimitem doar răspunsul la întrebare — restul datelor se citesc din documente (OCR).
      const profile = await onboardingService.submitEligibility({
        dateOfBirth: null,
        categoryBObtainedOn: null,
        drivingCategories: null,
        drivingLicenceExpiresOn: null,
        hasDriverCertificate: hasDriverCertificate === 'yes',
        driverCertificateExpiresOn: null,
      })
      setResult(profile)
      navigate('/onboarding')
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
            Încarcă documentele și trimite-le. Datele se citesc automat din ele și le verifică
            echipa RIDElance — tu nu trebuie să completezi nimic. Dacă un document nu e bun,
            primești email cu motivul și îl reîncarci.
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

        {/* Document-first: userul doar încarcă; datele se citesc pe backend (OCR) */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
          <Typography sx={{ fontWeight: 750, fontSize: '1.02rem', color: TOKENS.ink, mb: 2 }}>
            Documentele tale
          </Typography>
          <Stack spacing={2.5}>
            <DocumentFirstUpload
              category="CarteIdentitate"
              label="Cartea de identitate"
              hint="Citim data nașterii pentru verificarea vârstei. Nu stocăm CNP-ul."
              documents={documents}
              pfaRegistrationId={state?.pfaRegistrationId}
              onUploaded={refresh}
            />
            <DocumentFirstUpload
              category="PermisConducere"
              label="Permisul de conducere"
              hint="Citim data obținerii categoriei B și data de expirare."
              documents={documents}
              pfaRegistrationId={state?.pfaRegistrationId}
              onUploaded={refresh}
            />
            {hasDriverCertificate === 'yes' && (
              <DocumentFirstUpload
                category="AtestatSofer"
                label="Atestatul de transport alternativ"
                hint="Citim data de expirare a atestatului."
                documents={documents}
                pfaRegistrationId={state?.pfaRegistrationId}
                onUploaded={refresh}
              />
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
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

            {hasDriverCertificate === 'no' && (
              <Alert severity="warning" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
                <Typography sx={{ fontWeight: 700, mb: 0.3 }}>În așteptarea atestatului</Typography>
                Pentru a lucra legal pe platformele de transport alternativ ai nevoie de atestat
                profesional. Obține atestatul, apoi revino în RIDElance pentru a continua. Contul și
                progresul rămân salvate.
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    href="https://www.arr.ro"
                    target="_blank"
                    rel="noopener"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Vezi cum obțin atestatul
                  </Button>
                </Box>
              </Alert>
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
            {saving ? 'Se trimite...' : 'Trimite datele'}
          </Button>
        </Stack>
      </Stack>
    </OnboardingLayout>
  )
}
