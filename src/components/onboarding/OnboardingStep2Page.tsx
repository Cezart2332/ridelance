import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import {
  onboardingService,
  type VatDeclaration,
} from '../../services/onboarding.service'
import { getErrorMessage } from '../../utils/errorHandler'
import { BcrAccountDialog } from './BcrAccountDialog'
import { StepDocument } from './StepDocument'
import { TOKENS, inputSx } from './onboardingTheme'
import { useOnboarding, useOnboardingResource } from './useOnboarding'
import { PanelCard, PanelHeading } from './PanelCard'

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

export default function OnboardingStep2Page() {
  const { refresh, documents } = useOnboarding()
  const { data: step2 } = useOnboardingResource('step2', () => onboardingService.getStep2State())

  const [error, setError] = useState<string | null>(null)
  const [savingVat, setSavingVat] = useState(false)
  const [savingBank, setSavingBank] = useState(false)
  const [savingOblio, setSavingOblio] = useState(false)

  // Fiecare formular urmărește serverul până când userul îl atinge — apoi rămâne al lui.
  // `''` = nu s-a răspuns încă; dosarele vechi cu „nu știu" cad tot aici și trebuie răspuns din nou.
  const [vatForm, setVatForm] = useState<VatDeclaration | null>(null)
  const serverVat = step2?.fiscal?.vatAnswer
  const vatAnswer: VatDeclaration | '' =
    vatForm ?? (serverVat === 'Yes' || serverVat === 'No' ? serverVat : '')

  // Dovada codului special: fără ea, „Da" nu e o declarație pe care serverul o acceptă.
  const hasVatProof = documents.some(
    (d) => d.category === 'CertificatTvaIntracomunitar' && d.status.toLowerCase() !== 'rejected',
  )

  // Contul PFA: „Nu" nu e o dată de salvat, ci ramura în care îl ajutăm să deschidă unul.
  const [bankAnswer, setBankAnswer] = useState<'Yes' | 'No' | ''>('')
  const [bcrOpen, setBcrOpen] = useState(false)
  const hasBankOnServer = Boolean(step2?.bank?.ibanMasked ?? step2?.bank?.bankName)
  const bankChoice = bankAnswer || (hasBankOnServer ? 'Yes' : '')

  const [bankForm, setBankForm] = useState<string | null>(null)
  const bankName = bankForm ?? step2?.bank?.bankName ?? ''
  const setBankName = setBankForm

  const [oblioEmailForm, setOblioEmailForm] = useState<string | null>(null)
  const oblioEmail = oblioEmailForm ?? step2?.oblio?.accountEmail ?? ''
  const setOblioEmail = setOblioEmailForm

  const [oblioForm, setOblioForm] = useState<OblioForm | null>(null)
  const oblio: OblioForm =
    oblioForm ??
    (step2?.oblio
      ? {
          accountCreationConsent: step2.oblio.accountCreationConsent,
          dataProcessingConsent: step2.oblio.dataProcessingConsent,
          eInvoiceConsent: step2.oblio.eInvoiceConsent,
          autoInvoicingConsent: step2.oblio.autoInvoicingConsent,
          ridelanceManagementConsent: step2.oblio.ridelanceManagementConsent,
          termsAcceptedConsent: step2.oblio.termsAcceptedConsent,
        }
      : emptyOblio)
  const setOblio = (update: (current: OblioForm) => OblioForm) => setOblioForm(update(oblio))

  /** După fiecare salvare re-citim tot din provider, ca rail-ul să prindă schimbarea de status. */
  const reload = async () => {
    setVatForm(null)
    setBankForm(null)
    setOblioEmailForm(null)
    setOblioForm(null)
    await refresh()
  }

  const saveVat = async () => {
    if (vatAnswer === '') return
    setSavingVat(true)
    setError(null)
    try {
      await onboardingService.submitVat(vatAnswer)
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

  const allOblio = Object.values(oblio).every(Boolean)

  return (
    <Stack spacing={3}>
      <PanelHeading
        title="Fiscal, bancă și semnături"
        description="Completează informațiile fiscale, contul bancar și consimțămintele pentru facturare."
      />

      {error && (
        <Alert severity="error" sx={{ borderRadius: `${TOKENS.radius.md}px` }}>
          {error}
        </Alert>
      )}

      {/* 2.1 TVA intracomunitar */}
      <PanelCard
        title="TVA intracomunitar"
        subtitle="Ai cod special de TVA pentru operațiuni intracomunitare (art. 317)?"
      >
        <RadioGroup value={vatAnswer} onChange={(e) => setVatForm(e.target.value as VatDeclaration)}>
          <FormControlLabel value="No" control={<Radio />} label="Nu" />
          <FormControlLabel value="Yes" control={<Radio />} label="Da" />
        </RadioGroup>
        {vatAnswer === 'Yes' && (
          <Box sx={{ mt: 1.5 }}>
            <StepDocument
              step="fiscal"
              category="CertificatTvaIntracomunitar"
              label="Dovada codului de TVA intracomunitar"
              hint="Încarcă certificatul de înregistrare în scopuri de TVA sau decizia ANAF de atribuire a codului."
            />
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={saveVat}
            disabled={savingVat || vatAnswer === '' || (vatAnswer === 'Yes' && !hasVatProof)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: TOKENS.primary,
              '&:hover': { backgroundColor: TOKENS.primaryStrong },
            }}
          >
            {savingVat ? 'Se salvează...' : 'Salvează'}
          </Button>
          {vatAnswer === 'Yes' && !hasVatProof && (
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.82rem', mt: 1 }}>
              Încarcă întâi dovada — fără ea nu putem înregistra codul special.
            </Typography>
          )}
        </Box>
      </PanelCard>

      {/* 2.3 Bancă */}
      <PanelCard title="Cont bancar" subtitle="Ai deja un cont bancar deschis pe PFA?">
        {step2?.bank?.ibanMasked && (
          <Alert
            severity={step2.bank.status === 'Verified' ? 'success' : 'info'}
            sx={{ mb: 2, borderRadius: `${TOKENS.radius.md}px` }}
          >
            IBAN înregistrat: <strong>{step2.bank.ibanMasked}</strong> · status: {step2.bank.status}
            {step2.bank.source === 'OpenBanking' && ' (verificat prin open banking)'}
          </Alert>
        )}

        <RadioGroup
          value={bankChoice}
          onChange={(e) => {
            const next = e.target.value as 'Yes' | 'No'
            setBankAnswer(next)
            if (next === 'No') setBcrOpen(true)
          }}
        >
          <FormControlLabel value="Yes" control={<Radio />} label="Da, am cont pe PFA" />
          <FormControlLabel value="No" control={<Radio />} label="Nu am încă" />
        </RadioGroup>

        {bankChoice === 'No' ? (
          <Stack spacing={1.5} sx={{ mt: 1.5, alignItems: 'flex-start' }}>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.88rem', lineHeight: 1.65 }}>
              Îți deschidem drumul: prin parteneriatul RIDElance–BCR poți avea contul activ în aceeași
              zi. Revino aici cu IBAN-ul și documentul de confirmare după ce contul e deschis.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setBcrOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: TOKENS.primary,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              Vezi cum deschizi contul
            </Button>
          </Stack>
        ) : bankChoice === 'Yes' ? (
          <>
            <Box sx={{ my: 2 }}>
              <StepDocument
                step="fiscal"
                category="ExtrasBancar"
                label="Extras de cont / confirmare IBAN"
                hint="Citim automat IBAN-ul din document. Nu trebuie să-l scrii."
              />
            </Box>
            <Stack spacing={2}>
              <TextField
                select
                label="Bancă"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                sx={inputSx}
                fullWidth
              >
                {BANKS.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={saveBank}
                disabled={savingBank}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  backgroundColor: TOKENS.primary,
                  '&:hover': { backgroundColor: TOKENS.primaryStrong },
                }}
              >
                {savingBank ? 'Se salvează...' : 'Salvează contul'}
              </Button>
            </Box>
          </>
        ) : null}
      </PanelCard>

      <BcrAccountDialog open={bcrOpen} onClose={() => setBcrOpen(false)} />

      {/* 2.4 Oblio */}
      <PanelCard
        title="Cont Oblio (facturare)"
        subtitle="Consimțămintele necesare pentru emiterea automată a facturilor."
      >
        <TextField
          label="Email cont Oblio"
          type="email"
          value={oblioEmail}
          onChange={(e) => setOblioEmail(e.target.value)}
          sx={{ ...inputSx, mb: 1 }}
          fullWidth
        />
        <Stack>
          {OBLIO_CONSENTS.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={oblio[key]}
                  onChange={(e) => setOblio((o) => ({ ...o, [key]: e.target.checked }))}
                />
              }
              label={<Typography sx={{ fontSize: '0.86rem', color: TOKENS.ink }}>{label}</Typography>}
            />
          ))}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={saveOblio}
            disabled={savingOblio}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: TOKENS.primary,
              '&:hover': { backgroundColor: TOKENS.primaryStrong },
            }}
          >
            {savingOblio ? 'Se salvează...' : allOblio ? 'Accept toate' : 'Salvează'}
          </Button>
        </Box>
      </PanelCard>

      {/* 2.2 Semnături (read-only) */}
      <PanelCard
        title="Pachet de semnături"
        subtitle="Împuternicirile și contractele se pregătesc de echipa RIDElance."
      >
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
                <Typography
                  sx={{
                    fontSize: '0.82rem',
                    color: d.isSigned ? TOKENS.success : TOKENS.textMuted,
                    fontWeight: 700,
                  }}
                >
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
      </PanelCard>
    </Stack>
  )
}
