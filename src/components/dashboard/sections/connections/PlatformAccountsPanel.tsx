import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'

import { DASHBOARD_TOKENS } from '../../dashboardTheme'
import { userService, type DashboardSummary } from '../../../../services/user.service'
import { pfaService, type PfaPlatformAccount } from '../../../../services/pfa.service'

type Provider = 'Uber' | 'Bolt'
type DriverDraft = { email: string; phone: string; fullName: string }

const emptyDraft: DriverDraft = { email: '', phone: '', fullName: '' }

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: DASHBOARD_TOKENS.radius.lg,
  border: `1px solid ${DASHBOARD_TOKENS.border}`,
  boxShadow: DASHBOARD_TOKENS.shadow.sm,
} as const

const inputSx = {
  '& .MuiOutlinedInput-root': { bgcolor: DASHBOARD_TOKENS.paper, borderRadius: DASHBOARD_TOKENS.radius.sm },
} as const

/**
 * Contul de șofer și contul de flotă pentru o singură platformă.
 *
 * Înainte, ambele platforme stăteau împreună într-un panou cu taburi în Profil. Odată ce
 * Bolt și Uber au pagini separate sub Conexiuni, panoul se taie pe provider. Salvarea e
 * sigură per provider: endpointul face upsert pe perechea (provider, kind), nu înlocuiește
 * întreaga listă, deci salvarea Bolt nu atinge contul Uber.
 */
export function PlatformAccountsPanel({ provider }: { provider: Provider }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<DriverDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    let cancelled = false
    userService
      .getDashboardSummary()
      .then((data) => {
        if (cancelled) return
        setSummary(data)
        const account = data?.fiscalSettings?.platformAccounts.find(
          (a) => a.provider === provider && a.kind === 'Driver',
        )
        // Câmpurile `driver*`, nu `email`/`phone`: pe același rând stau și credențialele contului
        // de flotă, iar cardul ăsta arăta contul nostru de operator sub titlul „Cont șofer".
        setDraft({
          email: account?.driverEmail ?? '',
          phone: account?.driverPhone ?? '',
          fullName: account?.driverFullName ?? '',
        })
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [provider])

  const findAccount = (kind: 'Driver' | 'Fleet'): PfaPlatformAccount | undefined =>
    summary?.fiscalSettings?.platformAccounts.find((a) => a.provider === provider && a.kind === kind)

  const accountStatusLabel = (account?: PfaPlatformAccount) => {
    if (!account) return 'Neconfigurat'
    if (account.kind === 'Driver') return account.driverEmail ? 'Completat' : 'Necompletat'
    switch (account.status) {
      case 'Configured':
        return 'Configurat'
      case 'InProgress':
        return 'În curs'
      default:
        return 'Neconfigurat'
    }
  }

  const handleSave = async () => {
    if (!summary?.pfaRegistrationId) return
    setSaving(true)
    try {
      const updated = await pfaService.updatePlatformAccounts(summary.pfaRegistrationId, [
        {
          provider,
          kind: 'Driver',
          email: draft.email,
          phone: draft.phone,
          fullName: draft.fullName,
          status: 'Configured',
        },
      ])
      setSummary((current) =>
        current && current.fiscalSettings
          ? { ...current, fiscalSettings: { ...current.fiscalSettings, platformAccounts: updated } }
          : current,
      )
      setSnackbar({ open: true, message: `Contul de șofer ${provider} a fost salvat.`, severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: `Contul de șofer ${provider} nu a putut fi salvat.`, severity: 'error' })
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 160 }}>
        <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  const driverAccount = findAccount('Driver')
  // Contul de flotă are rândul lui doar când l-a creat un operator din admin. Onboardingul îl
  // scrie pe linia Driver, în `email`/`phone` — de acolo se citește când linia Fleet lipsește.
  const fleetAccount = findAccount('Fleet') ?? driverAccount
  const consent = summary?.fiscalSettings?.fleetConsent
  const fleetRows = [
    { label: 'Email', value: fleetAccount?.email ?? '—' },
    { label: 'Nr telefon', value: fleetAccount?.phone ?? '—' },
    {
      label: 'Permisiune conturi fleet',
      value: consent?.fleetAccountsAccepted ? 'Acceptată' : 'Neacceptată',
    },
    // Integrarea API e specifică Bolt — Uber nu are așa ceva.
    ...(provider === 'Bolt'
      ? [{ label: 'Bolt Fleet API', value: consent?.boltApiAccepted ? 'Acceptat' : 'Neacceptat' }]
      : []),
  ]

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* Contul de șofer — al clientului, editabil de client. */}
        <Paper elevation={0} sx={cardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <DirectionsCarRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, flex: 1 }}>
              Cont șofer {provider}
            </Typography>
            <Chip
              label={accountStatusLabel(driverAccount)}
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: DASHBOARD_TOKENS.radius.full,
                color: driverAccount?.driverEmail ? DASHBOARD_TOKENS.stateActive : DASHBOARD_TOKENS.textMuted,
                backgroundColor: driverAccount?.driverEmail
                  ? alpha(DASHBOARD_TOKENS.stateActive, 0.1)
                  : alpha(DASHBOARD_TOKENS.ink, 0.06),
              }}
            />
          </Stack>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Contabilul folosește aceste date ca să-ți verifice rapoartele {provider}.
          </Typography>

          <Stack spacing={1.2}>
            <TextField
              size="small"
              fullWidth
              label="Email"
              value={draft.email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
              sx={inputSx}
            />
            <TextField
              size="small"
              fullWidth
              label="Nr telefon"
              value={draft.phone}
              onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
              sx={inputSx}
            />
            <TextField
              size="small"
              fullWidth
              label="Nume și prenume"
              value={draft.fullName}
              onChange={(e) => setDraft((prev) => ({ ...prev, fullName: e.target.value }))}
              sx={inputSx}
            />
          </Stack>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !summary?.pfaRegistrationId}
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
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Salvează contul de șofer'}
          </Button>
        </Paper>

        {/* Contul de flotă — creat și operat de RIDElance, doar de citit. */}
        <Paper elevation={0} sx={cardSx}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <GroupsRoundedIcon sx={{ fontSize: 20, color: DASHBOARD_TOKENS.primaryStrong }} />
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, flex: 1 }}>
              Cont {provider} Fleet
            </Typography>
            <Chip
              label={accountStatusLabel(fleetAccount)}
              size="small"
              sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full }}
            />
          </Stack>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
            Contul e creat de RIDElance și poate fi folosit de suport și de contabil pentru gestionarea
            corectă a colaborării.
          </Typography>

          {fleetRows.map((row, index) => (
            <Stack
              key={row.label}
              direction="row"
              sx={{
                justifyContent: 'space-between',
                gap: 2,
                py: 0.9,
                borderBottom: index === fleetRows.length - 1 ? 'none' : `1px solid ${DASHBOARD_TOKENS.border}`,
              }}
            >
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>{row.label}</Typography>
              <Typography
                sx={{
                  color: DASHBOARD_TOKENS.ink,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'right',
                  wordBreak: 'break-word',
                }}
              >
                {row.value}
              </Typography>
            </Stack>
          ))}

          {/*
            Permisiunile se cer în onboarding, la pasul Uber & Bolt, lângă conturile la care se
            referă. Aici rămân doar de citit: butoanele erau într-un ecran la care se ajunge abia
            după înrolare, adică după ce conturile fuseseră deja deschise.
          */}
          {!consent?.fleetAccountsAccepted && (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', mt: 2 }}>
              Permisiunile se acordă în onboarding, la pasul Uber &amp; Bolt.
            </Typography>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
