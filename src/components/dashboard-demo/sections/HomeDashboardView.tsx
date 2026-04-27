import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { dashboardMetrics } from '../dashboardData'
import { TOKENS } from '../../../constants/tokens'
import { BarChart } from '@mui/x-charts/BarChart'

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
    <Stack spacing={4}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}
      >
        {dashboardMetrics.map((metric) => (
          <Paper
            key={metric.label}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: TOKENS.radius.xl,
              border: `1px solid ${TOKENS.border}`,
              backgroundColor: TOKENS.paper,
              display: 'flex',
              flexDirection: 'column',
              transition: `all 0.3s ${TOKENS.easing}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: TOKENS.shadow.md,
                borderColor: TOKENS.primary,
              }
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', mb: 2.5 }} spacing={2}>
              <Box 
                sx={{ 
                  p: 1.2, 
                  borderRadius: TOKENS.radius.lg, 
                  backgroundColor: alpha(TOKENS.primary, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img src={metricIcons[metric.label]} alt={metric.label} style={{ width: 24, height: 24, filter: 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)' }} />
              </Box>
              <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', fontWeight: 700 }}>
                {metric.label}
              </Typography>
            </Stack>
            <Typography sx={{ color: TOKENS.ink, fontWeight: 900, fontSize: '1.75rem', letterSpacing: -0.5 }}>
              {metric.value}
            </Typography>
          </Paper>
        ))}
      </div>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: TOKENS.radius.xl,
          border: `1px solid ${TOKENS.border}`,
          bgcolor: TOKENS.paper,
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h6" sx={{ color: TOKENS.ink, fontWeight: 800 }}>Analiză Venituri</Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.85rem', mt: 0.5 }}>
              Evoluția veniturilor brute pe parcursul anului curent
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ height: 350, width: '100%' }}>
          <BarChart
            series={[
              {
                data: [4500, 5200, 4800, 6100, 5900, 7500, 6800, 7200, 6900, 8400, 7800, 9200],
                label: 'Venit (RON)',
                color: TOKENS.primary,
              },
            ]}
            xAxis={[{ data: xAxisData, scaleType: 'band' }]}
            borderRadius={8}
            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
          />
        </Box>
      </Paper>
    </Stack>
  )
}
