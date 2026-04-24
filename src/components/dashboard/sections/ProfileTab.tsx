import { Avatar, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import character2 from '../../../assets/Stickers/character 2.png'
import { dashboardProfileFields, dashboardRideAccounts } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

export function ProfileTab() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
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
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Cont RIDElance</Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.5 }}>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex, nostrum?
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
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Conturi Uber & Bolt</Typography>
        <Stack spacing={1.4} sx={{ mt: 2 }}>
          {dashboardRideAccounts.map((account) => (
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
            </Paper>
          ))}
        </Stack>
      </Paper>
    </div>
  )
}
