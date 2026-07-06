import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { boltService, type BoltDashboardDto } from '../../../services/bolt.service';
import { uberService, type UberDashboardDto } from '../../../services/uber.service';
import { userService, type DashboardSummary } from '../../../services/user.service';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type StatsTimeframe = 'month' | 'year';
export type StatsPlatform = 'all' | 'bolt' | 'uber';

interface HomeDashboardViewProps {
  onNavigate?: (sectionId: string) => void;
}

/** Darker step of the brand cyan — 3:1 contrast on white, validated. */
const CHART_BAR_COLOR = '#0e7fa8';

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatLei(value: number) {
  return `${Math.round(value).toLocaleString('ro-RO')} lei`;
}

function pfaStatusChip(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending:  { label: 'PFA în verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
    Approved: { label: 'PFA aprobat',       color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Rejected: { label: 'PFA respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
  };
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  );
}

/* ── KPI Tile ──────────────────────────────────────────────────────────────── */

function KpiTile({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.2, md: 2.6 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${highlight ? alpha(DASHBOARD_TOKENS.primary, 0.35) : DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700, fontSize: '0.82rem' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: { xs: '1.5rem', md: '1.75rem' },
          lineHeight: 1.15,
          mt: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Typography>
      {helper && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 600, fontSize: '0.78rem', mt: 0.6 }}>
          {helper}
        </Typography>
      )}
    </Paper>
  );
}

/* ── Section Card ──────────────────────────────────────────────────────────── */

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.2, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.02rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', mt: 0.4, lineHeight: 1.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}

/* ── Platform Row ──────────────────────────────────────────────────────────── */

function PlatformRow({
  icon,
  name,
  statusChip,
  amount,
  detail,
  onClick,
}: {
  icon: ReactNode;
  name: string;
  statusChip?: ReactNode;
  amount: string;
  detail: string;
  onClick?: () => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.6}
      onClick={onClick}
      sx={{
        alignItems: 'center',
        p: 1.6,
        borderRadius: DASHBOARD_TOKENS.radius.md,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.surface,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 180ms ease, background-color 180ms ease',
        '&:hover': onClick
          ? { borderColor: alpha(DASHBOARD_TOKENS.primary, 0.4), bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04) }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          display: 'grid',
          placeItems: 'center',
          color: DASHBOARD_TOKENS.primaryStrong,
          bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12),
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.95rem' }}>
            {name}
          </Typography>
          {statusChip}
        </Stack>
        <Typography noWrap sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem', mt: 0.25 }}>
          {detail}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: '1rem',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {amount}
      </Typography>
    </Stack>
  );
}

/* ── Tax breakdown row ─────────────────────────────────────────────────────── */

function TaxRow({ label, value, total }: { label: string; value: number; total: number }) {
  const progress = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
          {formatLei(value)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 4,
          bgcolor: alpha(CHART_BAR_COLOR, 0.12),
          '& .MuiLinearProgress-bar': { bgcolor: CHART_BAR_COLOR, borderRadius: 4 },
        }}
      />
    </Box>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function HomeDashboardView({ onNavigate }: HomeDashboardViewProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [boltDashboard, setBoltDashboard] = useState<BoltDashboardDto | null>(null);
  const [uberDashboard, setUberDashboard] = useState<UberDashboardDto | null>(null);
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      userService.getDashboardSummary(),
      boltService.getDashboard('month'),
      uberService.getDashboard('month'),
    ]).then(([summaryResult, boltResult, uberResult]) => {
      if (!mounted) return;

      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
      else console.error(summaryResult.reason);

      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      else console.error(boltResult.reason);

      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
      else console.error(uberResult.reason);
    }).finally(() => {
      if (mounted) setSummaryLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleTimeframeChange = (nextTimeframe: StatsTimeframe) => {
    setTimeframe(nextTimeframe);

    Promise.allSettled([
      boltService.getDashboard(nextTimeframe),
      uberService.getDashboard(nextTimeframe),
    ]).then(([boltResult, uberResult]) => {
      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
    });
  };

  const goToPlatforms = onNavigate ? () => onNavigate('platforms') : undefined;

  if (summaryLoading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 240 }}>
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    );
  }

  if (!summary) {
    return (
      <Typography sx={{ color: DASHBOARD_TOKENS.textMuted }}>
        Nu s-au putut încărca datele. Încearcă din nou mai târziu.
      </Typography>
    );
  }

  // ── Aggregate income for the selected timeframe ──
  const stats = timeframe === 'year' ? summary.yearlyStats : summary.monthlyStats;
  const venitBolt = stats?.venitBolt ?? summary.venitBolt ?? 0;
  const venitUber = stats?.venitUber ?? summary.venitUber ?? 0;
  const venitTotal = venitBolt + venitUber;
  const taxeEstimate = timeframe === 'year' ? summary.ytdTotalTax : summary.taxeEstimate ?? 0;

  const periodLabel =
    timeframe === 'year'
      ? String(summary.incomeYear ?? new Date().getFullYear())
      : summary.incomeMonth && summary.incomeYear
        ? `${monthNumberToLabel(summary.incomeMonth)} ${summary.incomeYear}`
        : 'luna curentă';

  // ── Chart data: one series, monthly totals for the year ──
  const chartYear = summary.revenueChartYear ?? new Date().getFullYear();
  const byMonth = new Map((summary.monthlyRevenue ?? []).map((p) => [p.month, p]));
  const chartData = MONTH_CHART_LABELS.map((label, index) => ({
    name: label,
    value: byMonth.get(index + 1)?.venitTotal ?? 0,
  }));
  const hasChartData = chartData.some((p) => p.value > 0);

  // ── Platform synthesis rows ──
  const boltConfigured = boltDashboard?.isConfigured ?? false;
  const boltStatusChip = boltDashboard ? (
    boltConfigured ? (
      <Chip
        label={boltDashboard.isConnected ? 'Conectat' : 'Necesită reconectare'}
        size="small"
        sx={{
          height: 20,
          fontSize: '0.68rem',
          borderRadius: DASHBOARD_TOKENS.radius.full,
          fontWeight: 800,
          color: boltDashboard.isConnected ? '#047857' : '#b45309',
          bgcolor: boltDashboard.isConnected ? alpha('#10b981', 0.12) : alpha('#f59e0b', 0.14),
        }}
      />
    ) : (
      <Chip
        label="Neconectat"
        size="small"
        sx={{
          height: 20,
          fontSize: '0.68rem',
          borderRadius: DASHBOARD_TOKENS.radius.full,
          fontWeight: 800,
          color: DASHBOARD_TOKENS.textMuted,
          bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06),
        }}
      />
    )
  ) : undefined;

  const boltDetail = boltConfigured
    ? `${(boltDashboard?.totalOrdersCount ?? 0).toLocaleString('ro-RO')} curse · ${(boltDashboard?.totalRideHours ?? 0).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} h în cursă`
    : 'Conectează contul din pagina Platforme';

  const uberStats = uberDashboard?.stats;
  const lastUberImport = uberDashboard?.imports?.[0];
  const uberDetail = lastUberImport
    ? `${(uberStats?.trips ?? 0).toLocaleString('ro-RO')} curse · ultimul import ${new Date(lastUberImport.importedAtUtc).toLocaleDateString('ro-RO')}`
    : 'Importă rapoartele CSV din pagina Platforme';

  const hasFiscalData = summary.ytdTotalIncome > 0;

  return (
    <Stack spacing={3}>
      {/* ── Header ── */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: { xs: '1.4rem', md: '1.65rem' }, lineHeight: 1.15 }}>
            Privire de ansamblu
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.5, fontSize: '0.92rem' }}>
            Sinteza veniturilor și a taxelor pentru {periodLabel}.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          {pfaStatusChip(summary.pfaStatus)}
          <Chip
            label={`${summary.approvedDocuments}/${summary.totalDocuments} documente valide`}
            size="small"
            sx={{ fontWeight: 700, borderRadius: DASHBOARD_TOKENS.radius.full, bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.05), color: DASHBOARD_TOKENS.ink }}
          />
          <ToggleButtonGroup
            exclusive
            value={timeframe}
            onChange={(_: MouseEvent<HTMLElement>, v: StatsTimeframe | null) => {
              if (v) handleTimeframeChange(v);
            }}
            size="small"
            sx={{
              bgcolor: DASHBOARD_TOKENS.paper,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              p: 0.4,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                px: 1.8,
                py: 0.55,
                borderRadius: `${DASHBOARD_TOKENS.radius.sm}px !important`,
                color: DASHBOARD_TOKENS.textMuted,
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.18),
                  color: DASHBOARD_TOKENS.ink,
                },
              },
            }}
          >
            <ToggleButton value="month">Lună</ToggleButton>
            <ToggleButton value="year">An</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* ── KPI row ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <KpiTile label="Venit total" value={formatLei(venitTotal)} helper="Bolt + Uber, total contabil" highlight />
        <KpiTile label="Venit Bolt" value={formatLei(venitBolt)} />
        <KpiTile label="Venit Uber" value={formatLei(venitUber)} />
        <KpiTile
          label="Taxe estimate"
          value={formatLei(taxeEstimate)}
          helper={timeframe === 'year' ? `CAS + CASS + impozit, ${summary.taxYear}` : 'Estimare pentru luna curentă'}
        />
      </Box>

      {/* ── Chart + fiscal synthesis ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(300px, 1fr)' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <SectionCard
          title="Evoluția veniturilor"
          subtitle={`Total lunar Bolt + Uber în ${chartYear}`}
        >
          {hasChartData ? (
            <Box sx={{ width: '100%', height: { xs: 260, md: 320 }, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(DASHBOARD_TOKENS.ink, 0.07)} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    width={52}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(value) => `${Number(value).toLocaleString('ro-RO')}`}
                  />
                  <Tooltip
                    cursor={{ fill: alpha(CHART_BAR_COLOR, 0.07) }}
                    contentStyle={{
                      border: `1px solid ${DASHBOARD_TOKENS.border}`,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    formatter={(value) => [`${Number(value ?? 0).toLocaleString('ro-RO')} lei`, 'Venit total']}
                  />
                  <Bar dataKey="value" fill={CHART_BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Stack sx={{ height: { xs: 220, md: 300 }, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
                Încă nu există venituri înregistrate în {chartYear}.
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.88rem', mt: 0.6, maxWidth: 380 }}>
                Graficul se completează automat pe măsură ce apar încasări Bolt și importuri Uber.
              </Typography>
            </Stack>
          )}
        </SectionCard>

        <SectionCard
          title={`Estimare fiscală ${summary.taxYear}`}
          subtitle="Calcul automat din venitul anual Bolt + Uber, după deducerea cheltuielilor."
        >
          {hasFiscalData ? (
            <Stack spacing={2.4} sx={{ height: '100%' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: DASHBOARD_TOKENS.radius.lg,
                  border: `1px solid ${alpha('#10b981', 0.25)}`,
                  bgcolor: alpha('#10b981', 0.06),
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                  Venit net estimat, după taxe
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.7rem', color: '#047857', letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>
                  {formatLei(summary.ytdNetIncome)}
                </Typography>
              </Box>

              <Stack spacing={1.6}>
                <TaxRow label="CAS — pensie (25%)" value={summary.ytdCas} total={summary.ytdTotalIncome} />
                <TaxRow label="CASS — sănătate (10%)" value={summary.ytdCass} total={summary.ytdTotalIncome} />
                <TaxRow label="Impozit pe venit (10%)" value={summary.ytdIncomeTax} total={summary.ytdTotalIncome} />
              </Stack>

              <Box sx={{ mt: 'auto' }}>
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Estimare anuală, nu o obligație finală — cifrele se actualizează pe măsură ce se adaugă venituri și cheltuieli deductibile.
                </Typography>
                {onNavigate && (
                  <Button
                    variant="text"
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => onNavigate('expenses')}
                    sx={{
                      mt: 0.8,
                      px: 0,
                      fontWeight: 800,
                      textTransform: 'none',
                      color: DASHBOARD_TOKENS.primaryStrong,
                      '&:hover': { bgcolor: 'transparent', color: CHART_BAR_COLOR },
                    }}
                  >
                    Vezi cheltuielile deductibile
                  </Button>
                )}
              </Box>
            </Stack>
          ) : (
            <Stack sx={{ height: '100%', minHeight: 200, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', maxWidth: 300 }}>
                Estimarea fiscală apare după primele venituri înregistrate în {summary.taxYear}.
              </Typography>
            </Stack>
          )}
        </SectionCard>
      </Box>

      {/* ── Platforms synthesis ── */}
      <SectionCard
        title="Platforme"
        subtitle={`Sinteza încasărilor pe ${periodLabel}. Conectarea, importul CSV și istoricul complet sunt în pagina Platforme.`}
        action={
          goToPlatforms && (
            <Button
              variant="outlined"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={goToPlatforms}
              sx={{
                flexShrink: 0,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                borderColor: alpha(DASHBOARD_TOKENS.primary, 0.4),
                color: DASHBOARD_TOKENS.ink,
                fontWeight: 800,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: DASHBOARD_TOKENS.primaryStrong, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.06) },
              }}
            >
              Detalii
            </Button>
          )
        }
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <PlatformRow
            icon={<BoltRoundedIcon />}
            name="Bolt"
            statusChip={boltStatusChip}
            amount={formatLei(boltDashboard?.totalNetEarnings ?? 0)}
            detail={boltDetail}
            onClick={goToPlatforms}
          />
          <PlatformRow
            icon={<LocalTaxiRoundedIcon />}
            name="Uber"
            amount={formatLei(uberStats?.netEarnings ?? 0)}
            detail={uberDetail}
            onClick={goToPlatforms}
          />
        </Box>
      </SectionCard>
    </Stack>
  );
}
