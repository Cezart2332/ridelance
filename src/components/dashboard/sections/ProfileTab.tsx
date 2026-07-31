import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import character2 from '../../../assets/Stickers/character 2.png'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { userService, type UserProfile, type DashboardSummary } from '../../../services/user.service'
import { documentService } from '../../../services/document.service'
import { pfaService, type PfaPlatformAccount } from '../../../services/pfa.service'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import { formatRole } from '../../../utils/roleLabels'

type DriverAccountDraft = { email: string; phone: string; fullName: string }
type DriverDrafts = Record<'Uber' | 'Bolt', DriverAccountDraft>

const emptyDriverDraft: DriverAccountDraft = { email: '', phone: '', fullName: '' }

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: DASHBOARD_TOKENS.radius.lg,
  border: `1px solid ${DASHBOARD_TOKENS.border}`,
  boxShadow: DASHBOARD_TOKENS.shadow.sm,
} as const

const inputSx = {
  '& .MuiOutlinedInput-root': { bgcolor: DASHBOARD_TOKENS.paper, borderRadius: DASHBOARD_TOKENS.radius.sm },
} as const

export function ProfileTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [driverDrafts, setDriverDrafts] = useState<DriverDrafts>({ Uber: emptyDriverDraft, Bolt: emptyDriverDraft })
  const [savingDrivers, setSavingDrivers] = useState(false)
  const [accountsTab, setAccountsTab] = useState<'driver' | 'fleet'>('driver')
  const [driverSnackbar, setDriverSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const buildDriverDrafts = (data: DashboardSummary | null): DriverDrafts => {
    const draftFor = (provider: 'Uber' | 'Bolt'): DriverAccountDraft => {
      const account = data?.fiscalSettings?.platformAccounts.find(
        (a) => a.provider === provider && a.kind === 'Driver',
      )
      return { email: account?.email ?? '', phone: account?.phone ?? '', fullName: account?.fullName ?? '' }
    }
    return { Uber: draftFor('Uber'), Bolt: draftFor('Bolt') }
  }

  useEffect(() => {
    Promise.all([
      userService.getProfile(),
      userService.getDashboardSummary()
    ]).then(([profileData, summaryData]) => {
      setProfile(profileData)
      setSummary(summaryData)
      setDriverDrafts(buildDriverDrafts(summaryData))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateDriverDraft = (provider: 'Uber' | 'Bolt', patch: Partial<DriverAccountDraft>) => {
    setDriverDrafts((prev) => ({ ...prev, [provider]: { ...prev[provider], ...patch } }))
  }

  const handleSaveDriverAccounts = async () => {
    if (!summary?.pfaRegistrationId) return
    setSavingDrivers(true)
    try {
      const updated = await pfaService.updatePlatformAccounts(
        summary.pfaRegistrationId,
        (['Uber', 'Bolt'] as const).map((provider) => ({
          provider,
          kind: 'Driver',
          email: driverDrafts[provider].email,
          phone: driverDrafts[provider].phone,
          fullName: driverDrafts[provider].fullName,
          status: 'Configured',
        })),
      )
      setSummary((current) => current && current.fiscalSettings
        ? { ...current, fiscalSettings: { ...current.fiscalSettings, platformAccounts: updated } }
        : current)
      setDriverSnackbar({ open: true, message: 'Conturile de șofer au fost salvate.', severity: 'success' })
    } catch {
      setDriverSnackbar({ open: true, message: 'Conturile de șofer nu au putut fi salvate.', severity: 'error' })
    } finally {
      setSavingDrivers(false)
    }
  }

  const handleDownloadCertificat = async () => {
    if (!summary?.pfaCertificatId) return
    setDownloading(true)
    try {
      await documentService.downloadAndSave(summary.pfaCertificatId, 'Certificat_Inregistrare.pdf')
    } finally {
      setDownloading(false)
    }
  }

  const handleAcceptConsent = async (type: 'fleet' | 'bolt') => {
    if (!summary?.pfaRegistrationId) return
    setConsentLoading(true)
    try {
      const nextConsent = await pfaService.acceptFleetConsent(summary.pfaRegistrationId, {
        fleetAccountsAccepted: type === 'fleet' ? true : Boolean(summary.fiscalSettings?.fleetConsent.fleetAccountsAccepted),
        boltApiAccepted: type === 'bolt' ? true : Boolean(summary.fiscalSettings?.fleetConsent.boltApiAccepted),
      })
      setSummary((current) => current && current.fiscalSettings
        ? { ...current, fiscalSettings: { ...current.fiscalSettings, fleetConsent: nextConsent } }
        : current)
    } finally {
      setConsentLoading(false)
    }
  }

  const findAccount = (provider: string, kind: string): PfaPlatformAccount | undefined =>
    summary?.fiscalSettings?.platformAccounts.find((account) => account.provider === provider && account.kind === kind)

  const accountStatusLabel = (account?: PfaPlatformAccount) => {
    if (!account) return 'Neconfigurat'
    if (account.kind === 'Driver') return account.email ? 'Completat' : 'Necompletat'
    switch (account.status) {
      case 'Configured': return 'Configurat'
      case 'InProgress': return 'În curs'
      default: return 'Neconfigurat'
    }
  }

  const profileFields = profile
    ? [
        { label: 'Prenume', value: profile.firstName },
        { label: 'Nume', value: profile.lastName },
        { label: 'Email', value: profile.email },
        { label: 'Telefon', value: profile.phoneNumber || '—' },
        { label: 'Rol', value: formatRole(profile.role) },
        { label: 'Parola', value: '**********' },
        { label: 'Plan activ', value: 'RIDElance Pro' },
      ]
    : []

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  const pfaApproved = summary?.pfaStatus?.toLowerCase() === 'approved'

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      {/* Hero: identitate + PFA */}
      <Paper
        elevation={0}
        sx={{
          ...cardSx,
          background: `linear-gradient(135deg, ${alpha(DASHBOARD_TOKENS.primary, 0.08)} 0%, ${DASHBOARD_TOKENS.paper} 55%)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ gap: { xs: 2.5, md: 3 }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              src={character2}
              alt="Poza profil"
              sx={{ width: 72, height: 72, border: `2px solid ${alpha(DASHBOARD_TOKENS.primary, 0.35)}`, backgroundColor: DASHBOARD_TOKENS.paper }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 850, fontSize: '1.25rem', lineHeight: 1.3 }}>
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Cont RIDElance'}
              </Typography>
              <Typography noWrap sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.3 }}>
                {profile?.email}
              </Typography>
              <Stack direction="row" sx={{ gap: 0.8, mt: 1, flexWrap: 'wrap' }}>
                {profile && (
                  <Chip
                    label={formatRole(profile.role)}
                    size="small"
                    sx={{ fontWeight: 750, borderRadius: DASHBOARD_TOKENS.radius.full, color: DASHBOARD_TOKENS.primaryStrong, backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.12) }}
                  />
                )}
                <Chip
                  label="Plan: RIDElance Pro"
                  size="small"
                  sx={{ fontWeight: 750, borderRadius: DASHBOARD_TOKENS.radius.full, color: DASHBOARD_TOKENS.textMuted, backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.05) }}
                />
              </Stack>
            </Box>
          </Stack>

          {pfaApproved && (
            <Box
              sx={{
                p: 2,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                backgroundColor: DASHBOARD_TOKENS.paper,
                boxShadow: DASHBOARD_TOKENS.shadow.sm,
                width: { xs: '100%', md: 'auto' },
                minWidth: { md: 280 },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <HowToRegRoundedIcon sx={{ fontSize: 18, color: DASHBOARD_TOKENS.primaryStrong }} />
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.9rem' }}>
                  PFA aprobat
                </Typography>
              </Stack>
              <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.75rem' }}>
                CUI (Cod Unic de Înregistrare)
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.05rem', mb: 1.2 }}>
                {summary?.pfaCui}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                size="small"
                startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FileDownloadRoundedIcon />}
                onClick={handleDownloadCertificat}
                disabled={downloading || !summary?.pfaCertificatId}
                sx={{
                  py: 0.9,
                  fontWeight: 750,
                  textTransform: 'none',
                  boxShadow: 'none',
                  bgcolor: DASHBOARD_TOKENS.primary,
                  color: DASHBOARD_TOKENS.ink,
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
                }}
              >
                Descarcă Certificat PFA
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Split: date personale | conturi platforme */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* Date personale */}
        <Paper elevation={0} sx={cardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <PersonRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Date personale</Typography>
          </Stack>
          <Box>
            {profileFields.map((field, index) => (
              <Stack
                key={field.label}
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                  py: 1.4,
                  borderBottom: index === profileFields.length - 1 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                }}
              >
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', flexShrink: 0 }}>
                  {field.label}
                </Typography>
                <Typography
                  sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.9rem', textAlign: 'right', wordBreak: 'break-word', minWidth: 0 }}
                >
                  {field.value}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Paper>

        {/* Conturi platforme, organizate în taburi */}
        <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` }}>
            {([
              { id: 'driver', label: 'Conturi de șofer', icon: <DirectionsCarRoundedIcon sx={{ fontSize: 18 }} /> },
              { id: 'fleet', label: 'Conturi de flotă', icon: <GroupsRoundedIcon sx={{ fontSize: 18 }} /> },
            ] as const).map((tab) => {
              const isActive = accountsTab === tab.id
              return (
                <ButtonBase
                  key={tab.id}
                  onClick={() => setAccountsTab(tab.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 2, md: 3 },
                    py: 1.7,
                    borderBottom: `2px solid ${isActive ? DASHBOARD_TOKENS.primary : 'transparent'}`,
                    mb: '-1px',
                    color: isActive ? DASHBOARD_TOKENS.ink : DASHBOARD_TOKENS.textMuted,
                    transition: 'all 0.2s',
                    '&:hover': { color: DASHBOARD_TOKENS.ink },
                  }}
                >
                  <Box sx={{ display: 'grid', placeItems: 'center', color: isActive ? DASHBOARD_TOKENS.primaryStrong : DASHBOARD_TOKENS.textSubtle }}>
                    {tab.icon}
                  </Box>
                  <Typography sx={{ fontWeight: isActive ? 800 : 650, fontSize: '0.9rem', color: 'inherit' }}>
                    {tab.label}
                  </Typography>
                </ButtonBase>
              )
            })}
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
            {accountsTab === 'driver' ? (
              <>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
                  Completează datele conturilor tale de șofer Uber și Bolt. Contabilul le folosește pentru a-ți verifica rapoartele.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {(['Uber', 'Bolt'] as const).map((provider) => {
                    const account = findAccount(provider, 'Driver')
                    const draft = driverDrafts[provider]
                    return (
                      <Paper
                        key={provider}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: DASHBOARD_TOKENS.radius.md,
                          border: `1px solid ${DASHBOARD_TOKENS.border}`,
                          backgroundColor: DASHBOARD_TOKENS.surface,
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 750 }}>
                            {provider}
                          </Typography>
                          <Chip
                            label={accountStatusLabel(account)}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              borderRadius: DASHBOARD_TOKENS.radius.full,
                              color: account?.email ? DASHBOARD_TOKENS.stateActive : DASHBOARD_TOKENS.textMuted,
                              backgroundColor: account?.email
                                ? alpha(DASHBOARD_TOKENS.stateActive, 0.1)
                                : alpha(DASHBOARD_TOKENS.ink, 0.06),
                            }}
                          />
                        </Stack>
                        <Stack spacing={1.2}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Email"
                            value={draft.email}
                            onChange={(e) => updateDriverDraft(provider, { email: e.target.value })}
                            sx={inputSx}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            label="Nr telefon"
                            value={draft.phone}
                            onChange={(e) => updateDriverDraft(provider, { phone: e.target.value })}
                            sx={inputSx}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            label="Nume și prenume"
                            value={draft.fullName}
                            onChange={(e) => updateDriverDraft(provider, { fullName: e.target.value })}
                            sx={inputSx}
                          />
                        </Stack>
                      </Paper>
                    )
                  })}
                </Box>
                <Button
                  variant="contained"
                  onClick={handleSaveDriverAccounts}
                  disabled={savingDrivers || !summary?.pfaRegistrationId}
                  sx={{
                    mt: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: 'none',
                    bgcolor: DASHBOARD_TOKENS.primary,
                    color: DASHBOARD_TOKENS.ink,
                    borderRadius: DASHBOARD_TOKENS.radius.full,
                    px: 3,
                    '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
                  }}
                >
                  {savingDrivers ? <CircularProgress size={20} color="inherit" /> : 'Salvează conturile de șofer'}
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
                  Aceste conturi sunt create de RIDElance și pot fi utilizate de RIDElance suport și contabil pentru gestionarea corectă a colaborării.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {(['Uber', 'Bolt'] as const).map((provider) => {
                    const account = findAccount(provider, 'Fleet')
                    const rows = [
                      { label: 'Email', value: account?.email ?? '—' },
                      { label: 'Nr telefon', value: account?.phone ?? '—' },
                    ]
                    return (
                      <Paper
                        key={provider}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: DASHBOARD_TOKENS.radius.md,
                          border: `1px solid ${DASHBOARD_TOKENS.border}`,
                          backgroundColor: DASHBOARD_TOKENS.surface,
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 750 }}>
                            {provider} Fleet
                          </Typography>
                          <Chip
                            label={accountStatusLabel(account)}
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full }}
                          />
                        </Stack>
                        {rows.map((row, index) => (
                          <Stack
                            key={row.label}
                            direction="row"
                            sx={{
                              justifyContent: 'space-between',
                              gap: 2,
                              py: 0.9,
                              borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
                            }}
                          >
                            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>{row.label}</Typography>
                            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.85rem', textAlign: 'right', wordBreak: 'break-word' }}>
                              {row.value}
                            </Typography>
                          </Stack>
                        ))}
                      </Paper>
                    )
                  })}
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
                  <Button
                    variant={summary?.fiscalSettings?.fleetConsent.fleetAccountsAccepted ? 'outlined' : 'contained'}
                    disabled={consentLoading || summary?.fiscalSettings?.fleetConsent.fleetAccountsAccepted}
                    onClick={() => handleAcceptConsent('fleet')}
                    sx={{ fontWeight: 750, textTransform: 'none', borderRadius: DASHBOARD_TOKENS.radius.full }}
                  >
                    {summary?.fiscalSettings?.fleetConsent.fleetAccountsAccepted ? 'Permisiune conturi fleet acceptată' : 'Accept permisiunea pentru conturile fleet'}
                  </Button>
                  <Button
                    variant={summary?.fiscalSettings?.fleetConsent.boltApiAccepted ? 'outlined' : 'contained'}
                    disabled={consentLoading || summary?.fiscalSettings?.fleetConsent.boltApiAccepted}
                    onClick={() => handleAcceptConsent('bolt')}
                    sx={{ fontWeight: 750, textTransform: 'none', borderRadius: DASHBOARD_TOKENS.radius.full }}
                  >
                    {summary?.fiscalSettings?.fleetConsent.boltApiAccepted ? 'Bolt Fleet API acceptat' : 'Accept integrarea Bolt Fleet API'}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={driverSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setDriverSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={driverSnackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {driverSnackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
