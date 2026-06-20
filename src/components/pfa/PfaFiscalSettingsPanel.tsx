import { useEffect, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { isAxiosError } from 'axios'

import { TOKENS } from '../../constants/tokens'
import {
  pfaService,
  type PfaFiscalSettings,
  type PfaPlatformAccount,
  type UpsertPfaPlatformAccountItem,
} from '../../services/pfa.service'

type Provider = 'Uber' | 'Bolt'
type AccountKind = 'Driver' | 'Fleet'
type FiscalScreen = 'summary' | 'menu' | 'tax' | 'platforms' | 'cash' | 'vehicle' | 'uber' | 'bolt' | 'fleet'

interface PfaFiscalSettingsPanelProps {
  pfaId: string
  editable?: boolean
}

const FIXED_FISCAL_FIELDS = [
  { label: 'Sistem de impozitare', value: 'Sistem real' },
  { label: 'TVA', value: 'Neplătitor TVA' },
  { label: 'Angajați', value: 'Fără angajați' },
  { label: 'Regim contabil', value: 'Partidă simplă' },
]

const specialVatOptions = [
  { value: 'Yes', label: 'Da' },
  { value: 'No', label: 'Nu' },
  { value: 'InProgress', label: 'În curs de obținere' },
  { value: 'ToVerify', label: 'De verificat' },
]

const platformOptions = [
  { value: 'Active', label: 'Activ' },
  { value: 'Inactive', label: 'Inactiv' },
  { value: 'Activating', label: 'În curs de activare' },
  { value: 'Suspended', label: 'Suspendat' },
]

const triOptions = [
  { value: 'Yes', label: 'Da' },
  { value: 'No', label: 'Nu' },
  { value: 'ToVerify', label: 'De verificat' },
]

const cashRegisterOptions = [
  { value: 'Yes', label: 'Da' },
  { value: 'No', label: 'Nu' },
  { value: 'NotApplicable', label: 'Nu se aplică' },
  { value: 'ToVerify', label: 'De verificat' },
]

const vehicleOptions = [
  { value: 'OwnCar', label: 'Mașină proprie' },
  { value: 'RentedCar', label: 'Mașină închiriată' },
  { value: 'CommodatumCar', label: 'Mașină în comodat' },
  { value: 'Other', label: 'Altă situație' },
]

const fleetStatusOptions = [
  { value: 'NotConfigured', label: 'Neconfigurat' },
  { value: 'InProgress', label: 'În curs' },
  { value: 'Configured', label: 'Configurat' },
]

function optionLabel(options: { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label ?? value ?? '—'
}

function dateInputValue(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function roDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function accountKey(provider: Provider, kind: AccountKind) {
  return `${provider}:${kind}`
}

function findAccount(accounts: PfaPlatformAccount[], provider: Provider, kind: AccountKind) {
  return accounts.find((account) => account.provider === provider && account.kind === kind)
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: TOKENS.radius.md,
    backgroundColor: alpha(TOKENS.paper, 0.88),
  },
}

const readOnlyFieldSx = {
  ...fieldSx,
  '& .MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: alpha(TOKENS.surface, 0.92),
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: TOKENS.ink,
    opacity: 1,
    fontWeight: 650,
  },
  '& .MuiInputLabel-root.Mui-disabled': {
    color: TOKENS.textSubtle,
  },
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <TextField
      label={label}
      value={value}
      disabled
      fullWidth
      size="small"
      sx={readOnlyFieldSx}
    />
  )
}

function CenteredScreen({
  title,
  description,
  onBack,
  backTo = 'menu',
  children,
}: {
  title: string
  description: string
  onBack: (screen: FiscalScreen) => void
  backTo?: FiscalScreen
  children: ReactNode
}) {
  return (
    <Box
      sx={{
        minHeight: { xs: 380, md: 520 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440, px: { xs: 0.5, sm: 1 } }}>
        <Button
          variant="text"
          onClick={() => onBack(backTo)}
          sx={{ mb: 2, fontWeight: 700, color: TOKENS.textMuted, px: 0 }}
        >
          ← Înapoi
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 850, textAlign: 'center', letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, textAlign: 'center', mt: 0.75, mb: 3 }}>
          {description}
        </Typography>
        <Stack spacing={2}>{children}</Stack>
      </Box>
    </Box>
  )
}

function SummarySection({
  title,
  screen,
  editable,
  onOpen,
  children,
}: {
  title: string
  screen: FiscalScreen
  editable: boolean
  onOpen: (screen: FiscalScreen) => void
  children: ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: TOKENS.radius.md,
        border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
        bgcolor: alpha(TOKENS.surface, 0.55),
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
        <Typography sx={{ fontWeight: 850, fontSize: '0.95rem' }}>{title}</Typography>
        <Button size="small" variant="outlined" onClick={() => onOpen(screen)} sx={{ fontWeight: 800, flexShrink: 0 }}>
          {editable ? 'Modifică' : 'Vezi'}
        </Button>
      </Stack>
      <Stack spacing={1.5}>{children}</Stack>
    </Paper>
  )
}

function buildDefaultSettings(pfaId: string): PfaFiscalSettings {
  return {
    fiscalProfile: {
      id: null,
      pfaRegistrationId: pfaId,
      taxationSystem: 'RealSystem',
      isVatPayer: false,
      hasEmployees: false,
      accountingRegime: 'SingleEntry',
      specialVatCodeStatus: 'ToVerify',
      specialVatCodeObtainedAtUtc: null,
      specialVatCodeDocumentId: null,
      uberStatus: 'Inactive',
      boltStatus: 'Inactive',
      otherPlatformsStatus: 'No',
      cashRevenueStatus: 'ToVerify',
      cashRegisterStatus: 'ToVerify',
      vehicleUsageType: 'OwnCar',
      vehicleSupportingDocumentLabel: null,
      vehicleSupportingDocumentId: null,
      updatedAtUtc: null,
    },
    platformAccounts: [],
    fleetConsent: {
      id: null,
      pfaRegistrationId: pfaId,
      fleetAccountsAccepted: false,
      fleetAccountsAcceptedAtUtc: null,
      boltApiAccepted: false,
      boltApiAcceptedAtUtc: null,
      consentTextVersion: '2026-06',
    },
  }
}

export function PfaFiscalSettingsPanel({ pfaId, editable = false }: PfaFiscalSettingsPanelProps) {
  const [settings, setSettings] = useState<PfaFiscalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [screen, setScreen] = useState<FiscalScreen>('summary')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [form, setForm] = useState({
    specialVatCodeStatus: 'ToVerify',
    specialVatCodeObtainedAtUtc: '',
    uberStatus: 'Inactive',
    boltStatus: 'Inactive',
    otherPlatformsStatus: 'No',
    cashRevenueStatus: 'ToVerify',
    cashRegisterStatus: 'ToVerify',
    vehicleUsageType: 'OwnCar',
    vehicleSupportingDocumentLabel: '',
  })

  const [accounts, setAccounts] = useState<Record<string, UpsertPfaPlatformAccountItem>>({})

  const applySettings = (data: PfaFiscalSettings) => {
    setSettings(data)
    const profile = data.fiscalProfile
    setForm({
      specialVatCodeStatus: profile.specialVatCodeStatus,
      specialVatCodeObtainedAtUtc: dateInputValue(profile.specialVatCodeObtainedAtUtc),
      uberStatus: profile.uberStatus,
      boltStatus: profile.boltStatus,
      otherPlatformsStatus: profile.otherPlatformsStatus,
      cashRevenueStatus: profile.cashRevenueStatus,
      cashRegisterStatus: profile.cashRegisterStatus,
      vehicleUsageType: profile.vehicleUsageType,
      vehicleSupportingDocumentLabel: profile.vehicleSupportingDocumentLabel ?? '',
    })

    const nextAccounts: Record<string, UpsertPfaPlatformAccountItem> = {}
    ;(['Uber', 'Bolt'] as Provider[]).forEach((provider) => {
      ;(['Driver', 'Fleet'] as AccountKind[]).forEach((kind) => {
        const account = findAccount(data.platformAccounts, provider, kind)
        nextAccounts[accountKey(provider, kind)] = {
          provider,
          kind,
          email: account?.email ?? '',
          phone: account?.phone ?? '',
          fullName: account?.fullName ?? '',
          password: '',
          status: account?.status ?? (kind === 'Fleet' ? 'NotConfigured' : 'Configured'),
        }
      })
    })
    setAccounts(nextAccounts)
  }

  const loadSettings = () => {
    setLoading(true)
    setError(null)
    setApiUnavailable(false)
    pfaService.getFiscalSettings(pfaId)
      .then(applySettings)
      .catch((err) => {
        if (isAxiosError(err) && err.response?.status === 404) {
          setApiUnavailable(true)
          applySettings(buildDefaultSettings(pfaId))
          return
        }
        setError('Nu s-au putut încărca setările fiscale PFA.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setScreen('summary')
    loadSettings()
  }, [pfaId])

  const updateAccount = (provider: Provider, kind: AccountKind, patch: Partial<UpsertPfaPlatformAccountItem>) => {
    const key = accountKey(provider, kind)
    setAccounts((prev) => ({ ...prev, [key]: { ...prev[key], provider, kind, ...patch } }))
  }

  const handleSaveProfile = async () => {
    if (apiUnavailable) {
      setSnackbar({ open: true, message: 'API-ul pentru profil fiscal nu este încă disponibil pe backend.', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const updated = await pfaService.updateFiscalProfile(pfaId, {
        ...form,
        specialVatCodeObtainedAtUtc: form.specialVatCodeObtainedAtUtc || null,
        specialVatCodeDocumentId: settings?.fiscalProfile.specialVatCodeDocumentId ?? null,
        vehicleSupportingDocumentId: settings?.fiscalProfile.vehicleSupportingDocumentId ?? null,
      })
      setSettings((current) => current ? { ...current, fiscalProfile: updated } : current)
      setSnackbar({ open: true, message: 'Profilul fiscal a fost salvat.', severity: 'success' })
      setScreen('summary')
    } catch (err) {
      setSnackbar({
        open: true,
        message: isAxiosError(err) && err.response?.status === 404
          ? 'API-ul pentru profil fiscal nu este încă disponibil pe backend.'
          : 'Profilul fiscal nu a putut fi salvat.',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAccounts = async () => {
    if (apiUnavailable) {
      setSnackbar({ open: true, message: 'API-ul pentru conturile fleet nu este încă disponibil pe backend.', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const updated = await pfaService.updatePlatformAccounts(pfaId, Object.values(accounts))
      setSettings((current) => current ? { ...current, platformAccounts: updated } : current)
      setSnackbar({ open: true, message: 'Conturile au fost salvate.', severity: 'success' })
      setAccounts((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => { next[key] = { ...next[key], password: '' } })
        return next
      })
      setScreen('summary')
    } catch (err) {
      setSnackbar({
        open: true,
        message: isAxiosError(err) && err.response?.status === 404
          ? 'API-ul pentru conturile fleet nu este încă disponibil pe backend.'
          : 'Conturile nu au putut fi salvate.',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkConfigured = async (provider: Provider) => {
    if (apiUnavailable) {
      setSnackbar({ open: true, message: 'API-ul pentru conturile fleet nu este încă disponibil pe backend.', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const updated = await pfaService.markFleetConfigured(pfaId, provider)
      setSettings((current) => {
        if (!current) return current
        const filtered = current.platformAccounts.filter(
          (account) => !(account.provider === provider && account.kind === 'Fleet')
        )
        return { ...current, platformAccounts: [...filtered, updated] }
      })
      updateAccount(provider, 'Fleet', { status: updated.status })
      setSnackbar({ open: true, message: `${provider} Fleet a fost marcat configurat.`, severity: 'success' })
    } catch (err) {
      setSnackbar({
        open: true,
        message: isAxiosError(err) && err.response?.status === 404
          ? 'API-ul pentru conturile fleet nu este încă disponibil pe backend.'
          : 'Statusul contului fleet nu a putut fi actualizat.',
        severity: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const sectionCards: { key: FiscalScreen; title: string; description: string }[] = [
    { key: 'tax', title: 'Cod special TVA', description: 'Status cod TVA, dată obținere și document.' },
    { key: 'platforms', title: 'Platforme active', description: 'Status Uber, Bolt și alte platforme.' },
    { key: 'cash', title: 'Cash / casă de marcat', description: 'Venituri cash și casă de marcat.' },
    { key: 'vehicle', title: 'Utilizare auto', description: 'Tip mașină și document justificativ.' },
    { key: 'uber', title: 'Conturi Uber', description: 'Cont Uber Driver și Uber Fleet.' },
    { key: 'bolt', title: 'Conturi Bolt', description: 'Cont Bolt Driver, Bolt Fleet și API.' },
    { key: 'fleet', title: 'Permisiuni Fleet / API', description: 'Accept conturi fleet și Bolt Fleet API.' },
  ]

  const renderAccountFields = (provider: Provider, kind: AccountKind) => {
    const key = accountKey(provider, kind)
    const account = findAccount(settings?.platformAccounts ?? [], provider, kind)
    const draft = accounts[key]

    if (!editable) {
      return (
        <Stack spacing={1.5}>
          <ReadOnlyField label="Email" value={account?.email ?? '—'} />
          <ReadOnlyField label="Nr telefon" value={account?.phone ?? '—'} />
          <ReadOnlyField label="Nume Prenume" value={account?.fullName ?? '—'} />
          {kind === 'Fleet' && (
            <ReadOnlyField label="Parolă" value={account?.hasPassword ? '********' : '—'} />
          )}
        </Stack>
      )
    }

    return (
      <Stack spacing={1.5}>
        <TextField size="small" fullWidth label="Email" value={draft?.email ?? ''} onChange={(e) => updateAccount(provider, kind, { email: e.target.value })} sx={fieldSx} />
        <TextField size="small" fullWidth label="Nr telefon" value={draft?.phone ?? ''} onChange={(e) => updateAccount(provider, kind, { phone: e.target.value })} sx={fieldSx} />
        <TextField size="small" fullWidth label="Nume Prenume" value={draft?.fullName ?? ''} onChange={(e) => updateAccount(provider, kind, { fullName: e.target.value })} sx={fieldSx} />
        {kind === 'Fleet' && (
          <>
            <TextField size="small" fullWidth label={account?.hasPassword ? 'Parolă nouă (opțional)' : 'Parolă'} type="password" value={draft?.password ?? ''} onChange={(e) => updateAccount(provider, kind, { password: e.target.value })} sx={fieldSx} />
            <TextField select size="small" fullWidth label="Status" value={draft?.status ?? 'NotConfigured'} onChange={(e) => updateAccount(provider, kind, { status: e.target.value })} sx={fieldSx}>
              {fleetStatusOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <Button size="small" variant="outlined" onClick={() => handleMarkConfigured(provider)} disabled={saving || apiUnavailable} sx={{ fontWeight: 800 }}>
              Marchează configurat
            </Button>
          </>
        )}
      </Stack>
    )
  }

  const renderSectionContent = () => {
    if (!settings) return null
    const profile = settings.fiscalProfile

    switch (screen) {
      case 'tax':
        return (
          <CenteredScreen
            title="Cod special TVA"
            description="Valorile standard ale PFA-ului sunt fixe. Aici poți actualiza doar codul special TVA."
            onBack={setScreen}
          >
            {FIXED_FISCAL_FIELDS.map((field) => (
              <ReadOnlyField key={field.label} label={field.label} value={field.value} />
            ))}
            {editable ? (
              <>
                <TextField select fullWidth size="small" label="Cod special TVA" value={form.specialVatCodeStatus} onChange={(e) => setForm((f) => ({ ...f, specialVatCodeStatus: e.target.value }))} sx={fieldSx}>
                  {specialVatOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  label="Data obținerii"
                  type="date"
                  value={form.specialVatCodeObtainedAtUtc}
                  onChange={(e) => setForm((f) => ({ ...f, specialVatCodeObtainedAtUtc: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx}
                />
                <ReadOnlyField label="Document cod TVA" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
                <Button fullWidth variant="contained" onClick={handleSaveProfile} disabled={saving || apiUnavailable} sx={{ fontWeight: 800, boxShadow: 'none', mt: 1 }}>
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <ReadOnlyField label="Cod special TVA" value={optionLabel(specialVatOptions, profile.specialVatCodeStatus)} />
                <ReadOnlyField label="Data obținerii" value={roDate(profile.specialVatCodeObtainedAtUtc)} />
                <ReadOnlyField label="Document cod TVA" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
              </>
            )}
          </CenteredScreen>
        )

      case 'platforms':
        return (
          <CenteredScreen title="Platforme active" description="Statusul platformelor pe care lucrează PFA-ul." onBack={setScreen}>
            {editable ? (
              <>
                <TextField select fullWidth size="small" label="Uber" value={form.uberStatus} onChange={(e) => setForm((f) => ({ ...f, uberStatus: e.target.value }))} sx={fieldSx}>
                  {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField select fullWidth size="small" label="Bolt" value={form.boltStatus} onChange={(e) => setForm((f) => ({ ...f, boltStatus: e.target.value }))} sx={fieldSx}>
                  {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField select fullWidth size="small" label="Alte platforme" value={form.otherPlatformsStatus} onChange={(e) => setForm((f) => ({ ...f, otherPlatformsStatus: e.target.value }))} sx={fieldSx}>
                  {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <Button fullWidth variant="contained" onClick={handleSaveProfile} disabled={saving || apiUnavailable} sx={{ fontWeight: 800, boxShadow: 'none', mt: 1 }}>
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <ReadOnlyField label="Uber" value={optionLabel(platformOptions, profile.uberStatus)} />
                <ReadOnlyField label="Bolt" value={optionLabel(platformOptions, profile.boltStatus)} />
                <ReadOnlyField label="Alte platforme" value={optionLabel(triOptions, profile.otherPlatformsStatus)} />
              </>
            )}
          </CenteredScreen>
        )

      case 'cash':
        return (
          <CenteredScreen title="Cash / casă de marcat" description="Informații despre venituri cash și casă de marcat." onBack={setScreen}>
            {editable ? (
              <>
                <TextField select fullWidth size="small" label="Are venituri cash" value={form.cashRevenueStatus} onChange={(e) => setForm((f) => ({ ...f, cashRevenueStatus: e.target.value }))} sx={fieldSx}>
                  {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField select fullWidth size="small" label="Are casă de marcat" value={form.cashRegisterStatus} onChange={(e) => setForm((f) => ({ ...f, cashRegisterStatus: e.target.value }))} sx={fieldSx}>
                  {cashRegisterOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <Button fullWidth variant="contained" onClick={handleSaveProfile} disabled={saving || apiUnavailable} sx={{ fontWeight: 800, boxShadow: 'none', mt: 1 }}>
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <ReadOnlyField label="Are venituri cash" value={optionLabel(triOptions, profile.cashRevenueStatus)} />
                <ReadOnlyField label="Are casă de marcat" value={optionLabel(cashRegisterOptions, profile.cashRegisterStatus)} />
              </>
            )}
          </CenteredScreen>
        )

      case 'vehicle':
        return (
          <CenteredScreen title="Utilizare auto" description="Situația mașinii folosite de PFA și documentul justificativ." onBack={setScreen}>
            {editable ? (
              <>
                <TextField select fullWidth size="small" label="Tip utilizare auto" value={form.vehicleUsageType} onChange={(e) => setForm((f) => ({ ...f, vehicleUsageType: e.target.value }))} sx={fieldSx}>
                  {vehicleOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <TextField fullWidth size="small" label="Document justificativ auto" value={form.vehicleSupportingDocumentLabel} onChange={(e) => setForm((f) => ({ ...f, vehicleSupportingDocumentLabel: e.target.value }))} placeholder="Ex: Contract de comodat verificat" sx={fieldSx} />
                <Button fullWidth variant="contained" onClick={handleSaveProfile} disabled={saving || apiUnavailable} sx={{ fontWeight: 800, boxShadow: 'none', mt: 1 }}>
                  Salvează
                </Button>
              </>
            ) : (
              <>
                <ReadOnlyField label="Tip utilizare auto" value={optionLabel(vehicleOptions, profile.vehicleUsageType)} />
                <ReadOnlyField label="Document justificativ auto" value={profile.vehicleSupportingDocumentLabel || '—'} />
              </>
            )}
          </CenteredScreen>
        )

      case 'uber':
      case 'bolt': {
        const provider: Provider = screen === 'uber' ? 'Uber' : 'Bolt'
        return (
          <CenteredScreen title={`Conturi ${provider}`} description={`Cont ${provider} Driver și ${provider} Fleet.`} onBack={setScreen}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: TOKENS.radius.md, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
              <Typography sx={{ fontWeight: 850, mb: 1.5, textAlign: 'center' }}>{provider} Driver</Typography>
              {renderAccountFields(provider, 'Driver')}
            </Paper>
            <Paper elevation={0} sx={{ p: 2, borderRadius: TOKENS.radius.md, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
              <Typography sx={{ fontWeight: 850, mb: 1.5, textAlign: 'center' }}>{provider} Fleet</Typography>
              {renderAccountFields(provider, 'Fleet')}
            </Paper>
            {editable && (
              <Button fullWidth variant="contained" onClick={handleSaveAccounts} disabled={saving || apiUnavailable} sx={{ fontWeight: 800, boxShadow: 'none' }}>
                Salvează conturi {provider}
              </Button>
            )}
          </CenteredScreen>
        )
      }

      case 'fleet':
        return (
          <CenteredScreen title="Permisiuni Fleet / API" description="Permisiuni pentru conturile fleet și integrarea Bolt Fleet API." onBack={setScreen}>
            <Alert severity="info" sx={{ borderRadius: TOKENS.radius.md }}>
              Conturile fleet sunt create de RIDElance și pot fi utilizate de suport și contabil.
            </Alert>
            <ReadOnlyField
              label="Permisiune conturi fleet"
              value={settings.fleetConsent.fleetAccountsAccepted ? 'Acceptată' : 'Neacceptată'}
            />
            <ReadOnlyField
              label="Bolt Fleet API"
              value={settings.fleetConsent.boltApiAccepted ? 'Acceptat' : 'Neacceptat'}
            />
          </CenteredScreen>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}` }}>
        <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
      </Paper>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!settings) return null

  const profile = settings.fiscalProfile

  return (
    <Stack spacing={2}>
      {apiUnavailable && (
        <Alert severity="warning" sx={{ borderRadius: TOKENS.radius.md }}>
          API-ul pentru profil fiscal nu este încă disponibil pe backend-ul curent. Afișez valorile implicite; salvarea devine activă după deploy backend.
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
        {screen === 'summary' && (
          <Stack spacing={2.5}>
            <Box sx={{ textAlign: 'center', mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 850, letterSpacing: '-0.02em' }}>Profil fiscal</Typography>
              <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.5 }}>
                Sumar important despre PFA, completat în Admin și vizibil pentru contabil.
              </Typography>
            </Box>

            <SummarySection title="Profil fiscal standard" screen="tax" editable={editable} onOpen={setScreen}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
                {FIXED_FISCAL_FIELDS.map((field) => (
                  <ReadOnlyField key={field.label} label={field.label} value={field.value} />
                ))}
              </Box>
            </SummarySection>

            <SummarySection title="Cod special TVA" screen="tax" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Cod special TVA" value={optionLabel(specialVatOptions, profile.specialVatCodeStatus)} />
              <ReadOnlyField label="Data obținerii" value={roDate(profile.specialVatCodeObtainedAtUtc)} />
              <ReadOnlyField label="Document cod TVA" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
            </SummarySection>

            <SummarySection title="Platforme active" screen="platforms" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Uber" value={optionLabel(platformOptions, profile.uberStatus)} />
              <ReadOnlyField label="Bolt" value={optionLabel(platformOptions, profile.boltStatus)} />
              <ReadOnlyField label="Alte platforme" value={optionLabel(triOptions, profile.otherPlatformsStatus)} />
            </SummarySection>

            <SummarySection title="Cash / casă de marcat" screen="cash" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Are venituri cash" value={optionLabel(triOptions, profile.cashRevenueStatus)} />
              <ReadOnlyField label="Are casă de marcat" value={optionLabel(cashRegisterOptions, profile.cashRegisterStatus)} />
            </SummarySection>

            <SummarySection title="Utilizare auto" screen="vehicle" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Tip utilizare auto" value={optionLabel(vehicleOptions, profile.vehicleUsageType)} />
              <ReadOnlyField label="Document justificativ auto" value={profile.vehicleSupportingDocumentLabel || '—'} />
            </SummarySection>

            <SummarySection title="Conturi Uber" screen="uber" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Uber Driver — email" value={findAccount(settings.platformAccounts, 'Uber', 'Driver')?.email ?? '—'} />
              <ReadOnlyField label="Uber Fleet — email" value={findAccount(settings.platformAccounts, 'Uber', 'Fleet')?.email ?? '—'} />
            </SummarySection>

            <SummarySection title="Conturi Bolt" screen="bolt" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Bolt Driver — email" value={findAccount(settings.platformAccounts, 'Bolt', 'Driver')?.email ?? '—'} />
              <ReadOnlyField label="Bolt Fleet — email" value={findAccount(settings.platformAccounts, 'Bolt', 'Fleet')?.email ?? '—'} />
            </SummarySection>

            <SummarySection title="Permisiuni Fleet / API" screen="fleet" editable={editable} onOpen={setScreen}>
              <ReadOnlyField label="Permisiune conturi fleet" value={settings.fleetConsent.fleetAccountsAccepted ? 'Acceptată' : 'Neacceptată'} />
              <ReadOnlyField label="Bolt Fleet API" value={settings.fleetConsent.boltApiAccepted ? 'Acceptat' : 'Neacceptat'} />
            </SummarySection>

            {!editable && (
              <Button variant="outlined" onClick={() => setScreen('menu')} sx={{ alignSelf: 'center', fontWeight: 800, px: 4 }}>
                Vezi setări detaliate
              </Button>
            )}
            {editable && (
              <Button variant="contained" onClick={() => setScreen('menu')} sx={{ alignSelf: 'center', fontWeight: 800, boxShadow: 'none', px: 4 }}>
                Configurează profil fiscal
              </Button>
            )}
          </Stack>
        )}

        {screen === 'menu' && (
          <CenteredScreen title="Setări profil fiscal" description="Alege secțiunea pe care vrei să o configurezi." onBack={setScreen} backTo="summary">
            <Stack spacing={1.5}>
              {sectionCards.map((section) => (
                <Button
                  key={section.key}
                  fullWidth
                  variant="outlined"
                  onClick={() => setScreen(section.key)}
                  sx={{
                    py: 1.75,
                    fontWeight: 800,
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.35,
                    borderColor: alpha(TOKENS.ink, 0.1),
                  }}
                >
                  <Typography sx={{ fontWeight: 850 }}>{section.title}</Typography>
                  <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 500 }}>
                    {section.description}
                  </Typography>
                </Button>
              ))}
            </Stack>
          </CenteredScreen>
        )}

        {screen !== 'summary' && screen !== 'menu' && renderSectionContent()}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  )
}
