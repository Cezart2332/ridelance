import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import {
  boltService,
  type BoltDashboardDto,
  type BoltDashboardPeriod,
} from '../../../services/bolt.service';
import { userService, type DashboardSummary } from '../../../services/user.service';
import { BoltDashboardPanel } from './BoltDashboardPanel';
import { BoltIntegrationTab } from './BoltIntegrationTab';
import { PfaIncomeSummary } from './PfaIncomeSummary';
import { PfaTaxSummaryWidget } from './PfaTaxSummaryWidget';
import { RevenueCharts } from './RevenueCharts';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type StatsTimeframe = 'day' | 'week' | 'month' | 'year';
export type StatsPlatform = 'all' | 'bolt' | 'uber';

const TIMEFRAME_LABELS: Record<StatsTimeframe, string> = {
  day: 'Zi',
  week: 'Săptămână',
  month: 'Lună',
  year: 'An',
};

const PLATFORM_LABELS: Record<StatsPlatform, string> = {
  all: 'Toate',
  bolt: 'Bolt',
  uber: 'Uber',
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function pfaStatusChip(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    Pending:  { label: 'In verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
    Approved: { label: 'Aprobat',       color: '#2e7d32', bg: alpha('#2e7d32', 0.08) },
    Rejected: { label: 'Respins',       color: '#b71c1c', bg: alpha('#d32f2f', 0.08) },
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

/**
 * Compute the filtered income values based on timeframe & platform.
 * Backend stores data per-month, so:
 *  - month → current month values
 *  - year  → sum of all 12 months from monthlyRevenue
 *  - day   → current month / daysInMonth
 *  - week  → current month / ~4.33
 */
function computeFilteredIncome(
  summary: DashboardSummary,
  timeframe: StatsTimeframe,
  platform: StatsPlatform,
) {
  // Per-source values for the current month
  const mCash = summary.venitCash ?? 0;
  const mCard = summary.venitCard ?? 0;
  const mBolt = summary.venitBolt ?? 0;
  const mUber = summary.venitUber ?? 0;
  const mTaxe = summary.taxeEstimate ?? 0;

  // For year timeframe, sum all months from monthlyRevenue
  const yearRevenue = summary.monthlyRevenue ?? [];

  let cash: number, card: number, bolt: number, uber: number, taxe: number;

  if (timeframe === 'year') {
    cash = yearRevenue.reduce((s, p) => s + (p.venitCash ?? 0), 0);
    card = yearRevenue.reduce((s, p) => s + (p.venitCard ?? 0), 0);
    bolt = yearRevenue.reduce((s, p) => s + (p.venitBolt ?? 0), 0);
    uber = yearRevenue.reduce((s, p) => s + (p.venitUber ?? 0), 0);
    // Estimate taxes proportionally
    const monthTotal = mCash + mCard + mBolt + mUber;
    const yearTotal = cash + card + bolt + uber;
    taxe = monthTotal > 0 ? mTaxe * (yearTotal / monthTotal) : 0;
  } else if (timeframe === 'day') {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    cash = mCash / daysInMonth;
    card = mCard / daysInMonth;
    bolt = mBolt / daysInMonth;
    uber = mUber / daysInMonth;
    taxe = mTaxe / daysInMonth;
  } else if (timeframe === 'week') {
    cash = mCash / 4.33;
    card = mCard / 4.33;
    bolt = mBolt / 4.33;
    uber = mUber / 4.33;
    taxe = mTaxe / 4.33;
  } else {
    // month
    cash = mCash;
    card = mCard;
    bolt = mBolt;
    uber = mUber;
    taxe = mTaxe;
  }

  // Platform filter
  if (platform === 'bolt') {
    card = 0;
    uber = 0;
    cash = 0;
  } else if (platform === 'uber') {
    card = 0;
    bolt = 0;
    cash = 0;
  }

  const total = cash + card + bolt + uber;

  return {
    venitCash: Math.round(cash * 100) / 100,
    venitCard: Math.round(card * 100) / 100,
    venitBolt: Math.round(bolt * 100) / 100,
    venitUber: Math.round(uber * 100) / 100,
    taxeEstimate: Math.round(taxe * 100) / 100,
    venitTotal: Math.round(total * 100) / 100,
  };
}

/* ── Filter Bar ────────────────────────────────────────────────────────────── */

function StatsFilterBar({
  timeframe,
  platform,
  onTimeframeChange,
  onPlatformChange,
}: {
  timeframe: StatsTimeframe;
  platform: StatsPlatform;
  onTimeframeChange: (v: StatsTimeframe) => void;
  onPlatformChange: (v: StatsPlatform) => void;
}) {
  const toggleSx = {
    bgcolor: DASHBOARD_TOKENS.paper,
    borderRadius: DASHBOARD_TOKENS.radius.md,
    p: 0.4,
    boxShadow: DASHBOARD_TOKENS.shadow.sm,
    border: `1px solid ${DASHBOARD_TOKENS.border}`,
    '& .MuiToggleButtonGroup-grouped': {
      border: 0,
      px: { xs: 1.2, sm: 2 },
      py: 0.7,
      borderRadius: `${DASHBOARD_TOKENS.radius.sm}px !important`,
      color: DASHBOARD_TOKENS.textMuted,
      fontWeight: 800,
      fontSize: '0.82rem',
      textTransform: 'none' as const,
      transition: 'all 180ms ease',
      '&.Mui-selected': {
        bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.18),
        color: DASHBOARD_TOKENS.ink,
      },
      '&:hover': {
        bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.04),
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.surfaceAlt,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        {/* Timeframe */}
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              display: 'grid',
              placeItems: 'center',
              color: DASHBOARD_TOKENS.primaryStrong,
              bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12),
              '& svg': { fontSize: 18 },
            }}
          >
            <CalendarTodayRoundedIcon />
          </Box>
          <ToggleButtonGroup
            exclusive
            value={timeframe}
            onChange={(_: MouseEvent<HTMLElement>, v: StatsTimeframe | null) => {
              if (v) onTimeframeChange(v);
            }}
            size="small"
            sx={toggleSx}
          >
            {(Object.keys(TIMEFRAME_LABELS) as StatsTimeframe[]).map((k) => (
              <ToggleButton key={k} value={k}>
                {TIMEFRAME_LABELS[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {/* Platform */}
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              display: 'grid',
              placeItems: 'center',
              color: '#7c3aed',
              bgcolor: alpha('#7c3aed', 0.1),
              '& svg': { fontSize: 18 },
            }}
          >
            <FilterListRoundedIcon />
          </Box>
          <ToggleButtonGroup
            exclusive
            value={platform}
            onChange={(_: MouseEvent<HTMLElement>, v: StatsPlatform | null) => {
              if (v) onPlatformChange(v);
            }}
            size="small"
            sx={toggleSx}
          >
            {(Object.keys(PLATFORM_LABELS) as StatsPlatform[]).map((k) => (
              <ToggleButton key={k} value={k}>
                {PLATFORM_LABELS[k]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Stack>
    </Paper>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function HomeDashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [boltDashboard, setBoltDashboard] = useState<BoltDashboardDto | null>(null);
  const [boltPeriod, setBoltPeriod] = useState<BoltDashboardPeriod>('month');
  const [boltLoading, setBoltLoading] = useState(true);
  const [boltError, setBoltError] = useState<string | null>(null);
  const [boltModalOpen, setBoltModalOpen] = useState(false);

  // ── Filter state ──
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');
  const [platform, setPlatform] = useState<StatsPlatform>('all');

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      userService.getDashboardSummary(),
      boltService.getDashboard('month'),
    ]).then(([summaryResult, boltResult]) => {
      if (!mounted) return;

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.error(summaryResult.reason);
      }

      if (boltResult.status === 'fulfilled') {
        setBoltDashboard(boltResult.value);
        setBoltError(null);
      } else {
        console.error(boltResult.reason);
        setBoltError('Nu s-au putut încărca datele Bolt.');
      }
    }).finally(() => {
      if (!mounted) return;
      setSummaryLoading(false);
      setBoltLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBoltPeriodChange = (period: BoltDashboardPeriod) => {
    setBoltPeriod(period);
    setBoltLoading(true);
    setBoltError(null);

    boltService.getDashboard(period)
      .then((data) => {
        setBoltDashboard(data);
      })
      .catch((err) => {
        console.error(err);
        setBoltError('Nu s-au putut încărca datele Bolt pentru perioada selectată.');
      })
      .finally(() => setBoltLoading(false));
  };

  const openBoltIntegration = () => {
    setBoltModalOpen(true);
  };

  const refreshBoltDashboard = () => {
    setBoltLoading(true);
    setBoltError(null);

    boltService.getDashboard(boltPeriod)
      .then((data) => {
        setBoltDashboard(data);
      })
      .catch((err) => {
        console.error(err);
        setBoltError('Nu s-au putut încărca datele Bolt după conectare.');
      })
      .finally(() => setBoltLoading(false));
  };

  const handleBoltConnected = () => {
    setBoltModalOpen(false);
    refreshBoltDashboard();
  };

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
        Nu s-au putut incarca datele. Incearca din nou mai tarziu.
      </Typography>
    );
  }

  // ── Compute filtered income ──
  const filtered = computeFilteredIncome(summary, timeframe, platform);

  // ── Period label for PfaIncomeSummary ──
  const timeframeLabel =
    timeframe === 'year'
      ? String(summary.incomeYear ?? new Date().getFullYear())
      : timeframe === 'day'
        ? 'medie zilnică'
        : timeframe === 'week'
          ? 'medie săptămânală'
          : undefined; // month uses default

  return (
    <>
      <Stack spacing={2.5}>
        <BoltDashboardPanel
          dashboard={boltDashboard}
          loading={boltLoading}
          error={boltError}
          period={boltPeriod}
          onPeriodChange={handleBoltPeriodChange}
          onOpenBoltIntegration={openBoltIntegration}
        />

        {/* ── Stats Filter Bar ── */}
        <StatsFilterBar
          timeframe={timeframe}
          platform={platform}
          onTimeframeChange={setTimeframe}
          onPlatformChange={setPlatform}
        />

        <PfaIncomeSummary
          venitCash={filtered.venitCash}
          venitCard={filtered.venitCard}
          venitBolt={filtered.venitBolt}
          venitUber={filtered.venitUber}
          taxeEstimate={filtered.taxeEstimate}
          venitTotal={filtered.venitTotal}
          incomeYear={summary.incomeYear}
          incomeMonth={timeframe === 'month' ? summary.incomeMonth : undefined}
          periodOverride={timeframeLabel}
        />

        <PfaTaxSummaryWidget summary={summary} />

        <RevenueCharts
          year={summary.revenueChartYear ?? new Date().getFullYear()}
          monthlyRevenue={summary.monthlyRevenue ?? []}
          venitCash={filtered.venitCash}
          venitCard={filtered.venitCard}
          venitBolt={filtered.venitBolt}
          venitUber={filtered.venitUber}
          incomeMonth={summary.incomeMonth}
          timeframe={timeframe}
          platform={platform}
          boltDashboard={boltDashboard}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              gridColumn: { xs: 'span 12', md: 'span 6' },
              p: 2.5,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
            }}
          >
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, mb: 0.5 }}>
              Status inregistrare PFA
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mb: 2 }}>
              Starea cererii tale de inregistrare PFA
            </Typography>

            {summary.pfaStatus ? (
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Status</Typography>
                  {pfaStatusChip(summary.pfaStatus)}
                </Stack>
                {summary.pfaCreatedAtUtc && (
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>Data cererii</Typography>
                    <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem' }}>
                      {new Date(summary.pfaCreatedAtUtc).toLocaleDateString('ro-RO')}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            ) : (
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
                Nu ai o cerere de inregistrare PFA activa.
              </Typography>
            )}
          </Paper>
        </Box>
      </Stack>

      <Dialog
        open={boltModalOpen}
        onClose={() => setBoltModalOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: DASHBOARD_TOKENS.radius.xl,
              overflow: 'hidden',
              bgcolor: DASHBOARD_TOKENS.paper,
            },
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: '1.15rem' }}>
              Conectare Bolt
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.35 }}>
              Conectează contul pentru încasări și curse direct în Acasă.
            </Typography>
          </Box>
          <IconButton
            aria-label="Închide"
            onClick={() => setBoltModalOpen(false)}
            sx={{
              flexShrink: 0,
              color: DASHBOARD_TOKENS.textMuted,
              bgcolor: DASHBOARD_TOKENS.surface,
              '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06) },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: DASHBOARD_TOKENS.surface, overflowX: 'hidden' }}>
          <BoltIntegrationTab embedded onConnected={handleBoltConnected} />
        </DialogContent>
      </Dialog>
    </>
  );
}
