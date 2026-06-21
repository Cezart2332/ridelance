import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { isAxiosError } from 'axios'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'

import { TOKENS } from '../../constants/tokens'
import {
  pfaService,
  type PfaFiscalSettings,
  type PfaPlatformAccount,
  type UpsertPfaPlatformAccountItem,
} from '../../services/pfa.service'

type Provider = 'Uber' | 'Bolt'
type AccountKind = 'Driver' | 'Fleet'
type FiscalSection = 'overview' | 'tax' | 'platforms' | 'cash' | 'vehicle' | 'uber' | 'bolt' | 'fleet'

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

const NAV_ITEMS: { id: FiscalSection; label: string; icon: ReactNode; group: string }[] = [
  { id: 'overview', label: 'Prezentare generală', icon: <DashboardOutlinedIcon fontSize="small" />, group: 'Profil' },
  { id: 'tax', label: 'Cod special TVA', icon: <ReceiptLongOutlinedIcon fontSize="small" />, group: 'Profil' },
  { id: 'platforms', label: 'Platforme active', icon: <AppsOutlinedIcon fontSize="small" />, group: 'Activitate' },
  { id: 'cash', label: 'Cash și casă de marcat', icon: <PaymentsOutlinedIcon fontSize="small" />, group: 'Activitate' },
  { id: 'vehicle', label: 'Utilizare auto', icon: <DirectionsCarOutlinedIcon fontSize="small" />, group: 'Activitate' },
  { id: 'uber', label: 'Conturi Uber', icon: <PersonOutlineRoundedIcon fontSize="small" />, group: 'Conturi' },
  { id: 'bolt', label: 'Conturi Bolt', icon: <PersonOutlineRoundedIcon fontSize="small" />, group: 'Conturi' },
  { id: 'fleet', label: 'Permisiuni Fleet', icon: <VpnKeyOutlinedIcon fontSize="small" />, group: 'Conturi' },
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

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: TOKENS.radius.sm,
    backgroundColor: TOKENS.paper,
    transition: `border-color ${TOKENS.duration} ${TOKENS.easing}`,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.1) },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.ink, 0.2) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TOKENS.primary, borderWidth: 2 },
  },
}

const lockedInputSx = {
  ...inputSx,
  '& .MuiOutlinedInput-root': {
    ...inputSx['& .MuiOutlinedInput-root'],
    backgroundColor: alpha(TOKENS.primary, 0.04),
    '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(TOKENS.primary, 0.18) },
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: TOKENS.ink,
    opacity: 1,
    fontWeight: 600,
  },
  '& .MuiInputLabel-root.Mui-disabled': { color: TOKENS.textSubtle },
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <TextField
      label={label}
      value={value}
      disabled
      fullWidth
      size="small"
      slotProps={{
        input: {
          endAdornment: <LockOutlinedIcon sx={{ fontSize: 16, color: TOKENS.textSubtle, mr: 0.5 }} />,
        },
      }}
      sx={lockedInputSx}
    />
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 38%) 1fr' },
        gap: { xs: 0.35, sm: 2 },
        py: 1.35,
        borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, fontWeight: 550 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 650, textWrap: 'pretty' }}>
        {value}
      </Typography>
    </Box>
  )
}

function SettingGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          color: TOKENS.textSubtle,
          fontWeight: 700,
          letterSpacing: '0.06em',
          mb: 0.5,
          fontSize: '0.68rem',
        }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Box>
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [settings, setSettings] = useState<PfaFiscalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const [section, setSection] = useState<FiscalSection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
    setSection('overview')
    loadSettings()
  }, [pfaId])

  const selectSection = (next: FiscalSection) => {
    setSection(next)
    setMobileNavOpen(false)
  }

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

  const activeNav = NAV_ITEMS.find((item) => item.id === section)
  const navGroups = useMemo(() => {
    const groups = new Map<string, typeof NAV_ITEMS>()
    NAV_ITEMS.forEach((item) => {
      const list = groups.get(item.group) ?? []
      list.push(item)
      groups.set(item.group, list)
    })
    return Array.from(groups.entries())
  }, [])

  const renderNav = (inDrawer = false) => (
    <Stack spacing={0.5} sx={{ p: inDrawer ? 1.5 : 0 }}>
      {navGroups.map(([group, items]) => (
        <Box key={group} sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              py: 0.75,
              display: 'block',
              color: TOKENS.textSubtle,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            {group}
          </Typography>
          {items.map((item) => {
            const active = section === item.id
            return (
              <Box
                key={item.id}
                component="button"
                type="button"
                onClick={() => selectSection(item.id)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1.1,
                  border: 'none',
                  borderRadius: TOKENS.radius.sm,
                  cursor: 'pointer',
                  textAlign: 'left',
                  bgcolor: active ? alpha(TOKENS.primary, 0.1) : 'transparent',
                  color: active ? TOKENS.primaryStrong : TOKENS.ink,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  '&:hover': {
                    bgcolor: active ? alpha(TOKENS.primary, 0.12) : alpha(TOKENS.ink, 0.04),
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${TOKENS.primary}`,
                    outlineOffset: 2,
                  },
                }}
              >
                <Box sx={{ opacity: active ? 1 : 0.55, display: 'flex' }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: active ? 700 : 550, flex: 1 }}>
                  {item.label}
                </Typography>
                {active && <ChevronRightRoundedIcon sx={{ fontSize: 18, opacity: 0.7 }} />}
              </Box>
            )
          })}
        </Box>
      ))}
    </Stack>
  )

  const renderDetailHeader = (title: string, description: string) => (
    <Box sx={{ mb: 3, maxWidth: 560 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.025em', textWrap: 'balance' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: TOKENS.textMuted, mt: 0.6, lineHeight: 1.65, maxWidth: '42ch' }}>
        {description}
      </Typography>
    </Box>
  )

  const renderFormStack = (children: ReactNode, onSave?: () => void, saveLabel = 'Salvează modificările') => (
    <Box sx={{ maxWidth: 480 }}>
      <Stack spacing={2}>{children}</Stack>
      {editable && onSave && (
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
            display: 'flex',
            gap: 1.5,
          }}
        >
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving || apiUnavailable}
            sx={{
              fontWeight: 700,
              boxShadow: 'none',
              px: 3,
              transition: `transform ${TOKENS.duration} ${TOKENS.easing}`,
              '&:hover': { boxShadow: TOKENS.shadow.glow },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            {saving ? 'Se salvează…' : saveLabel}
          </Button>
        </Box>
      )}
    </Box>
  )

  const renderAccountBlock = (provider: Provider, kind: AccountKind) => {
    const key = accountKey(provider, kind)
    const account = findAccount(settings?.platformAccounts ?? [], provider, kind)
    const draft = accounts[key]

    return (
      <Box
        key={key}
        sx={{
          py: 2,
          borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
          '&:last-of-type': { borderBottom: 'none', pb: 0 },
        }}
      >
        <Typography sx={{ fontWeight: 750, mb: 1.5, fontSize: '0.92rem' }}>
          {provider} {kind}
        </Typography>
        {editable ? (
          <Stack spacing={1.5}>
            <TextField size="small" fullWidth label="Email" value={draft?.email ?? ''} onChange={(e) => updateAccount(provider, kind, { email: e.target.value })} sx={inputSx} />
            <TextField size="small" fullWidth label="Nr telefon" value={draft?.phone ?? ''} onChange={(e) => updateAccount(provider, kind, { phone: e.target.value })} sx={inputSx} />
            <TextField size="small" fullWidth label="Nume Prenume" value={draft?.fullName ?? ''} onChange={(e) => updateAccount(provider, kind, { fullName: e.target.value })} sx={inputSx} />
            {kind === 'Fleet' && (
              <>
                <TextField size="small" fullWidth label={account?.hasPassword ? 'Parolă nouă (opțional)' : 'Parolă'} type="password" value={draft?.password ?? ''} onChange={(e) => updateAccount(provider, kind, { password: e.target.value })} sx={inputSx} />
                <TextField select size="small" fullWidth label="Status" value={draft?.status ?? 'NotConfigured'} onChange={(e) => updateAccount(provider, kind, { status: e.target.value })} sx={inputSx}>
                  {fleetStatusOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                </TextField>
                <Button size="small" variant="text" onClick={() => handleMarkConfigured(provider)} disabled={saving || apiUnavailable} sx={{ alignSelf: 'flex-start', fontWeight: 700 }}>
                  Marchează configurat
                </Button>
              </>
            )}
          </Stack>
        ) : (
          <Stack spacing={0}>
            <SettingRow label="Email" value={account?.email ?? '—'} />
            <SettingRow label="Nr telefon" value={account?.phone ?? '—'} />
            <SettingRow label="Nume Prenume" value={account?.fullName ?? '—'} />
            {kind === 'Fleet' && <SettingRow label="Parolă" value={account?.hasPassword ? '********' : '—'} />}
          </Stack>
        )}
      </Box>
    )
  }

  const renderDetail = () => {
    if (!settings) return null
    const profile = settings.fiscalProfile

    switch (section) {
      case 'overview':
        return (
          <>
            {renderDetailHeader('Prezentare generală', 'Toate informațiile fiscale ale PFA-ului, grupate pe categorii.')}
            <Box sx={{ maxWidth: 640 }}>
              <SettingGroup title="Profil fiscal standard">
                {FIXED_FISCAL_FIELDS.map((field) => (
                  <SettingRow key={field.label} label={field.label} value={field.value} />
                ))}
              </SettingGroup>
              <SettingGroup title="Cod special TVA">
                <SettingRow label="Cod special TVA" value={optionLabel(specialVatOptions, profile.specialVatCodeStatus)} />
                <SettingRow label="Data obținerii" value={roDate(profile.specialVatCodeObtainedAtUtc)} />
                <SettingRow label="Document" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
              </SettingGroup>
              <SettingGroup title="Platforme">
                <SettingRow label="Uber" value={optionLabel(platformOptions, profile.uberStatus)} />
                <SettingRow label="Bolt" value={optionLabel(platformOptions, profile.boltStatus)} />
                <SettingRow label="Alte platforme" value={optionLabel(triOptions, profile.otherPlatformsStatus)} />
              </SettingGroup>
              <SettingGroup title="Cash">
                <SettingRow label="Venituri cash" value={optionLabel(triOptions, profile.cashRevenueStatus)} />
                <SettingRow label="Casă de marcat" value={optionLabel(cashRegisterOptions, profile.cashRegisterStatus)} />
              </SettingGroup>
              <SettingGroup title="Auto">
                <SettingRow label="Tip utilizare" value={optionLabel(vehicleOptions, profile.vehicleUsageType)} />
                <SettingRow label="Document justificativ" value={profile.vehicleSupportingDocumentLabel || '—'} />
              </SettingGroup>
              <SettingGroup title="Conturi">
                <SettingRow label="Uber Driver" value={findAccount(settings.platformAccounts, 'Uber', 'Driver')?.email ?? '—'} />
                <SettingRow label="Uber Fleet" value={findAccount(settings.platformAccounts, 'Uber', 'Fleet')?.email ?? '—'} />
                <SettingRow label="Bolt Driver" value={findAccount(settings.platformAccounts, 'Bolt', 'Driver')?.email ?? '—'} />
                <SettingRow label="Bolt Fleet" value={findAccount(settings.platformAccounts, 'Bolt', 'Fleet')?.email ?? '—'} />
              </SettingGroup>
              <SettingGroup title="Permisiuni">
                <SettingRow label="Conturi fleet" value={settings.fleetConsent.fleetAccountsAccepted ? 'Acceptată' : 'Neacceptată'} />
                <SettingRow label="Bolt Fleet API" value={settings.fleetConsent.boltApiAccepted ? 'Acceptat' : 'Neacceptat'} />
              </SettingGroup>
            </Box>
          </>
        )

      case 'tax':
        return (
          <>
            {renderDetailHeader('Cod special TVA', 'Profilul fiscal standard este fix. Actualizează doar codul special TVA.')}
            {renderFormStack(
              <>
                {FIXED_FISCAL_FIELDS.map((field) => (
                  <LockedField key={field.label} label={field.label} value={field.value} />
                ))}
                {editable ? (
                  <>
                    <TextField select fullWidth size="small" label="Cod special TVA" value={form.specialVatCodeStatus} onChange={(e) => setForm((f) => ({ ...f, specialVatCodeStatus: e.target.value }))} sx={inputSx}>
                      {specialVatOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth size="small" label="Data obținerii" type="date" value={form.specialVatCodeObtainedAtUtc} onChange={(e) => setForm((f) => ({ ...f, specialVatCodeObtainedAtUtc: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
                    <LockedField label="Document cod TVA" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
                  </>
                ) : (
                  <>
                    <SettingRow label="Cod special TVA" value={optionLabel(specialVatOptions, profile.specialVatCodeStatus)} />
                    <SettingRow label="Data obținerii" value={roDate(profile.specialVatCodeObtainedAtUtc)} />
                    <SettingRow label="Document cod TVA" value={profile.specialVatCodeDocumentId ? 'Verificat' : '—'} />
                  </>
                )}
              </>,
              handleSaveProfile,
            )}
          </>
        )

      case 'platforms':
        return (
          <>
            {renderDetailHeader('Platforme active', 'Statusul platformelor pe care lucrează PFA-ul.')}
            {renderFormStack(
              editable ? (
                <>
                  <TextField select fullWidth size="small" label="Uber" value={form.uberStatus} onChange={(e) => setForm((f) => ({ ...f, uberStatus: e.target.value }))} sx={inputSx}>
                    {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth size="small" label="Bolt" value={form.boltStatus} onChange={(e) => setForm((f) => ({ ...f, boltStatus: e.target.value }))} sx={inputSx}>
                    {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth size="small" label="Alte platforme" value={form.otherPlatformsStatus} onChange={(e) => setForm((f) => ({ ...f, otherPlatformsStatus: e.target.value }))} sx={inputSx}>
                    {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                </>
              ) : (
                <>
                  <SettingRow label="Uber" value={optionLabel(platformOptions, profile.uberStatus)} />
                  <SettingRow label="Bolt" value={optionLabel(platformOptions, profile.boltStatus)} />
                  <SettingRow label="Alte platforme" value={optionLabel(triOptions, profile.otherPlatformsStatus)} />
                </>
              ),
              handleSaveProfile,
            )}
          </>
        )

      case 'cash':
        return (
          <>
            {renderDetailHeader('Cash și casă de marcat', 'Informații despre venituri cash și obligația de casă de marcat.')}
            {renderFormStack(
              editable ? (
                <>
                  <TextField select fullWidth size="small" label="Are venituri cash" value={form.cashRevenueStatus} onChange={(e) => setForm((f) => ({ ...f, cashRevenueStatus: e.target.value }))} sx={inputSx}>
                    {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth size="small" label="Are casă de marcat" value={form.cashRegisterStatus} onChange={(e) => setForm((f) => ({ ...f, cashRegisterStatus: e.target.value }))} sx={inputSx}>
                    {cashRegisterOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                </>
              ) : (
                <>
                  <SettingRow label="Are venituri cash" value={optionLabel(triOptions, profile.cashRevenueStatus)} />
                  <SettingRow label="Are casă de marcat" value={optionLabel(cashRegisterOptions, profile.cashRegisterStatus)} />
                </>
              ),
              handleSaveProfile,
            )}
          </>
        )

      case 'vehicle':
        return (
          <>
            {renderDetailHeader('Utilizare auto', 'Situația mașinii folosite de PFA și documentul justificativ.')}
            {renderFormStack(
              editable ? (
                <>
                  <TextField select fullWidth size="small" label="Tip utilizare auto" value={form.vehicleUsageType} onChange={(e) => setForm((f) => ({ ...f, vehicleUsageType: e.target.value }))} sx={inputSx}>
                    {vehicleOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                  <TextField fullWidth size="small" label="Document justificativ auto" value={form.vehicleSupportingDocumentLabel} onChange={(e) => setForm((f) => ({ ...f, vehicleSupportingDocumentLabel: e.target.value }))} placeholder="Ex: Contract de comodat verificat" sx={inputSx} />
                </>
              ) : (
                <>
                  <SettingRow label="Tip utilizare auto" value={optionLabel(vehicleOptions, profile.vehicleUsageType)} />
                  <SettingRow label="Document justificativ" value={profile.vehicleSupportingDocumentLabel || '—'} />
                </>
              ),
              handleSaveProfile,
            )}
          </>
        )

      case 'uber':
      case 'bolt': {
        const provider: Provider = section === 'uber' ? 'Uber' : 'Bolt'
        return (
          <>
            {renderDetailHeader(`Conturi ${provider}`, `Cont ${provider} Driver și ${provider} Fleet.`)}
            {renderFormStack(
              <>
                {renderAccountBlock(provider, 'Driver')}
                {renderAccountBlock(provider, 'Fleet')}
              </>,
              handleSaveAccounts,
              `Salvează conturi ${provider}`,
            )}
          </>
        )
      }

      case 'fleet':
        return (
          <>
            {renderDetailHeader('Permisiuni Fleet', 'Permisiuni pentru conturile fleet și integrarea Bolt Fleet API.')}
            <Alert severity="info" sx={{ borderRadius: TOKENS.radius.sm, maxWidth: 480, mb: 2 }}>
              Conturile fleet sunt create de RIDElance și pot fi utilizate de suport și contabil.
            </Alert>
            <Box sx={{ maxWidth: 480 }}>
              <SettingRow label="Permisiune conturi fleet" value={settings.fleetConsent.fleetAccountsAccepted ? 'Acceptată' : 'Neacceptată'} />
              <SettingRow label="Bolt Fleet API" value={settings.fleetConsent.boltApiAccepted ? 'Acceptat' : 'Neacceptat'} />
            </Box>
          </>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={26} sx={{ color: TOKENS.primary }} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!settings) return null

  return (
    <Stack spacing={2}>
      {apiUnavailable && (
        <Alert severity="warning" sx={{ borderRadius: TOKENS.radius.sm }}>
          API-ul pentru profil fiscal nu este încă disponibil pe backend. Afișez valorile implicite.
        </Alert>
      )}

      <Box
        sx={{
          borderRadius: TOKENS.radius.lg,
          border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
          bgcolor: TOKENS.paper,
          overflow: 'hidden',
          boxShadow: TOKENS.shadow.sm,
        }}
      >
        {/* Locked fiscal strip — always visible */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            bgcolor: alpha(TOKENS.primary, 0.035),
            borderBottom: `1px solid ${alpha(TOKENS.primary, 0.12)}`,
          }}
        >
          <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 700, letterSpacing: '0.04em', display: 'block', mb: 1.25 }}>
            Profil fiscal standard · blocat
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {FIXED_FISCAL_FIELDS.map((field) => (
              <LockedField key={field.label} label={field.label} value={field.value} />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px 1fr' }, minHeight: 420 }}>
          {/* Sidebar — desktop */}
          {!isMobile && (
            <Box
              sx={{
                borderRight: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                bgcolor: TOKENS.surfaceAlt,
                py: 2,
                px: 1,
              }}
            >
              {renderNav()}
            </Box>
          )}

          {/* Detail pane */}
          <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
            {isMobile && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
                <IconButton
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Deschide meniul secțiuni"
                  sx={{
                    border: `1px solid ${alpha(TOKENS.ink, 0.1)}`,
                    borderRadius: TOKENS.radius.sm,
                  }}
                >
                  <MenuRoundedIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 700, color: TOKENS.textMuted }}>
                  {activeNav?.label ?? 'Secțiune'}
                </Typography>
              </Stack>
            )}

            {!editable && section !== 'overview' && (
              <Typography variant="caption" sx={{ display: 'block', color: TOKENS.textSubtle, mb: 2, fontWeight: 600 }}>
                Mod doar citire
              </Typography>
            )}

            {renderDetail()}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        slotProps={{
          paper: { sx: { width: 280, bgcolor: TOKENS.surfaceAlt } },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
          <Typography sx={{ fontWeight: 800 }}>Profil fiscal</Typography>
          <Typography variant="caption" sx={{ color: TOKENS.textMuted }}>Alege secțiunea</Typography>
        </Box>
        {renderNav(true)}
      </Drawer>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  )
}
