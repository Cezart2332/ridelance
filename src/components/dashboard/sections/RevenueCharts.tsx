import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { TOKENS } from '../../../constants/tokens';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';
import type { MonthlyRevenuePoint } from '../../../services/user.service';

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
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        height: '100%',
        transition: `all 0.3s ${TOKENS.easing}`,
        '&:hover': {
          boxShadow: DASHBOARD_TOKENS.shadow.md,
          borderColor: alpha(DASHBOARD_TOKENS.primary, 0.25),
        },
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: subtitle ? 0.5 : 2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
          {subtitle}
        </Typography>
      )}
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
          p: { xs: 2, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
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

  const yearlyChartData = MONTH_CHART_LABELS.map((label, index) => ({
    name: label,
    value: yearlyTotals[index] ?? 0,
  }));

  const breakdownChartData = [
    { name: 'Cash', value: venitCash },
    { name: 'Card', value: venitCard },
    { name: 'Bolt', value: venitBolt },
    { name: 'Uber', value: venitUber },
  ];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.1rem' }}>
          Analiză venituri
        </Typography>
      </Box>
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
          >
            <Box sx={{ height: { xs: 300, md: 350 }, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearlyChartData}
                  margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(DASHBOARD_TOKENS.border, 0.5)} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: DASHBOARD_TOKENS.textMuted,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: DASHBOARD_TOKENS.textMuted,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    tickFormatter={(v) => `${v} lei`}
                  />
                  <Tooltip
                    cursor={{ fill: alpha(DASHBOARD_TOKENS.primary, 0.05) }}
                    contentStyle={{
                      backgroundColor: DASHBOARD_TOKENS.paper,
                      borderColor: DASHBOARD_TOKENS.border,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    itemStyle={{ color: DASHBOARD_TOKENS.primary }}
                    formatter={(value: any) => [`${value} lei`, 'Venit']}
                  />
                  <Bar
                    dataKey="value"
                    fill={DASHBOARD_TOKENS.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        )}

        {hasBreakdown && (
          <ChartCard
            title={`Structură venituri — ${breakdownMonthLabel} ${year}`}
          >
            <Box sx={{ height: { xs: 300, md: 350 }, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={breakdownChartData}
                  margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={alpha(DASHBOARD_TOKENS.border, 0.5)} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: DASHBOARD_TOKENS.textMuted,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    tickFormatter={(v) => `${v} lei`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: DASHBOARD_TOKENS.textMuted,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: alpha(DASHBOARD_TOKENS.primaryStrong, 0.05) }}
                    contentStyle={{
                      backgroundColor: DASHBOARD_TOKENS.paper,
                      borderColor: DASHBOARD_TOKENS.border,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    itemStyle={{ color: DASHBOARD_TOKENS.primaryStrong }}
                    formatter={(value: any) => [`${value} lei`, 'Valoare']}
                  />
                  <Bar
                    dataKey="value"
                    fill={DASHBOARD_TOKENS.primaryStrong}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        )}
      </Box>
    </Stack>
  );
}
