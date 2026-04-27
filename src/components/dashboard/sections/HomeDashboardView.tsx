import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { dashboardMetrics } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { BarChart } from '@mui/x-charts/BarChart'
import { ChartsBrushOverlay } from '@mui/x-charts/ChartsBrushOverlay'

import iconCash from '../../../assets/SVG/2- Regular/coupon.svg'
import iconCard from '../../../assets/SVG/2- Regular/credit-card.svg'
import iconTaxes from '../../../assets/SVG/2- Regular/file.svg'
import iconBolt from '../../../assets/SVG/2- Regular/users.svg'
import iconUber from '../../../assets/SVG/2- Regular/users-three.svg'
import iconTotal from '../../../assets/SVG/2- Regular/chart-pie.svg'

const xAxisData = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const metricIcons: Record<string, string> = {
  'Venit cash': iconCash,
  'Venit card': iconCard,
  'Taxe estimate': iconTaxes,
  'Venit Bolt': iconBolt,
  'Venit Uber': iconUber,
  'Venit total': iconTotal,
}

export function HomeDashboardView() {
  return (
    <Stack spacing={2.5}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {dashboardMetrics.map((metric) => (
          <Paper
            key={metric.label}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
              background: `linear-gradient(160deg, ${alpha(DASHBOARD_TOKENS.primary, 0.05)} 0%, ${DASHBOARD_TOKENS.paper} 34%)`,
              display: 'flex',
              flexDirection: 'column',
              transition: `all 0.2s ease`,
              '&:hover': {
                boxShadow: DASHBOARD_TOKENS.shadow.md,
                borderColor: alpha(DASHBOARD_TOKENS.primary, 0.34),
              }
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }} spacing={1.5}>
              <Box 
                sx={{ 
                  p: 1.2, 
                  borderRadius: DASHBOARD_TOKENS.radius.md, 
                  backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img src={metricIcons[metric.label]} alt={metric.label} style={{ width: 22, height: 22, filter: 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)' }} />
              </Box>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', fontWeight: 650 }}>
                {metric.label}
              </Typography>
            </Stack>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.4rem' }}>
              {metric.value}
            </Typography>
          </Paper>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            gridColumn: { xs: 'span 12', xl: 'span 7' },
            p: 2.5,
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
            background: `linear-gradient(170deg, ${alpha(DASHBOARD_TOKENS.primary, 0.05)} 0%, ${DASHBOARD_TOKENS.paper} 35%)`,
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <div>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>Venit</Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mt: 0.4 }}>
                Venitul pe fiecare luna
              </Typography>
            </div>
          </Stack>

          <BarChart
            height={300}
            series={[
              {
                data: [4, 8, 6, 12, 9, 15, 11, 14, 13, 18, 16, 20],
                label: 'Venit',
              },
            ]}
            brushConfig={{ enabled: true }}
            xAxis={[{ data: xAxisData }]}
          >
            <ChartsBrushOverlay />
          </BarChart>

         
        </Paper>

       
      </div>
    </Stack>
  )
}
