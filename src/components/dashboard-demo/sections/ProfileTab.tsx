import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import character2 from '../../../assets/Stickers/character 2.png'
import { dashboardProfileFields, dashboardRideAccounts } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

export function ProfileTab() {
  const driverAccounts = dashboardRideAccounts.filter((account) => account.provider.includes('driver') || account.provider.includes('Driver'))
  const fleetAccounts = dashboardRideAccounts.filter((account) => account.provider.includes('Fleet'))

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
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Andrei Popescu</Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.5 }}>
              sofer.demo@ridelance.ro
            </Typography>
          </div>
        </Stack>

        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {dashboardProfileFields.map((field) => (
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
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Conturi de șofer</Typography>
        <Stack spacing={1.4} sx={{ mt: 2 }}>
          {driverAccounts.map((account) => (
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
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
              >
                <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>
                  {account.provider}
                </Typography>
                <Chip
                  label={account.status}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: DASHBOARD_TOKENS.radius.full,
                    color: '#2e7d32',
                    backgroundColor: alpha('#2e7d32', 0.1),
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 1, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Email: {account.accountEmail}
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Nr telefon: 0722 456 190
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Nume Prenume: Andrei Popescu
              </Typography>
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
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Conturi de flotă</Typography>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 1, fontSize: '0.9rem' }}>
          Aceste conturi sunt create de RIDElance și pot fi utilizate de RIDElance suport și contabil pentru gestionarea corectă a colaborării.
        </Typography>
        <Stack spacing={1.4} sx={{ mt: 2 }}>
          {fleetAccounts.map((account) => (
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
                <Chip label={account.status} size="small" sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full }} />
              </Stack>
              <Typography sx={{ mt: 1, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Email: {account.accountEmail}
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>Nr telefon: 0722 000 190</Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>Parolă: ********</Typography>
            </Paper>
          ))}
        </Stack>
        <Stack spacing={1.2} sx={{ mt: 2 }}>
          <Button variant="outlined" disabled sx={{ fontWeight: 750, textTransform: 'none' }}>
            Permisiune conturi fleet acceptată
          </Button>
          <Button variant="outlined" disabled sx={{ fontWeight: 750, textTransform: 'none' }}>
            Bolt Fleet API acceptat
          </Button>
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
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 2 }}>
          Profil fiscal / Setări contabile PFA
        </Typography>
        {[
          ['Sistem de impozitare', 'Sistem real'],
          ['TVA', 'Neplătitor TVA'],
          ['Angajați', 'Fără angajați'],
          ['Regim contabil', 'Partidă simplă'],
          ['Cod special TVA', 'Da'],
          ['Data obținerii', '12.06.2026'],
          ['Document', 'Verificat'],
          ['Auto folosit', 'Mașină în comodat'],
          ['Document justificativ', 'Contract de comodat verificat'],
        ].map(([label, value]) => (
          <Paper
            key={label}
            elevation={0}
            sx={{
              p: 1.4,
              mb: 1,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              backgroundColor: DASHBOARD_TOKENS.surface,
            }}
          >
            <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.78rem', mb: 0.3 }}>{label}</Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{value}</Typography>
          </Paper>
        ))}
      </Paper>
    </Box>
  )
}
