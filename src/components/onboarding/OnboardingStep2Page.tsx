import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
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
  type Step2State,
  type VatAnswer,
  type VatRegistrationKind,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { DocumentFirstUpload } from './DocumentFirstUpload'
import OnboardingLayout from './OnboardingLayout'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboardingState } from './useOnboardingState'

const BANKS = [
  'BCR',
  'Banca Transilvania',
  'BRD',
  'ING Bank',
  'Raiffeisen Bank',
  'UniCredit Bank',
  'CEC Bank',
  'Alpha Bank',
  'OTP Bank',
  'First Bank',
  'Libra Internet Bank',
  'Revolut',
]

const OBLIO_CONSENTS: { key: keyof OblioForm; label: string }[] = [
  { key: 'accountCreationConsent', label: 'Sunt de acord cu crearea unui cont Oblio pe numele meu.' },
  { key: 'dataProcessingConsent', label: 'Sunt de acord cu prelucrarea datelor pentru facturare.' },
  { key: 'eInvoiceConsent', label: 'Sunt de acord cu emiterea facturilor electronice (e-Factura).' },
  { key: 'autoInvoicingConsent', label: 'Sunt de acord cu facturarea automată a curselor.' },
  { key: 'ridelanceManagementConsent', label: 'Sunt de acord ca RIDElance să administreze contul Oblio.' },
  { key: 'termsAcceptedConsent', label: 'Am citit și accept termenii și condițiile Oblio.' },
]

interface OblioForm {
  accountCreationConsent: boolean
  dataProcessingConsent: boolean
  eInvoiceConsent: boolean
  autoInvoicingConsent: boolean
  ridelanceManagementConsent: boolean
  termsAcceptedConsent: boolean
}

const emptyOblio: OblioForm = {
  accountCreationConsent: false,
  dataProcessingConsent: false,
  eInvoiceConsent: false,
  autoInvoicingConsent: false,
  ridelanceManagementConsent: false,
  termsAcceptedConsent: false,
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: `${TOKENS.radius.lg}px`, border: `1px solid ${TOKENS.border}` }}>
      <Typography sx={{ fontWeight: 750, fontSize: '1.05rem', color: TOKENS.ink }}>{title}</Typography>
      {subtitle && <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mt: 0.3, mb: 1.5 }}>{subtitle}</Typography>}
      <Box sx={{ mt: subtitle ? 0 : 1.5 }}>{children}</Box>
    </Paper>
  )
}

export default function OnboardingStep2Page() {
  const navigate = useNavigate()
  const { state, documents, refresh } = useOnboardingState()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step2, setStep2] = useState<Step2State | null>(null)

  // VAT
  const [vatAnswer, setVatAnswer] = useState<VatAnswer>('Unknown')
  const [vatKind, setVatKind] = useState<VatRegistrationKind>('None')
  const [savingVat, setSavingVat] = useState(false)

  // Bank
  const [bankName, setBankName] = useState('')
  const [savingBank, setSavingBank] = useState(false)

  // Oblio
  const [oblioEmail, setOblioEmail] = useState('')
  const [oblio, setOblio] = useState<OblioForm>(emptyOblio)
  const [savingOblio, setSavingOblio] = useState(false)

  const reload = async () => {
    const data = await onboardingService.getStep2State()
    setStep2(data)
    if (data.fiscal) {
      setVatAnswer(data.fiscal.vatAnswer)
      setVatKind(data.fiscal.vatRegistrationKind)
    }
    if (data.bank) setBankName(data.bank.bankName ?? '')
    if (data.oblio) {
      setOblioEmail(data.oblio.accountEmail ?? '')
      setOblio({
        accountCreationConsent: data.oblio.accountCreationConsent,
        dataProcessingConsent: data.oblio.dataProcessingConsent,
        eInvoiceConsent: data.oblio.eInvoiceConsent,
        autoInvoicingConsent: data.oblio.autoInvoicingConsent,
        ridelanceManagementConsent: data.oblio.ridelanceManagementConsent,
        termsAcceptedConsent: data.oblio.termsAcceptedConsent,
      })
    }
  }

  useEffect(() => {
    reload()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const saveVat = async () => {
    setSavingVat(true)
    setError(null)
    try {
      await onboardingService.submitVat(vatAnswer, vatAnswer === 'Yes' ? vatKind : 'None')
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingVat(false)
    }
  }

  const saveBank = async () => {
    setSavingBank(true)
    setError(null)
    try {
      await onboardingService.submitBankDeclaration({ bankName: bankName || null })
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingBank(false)
    }
  }

  const saveOblio = async () => {
    setSavingOblio(true)
    setError(null)
    try {
      await onboardingService.acceptOblioConsents({ accountEmail: oblioEmail || null, ...oblio })
      await reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingOblio(false)
    }
  }

  if (loading) {
    return (
      <OnboardingLayout state={state} activeKey="fiscal">
        <Stack sx={{ alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TOKENS.primary }} />
        </Stack>
      </OnboardingLayout>
    )
  }

  const allOblio = Object.values(oblio).every(Boolean)

  return (
    <OnboardingLayout state={state} activeKey="fiscal">
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: TOKENS.ink }}>
            Fiscal, bancă și semnături
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.92rem', mt: 0.5 }}>
            Completează informațiile fiscale, contul bancar și consimțămintele pentru facturare.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>{error}</Alert>}

        {/* 2.1 TVA */}
        <Card title="TVA" subtitle="Ești înregistrat în scopuri de TVA?">
          <RadioGroup value={vatAnswer} onChange={(e) => setVatAnswer(e.target.value as VatAnswer)}>
            <FormControlLabel value="No" control={<Radio />} label="Nu" />
            <FormControlLabel value="Yes" control={<Radio />} label="Da" />
            <FormControlLabel value="DontKnow" control={<Radio />} label="Nu știu" />
          </RadioGroup>
          {vatAnswer === 'Yes' && (
            <TextField
              select
              label="Tip înregistrare TVA"
              value={vatKind}
              onChange={(e) => setVatKind(e.target.value as VatRegistrationKind)}
              sx={{ ...inputSx, mt: 1.5 }}
              fullWidth
            >
              <MenuItem value="SpecialArticle317">Cod special (art. 317 — intracomunitar)</MenuItem>
              <MenuItem value="StandardVat">Plătitor de TVA obișnuit</MenuItem>
              <MenuItem value="Unknown">Nu sunt sigur</MenuItem>
            </TextField>
          )}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={saveVat} disabled={savingVat}
              sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
              {savingVat ? 'Se salvează...' : 'Salvează'}
            </Button>
          </Box>
        </Card>

        {/* 2.3 Bancă */}
        <Card title="Cont bancar" subtitle="Contul PFA pe care primești încasările.">
          {step2?.bank?.ibanMasked && (
            <Alert severity={step2.bank.status === 'Verified' ? 'success' : 'info'} sx={{ mb: 2, borderRadius: `${TOKENS.radius.md}px` }}>
              IBAN înregistrat: <strong>{step2.bank.ibanMasked}</strong> · status: {step2.bank.status}
              {step2.bank.source === 'OpenBanking' && ' (verificat prin open banking)'}
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
            <DocumentFirstUpload
              category="ExtrasBancar"
              label="Extras de cont / confirmare IBAN"
              hint="Citim automat IBAN-ul din document. Nu trebuie să-l scrii."
              documents={documents}
              pfaRegistrationId={state?.pfaRegistrationId}
              onUploaded={refresh}
            />
          </Box>
          <Stack spacing={2}>
            <TextField select label="Bancă" value={bankName} onChange={(e) => setBankName(e.target.value)} sx={inputSx} fullWidth>
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={saveBank} disabled={savingBank}
              sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
              {savingBank ? 'Se salvează...' : 'Salvează contul'}
            </Button>
          </Box>
        </Card>

        {/* 2.4 Oblio */}
        <Card title="Cont Oblio (facturare)" subtitle="Consimțămintele necesare pentru emiterea automată a facturilor.">
          <TextField label="Email cont Oblio" type="email" value={oblioEmail} onChange={(e) => setOblioEmail(e.target.value)} sx={{ ...inputSx, mb: 1 }} fullWidth />
          <Stack>
            {OBLIO_CONSENTS.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={<Checkbox checked={oblio[key]} onChange={(e) => setOblio((o) => ({ ...o, [key]: e.target.checked }))} />}
                label={<Typography sx={{ fontSize: '0.86rem', color: TOKENS.ink }}>{label}</Typography>}
              />
            ))}
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={saveOblio} disabled={savingOblio}
              sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: TOKENS.primary, '&:hover': { backgroundColor: TOKENS.primaryStrong } }}>
              {savingOblio ? 'Se salvează...' : allOblio ? 'Accept toate' : 'Salvează'}
            </Button>
          </Box>
        </Card>

        {/* 2.2 Semnături (read-only) */}
        <Card title="Pachet de semnături" subtitle="Împuternicirile și contractele se pregătesc de echipa RIDElance.">
          {step2?.signature ? (
            <Stack spacing={1.2}>
              <Chip
                icon={step2.signature.status === 'Completed' ? <CheckCircleOutlineRoundedIcon /> : undefined}
                label={`Status: ${step2.signature.status} · ${step2.signature.provider}`}
                sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
              />
              {step2.signature.documents.length > 0 && <Divider />}
              {step2.signature.documents.map((d) => (
                <Stack key={d.type} direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.88rem', color: TOKENS.ink }}>{d.label ?? d.type}</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: d.isSigned ? '#2e7d32' : TOKENS.textMuted, fontWeight: 700 }}>
                    {d.isSigned ? 'Semnat' : 'În așteptare'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem' }}>
              Pachetul de semnături nu a fost încă pregătit. Te anunțăm când e gata de semnat.
            </Typography>
          )}
        </Card>

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
