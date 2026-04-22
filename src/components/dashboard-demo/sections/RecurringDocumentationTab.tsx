import { Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { monthlyRequiredDocuments } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

export function RecurringDocumentationTab() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
        Documentatie recurenta
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.7, fontSize: '0.9rem' }}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim, obcaecati.
      </Typography>

      <Stack spacing={1.2} sx={{ mt: 2 }}>
        {monthlyRequiredDocuments.map((documentName) => (
          <Paper
            key={documentName}
            elevation={0}
            sx={{
              p: 1.4,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              backgroundColor: DASHBOARD_TOKENS.surface,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700 }}>{documentName}</Typography>
              <Chip
                label="Obligatoriu"
                size="small"
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  fontWeight: 700,
                  color: '#2e7d32',
                  backgroundColor: alpha('#2e7d32', 0.1),
                }}
              />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  )
}
