import {Paper, Stack, Typography } from '@mui/material'

import { dashboardMetrics } from '../dashboardData'
import { DASHBOARD_TOKENS } from '../dashboardTheme'
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsBrushOverlay } from '@mui/x-charts/ChartsBrushOverlay';

const xAxisData = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];


export function HomeDashboardView() {
  return (
    <Stack spacing={2.5}>


      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {dashboardMetrics.map((metric) => (
          <Paper
            key={metric.label}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
            }}
          >
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.78rem', fontWeight: 700 }}>
              {metric.label}
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mt: 0.7, fontSize: '1.05rem' }}>
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
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
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
