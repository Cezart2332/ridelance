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
import { uberService, type UberDashboardDto, type UberDashboardPeriod } from '../../../services/uber.service';
import { userService, type DashboardSummary } from '../../../services/user.service';
import { BoltDashboardPanel } from './BoltDashboardPanel';
import { BoltIntegrationTab } from './BoltIntegrationTab';
import { PfaIncomeSummary } from './PfaIncomeSummary';
import { PfaTaxSummaryWidget } from './PfaTaxSummaryWidget';
import { RevenueCharts } from './RevenueCharts';
import { UberCsvPanel } from './UberCsvPanel';
import logo from '../../../assets/logo.svg';

/* ── Types ────────────────────────────────────────────────────────────────── */

export type StatsTimeframe = 'month' | 'year';
export type StatsPlatform = 'all' | 'bolt' | 'uber';

const TIMEFRAME_LABELS: Record<StatsTimeframe, string> = {
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
    Pending:  { label: 'În verificare', color: '#b54708', bg: alpha('#ed6c02', 0.1) },
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
 * Backend exposes accounting totals per current month and current year.
 * Cash/card remain visible only as informative breakdown.
 */
function computeFilteredIncome(
  summary: DashboardSummary,
  timeframe: StatsTimeframe,
  platform: StatsPlatform,
) {
  const stats = timeframe === 'year' ? summary.yearlyStats : summary.monthlyStats;
  let cash = stats?.venitCash ?? summary.venitCash ?? 0;
  let card = stats?.venitCard ?? summary.venitCard ?? 0;
  let bolt = stats?.venitBolt ?? summary.venitBolt ?? 0;
  let uber = stats?.venitUber ?? summary.venitUber ?? 0;
  const taxe = timeframe === 'year' ? summary.ytdTotalTax : summary.taxeEstimate ?? 0;

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

  const total = bolt + uber;

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
  const [boltLoading, setBoltLoading] = useState(true);
  const [boltError, setBoltError] = useState<string | null>(null);
  const [uberDashboard, setUberDashboard] = useState<UberDashboardDto | null>(null);
  const [uberLoading, setUberLoading] = useState(true);
  const [uberError, setUberError] = useState<string | null>(null);
  const [boltModalOpen, setBoltModalOpen] = useState(false);

  // ── Filter state ──
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('month');
  const [platform, setPlatform] = useState<StatsPlatform>('all');

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      userService.getDashboardSummary(),
      boltService.getDashboard('month'),
      uberService.getDashboard('month'),
    ]).then(([summaryResult, boltResult, uberResult]) => {
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

      if (uberResult.status === 'fulfilled') {
        setUberDashboard(uberResult.value);
        setUberError(null);
      } else {
        console.error(uberResult.reason);
        setUberError('Nu s-au putut încărca datele Uber.');
      }
    }).finally(() => {
      if (!mounted) return;
      setSummaryLoading(false);
      setBoltLoading(false);
      setUberLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePeriodChange = (period: StatsTimeframe) => {
    setTimeframe(period);
    setBoltLoading(true);
    setUberLoading(true);
    setBoltError(null);
    setUberError(null);

    Promise.allSettled([
      boltService.getDashboard(period),
      uberService.getDashboard(period),
    ]).then(([boltResult, uberResult]) => {
      if (boltResult.status === 'fulfilled') setBoltDashboard(boltResult.value);
      else {
        console.error(boltResult.reason);
        setBoltError('Nu s-au putut încărca datele Bolt pentru perioada selectată.');
      }

      if (uberResult.status === 'fulfilled') setUberDashboard(uberResult.value);
      else {
        console.error(uberResult.reason);
        setUberError('Nu s-au putut încărca datele Uber pentru perioada selectată.');
      }
    }).finally(() => {
      setBoltLoading(false);
      setUberLoading(false);
    });
  };

  const openBoltIntegration = () => {
    setBoltModalOpen(true);
  };

  const refreshBoltDashboard = () => {
    setBoltLoading(true);
    setBoltError(null);

    boltService.getDashboard(timeframe)
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

  const handleUberImported = (dashboard: UberDashboardDto) => {
    setUberDashboard(dashboard);
    userService.getDashboardSummary()
      .then(setSummary)
      .catch((err) => console.error(err));
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
      : undefined; // month uses default

  return (
    <>
      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.4, md: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.xl,
            border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.16)}`,
            background: `linear-gradient(135deg, ${alpha(DASHBOARD_TOKENS.paper, 0.98)} 0%, ${alpha(DASHBOARD_TOKENS.primary, 0.08)} 100%)`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.2} sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Box component="img" src={logo} alt="RIDElance" sx={{ height: 34, width: 'auto', mb: 1.6 }} />
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: { xs: '1.55rem', md: '2rem' }, lineHeight: 1.08 }}>
                Dashboard PFA
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, mt: 0.8, maxWidth: 680, lineHeight: 1.6 }}>
                Urmărește veniturile, taxele estimate, documentele și activitatea platformelor într-un singur loc.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {pfaStatusChip(summary.pfaStatus)}
              <Chip
                label={`${summary.approvedDocuments}/${summary.totalDocuments} documente valide`}
                size="small"
                sx={{ fontWeight: 800, borderRadius: DASHBOARD_TOKENS.radius.full, bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.05), color: DASHBOARD_TOKENS.ink }}
              />
            </Stack>
          </Stack>
        </Paper>

        <BoltDashboardPanel
          dashboard={boltDashboard}
          loading={boltLoading}
          error={boltError}
          period={timeframe as BoltDashboardPeriod}
          onPeriodChange={(period) => {
            if (period === 'month' || period === 'year') handlePeriodChange(period);
          }}
          onOpenBoltIntegration={openBoltIntegration}
        />

        <UberCsvPanel
          dashboard={uberDashboard}
          loading={uberLoading}
          error={uberError}
          period={timeframe as UberDashboardPeriod}
          onImported={handleUberImported}
        />

        {/* ── Stats Filter Bar ── */}
        <StatsFilterBar
          timeframe={timeframe}
          platform={platform}
          onTimeframeChange={handlePeriodChange}
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
        />

        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>
          CAS/CASS sunt estimări anuale pe {summary.taxYear}, calculate din venitul Bolt + Uber YTD.
        </Typography>

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
