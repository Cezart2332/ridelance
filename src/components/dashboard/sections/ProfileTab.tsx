import { useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import character2 from '../../../assets/Stickers/character 2.png'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { userService, type UserProfile, type DashboardSummary } from '../../../services/user.service'
import { documentService } from '../../../services/document.service'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { formatRole } from '../../../utils/roleLabels'
import { displayName } from '../../../utils/displayName'

const cardSx = {
  p: { xs: 2.5, md: 3 },
  borderRadius: DASHBOARD_TOKENS.radius.lg,
  border: `1px solid ${DASHBOARD_TOKENS.border}`,
  boxShadow: DASHBOARD_TOKENS.shadow.sm,
} as const

export function ProfileTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    Promise.all([
      userService.getProfile(),
      userService.getDashboardSummary()
    ]).then(([profileData, summaryData]) => {
      setProfile(profileData)
      setSummary(summaryData)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadCertificat = async () => {
    if (!summary?.pfaCertificatId) return
    setDownloading(true)
    try {
      await documentService.downloadAndSave(summary.pfaCertificatId, 'Certificat_Inregistrare.pdf')
    } finally {
      setDownloading(false)
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
                {displayName(profile)}
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

      {/* Date personale. Conturile de platformă au plecat la Conexiuni → Bolt / Uber. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, alignItems: 'start' }}>
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

      </Box>

    </Stack>
  )
}
