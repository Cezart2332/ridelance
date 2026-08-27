import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import ElectricCarRoundedIcon from '@mui/icons-material/ElectricCarRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded';
import PercentRoundedIcon from '@mui/icons-material/PercentRounded';
import SettingsInputComponentRoundedIcon from '@mui/icons-material/SettingsInputComponentRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';

import {
  boltService,
  type BoltDashboardDto,
  type BoltIntegrationDto,
  type BoltOrderDto,
} from '../../../services/bolt.service';
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme';
import { StatCard, StatusChip, type StatusTone } from '../ui';

const STATUS_CHIP_CONFIG: Record<string, { label: string; tone: StatusTone }> = {
  finished: { label: 'Finalizată', tone: 'active' },
  driver_booking: { label: 'Rezervată', tone: 'neutral' },
  accepted: { label: 'Acceptată', tone: 'neutral' },
  pickup: { label: 'Preluare', tone: 'neutral' },
  cancelled: { label: 'Anulată', tone: 'error' },
  no_show: { label: 'Neprezentare', tone: 'neutral' },
};

function formatLei(value: number) {
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

function getRideHours(order: BoltOrderDto) {
  if (!order.orderFinishedTime) return 0;
  const start = new Date(order.orderCreatedTime).getTime();
  const finish = new Date(order.orderFinishedTime).getTime();
  const hours = (finish - start) / 36e5;
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
}

function MobileDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(92px, auto) minmax(0, 1fr)',
        gap: 1.5,
        alignItems: 'start',
      }}
    >
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, textAlign: 'right', overflowWrap: 'anywhere' }}>
        {children}
      </Box>
    </Box>
  );
}

interface BoltIntegrationTabProps {
  embedded?: boolean;
  onConnected?: () => void;
}

export function BoltIntegrationTab({ embedded = false, onConnected }: BoltIntegrationTabProps) {
  const [integration, setIntegration] = useState<BoltIntegrationDto | null>(null);
  const [dashboard, setDashboard] = useState<BoltDashboardDto | null>(null);
  const [orders, setOrders] = useState<BoltOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [integrationData, ordersResponse, dashboardData] = await Promise.all([
        boltService.getIntegration(),
        boltService.getOrders(5, 0),
        boltService.getDashboard('month'),
      ]);

      setIntegration(integrationData);
      setOrders(ordersResponse.orders || []);
      setTotalOrdersCount(ordersResponse.totalOrdersCount);
      setDashboard(dashboardData);

      // Câmpurile de credențiale rămân goale, chiar și când există deja o integrare. Aici se
      // punea masca primită de la server ca valoare inițială; cine apăsa Conectează fără s-o
      // rescrie trimitea `4wEssh...ME` în loc de Client ID, iar salvarea suprascria valoarea
      // bună cu masca. De acolo încolo Bolt răspundea 500 la fiecare încercare, la nesfârșit:
      // masca mascată e tot masca, deci nimic nu mai ieșea din starea asta singur.
    } catch (err: any) {
      console.error('Failed to load Bolt integration data', err);
      setErrorMsg('Nu s-au putut încărca datele Bolt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const ordersResponse = await boltService.getOrders(5, orders.length);
      setOrders((prev) => [...prev, ...(ordersResponse.orders || [])]);
      setTotalOrdersCount(ordersResponse.totalOrdersCount);
    } catch (err) {
      console.error('Failed to load more orders', err);
      setErrorMsg('Eroare la încărcarea mai multor curse.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientSecret) {
      setErrorMsg('Introduceți Client ID și Client Secret.');
      return;
    }

    setSyncing(true);
    setErrorMsg(null);
    try {
      await boltService.configureIntegration(clientId, clientSecret);
      await loadData();
      setConfiguring(false);
      setClientId('');
      setClientSecret('');
      onConnected?.();
    } catch (err: any) {
      console.error('Failed to configure Bolt API', err);
      setErrorMsg(err.response?.data?.detail || 'Eroare la autentificarea cu Bolt API. Verifică datele introduse.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      await boltService.syncOrders();
      await loadData();
    } catch (err: any) {
      console.error('Sync failed', err);
      setErrorMsg('Eroare la sincronizarea datelor Bolt.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <CircularProgress size={36} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    );
  }

  const showForm = !integration || configuring || !integration.isConnected || (embedded && Boolean(integration.errorMessage));
  const totalTipsAndCommissions = (dashboard?.totalTips ?? 0) + (dashboard?.totalCommissions ?? 0);

  return (
    <Box sx={{ width: '100%', maxWidth: embedded ? 'none' : 1200, minWidth: 0, mx: 'auto', py: embedded ? 0 : { xs: 1, md: 0 }, boxSizing: 'border-box' }}>
      {!embedded && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3.5,
          }}
        >
          <Stack direction="row" spacing={1.6} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.14),
                color: DASHBOARD_TOKENS.primaryStrong,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ElectricCarRoundedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.45rem', color: DASHBOARD_TOKENS.ink }}>
                Bolt
              </Typography>
              <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.3 }}>
                Încasări, curse și sincronizare
              </Typography>
            </Box>
          </Stack>

          {integration?.isConnected && !showForm && (
            <Button
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncRoundedIcon />}
              onClick={handleSyncNow}
              disabled={syncing}
              sx={{
                borderRadius: DASHBOARD_TOKENS.radius.md,
                fontWeight: 800,
                textTransform: 'none',
                borderColor: alpha(DASHBOARD_TOKENS.ink, 0.12),
                color: DASHBOARD_TOKENS.ink,
                py: { xs: 1.2, sm: 1 },
                '&:hover': {
                  borderColor: DASHBOARD_TOKENS.primary,
                  bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04),
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Sincronizează acum
            </Button>
          )}
        </Stack>
      )}

      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg(null)}
          sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mb: 3, fontWeight: 700 }}
        >
          {errorMsg}
        </Alert>
      )}

      {showForm ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
            bgcolor: DASHBOARD_TOKENS.paper,
            maxWidth: 620,
            mx: embedded ? 'auto' : 0,
          }}
        >
          <form onSubmit={handleConnect}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: DASHBOARD_TOKENS.radius.sm, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12), color: DASHBOARD_TOKENS.primaryStrong }}>
                <SettingsInputComponentRoundedIcon fontSize="small" />
              </Box>
              <Typography sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
                {integration ? 'Reconectare Bolt' : 'Conectare Bolt'}
              </Typography>
            </Stack>

            {integration?.errorMessage && (
              <Alert severity="warning" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mb: 2, fontWeight: 700 }}>
                Sincronizarea Bolt a raportat o eroare. Reconectează contul pentru a relua importul de curse.
              </Alert>
            )}

            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink, mb: 0.8 }}>
                  Client ID
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Introdu Client ID de la Bolt"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  helperText={
                    integration
                      ? `Momentan salvat: ${integration.clientIdMasked}. Scrie-l din nou, întreg, ca să-l schimbi.`
                      : undefined
                  }
                  sx={dashboardInputSx}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink, mb: 0.8 }}>
                  Client Secret
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  placeholder="Introdu Client Secret-ul asociat"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  sx={dashboardInputSx}
                />
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                {integration?.isConnected && configuring && (
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => setConfiguring(false)}
                    sx={{
                      fontWeight: 800,
                      textTransform: 'none',
                      color: DASHBOARD_TOKENS.textMuted,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                    }}
                  >
                    Renunță
                  </Button>
                )}
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={syncing}
                  sx={{
                    py: 1.3,
                    fontWeight: 900,
                    textTransform: 'none',
                    boxShadow: 'none',
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    bgcolor: DASHBOARD_TOKENS.primary,
                    color: DASHBOARD_TOKENS.ink,
                    '&:hover': {
                      bgcolor: DASHBOARD_TOKENS.primaryStrong,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {syncing ? <CircularProgress size={20} color="inherit" /> : 'Salvează conexiunea'}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      ) : (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              bgcolor: DASHBOARD_TOKENS.paper,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
                  Stare Bolt
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', mt: 0.4 }}>
                  {integration.lastFetchedAtUtc
                    ? `Ultima sincronizare: ${new Date(integration.lastFetchedAtUtc).toLocaleString('ro-RO')}`
                    : 'Datele nu au fost sincronizate încă.'}
                </Typography>
              </Box>
              <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                <StatusChip
                  tone="active"
                  label="Conectat"
                  icon={<CloudDoneRoundedIcon fontSize="small" />}
                />
              </Box>
            </Stack>

            {integration.errorMessage && (
              <Alert
                severity="warning"
                icon={<ErrorOutlineRoundedIcon />}
                sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mt: 2, fontWeight: 700 }}
                action={
                  <Button color="inherit" size="small" onClick={() => setConfiguring(true)} sx={{ fontWeight: 900, textTransform: 'none' }}>
                    Reconectează
                  </Button>
                }
              >
                Sincronizarea Bolt a raportat o eroare.
              </Alert>
            )}
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <StatCard
              label="Curse luna curentă"
              value={(dashboard?.totalOrdersCount ?? 0).toLocaleString('ro-RO')}
              icon={<LocalTaxiRoundedIcon />}
            />
            <StatCard
              label="Încasat net"
              value={formatLei(dashboard?.totalNetEarnings ?? 0)}
              icon={<AccountBalanceWalletRoundedIcon />}
              variant="accent"
            />
            <StatCard
              label="Ore în cursă"
              value={formatHours(dashboard?.totalRideHours ?? 0)}
              icon={<AccessTimeRoundedIcon />}
            />
            <StatCard
              label="Tips + comision"
              value={formatLei(totalTipsAndCommissions)}
              icon={<PercentRoundedIcon />}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: DASHBOARD_TOKENS.radius.lg,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
              bgcolor: DASHBOARD_TOKENS.paper,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ p: 1, borderRadius: DASHBOARD_TOKENS.radius.sm, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12), color: DASHBOARD_TOKENS.primaryStrong }}>
                <CalendarMonthRoundedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.ink }}>
                  Curse recente
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                  Date importate din Bolt
                </Typography>
              </Box>
            </Stack>

            {orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ElectricCarRoundedIcon sx={{ fontSize: 44, color: alpha(DASHBOARD_TOKENS.ink, 0.12), mb: 2 }} />
                <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 800 }}>
                  Nicio cursă înregistrată
                </Typography>
                <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.85rem', mt: 0.5 }}>
                  Sincronizează datele dacă ai curse recente.
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', maxWidth: '100%' }}>
                  <Table sx={{ minWidth: 820 }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`, fontWeight: 800, color: DASHBOARD_TOKENS.textMuted } }}>
                        <TableCell>Data cursei</TableCell>
                        <TableCell>Traseu</TableCell>
                        <TableCell>Șofer / auto</TableCell>
                        <TableCell align="right">Distanță</TableCell>
                        <TableCell align="right">Durată</TableCell>
                        <TableCell align="right">Venit net</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => {
                        const statusCfg = STATUS_CHIP_CONFIG[order.orderStatus.toLowerCase()] || { label: order.orderStatus, tone: 'neutral' as StatusTone };
                        return (
                          <TableRow
                            key={order.id}
                            sx={{
                              '& td': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`, py: 1.8 },
                              '&:hover': { bgcolor: DASHBOARD_TOKENS.surface },
                            }}
                          >
                            <TableCell sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>
                              {new Date(order.orderCreatedTime).toLocaleString('ro-RO')}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: DASHBOARD_TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {trimAddress(order.pickupAddress)} → {trimAddress(order.destinationAddress)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                                {order.driverName}
                              </Typography>
                              <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle }}>
                                {order.vehicleLicensePlate} ({order.vehicleModel})
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                              {formatKm(order.rideDistance / 1000)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                              {formatHours(getRideHours(order))}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.accent, fontVariantNumeric: 'tabular-nums' }}>
                              {formatLei(Number(order.netEarnings))}
                            </TableCell>
                            <TableCell>
                              <StatusChip label={statusCfg.label} tone={statusCfg.tone} size="sm" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 0 }}>
                  {orders.map((order) => {
                    const statusCfg = STATUS_CHIP_CONFIG[order.orderStatus.toLowerCase()] || { label: order.orderStatus, tone: 'neutral' as StatusTone };
                    return (
                      <Box
                        key={order.id}
                        sx={{
                          p: 2,
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          borderRadius: DASHBOARD_TOKENS.radius.md,
                          border: `1px solid ${DASHBOARD_TOKENS.border}`,
                          bgcolor: DASHBOARD_TOKENS.surface,
                          overflow: 'hidden',
                          '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
                        }}
                      >
                        <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, minWidth: 0 }}>
                          <Typography
                            sx={{ flex: 1, minWidth: 0, fontWeight: 900, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {trimAddress(order.pickupAddress)} → {trimAddress(order.destinationAddress)}
                          </Typography>
                          <Box sx={{ flexShrink: 0 }}>
                            <StatusChip label={statusCfg.label} tone={statusCfg.tone} size="sm" />
                          </Box>
                        </Stack>

                        <Stack spacing={1} sx={{ mb: 1.5 }}>
                          <MobileDetailRow label="Data cursei:">
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
                              {new Date(order.orderCreatedTime).toLocaleString('ro-RO')}
                            </Typography>
                          </MobileDetailRow>

                          <MobileDetailRow label="Șofer / auto:">
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                                {order.driverName}
                              </Typography>
                              <Typography sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textSubtle }}>
                                {order.vehicleLicensePlate} ({order.vehicleModel})
                              </Typography>
                            </Box>
                          </MobileDetailRow>

                          <MobileDetailRow label="Distanță:">
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
                              {formatKm(order.rideDistance / 1000)}
                            </Typography>
                          </MobileDetailRow>

                          <MobileDetailRow label="Durată:">
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
                              {formatHours(getRideHours(order))}
                            </Typography>
                          </MobileDetailRow>
                        </Stack>

                        <Box
                          sx={{
                            pt: 1.5,
                            borderTop: `1px dashed ${DASHBOARD_TOKENS.border}`,
                            display: 'flex',
                            gap: 1.5,
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            minWidth: 0,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: DASHBOARD_TOKENS.textMuted }}>Venit net</Typography>
                          <Typography sx={{ minWidth: 0, textAlign: 'right', overflowWrap: 'anywhere', fontSize: '1.05rem', fontWeight: 900, color: DASHBOARD_TOKENS.accent, fontVariantNumeric: 'tabular-nums' }}>
                            {formatLei(Number(order.netEarnings))}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>

                {orders.length < totalOrdersCount && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      startIcon={loadingMore ? <CircularProgress size={16} color="inherit" /> : null}
                      sx={{
                        borderRadius: DASHBOARD_TOKENS.radius.md,
                        fontWeight: 800,
                        textTransform: 'none',
                        borderColor: alpha(DASHBOARD_TOKENS.ink, 0.12),
                        color: DASHBOARD_TOKENS.ink,
                        px: 4,
                        py: 1.2,
                        '&:hover': {
                          borderColor: DASHBOARD_TOKENS.primary,
                          bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04),
                        },
                      }}
                    >
                      {loadingMore ? 'Se încarcă...' : 'Încarcă mai multe curse'}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
