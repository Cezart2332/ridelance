import type { MouseEvent, ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ElectricCarRoundedIcon from '@mui/icons-material/ElectricCarRounded';
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  type BoltDashboardDto,
  type BoltDashboardPeriod,
  type BoltDashboardRideDto,
} from '../../../services/bolt.service';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

interface BoltDashboardPanelProps {
  dashboard: BoltDashboardDto | null;
  loading: boolean;
  error: string | null;
  period: BoltDashboardPeriod;
  onPeriodChange: (period: BoltDashboardPeriod) => void;
  onOpenBoltIntegration: () => void;
}

type KpiCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
  helper?: string;
};

const periodLabels: Record<BoltDashboardPeriod, string> = {
  month: 'Lună',
  year: 'An',
  total: 'Total',
};

function formatLei(value: number) {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} lei`;
}

function formatLeiDetailed(value: number) {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} lei`;
}

function formatHours(value: number) {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })} h`;
}

function formatKm(value: number) {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })} km`;
}

function trimAddress(address: string) {
  if (!address || address === 'Unknown') return 'Adresă indisponibilă';
  const [firstPart] = address.split(',');
  return firstPart?.trim() || address;
}

function rideTimeLabel(ride: BoltDashboardRideDto) {
  const started = new Date(ride.orderCreatedTime);
  const date = started.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  const time = started.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

function KpiCard({ label, value, icon, tone, helper }: KpiCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.35 },
        minHeight: 142,
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${alpha(tone, 0.22)}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: DASHBOARD_TOKENS.shadow.md,
          borderColor: alpha(tone, 0.45),
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, fontSize: '0.82rem' }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: DASHBOARD_TOKENS.radius.md,
            color: tone,
            bgcolor: alpha(tone, 0.11),
            display: 'grid',
            placeItems: 'center',
            '& svg': { fontSize: 21 },
          }}
        >
          {icon}
        </Box>
      </Stack>
      <Box>
        <Typography
          sx={{
            color: DASHBOARD_TOKENS.ink,
            fontWeight: 900,
            fontSize: { xs: '1.55rem', sm: '1.8rem' },
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0,
          }}
        >
          {value}
        </Typography>
        {helper && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700, fontSize: '0.78rem', mt: 0.8 }}>
            {helper}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: DASHBOARD_TOKENS.radius.lg,
        border: `1px solid ${DASHBOARD_TOKENS.border}`,
        bgcolor: DASHBOARD_TOKENS.paper,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, mb: 2, fontSize: '1rem' }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyBoltState({ onOpenBoltIntegration }: { onOpenBoltIntegration: () => void }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: DASHBOARD_TOKENS.radius.xl,
        border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.22)}`,
        bgcolor: `linear-gradient(160deg, ${alpha(DASHBOARD_TOKENS.primary, 0.08)} 0%, ${DASHBOARD_TOKENS.paper} 58%)`,
        boxShadow: DASHBOARD_TOKENS.shadow.sm,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              display: 'grid',
              placeItems: 'center',
              color: DASHBOARD_TOKENS.primaryStrong,
              bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.16),
            }}
          >
            <ElectricCarRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: '1.05rem' }}>
              Conectează Bolt
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.35 }}>
              După conectare apar încasările, orele în cursă și evoluția lunii.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onOpenBoltIntegration}
          sx={{
            alignSelf: { xs: 'stretch', md: 'center' },
            borderRadius: DASHBOARD_TOKENS.radius.md,
            bgcolor: DASHBOARD_TOKENS.primary,
            color: DASHBOARD_TOKENS.ink,
            fontWeight: 900,
            textTransform: 'none',
            boxShadow: 'none',
            px: 2.5,
            '&:hover': { bgcolor: DASHBOARD_TOKENS.primaryStrong, boxShadow: 'none' },
            '&:active': { transform: 'scale(0.98)' },
          }}
        >
          Conectează Bolt
        </Button>
      </Stack>
    </Paper>
  );
}

export function BoltDashboardPanel({
  dashboard,
  loading,
  error,
  period,
  onPeriodChange,
  onOpenBoltIntegration,
}: BoltDashboardPanelProps) {
  const hasRideData = Boolean(dashboard && dashboard.totalOrdersCount > 0);
  const earningsSeries = dashboard?.series ?? [];
  const distributionData = dashboard
    ? [
        { name: 'Net', value: dashboard.totalNetEarnings },
        { name: 'Tips', value: dashboard.totalTips },
        { name: 'Comision', value: dashboard.totalCommissions },
      ]
    : [];

  const handlePeriodChange = (_: MouseEvent<HTMLElement>, nextPeriod: BoltDashboardPeriod | null) => {
    if (nextPeriod) {
      onPeriodChange(nextPeriod);
    }
  };

  if (loading && !dashboard) {
    return (
      <Paper
        elevation={0}
        sx={{
          minHeight: 260,
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress size={32} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Paper>
    );
  }

  if (!dashboard) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${alpha('#dc2626', 0.18)}`,
          bgcolor: DASHBOARD_TOKENS.paper,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
        }}
      >
        <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontWeight: 700 }}>
          {error || 'Nu s-au putut încărca datele Bolt.'}
        </Alert>
      </Paper>
    );
  }

  if (!dashboard?.isConfigured) {
    return <EmptyBoltState onOpenBoltIntegration={onOpenBoltIntegration} />;
  }

  return (
    <Stack spacing={2}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.8 },
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          bgcolor: DASHBOARD_TOKENS.surfaceAlt,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          overflow: 'hidden',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: 2.2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.75 }}>
              <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 950, fontSize: { xs: '1.35rem', md: '1.65rem' }, lineHeight: 1.15 }}>
                Bolt
              </Typography>
              <Chip
                label={dashboard.isConnected ? 'Conectat' : 'Necesită reconectare'}
                size="small"
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.full,
                  fontWeight: 800,
                  color: dashboard.isConnected ? '#047857' : '#b45309',
                  bgcolor: dashboard.isConnected ? alpha('#10b981', 0.12) : alpha('#f59e0b', 0.14),
                }}
              />
            </Stack>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem' }}>
              {dashboard.lastFetchedAtUtc
                ? `Ultima sincronizare: ${new Date(dashboard.lastFetchedAtUtc).toLocaleString('ro-RO')}`
                : 'Datele Bolt nu au fost sincronizate încă.'}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
            {(!dashboard.isConnected || dashboard.errorMessage) && (
              <Button
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={onOpenBoltIntegration}
                sx={{
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  borderColor: alpha('#b45309', 0.24),
                  color: '#92400e',
                  fontWeight: 900,
                  textTransform: 'none',
                  bgcolor: alpha('#f59e0b', 0.08),
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: alpha('#b45309', 0.38),
                    bgcolor: alpha('#f59e0b', 0.13),
                  },
                }}
              >
                Reconectează
              </Button>
            )}
            <ToggleButtonGroup
              exclusive
              value={period}
              onChange={handlePeriodChange}
              size="small"
              sx={{
                alignSelf: { xs: 'stretch', md: 'center' },
                bgcolor: DASHBOARD_TOKENS.paper,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                p: 0.4,
                boxShadow: DASHBOARD_TOKENS.shadow.sm,
                '& .MuiToggleButtonGroup-grouped': {
                  flex: { xs: 1, md: 'initial' },
                  border: 0,
                  px: { xs: 1.2, sm: 2 },
                  py: 0.75,
                  borderRadius: `${DASHBOARD_TOKENS.radius.sm}px !important`,
                  color: DASHBOARD_TOKENS.textMuted,
                  fontWeight: 900,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.18),
                    color: DASHBOARD_TOKENS.ink,
                  },
                },
              }}
            >
              {(Object.keys(periodLabels) as BoltDashboardPeriod[]).map((value) => (
                <ToggleButton key={value} value={value}>
                  {periodLabels[value]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mb: 2, fontWeight: 700 }}>
            {error}
          </Alert>
        )}

        {dashboard.errorMessage && (
          <Alert severity="warning" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mb: 2, fontWeight: 700 }}>
            Ultima sincronizare Bolt a raportat o eroare.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          <KpiCard
            label="Încasat net"
            value={formatLei(dashboard.totalNetEarnings)}
            icon={<AccountBalanceWalletRoundedIcon />}
            tone="#0f9f6e"
            helper={dashboard.averageNetPerRide > 0 ? `${formatLeiDetailed(dashboard.averageNetPerRide)} / cursă` : undefined}
          />
          <KpiCard
            label="Curse"
            value={dashboard.totalOrdersCount.toLocaleString('ro-RO')}
            icon={<LocalTaxiRoundedIcon />}
            tone={DASHBOARD_TOKENS.primaryStrong}
            helper={dashboard.recentRides.length > 0 ? 'Cele mai recente sunt mai jos' : undefined}
          />
          <KpiCard
            label="Ore în cursă"
            value={formatHours(dashboard.totalRideHours)}
            icon={<AccessTimeRoundedIcon />}
            tone="#7c3aed"
            helper={dashboard.averageNetPerRideHour > 0 ? `${formatLeiDetailed(dashboard.averageNetPerRideHour)} / oră` : undefined}
          />
          <KpiCard
            label="Km parcurși"
            value={formatKm(dashboard.totalRideDistanceKm)}
            icon={<RouteRoundedIcon />}
            tone="#ea8a16"
            helper={`Tips ${formatLeiDetailed(dashboard.totalTips)} · comision ${formatLeiDetailed(dashboard.totalCommissions)}`}
          />
        </Box>
      </Paper>

      {!hasRideData ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            bgcolor: DASHBOARD_TOKENS.paper,
            textAlign: 'center',
          }}
        >
          <ElectricCarRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.18), fontSize: 46, mb: 1 }} />
          <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900 }}>
            Nu există curse Bolt pentru perioada selectată.
          </Typography>
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.6 }}>
            Datele se vor afișa aici după următoarea sincronizare Bolt.
          </Typography>
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(300px, 0.8fr)' },
              gap: 2,
              minWidth: 0,
            }}
          >
            <ChartCard title="Încasări">
              <Box sx={{ width: '100%', height: { xs: 260, md: 320 }, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={earningsSeries} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(DASHBOARD_TOKENS.ink, 0.08)} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                      width={54}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 700 }}
                      tickFormatter={(value) => `${Number(value).toLocaleString('ro-RO')} lei`}
                    />
                    <Tooltip
                      cursor={{ fill: alpha(DASHBOARD_TOKENS.primary, 0.08) }}
                      contentStyle={{
                        border: `1px solid ${DASHBOARD_TOKENS.border}`,
                        borderRadius: DASHBOARD_TOKENS.radius.md,
                        boxShadow: DASHBOARD_TOKENS.shadow.sm,
                      }}
                      formatter={(value: any) => [formatLeiDetailed(Number(value)), 'Încasat net']}
                    />
                    <Bar dataKey="netEarnings" fill={DASHBOARD_TOKENS.primaryStrong} radius={[5, 5, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>

            <ChartCard title="Net, tips și comision">
              <Box sx={{ width: '100%', height: { xs: 260, md: 320 }, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart layout="vertical" data={distributionData} margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={alpha(DASHBOARD_TOKENS.ink, 0.08)} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 11, fontWeight: 700 }}
                      tickFormatter={(value) => `${Number(value).toLocaleString('ro-RO')} lei`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={72}
                      tick={{ fill: DASHBOARD_TOKENS.textMuted, fontSize: 12, fontWeight: 800 }}
                    />
                    <Tooltip
                      cursor={{ fill: alpha('#0f9f6e', 0.06) }}
                      contentStyle={{
                        border: `1px solid ${DASHBOARD_TOKENS.border}`,
                        borderRadius: DASHBOARD_TOKENS.radius.md,
                        boxShadow: DASHBOARD_TOKENS.shadow.sm,
                      }}
                      formatter={(value: any) => [formatLeiDetailed(Number(value)), 'Valoare']}
                    />
                    <Bar dataKey="value" fill="#0f9f6e" radius={[0, 5, 5, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Box>

          <ChartCard title="Ultimele curse">
            <Stack spacing={1.2}>
              {dashboard.recentRides.map((ride) => (
                <Box
                  key={ride.id}
                  sx={{
                    p: { xs: 1.5, md: 1.8 },
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    bgcolor: DASHBOARD_TOKENS.surface,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) repeat(3, minmax(96px, auto))' },
                    gap: { xs: 1.2, md: 2 },
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trimAddress(ride.pickupAddress)} → {trimAddress(ride.destinationAddress)}
                    </Typography>
                    <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem', mt: 0.35 }}>
                      {rideTimeLabel(ride)} · {ride.vehicleLicensePlate}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {formatKm(ride.rideDistanceKm)}
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {formatHours(ride.rideHours)}
                  </Typography>
                  <Typography sx={{ color: '#047857', fontWeight: 950, textAlign: { xs: 'left', md: 'right' }, fontVariantNumeric: 'tabular-nums' }}>
                    {formatLeiDetailed(ride.netEarnings)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </ChartCard>
        </>
      )}
    </Stack>
  );
}
