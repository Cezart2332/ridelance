import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';
import type { MonthlyRevenuePoint } from '../../../services/user.service';

const chartMargin = { top: 16, right: 16, bottom: 36, left: 56 };

interface RevenueChartsProps {
  year: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
  incomeMonth?: number | null;
}

function normalizeMonthlyTotals(points: MonthlyRevenuePoint[]): number[] {
  const byMonth = new Map(points.map((p) => [p.month, Number(p.venitTotal)]));
  return Array.from({ length: 12 }, (_, i) => byMonth.get(i + 1) ?? 0);
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        height: '100%',
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
        {subtitle}
      </Typography>
      {children}
    </Paper>
  );
}

export function RevenueCharts({
  year,
  monthlyRevenue,
  venitCash,
  venitCard,
  venitBolt,
  venitUber,
  incomeMonth,
}: RevenueChartsProps) {
  const yearlyTotals = normalizeMonthlyTotals(monthlyRevenue);
  const hasYearData = yearlyTotals.some((v) => v > 0);
  const breakdownValues = [venitCash, venitCard, venitBolt, venitUber];
  const hasBreakdown = breakdownValues.some((v) => v > 0);
  const breakdownMonthLabel = incomeMonth ? monthNumberToLabel(incomeMonth) : 'luna curentă';

  if (!hasYearData && !hasBreakdown) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
          Grafice venituri
        </Typography>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
          Nu există încă date de venituri pentru grafice. Contabilul tău le va introduce lunar.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: hasYearData && hasBreakdown ? '1fr 1fr' : '1fr' },
        gap: 2,
      }}
    >
      {hasYearData && (
        <ChartCard
          title={`Venit total pe luni — ${year}`}
          subtitle="Evoluția veniturilor brute introduse de contabil"
        >
          <Box sx={{ height: { xs: 280, md: 320 }, width: '100%' }}>
            <BarChart
              series={[
                {
                  data: yearlyTotals,
                  label: 'Venit (lei)',
                  color: DASHBOARD_TOKENS.primary,
                },
              ]}
              xAxis={[{ data: [...MONTH_CHART_LABELS], scaleType: 'band' }]}
              borderRadius={6}
              margin={chartMargin}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: DASHBOARD_TOKENS.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                },
                '& .MuiChartsAxis-label': {
                  fill: DASHBOARD_TOKENS.textMuted,
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        </ChartCard>
      )}

      {hasBreakdown && (
        <ChartCard
          title={`Structură venituri — ${breakdownMonthLabel} ${year}`}
          subtitle="Împărțire pe canale pentru luna selectată"
        >
          <Box sx={{ height: { xs: 280, md: 320 }, width: '100%' }}>
            <BarChart
              layout="horizontal"
              series={[
                {
                  data: breakdownValues,
                  label: 'Lei',
                  color: DASHBOARD_TOKENS.primaryStrong,
                },
              ]}
              yAxis={[{ data: ['Cash', 'Card', 'Bolt', 'Uber'], scaleType: 'band' }]}
              borderRadius={6}
              margin={{ top: 16, right: 24, bottom: 24, left: 72 }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: DASHBOARD_TOKENS.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        </ChartCard>
      )}
    </Box>
  );
}
