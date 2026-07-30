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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
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
import { userService, type DashboardSummary, type UserProfile } from '../../../services/user.service';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type StatsTimeframe = 'month' | 'year';

interface HomeDashboardViewProps {
  onNavigate?: (sectionId: string) => void;
}

/**
 * Two hues for the one categorical encoding on this screen — how the money was collected.
 * Validated as a pair on the white card surface: CVD ΔE 17.3, normal-vision ΔE 18.0.
 * Cash sits below 3:1 on white, so its amount is always printed next to the swatch.
 */
const CASH_COLOR = '#1baf7a';
const CARD_COLOR = '#0e7fa8';

/** Same deep cyan carries the single chart series. */
const CHART_COLOR = CARD_COLOR;

const HERO_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #17324b 58%, #0e5f80 100%)';

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatLei(value: number) {
  return `${Math.round(value).toLocaleString('ro-RO')} lei`;
}

function pfaStatusChip(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending: { label: 'PFA în verificare', color: '#b54708', bg: alpha('#ed6c02', 0.12) },
    Approved: { label: 'PFA activ', color: '#2e7d32', bg: alpha('#2e7d32', 0.1) },
    Rejected: { label: 'PFA respins', color: '#b71c1c', bg: alpha('#d32f2f', 0.1) },
  };
  const cfg = map[status] ?? { label: status, color: DASHBOARD_TOKENS.textMuted, bg: alpha(DASHBOARD_TOKENS.ink, 0.06) };
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ fontWeight: 700, height: 26, borderRadius: DASHBOARD_TOKENS.radius.full, color: cfg.color, backgroundColor: cfg.bg }}
    />
  );
}

/* ── Building blocks ───────────────────────────────────────────────────────── */

/** A white panel. Every block on this screen is one of these, so the rhythm stays even. */
function Panel({ title, subtitle, action, children }: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.4, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {(title || action) && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.2 }}>
          <Box sx={{ minWidth: 0 }}>
            {title && (
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.02rem' }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', mt: 0.35, lineHeight: 1.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
        </Stack>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}

/** Label above, number below — the same shape everywhere, so tiles line up. */
function StatTile({ label, value, helper, tone }: {
  label: string;
  value: string;
  helper?: string;
  tone?: 'positive';
}) {
  const positive = tone === 'positive';
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.2, md: 2.6 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${positive ? alpha('#10b981', 0.3) : DASHBOARD_TOKENS.border}`,
        bgcolor: positive ? alpha('#10b981', 0.05) : DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
      }}
    >
      <Typography sx={{ color: positive ? '#047857' : DASHBOARD_TOKENS.textMuted, fontWeight: 700, fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: positive ? '#065f46' : DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: { xs: '1.4rem', md: '1.6rem' },
          lineHeight: 1.2,
          mt: 0.8,
          letterSpacing: -0.4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {helper && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 600, fontSize: '0.75rem', mt: 0.5 }}>
          {helper}
        </Typography>
      )}
    </Paper>
  );
}

/** One line of the "how you were paid" / "where it came from" breakdown. */
function BreakdownRow({ color, label, value, share }: {
  color: string;
  label: string;
  value: number;
  share: string | null;
}) {
  return (
    <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 700, fontSize: '0.9rem', flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      {share && (
        <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
          {share}
        </Typography>
      )}
      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 800,
          fontSize: '0.95rem',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          minWidth: 92,
          textAlign: 'right',
        }}
      >
        {formatLei(value)}
      </Typography>
    </Stack>
  );
}

/** Two-segment proportion bar with a 2px surface gap between the fills. */
function SplitBar({ first, second, firstColor, secondColor }: {
  first: number;
  second: number;
  firstColor: string;
  secondColor: string;
}) {
  const total = first + second;
  const firstPct = total > 0 ? (first / total) * 100 : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '2px',
        height: 10,
        borderRadius: 999,
        overflow: 'hidden',
        bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06),
      }}
    >
      {total > 0 && (
        <>
          <Box sx={{ width: `${firstPct}%`, bgcolor: firstColor }} />
          <Box sx={{ flex: 1, bgcolor: secondColor }} />
        </>
      )}
    </Box>
  );
}

/** A tappable platform line: icon, name, status, amount. */
function PlatformRow({ icon, name, statusChip, amount, detail, onClick }: {
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
        p: 1.8,
        minHeight: 64,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.surface,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 180ms ease, background-color 180ms ease',
        '&:hover': onClick
          ? { borderColor: alpha(DASHBOARD_TOKENS.primary, 0.45), bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04) }
          : undefined,
        '&:active': onClick ? { transform: 'scale(0.995)' } : undefined,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          display: 'grid',
          placeItems: 'center',
          color: DASHBOARD_TOKENS.primaryStrong,
          bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.14),
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
      {onClick && <ChevronRightRoundedIcon sx={{ color: DASHBOARD_TOKENS.textSubtle, flexShrink: 0 }} />}
    </Stack>
  );
}

function TaxLine({ label, value }: { label: string; value: number }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0.9 }}>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink, fontVariantNumeric: 'tabular-nums' }}>
        {formatLei(value)}
      </Typography>
    </Stack>
  );
}

/* ── Container: loads the data ─────────────────────────────────────────────── */

export function HomeDashboardView({ onNavigate }: HomeDashboardViewProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [boltDashboard, setBoltDashboard] = useState<BoltDashboardDto | null>(null);
  const [uberDashboard, setUberDashboard] = useState<UberDashboardDto | null>(null);
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      userService.getDashboardSummary(),
      userService.getProfile(),
      boltService.getDashboard('month'),
      uberService.getDashboard('month'),
    ]).then(([summaryResult, profileResult, boltResult, uberResult]) => {
      if (!mounted) return;
      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleTimeframeChange = (next: StatsTimeframe) => {
    setTimeframe(next);
    Promise.allSettled([
      boltService.getDashboard(next),
      uberService.getDashboard(next),
    ]).then(([boltResult, uberResult]) => {
      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
    });
  };

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 260 }}>
        <CircularProgress size={30} sx={{ color: DASHBOARD_TOKENS.primary }} />
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

  return (
    <HomeDashboardContent
      summary={summary}
      profile={profile}
      boltDashboard={boltDashboard}
      uberDashboard={uberDashboard}
      timeframe={timeframe}
      onTimeframeChange={handleTimeframeChange}
      onNavigate={onNavigate}
    />
  );
}

/* ── Presentation: the screen itself, also used by the public demo ─────────── */

export interface HomeDashboardContentProps {
  summary: DashboardSummary;
  profile: UserProfile | null;
  boltDashboard: BoltDashboardDto | null;
  uberDashboard: UberDashboardDto | null;
  timeframe: StatsTimeframe;
  onTimeframeChange: (timeframe: StatsTimeframe) => void;
  onNavigate?: (sectionId: string) => void;
}

export function HomeDashboardContent({
  summary,
  profile,
  boltDashboard,
  uberDashboard,
  timeframe,
  onTimeframeChange,
  onNavigate,
}: HomeDashboardContentProps) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const goToPlatforms = onNavigate ? () => onNavigate('platforms') : undefined;

  /* ── Numbers ── */

  const stats = timeframe === 'year' ? summary.yearlyStats : summary.monthlyStats;
  const venitCash = stats?.venitCash ?? summary.venitCash ?? 0;
  const venitCard = stats?.venitCard ?? summary.venitCard ?? 0;
  const venitBolt = stats?.venitBolt ?? summary.venitBolt ?? 0;
  const venitUber = stats?.venitUber ?? summary.venitUber ?? 0;

  // Cash/card and Bolt/Uber describe the same money, seen two ways — never summed together.
  const incasat = Math.max(venitCash + venitCard, venitBolt + venitUber);
  const cashCardTotal = venitCash + venitCard;

  const periodLabel =
    timeframe === 'year'
      ? `anul ${summary.incomeYear ?? new Date().getFullYear()}`
      : summary.incomeMonth && summary.incomeYear
        ? `${monthNumberToLabel(summary.incomeMonth).toLowerCase()} ${summary.incomeYear}`
        : 'luna curentă';

  const chartYear = summary.revenueChartYear ?? new Date().getFullYear();
  const byMonth = new Map((summary.monthlyRevenue ?? []).map((p) => [p.month, p]));
  const chartData = MONTH_CHART_LABELS.map((label, index) => ({
    name: label,
    value: byMonth.get(index + 1)?.venitTotal ?? 0,
  }));
  const hasChartData = chartData.some((p) => p.value > 0);
  const hasFiscalData = summary.ytdTotalIncome > 0;

  const share = (value: number) =>
    cashCardTotal > 0 ? `${Math.round((value / cashCardTotal) * 100)}%` : null;

  /* ── Next contribution threshold, in one plain sentence ── */

  const minSalary = summary.taxYear >= 2025 ? 4050 : 3300;
  const profitYtd = summary.taxThresholds?.profit ?? summary.ytdProfit;
  const casT1 = summary.taxThresholds?.casFirstThreshold ?? minSalary * 12;
  const casT2 = summary.taxThresholds?.casSecondThreshold ?? minSalary * 24;
  const cassT1 = summary.taxThresholds?.cassFirstThreshold ?? minSalary * 6;

  const nextThreshold =
    profitYtd < cassT1
      ? { target: cassT1, label: 'Următorul prag: CASS', text: `Dacă profitul tău depășește ${formatLei(cassT1)} într-un an, sănătatea (CASS) se calculează ca 10% din profit.` }
      : profitYtd < casT1
        ? { target: casT1, label: 'Următorul prag: CAS', text: `Peste ${formatLei(casT1)} profit pe an începi să plătești și pensie (CAS) — ${formatLei(casT1 * 0.25)} pe an.` }
        : profitYtd < casT2
          ? { target: casT2, label: 'Următorul prag: CAS', text: `Peste ${formatLei(casT2)} profit pe an, pensia (CAS) crește la ${formatLei(casT2 * 0.25)} pe an.` }
          : { target: casT2, label: 'Toate pragurile atinse', text: 'Ai depășit ultimul prag — contribuțiile sunt la maximum și nu mai cresc.' };

  const thresholdProgress = nextThreshold.target > 0
    ? Math.min(100, (profitYtd / nextThreshold.target) * 100)
    : 100;

  /* ── Platform rows ── */

  const boltConfigured = boltDashboard?.isConfigured ?? false;
  const boltStatusChip = boltDashboard ? (
    <Chip
      label={boltConfigured ? (boltDashboard.isConnected ? 'Conectat' : 'Reconectează') : 'Neconectat'}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.68rem',
        borderRadius: DASHBOARD_TOKENS.radius.full,
        fontWeight: 800,
        color: boltConfigured && boltDashboard.isConnected ? '#047857' : boltConfigured ? '#b45309' : DASHBOARD_TOKENS.textMuted,
        bgcolor: boltConfigured && boltDashboard.isConnected
          ? alpha('#10b981', 0.12)
          : boltConfigured
            ? alpha('#f59e0b', 0.14)
            : alpha(DASHBOARD_TOKENS.ink, 0.06),
      }}
    />
  ) : undefined;

  const boltDetail = boltConfigured
    ? `${(boltDashboard?.totalOrdersCount ?? 0).toLocaleString('ro-RO')} curse`
    : 'Conectează contul ca să apară automat';

  const lastUberImport = uberDashboard?.imports?.[0];
  const uberDetail = lastUberImport
    ? `Import ${new Date(lastUberImport.importedAtUtc).toLocaleDateString('ro-RO')}`
    : 'Importă raportul CSV ca să apară automat';

  const greeting = profile?.firstName ? `Bună, ${profile.firstName}` : 'Bună';

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* ── Greeting ── */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.5rem' }, letterSpacing: -0.4 }}>
          {greeting}
        </Typography>
        {pfaStatusChip(summary.pfaStatus)}
      </Stack>

      {/* ── Hero: the one number that matters ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          background: HERO_GRADIENT,
          color: '#fff',
          boxShadow: DASHBOARD_TOKENS.shadow.md,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', rowGap: 1.5 }}
        >
          <Typography sx={{ color: alpha('#fff', 0.75), fontWeight: 700, fontSize: '0.88rem' }}>
            Ai încasat în {periodLabel}
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={timeframe}
            onChange={(_: MouseEvent<HTMLElement>, v: StatsTimeframe | null) => {
              if (v) onTimeframeChange(v);
            }}
            size="small"
            sx={{
              bgcolor: alpha('#fff', 0.12),
              borderRadius: DASHBOARD_TOKENS.radius.full,
              p: 0.4,
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                px: 2,
                py: 0.5,
                minHeight: 34,
                borderRadius: `${DASHBOARD_TOKENS.radius.full}px !important`,
                color: alpha('#fff', 0.7),
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                '&.Mui-selected': { bgcolor: '#fff', color: '#12263a', '&:hover': { bgcolor: '#fff' } },
              },
            }}
          >
            <ToggleButton value="month">Luna</ToggleButton>
            <ToggleButton value="year">Anul</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2.6rem', md: '3.2rem' },
            lineHeight: 1.05,
            letterSpacing: -1.6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatLei(incasat)}
        </Typography>

        <Typography sx={{ color: alpha('#fff', 0.65), fontSize: '0.85rem', mt: 1 }}>
          Totalul curselor tale de pe Bolt și Uber, înainte de taxe.
        </Typography>
      </Paper>

      {/* ── How you were paid · where it came from ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.5,
          alignItems: 'stretch',
        }}
      >
        <Panel title="Cum ai încasat" subtitle="Se completează singur din Bolt și din raportul Uber.">
          {cashCardTotal > 0 ? (
            <Stack spacing={2.4} sx={{ height: '100%', justifyContent: 'center' }}>
              <SplitBar first={venitCash} second={venitCard} firstColor={CASH_COLOR} secondColor={CARD_COLOR} />
              <Stack spacing={1.8}>
                <BreakdownRow color={CASH_COLOR} label="Numerar" value={venitCash} share={share(venitCash)} />
                <BreakdownRow color={CARD_COLOR} label="Card" value={venitCard} share={share(venitCard)} />
              </Stack>
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>
              Împărțirea pe numerar și card apare imediat ce contul de Bolt e conectat sau ce încarci raportul Uber.
            </Typography>
          )}
        </Panel>

        <Panel title="De unde vin banii" subtitle="Totalul pe fiecare platformă.">
          <Stack spacing={1.6}>
            <PlatformRow
              icon={<BoltRoundedIcon />}
              name="Bolt"
              statusChip={boltStatusChip}
              amount={formatLei(venitBolt)}
              detail={boltDetail}
              onClick={goToPlatforms}
            />
            <PlatformRow
              icon={<LocalTaxiRoundedIcon />}
              name="Uber"
              amount={formatLei(venitUber)}
              detail={uberDetail}
              onClick={goToPlatforms}
            />
          </Stack>
        </Panel>
      </Box>

      {/* ── Taxes at a glance ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        <StatTile
          label={`Taxe estimate ${summary.taxYear}`}
          value={formatLei(summary.ytdTotalTax)}
          helper="Pensie, sănătate și impozit"
        />
        <StatTile
          label="Îți rămân după taxe"
          value={formatLei(summary.ytdNetIncome)}
          helper={`Din tot ce ai încasat în ${summary.taxYear}`}
          tone="positive"
        />
      </Box>

      {/* ── One chart, one series ── */}
      <Panel title={`Cât ai încasat lună de lună în ${chartYear}`}>
        {hasChartData ? (
          <Box sx={{ width: '100%', height: { xs: 220, md: 280 }, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(DASHBOARD_TOKENS.ink, 0.06)} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  /* Twelve labels do not fit on a phone — show every other month there. */
                  interval={isCompact ? 1 : 0}
                  tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  width={46}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: DASHBOARD_TOKENS.textSubtle, fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(value) => `${Number(value).toLocaleString('ro-RO')}`}
                />
                <Tooltip
                  cursor={{ fill: alpha(CHART_COLOR, 0.06) }}
                  contentStyle={{
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    boxShadow: DASHBOARD_TOKENS.shadow.sm,
                  }}
                  labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                  formatter={(value) => [`${Number(value ?? 0).toLocaleString('ro-RO')} lei`, 'Încasat']}
                />
                <Bar dataKey="value" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Stack sx={{ height: { xs: 180, md: 240 }, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
              Încă nu ai încasări în {chartYear}.
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.88rem', mt: 0.6, maxWidth: 340 }}>
              Graficul se completează singur pe măsură ce apar cursele.
            </Typography>
          </Stack>
        )}
      </Panel>

      {/* ── Taxes explained ── */}
      <Panel
        title={`Ce taxe ai de plătit pentru ${summary.taxYear}`}
        subtitle="Estimare, nu o sumă finală — se actualizează cu fiecare cursă și cheltuială."
        action={
          onNavigate && (
            <Button
              variant="text"
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => onNavigate('expenses')}
              sx={{
                flexShrink: 0,
                fontWeight: 800,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                color: DASHBOARD_TOKENS.primaryStrong,
                '&:hover': { bgcolor: 'transparent', color: CHART_COLOR },
              }}
            >
              Cheltuieli
            </Button>
          )
        }
      >
        {hasFiscalData ? (
          <Stack spacing={2.5}>
            <Box sx={{ '& > *:not(:last-child)': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` } }}>
              <TaxLine label="Pensie (CAS)" value={summary.ytdCas} />
              <TaxLine label="Sănătate (CASS)" value={summary.ytdCass} />
              <TaxLine label="Impozit pe venit" value={summary.ytdIncomeTax} />
            </Box>

            <Box
              sx={{
                p: 2.2,
                borderRadius: DASHBOARD_TOKENS.radius.lg,
                bgcolor: DASHBOARD_TOKENS.surface,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.3, sm: 1 }}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'baseline' }, mb: 1.2 }}
              >
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                  {nextThreshold.label}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_TOKENS.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                  {formatLei(profitYtd)} / {formatLei(nextThreshold.target)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={thresholdProgress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: alpha(CHART_COLOR, 0.12),
                  '& .MuiLinearProgress-bar': { bgcolor: CHART_COLOR, borderRadius: 999 },
                }}
              />
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.82rem', lineHeight: 1.6, mt: 1.2 }}>
                {nextThreshold.text}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', lineHeight: 1.6 }}>
            Calculăm taxele automat imediat ce apar primele încasări în {summary.taxYear}.
          </Typography>
        )}
      </Panel>
    </Stack>
  );
}
