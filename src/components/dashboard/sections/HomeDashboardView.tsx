import { useEffect, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
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
import {
  BreakdownRow,
  Panel,
  PfaStatusChip,
  SplitBar,
  StatCard,
  StatusChip,
  formatLei,
  formatNumber,
  pillToggleSx,
} from '../ui';
import { boltService, type BoltDashboardDto } from '../../../services/bolt.service';
import { uberService, type UberDashboardDto } from '../../../services/uber.service';
import { userService, type DashboardSummary, type UserProfile } from '../../../services/user.service';
import { MONTH_CHART_LABELS, monthNumberToLabel } from '../../../utils/monthLabels';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type StatsTimeframe = 'month' | 'year';

interface HomeDashboardViewProps {
  onNavigate?: (sectionId: string) => void;
}

/* ── Building blocks locale acestei pagini ─────────────────────────────────── */

/** O linie de platformă, tappable: iconiță, nume, stare, sumă. */
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
      spacing={1.4}
      onClick={onClick}
      sx={{
        alignItems: 'center',
        p: 1.5,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.surface,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 180ms ease, background-color 180ms ease',
        '&:hover': onClick
          ? { borderColor: alpha(DASHBOARD_TOKENS.accent, 0.4), bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.04) }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          display: 'grid',
          placeItems: 'center',
          color: DASHBOARD_TOKENS.accent,
          bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.1),
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '0.9rem' }}>
            {name}
          </Typography>
          {statusChip}
        </Stack>
        <Typography noWrap sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.76rem', mt: 0.15 }}>
          {detail}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: DASHBOARD_TOKENS.ink,
          fontWeight: 900,
          fontSize: '0.95rem',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {amount}
      </Typography>
      {onClick && <ChevronRightRoundedIcon sx={{ color: DASHBOARD_TOKENS.textSubtle, flexShrink: 0, fontSize: 18 }} />}
    </Stack>
  );
}

function TaxLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: strong ? 800 : 600,
          color: strong ? DASHBOARD_TOKENS.ink : DASHBOARD_TOKENS.textMuted,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: strong ? '1rem' : '0.92rem',
          fontWeight: strong ? 900 : 800,
          color: DASHBOARD_TOKENS.ink,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
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
        <CircularProgress size={30} sx={{ color: DASHBOARD_TOKENS.accent }} />
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
  const platformTotal = venitBolt + venitUber;

  const isYear = timeframe === 'year';
  const periodLabel = isYear
    ? `${summary.incomeYear ?? new Date().getFullYear()}`
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

  const shareOf = (value: number, total: number) =>
    total > 0 ? `${Math.round((value / total) * 100)}%` : null;

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
    <StatusChip
      size="sm"
      label={boltConfigured ? (boltDashboard.isConnected ? 'Conectat' : 'Reconectează') : 'Neconectat'}
      tone={boltConfigured && boltDashboard.isConnected ? 'active' : 'neutral'}
    />
  ) : undefined;

  const boltDetail = boltConfigured
    ? `${formatNumber(boltDashboard?.totalOrdersCount ?? 0)} curse`
    : 'Conectează contul ca să apară automat';

  const lastUberImport = uberDashboard?.imports?.[0];
  const uberDetail = lastUberImport
    ? `Import ${new Date(lastUberImport.importedAtUtc).toLocaleDateString('ro-RO')}`
    : 'Importă raportul CSV ca să apară automat';

  const greeting = profile?.firstName ? `Bună, ${profile.firstName}` : 'Bună';

  return (
    <Stack
      spacing={2}
      sx={{
        width: '100%',
        maxWidth: 1280,
        mx: 'auto',
        // Pe desktop pagina se încadrează exact în ecran; pe telefon curge normal.
        height: { xs: 'auto', md: '100%' },
        minHeight: 0,
      }}
    >
      {/* ── Antet: cine ești, ce stare are PFA-ul, ce perioadă privești ── */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1.2, flexShrink: 0 }}
      >
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: { xs: '1.25rem', md: '1.45rem' }, letterSpacing: -0.4 }}>
            {greeting}
          </Typography>
          <PfaStatusChip status={summary.pfaStatus} />
        </Stack>

        <ToggleButtonGroup
          exclusive
          value={timeframe}
          onChange={(_: MouseEvent<HTMLElement>, v: StatsTimeframe | null) => {
            if (v) onTimeframeChange(v);
          }}
          size="small"
          sx={pillToggleSx}
        >
          <ToggleButton value="month">Luna</ToggleButton>
          <ToggleButton value="year">Anul</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* ── Rândul de venituri: total, platforme, mod de încasare ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          flexShrink: 0,
        }}
      >
        <StatCard
          variant="accent"
          size="lg"
          label={`Venit total · ${periodLabel}`}
          value={formatLei(incasat)}
          helper="Înainte de taxe"
        />

        <Panel dense title="Platforme">
          {platformTotal > 0 ? (
            <Stack spacing={1.4} sx={{ height: '100%', justifyContent: 'center' }}>
              <SplitBar first={venitBolt} second={venitUber} />
              <Stack spacing={1}>
                <BreakdownRow color={DASHBOARD_TOKENS.accent} label="Bolt" value={venitBolt} share={shareOf(venitBolt, platformTotal)} />
                <BreakdownRow color={DASHBOARD_TOKENS.accentSoft} label="Uber" value={venitUber} share={shareOf(venitUber, platformTotal)} />
              </Stack>
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', lineHeight: 1.6 }}>
              Conectează Bolt sau încarcă raportul Uber ca să vezi cât aduce fiecare platformă.
            </Typography>
          )}
        </Panel>

        <Panel dense title="Cum ai încasat">
          {cashCardTotal > 0 ? (
            <Stack spacing={1.4} sx={{ height: '100%', justifyContent: 'center' }}>
              <SplitBar first={venitCash} second={venitCard} />
              <Stack spacing={1}>
                <BreakdownRow color={DASHBOARD_TOKENS.accent} label="Numerar" value={venitCash} share={shareOf(venitCash, cashCardTotal)} />
                <BreakdownRow color={DASHBOARD_TOKENS.accentSoft} label="Card" value={venitCard} share={shareOf(venitCard, cashCardTotal)} />
              </Stack>
            </Stack>
          ) : (
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.84rem', lineHeight: 1.6 }}>
              Împărțirea pe numerar și card apare imediat ce contul de Bolt e conectat sau ce încarci raportul Uber.
            </Typography>
          )}
        </Panel>
      </Box>

      {/* ── Rândul principal: graficul umple restul ecranului, lângă panoul contextual ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(320px, 380px)' },
          gap: 2,
          flexGrow: { xs: 0, md: 1 },
          minHeight: 0,
        }}
      >
        <Panel fill title={`Încasări lună de lună în ${chartYear}`}>
          {hasChartData ? (
            <Box sx={{ width: '100%', flexGrow: 1, minHeight: { xs: 200, md: 180 }, minWidth: 0 }}>
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
                    tickFormatter={(value) => formatNumber(Number(value))}
                  />
                  <Tooltip
                    cursor={{ fill: alpha(DASHBOARD_TOKENS.accent, 0.06) }}
                    contentStyle={{
                      border: `1px solid ${DASHBOARD_TOKENS.border}`,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    }}
                    labelStyle={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}
                    formatter={(value) => [formatLei(Number(value ?? 0)), 'Încasat']}
                  />
                  {/* Containerul flexibil se remăsoară la fiecare resize; cu animație,
                      barele ar reporni de la zero și ar rămâne goale. */}
                  <Bar
                    dataKey="value"
                    fill={DASHBOARD_TOKENS.accent}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Stack sx={{ flexGrow: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 2 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800 }}>
                Încă nu ai încasări în {chartYear}.
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.6, maxWidth: 340 }}>
                Graficul se completează singur pe măsură ce apar cursele.
              </Typography>
            </Stack>
          )}
        </Panel>

        {/* Pe „Luna" — starea platformelor. Taxele sunt anuale, deci nu apar aici. */}
        {!isYear && (
          <Panel title="Platformele tale" subtitle="Se completează singur din Bolt și din raportul Uber.">
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack spacing={1.2}>
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
              <Box sx={{ flexGrow: 1, minHeight: 12 }} />
              <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.78rem', lineHeight: 1.6 }}>
                Taxele și pragurile se calculează pe an — le vezi comutând sus pe <b>Anul</b>.
              </Typography>
            </Box>
          </Panel>
        )}

        {/* Pe „Anul" — taxele estimate și pragul următor. */}
        {isYear && (
          <Panel
            title={`Taxe estimate ${summary.taxYear}`}
            subtitle="Estimare, nu o sumă finală."
            action={
              onNavigate && (
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />}
                  onClick={() => onNavigate('expenses')}
                  sx={{
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    color: DASHBOARD_TOKENS.accent,
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  Cheltuieli
                </Button>
              )
            }
          >
            {hasFiscalData ? (
              // Dacă ecranul e foarte scund, panoul derulează intern — pagina nu.
              <Stack spacing={1.4} sx={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
                <Box sx={{ flexShrink: 0, '& > *:not(:last-child)': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}` } }}>
                  <TaxLine label="Pensie (CAS)" value={summary.ytdCas} />
                  <TaxLine label="Sănătate (CASS)" value={summary.ytdCass} />
                  <TaxLine label="Impozit pe venit" value={summary.ytdIncomeTax} />
                  <TaxLine label="Total taxe" value={summary.ytdTotalTax} strong />
                  <TaxLine label="Îți rămân după taxe" value={summary.ytdNetIncome} strong />
                </Box>

                <Box
                  sx={{
                    mt: 'auto',
                    flexShrink: 0,
                    p: 1.5,
                    borderRadius: DASHBOARD_TOKENS.radius.lg,
                    bgcolor: DASHBOARD_TOKENS.surface,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1, flexWrap: 'wrap', rowGap: 0.3 }}
                  >
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                      {nextThreshold.label}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 800, color: DASHBOARD_TOKENS.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                      {formatLei(profitYtd)} / {formatLei(nextThreshold.target)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={thresholdProgress}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: alpha(DASHBOARD_TOKENS.accent, 0.12),
                      '& .MuiLinearProgress-bar': { bgcolor: DASHBOARD_TOKENS.accent, borderRadius: 999 },
                    }}
                  />
                  <Typography
                    sx={{
                      color: DASHBOARD_TOKENS.textMuted,
                      fontSize: '0.76rem',
                      lineHeight: 1.5,
                      mt: 1,
                      // Pe ecrane scunde textul lung ar împinge caseta în afara paginii.
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={nextThreshold.text}
                  >
                    {nextThreshold.text}
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.88rem', lineHeight: 1.6 }}>
                Calculăm taxele automat imediat ce apar primele încasări în {summary.taxYear}.
              </Typography>
            )}
          </Panel>
        )}
      </Box>
    </Stack>
  );
}
