import { useEffect, useState } from 'react'
import { Avatar, Chip, CircularProgress, Paper, Stack, Typography, Button, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'

import character2 from '../../../assets/Stickers/character 2.png'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { userService, type UserProfile, type DashboardSummary } from '../../../services/user.service'
import { documentService } from '../../../services/document.service'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded'
import { formatRole } from '../../../utils/roleLabels'

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

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(280px, 1fr))' },
        gap: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar src={character2} alt="Poza profil" sx={{ width: 64, height: 64 }} />
          <div>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Cont RIDElance'}
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.5 }}>
              {profile?.email}
            </Typography>
          </div>
        </Stack>

        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {profileFields.map((field) => (
            <Paper
              key={field.label}
              elevation={0}
              sx={{
                p: 1.6,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                backgroundColor: DASHBOARD_TOKENS.surface,
              }}
            >
              <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.8rem', mb: 0.3 }}>
                {field.label}
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{field.value}</Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Conturi Uber & Bolt</Typography>
        <Stack spacing={1.4} sx={{ mt: 2 }}>
          {[
            { provider: 'Uber', accountEmail: '—', status: 'Neconfigurat' },
            { provider: 'Bolt', accountEmail: '—', status: 'Neconfigurat' },
          ].map((account) => (
            <Paper
              key={account.provider}
              elevation={0}
              sx={{
                p: 1.6,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                backgroundColor: DASHBOARD_TOKENS.surface,
              }}
            >
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>
                  {account.provider}
                </Typography>
                <Chip
                  label={account.status}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: DASHBOARD_TOKENS.radius.full,
                    color: '#ed6c02',
                    backgroundColor: alpha('#ed6c02', 0.1),
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 1, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Email: {account.accountEmail}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {summary?.pfaStatus?.toLowerCase() === 'approved' && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
            background: `linear-gradient(135deg, ${alpha(DASHBOARD_TOKENS.primary, 0.05)} 0%, ${DASHBOARD_TOKENS.surface} 100%)`,
          }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: DASHBOARD_TOKENS.radius.sm, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.1), color: DASHBOARD_TOKENS.primary }}>
              <HowToRegRoundedIcon />
            </Box>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Informații PFA</Typography>
          </Stack>

          <Stack spacing={2}>
            <Box>
              <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.8rem' }}>CUI (Cod Unic de Înregistrare)</Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '1.1rem' }}>{summary.pfaCui}</Typography>
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <FileDownloadRoundedIcon />}
              onClick={handleDownloadCertificat}
              disabled={downloading || !summary.pfaCertificatId}
              sx={{
                mt: 1,
                py: 1.2,
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                boxShadow: 'none',
                bgcolor: DASHBOARD_TOKENS.primary,
                color: DASHBOARD_TOKENS.ink,
                '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' }
              }}
            >
              Descarcă Certificat PFA
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
