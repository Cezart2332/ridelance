import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { TOKENS } from '../../../constants/tokens';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';
import type { MonthlyRevenuePoint } from '../../../services/user.service';
import type { StatsTimeframe, StatsPlatform } from './HomeDashboardView';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RevenueChartsProps {
  year: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  venitCash: number;
  venitCard: number;
  venitBolt: number;
  venitUber: number;
  incomeMonth?: number | null;
  timeframe: StatsTimeframe;
  platform: StatsPlatform;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

/** Extract per-source value from a MonthlyRevenuePoint depending on platform filter */
function getPointValue(p: MonthlyRevenuePoint, platform: StatsPlatform): number {
  if (platform === 'bolt') return p.venitBolt ?? 0;
  if (platform === 'uber') return p.venitUber ?? 0;
  return p.venitTotal;
}

/** Build the monthly chart data, filtered by platform */
function buildMonthlyChartData(
  points: MonthlyRevenuePoint[],
  platform: StatsPlatform,
) {
  const byMonth = new Map(points.map((p) => [p.month, p]));
  return MONTH_CHART_LABELS.map((label, index) => {
    const p = byMonth.get(index + 1);
    return {
      name: label,
      value: p ? getPointValue(p, platform) : 0,
    };
  });
}

/* ── ChartCard ──────────────────────────────────────────────────────────────── */

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

/* ── Main Component ─────────────────────────────────────────────────────────── */

export function RevenueCharts({
  year,
  monthlyRevenue,
  venitCash,
  venitCard,
  venitBolt,
  venitUber,
  incomeMonth,
  timeframe,
  platform,
}: RevenueChartsProps) {
  // Determine current month point
  const currentMonth = incomeMonth ?? new Date().getMonth() + 1;
  const currentMonthPoint = monthlyRevenue.find((p) => p.month === currentMonth);

  // Build main chart data based on timeframe
  let mainChartData: { name: string; value: number }[];
  let mainChartTitle: string;

  if (timeframe === 'year') {
    mainChartData = buildMonthlyChartData(monthlyRevenue, platform);
    mainChartTitle = `Venituri YTD — ${year}`;
  } else {
    mainChartData = [{
      name: monthNumberToLabel(currentMonth),
      value: currentMonthPoint ? getPointValue(currentMonthPoint, platform) : 0,
    }];
    mainChartTitle = `Venit luna curentă — ${monthNumberToLabel(currentMonth)} ${year}`;
  }

  const hasMainData = mainChartData.some((v) => v.value > 0);

  // Build breakdown chart data (filtered by platform)
  let breakdownData: { name: string; value: number }[];
  if (platform === 'bolt') {
    breakdownData = [{ name: 'Bolt', value: venitBolt }];
  } else if (platform === 'uber') {
    breakdownData = [{ name: 'Uber', value: venitUber }];
  } else {
    breakdownData = [
      { name: 'Cash', value: venitCash },
      { name: 'Card', value: venitCard },
      { name: 'Bolt', value: venitBolt },
      { name: 'Uber', value: venitUber },
    ];
  }
  const hasBreakdown = breakdownData.some((v) => v.value > 0);

  const breakdownMonthLabel =
    timeframe === 'year'
      ? String(year)
      : incomeMonth
        ? monthNumberToLabel(incomeMonth)
        : 'luna curentă';

  if (!hasMainData && !hasBreakdown) {
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

  // Determine appropriate bar color based on platform
  const barColor =
    platform === 'bolt'
      ? '#34d399'
      : platform === 'uber'
        ? '#60a5fa'
        : DASHBOARD_TOKENS.primary;

  const breakdownBarColor =
    platform === 'bolt'
      ? '#059669'
      : platform === 'uber'
        ? '#2563eb'
        : DASHBOARD_TOKENS.primaryStrong;

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
          gridTemplateColumns: { xs: '1fr', lg: hasMainData && hasBreakdown ? '1fr 1fr' : '1fr' },
          gap: 2,
        }}
      >
        {hasMainData && (
          <ChartCard title={mainChartTitle}>
            <Box sx={{ height: { xs: 300, md: 350 }, width: '100%', minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={mainChartData}
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
                    interval={0}
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
                    cursor={{ fill: alpha(barColor, 0.05) }}
                    contentStyle={{
                      backgroundColor: DASHBOARD_TOKENS.paper,
                      borderColor: DASHBOARD_TOKENS.border,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    itemStyle={{ color: barColor }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} lei`, 'Venit']}
                  />
                  <Bar
                    dataKey="value"
                    fill={barColor}
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
            title={`Structură venituri — ${breakdownMonthLabel}${timeframe === 'month' || timeframe === 'year' ? ` ${timeframe === 'month' ? year : ''}` : ''}`}
          >
            <Box sx={{ height: { xs: 300, md: 350 }, width: '100%', minWidth: 0, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  layout="vertical"
                  data={breakdownData}
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
                    cursor={{ fill: alpha(breakdownBarColor, 0.05) }}
                    contentStyle={{
                      backgroundColor: DASHBOARD_TOKENS.paper,
                      borderColor: DASHBOARD_TOKENS.border,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    itemStyle={{ color: breakdownBarColor }}
                    formatter={(value: any) => [`${Number(value).toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} lei`, 'Valoare']}
                  />
                  <Bar
                    dataKey="value"
                    fill={breakdownBarColor}
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
