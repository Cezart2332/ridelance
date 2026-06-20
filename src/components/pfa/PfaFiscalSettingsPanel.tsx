import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { TOKENS } from '../../constants/tokens'
import {
  pfaService,
  type PfaFiscalSettings,
  type PfaPlatformAccount,
  type UpsertPfaPlatformAccountItem,
} from '../../services/pfa.service'

type Provider = 'Uber' | 'Bolt'
type AccountKind = 'Driver' | 'Fleet'

interface PfaFiscalSettingsPanelProps {
  pfaId: string
  editable?: boolean
}

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

export function PfaFiscalSettingsPanel({ pfaId, editable = false }: PfaFiscalSettingsPanelProps) {
  const [settings, setSettings] = useState<PfaFiscalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const loadSettings = () => {
    setLoading(true)
    setError(null)
    pfaService.getFiscalSettings(pfaId)
      .then((data) => {
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
      })
      .catch(() => setError('Nu s-au putut încărca setările fiscale PFA.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSettings()
  }, [pfaId])

  const summaryRows = useMemo(() => {
    if (!settings) return []
    const profile = settings.fiscalProfile
    return [
      { label: 'Sistem de impozitare', value: 'Sistem real' },
      { label: 'TVA', value: 'Neplătitor TVA' },
      { label: 'Angajați', value: 'Fără angajați' },
      { label: 'Regim contabil', value: 'Partidă simplă' },
      { label: 'Cod special TVA', value: optionLabel(specialVatOptions, profile.specialVatCodeStatus) },
      { label: 'Data obținerii', value: roDate(profile.specialVatCodeObtainedAtUtc) },
      { label: 'Document', value: profile.specialVatCodeDocumentId ? 'Verificat' : '—' },
      { label: 'Uber', value: optionLabel(platformOptions, profile.uberStatus) },
      { label: 'Bolt', value: optionLabel(platformOptions, profile.boltStatus) },
      { label: 'Alte platforme', value: optionLabel(triOptions, profile.otherPlatformsStatus) },
      { label: 'Venituri cash', value: optionLabel(triOptions, profile.cashRevenueStatus) },
      { label: 'Casă de marcat', value: optionLabel(cashRegisterOptions, profile.cashRegisterStatus) },
      { label: 'Auto folosit', value: optionLabel(vehicleOptions, profile.vehicleUsageType) },
      { label: 'Document justificativ', value: profile.vehicleSupportingDocumentLabel || '—' },
    ]
  }, [settings])

  const updateAccount = (provider: Provider, kind: AccountKind, patch: Partial<UpsertPfaPlatformAccountItem>) => {
    const key = accountKey(provider, kind)
    setAccounts((prev) => ({ ...prev, [key]: { ...prev[key], provider, kind, ...patch } }))
  }

  const handleSaveProfile = async () => {
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
    } catch {
      setSnackbar({ open: true, message: 'Profilul fiscal nu a putut fi salvat.', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAccounts = async () => {
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
    } catch {
      setSnackbar({ open: true, message: 'Conturile nu au putut fi salvate.', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleMarkConfigured = async (provider: Provider) => {
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
    } catch {
      setSnackbar({ open: true, message: 'Statusul contului fleet nu a putut fi actualizat.', severity: 'error' })
    } finally {
      setSaving(false)
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

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850 }}>Profil fiscal / Setări contabile PFA</Typography>
            <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>
              Setări completate în Admin și vizibile pentru contabil.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Chip label="Sistem real" size="small" sx={{ fontWeight: 800 }} />
            <Chip label="Neplătitor TVA" size="small" sx={{ fontWeight: 800 }} />
            <Chip label="Fără angajați" size="small" sx={{ fontWeight: 800 }} />
            <Chip label="Partidă simplă" size="small" sx={{ fontWeight: 800 }} />
          </Stack>
        </Stack>

        {editable ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <TextField select label="Cod special TVA" value={form.specialVatCodeStatus} onChange={(e) => setForm((f) => ({ ...f, specialVatCodeStatus: e.target.value }))} sx={fieldSx}>
                {specialVatOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField
                label="Data obținerii"
                type="date"
                value={form.specialVatCodeObtainedAtUtc}
                onChange={(e) => setForm((f) => ({ ...f, specialVatCodeObtainedAtUtc: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={fieldSx}
              />
              <TextField label="Document cod TVA" value={settings.fiscalProfile.specialVatCodeDocumentId ? 'Verificat' : '—'} disabled sx={fieldSx} />
              <TextField select label="Uber" value={form.uberStatus} onChange={(e) => setForm((f) => ({ ...f, uberStatus: e.target.value }))} sx={fieldSx}>
                {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select label="Bolt" value={form.boltStatus} onChange={(e) => setForm((f) => ({ ...f, boltStatus: e.target.value }))} sx={fieldSx}>
                {platformOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select label="Alte platforme" value={form.otherPlatformsStatus} onChange={(e) => setForm((f) => ({ ...f, otherPlatformsStatus: e.target.value }))} sx={fieldSx}>
                {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select label="Are venituri cash" value={form.cashRevenueStatus} onChange={(e) => setForm((f) => ({ ...f, cashRevenueStatus: e.target.value }))} sx={fieldSx}>
                {triOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select label="Are casă de marcat" value={form.cashRegisterStatus} onChange={(e) => setForm((f) => ({ ...f, cashRegisterStatus: e.target.value }))} sx={fieldSx}>
                {cashRegisterOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
              <TextField select label="Tip utilizare auto" value={form.vehicleUsageType} onChange={(e) => setForm((f) => ({ ...f, vehicleUsageType: e.target.value }))} sx={fieldSx}>
                {vehicleOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="Document justificativ auto" value={form.vehicleSupportingDocumentLabel} onChange={(e) => setForm((f) => ({ ...f, vehicleSupportingDocumentLabel: e.target.value }))} placeholder="Ex: Contract de comodat verificat" sx={fieldSx} />
            <Button variant="contained" onClick={handleSaveProfile} disabled={saving} sx={{ alignSelf: 'flex-start', fontWeight: 800, boxShadow: 'none' }}>
              Salvează profil fiscal
            </Button>
          </Stack>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
            {summaryRows.map((row) => (
              <Box key={row.label} sx={{ p: 1.5, borderRadius: TOKENS.radius.md, bgcolor: alpha(TOKENS.surface, 0.7), border: `1px solid ${alpha(TOKENS.ink, 0.06)}` }}>
                <Typography variant="caption" sx={{ color: TOKENS.textSubtle, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ color: TOKENS.ink, fontWeight: 750, mt: 0.4 }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: TOKENS.radius.lg, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, boxShadow: TOKENS.shadow.sm }}>
        <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>Conturi Uber & Bolt</Typography>
        <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
          Conturile fleet sunt create de RIDElance pentru suport și gestionare contabilă corectă.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={settings.fleetConsent.fleetAccountsAccepted ? 'Permisiune conturi fleet acceptată' : 'Permisiune conturi fleet neacceptată'}
            color={settings.fleetConsent.fleetAccountsAccepted ? 'success' : 'default'}
            sx={{ fontWeight: 800 }}
          />
          <Chip
            label={settings.fleetConsent.boltApiAccepted ? 'Bolt Fleet API acceptat' : 'Bolt Fleet API neacceptat'}
            color={settings.fleetConsent.boltApiAccepted ? 'success' : 'default'}
            sx={{ fontWeight: 800 }}
          />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {(['Uber', 'Bolt'] as Provider[]).map((provider) => (
            <Stack key={provider} spacing={1.5}>
              {(['Driver', 'Fleet'] as AccountKind[]).map((kind) => {
                const key = accountKey(provider, kind)
                const account = findAccount(settings.platformAccounts, provider, kind)
                const draft = accounts[key]
                return (
                  <Paper key={key} elevation={0} sx={{ p: 2, borderRadius: TOKENS.radius.md, border: `1px solid ${alpha(TOKENS.ink, 0.08)}`, bgcolor: alpha(TOKENS.surface, 0.65) }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 850 }}>{provider} {kind === 'Driver' ? 'Driver' : 'Fleet'}</Typography>
                      <Chip
                        label={kind === 'Driver' ? (account?.email ? 'Completat' : 'Necompletat') : optionLabel(fleetStatusOptions, account?.status ?? draft?.status)}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                    {editable ? (
                      <Stack spacing={1.2}>
                        <TextField size="small" label="Email" value={draft?.email ?? ''} onChange={(e) => updateAccount(provider, kind, { email: e.target.value })} sx={fieldSx} />
                        <TextField size="small" label="Nr telefon" value={draft?.phone ?? ''} onChange={(e) => updateAccount(provider, kind, { phone: e.target.value })} sx={fieldSx} />
                        <TextField size="small" label="Nume Prenume" value={draft?.fullName ?? ''} onChange={(e) => updateAccount(provider, kind, { fullName: e.target.value })} sx={fieldSx} />
                        {kind === 'Fleet' && (
                          <>
                            <TextField size="small" label={account?.hasPassword ? 'Parolă nouă (opțional)' : 'Parolă'} type="password" value={draft?.password ?? ''} onChange={(e) => updateAccount(provider, kind, { password: e.target.value })} sx={fieldSx} />
                            <TextField select size="small" label="Status" value={draft?.status ?? 'NotConfigured'} onChange={(e) => updateAccount(provider, kind, { status: e.target.value })} sx={fieldSx}>
                              {fleetStatusOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                            </TextField>
                            <Button size="small" variant="outlined" onClick={() => handleMarkConfigured(provider)} disabled={saving} sx={{ alignSelf: 'flex-start', fontWeight: 800 }}>
                              Configurat
                            </Button>
                          </>
                        )}
                      </Stack>
                    ) : (
                      <Stack spacing={0.7}>
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Email: <strong>{account?.email ?? '—'}</strong></Typography>
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Nr telefon: <strong>{account?.phone ?? '—'}</strong></Typography>
                        <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Nume Prenume: <strong>{account?.fullName ?? '—'}</strong></Typography>
                        {kind === 'Fleet' && <Typography variant="body2" sx={{ color: TOKENS.textMuted }}>Parolă: <strong>{account?.hasPassword ? '********' : '—'}</strong></Typography>}
                      </Stack>
                    )}
                  </Paper>
                )
              })}
            </Stack>
          ))}
        </Box>
        {editable && (
          <Button variant="contained" onClick={handleSaveAccounts} disabled={saving} sx={{ mt: 2, fontWeight: 800, boxShadow: 'none' }}>
            Salvează conturi
          </Button>
        )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  )
}
