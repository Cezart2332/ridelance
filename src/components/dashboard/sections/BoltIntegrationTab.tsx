import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ElectricCarRoundedIcon from '@mui/icons-material/ElectricCarRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import SettingsInputComponentRoundedIcon from '@mui/icons-material/SettingsInputComponentRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import LocalTaxiRoundedIcon from '@mui/icons-material/LocalTaxiRounded'
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'

import { boltService, type BoltIntegrationDto, type BoltOrderDto } from '../../../services/bolt.service'
import { DASHBOARD_TOKENS, dashboardInputSx } from '../dashboardTheme'

const STATUS_CHIP_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  finished: { label: 'Finalizată', color: '#16a34a', bg: alpha('#22c55e', 0.1) },
  driver_booking: { label: 'Rezervată', color: '#1d4ed8', bg: alpha('#3b82f6', 0.1) },
  accepted: { label: 'Acceptată', color: '#1d4ed8', bg: alpha('#3b82f6', 0.1) },
  pickup: { label: 'Preluare', color: '#ca8a04', bg: alpha('#eab308', 0.1) },
  cancelled: { label: 'Anulată', color: '#dc2626', bg: alpha('#ef4444', 0.1) },
  no_show: { label: 'Neprezentare', color: '#4b5563', bg: alpha('#9ca3af', 0.1) }
}

function MobileDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(88px, auto) minmax(0, 1fr)',
        gap: 1.5,
        alignItems: 'start',
      }}
    >
      <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: 0,
          textAlign: 'right',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export function BoltIntegrationTab() {
  const [integration, setIntegration] = useState<BoltIntegrationDto | null>(null)
  const [orders, setOrders] = useState<BoltOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [configuring, setConfiguring] = useState(false)

  // Aggregate stats states (returned from server)
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [totalNetEarnings, setTotalNetEarnings] = useState(0)
  const [totalCommissions, setTotalCommissions] = useState(0)
  const [totalTips, setTotalTips] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  // Form inputs
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [integrationData, ordersResponse] = await Promise.all([
        boltService.getIntegration(),
        boltService.getOrders(5, 0)
      ])
      setIntegration(integrationData)
      if (ordersResponse) {
        setOrders(ordersResponse.orders || [])
        setTotalOrdersCount(ordersResponse.totalOrdersCount)
        setTotalNetEarnings(ordersResponse.totalNetEarnings)
        setTotalCommissions(ordersResponse.totalCommissions)
        setTotalTips(ordersResponse.totalTips)
      }
      
      if (integrationData) {
        setClientId(integrationData.clientId)
      }
    } catch (err: any) {
      console.error('Failed to load Bolt integration data', err)
      setErrorMsg('Nu s-au putut încărca datele din backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLoadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const ordersResponse = await boltService.getOrders(5, orders.length)
      if (ordersResponse && ordersResponse.orders) {
        setOrders((prev) => [...prev, ...ordersResponse.orders])
        // Keep aggregates sync
        setTotalOrdersCount(ordersResponse.totalOrdersCount)
        setTotalNetEarnings(ordersResponse.totalNetEarnings)
        setTotalCommissions(ordersResponse.totalCommissions)
        setTotalTips(ordersResponse.totalTips)
      }
    } catch (err) {
      console.error('Failed to load more orders', err)
      setErrorMsg('Eroare la încărcarea mai multor curse.')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault()
    if (!clientId || !clientSecret) {
      setErrorMsg('Introduceți atât Client ID cât și Client Secret.')
      return
    }

    setSyncing(true)
    setErrorMsg(null)
    try {
      await boltService.configureIntegration(clientId, clientSecret)
      await loadData()
      setConfiguring(false)
      setClientSecret('')
    } catch (err: any) {
      console.error('Failed to configure Bolt API', err)
      setErrorMsg(err.response?.data?.detail || 'Eroare la autentificarea cu Bolt API. Verificați credențialele.')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    setErrorMsg(null)
    try {
      await boltService.syncOrders()
      await loadData()
    } catch (err: any) {
      console.error('Sync failed', err)
      setErrorMsg('Eroare la sincronizarea datelor de la Bolt API.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <CircularProgress size={36} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    )
  }

  const showForm = !integration || configuring

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, minWidth: 0, mx: 'auto', p: 0, py: { xs: 1, md: 0 }, boxSizing: 'border-box' }}>
      {/* Title & Refresh */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3.5
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
            <Typography sx={{ fontWeight: 800, fontSize: '1.45rem', color: DASHBOARD_TOKENS.ink }}>
              Integrare Bolt API
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.9rem', mt: 0.3 }}>
              Sincronizare automată a curselor și facturarea lor prin PFA
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
              fontWeight: 700,
              textTransform: 'none',
              borderColor: alpha(DASHBOARD_TOKENS.ink, 0.12),
              color: DASHBOARD_TOKENS.ink,
              py: { xs: 1.2, sm: 1 },
              '&:hover': {
                borderColor: DASHBOARD_TOKENS.primary,
                bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04)
              }
            }}
          >
            Sincronizează acum
          </Button>
        )}
      </Stack>

      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg(null)}
          sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, mb: 3, fontWeight: 500 }}
        >
          {errorMsg}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: showForm ? '1fr' : '1fr 2fr' },
          gap: 3,
          alignItems: 'start',
          minWidth: 0
        }}
      >
        {/* Connection Setup panel */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: DASHBOARD_TOKENS.radius.lg,
            border: `1px solid ${DASHBOARD_TOKENS.border}`,
            boxShadow: DASHBOARD_TOKENS.shadow.sm,
            bgcolor: DASHBOARD_TOKENS.paper,
            minWidth: 0
          }}
        >
          {showForm ? (
            <form onSubmit={handleConnect}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: DASHBOARD_TOKENS.radius.sm, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12), color: DASHBOARD_TOKENS.primaryStrong }}>
                  <SettingsInputComponentRoundedIcon fontSize="small" />
                </Box>
                <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                  Configurare Conexiune
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: '0.85rem', color: DASHBOARD_TOKENS.textMuted, mb: 2.5 }}>
                Obține credențialele API din panoul Bolt Fleet Management pentru a stabili conexiunea securizată.
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, mb: 0.8 }}>
                    Client ID
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Introdu Client ID de la Bolt"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    sx={dashboardInputSx}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink, mb: 0.8 }}>
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
                  {integration && (
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => setConfiguring(false)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        color: DASHBOARD_TOKENS.textMuted,
                        borderRadius: DASHBOARD_TOKENS.radius.md
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
                      fontWeight: 700,
                      textTransform: 'none',
                      boxShadow: 'none',
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      bgcolor: DASHBOARD_TOKENS.primary,
                      color: DASHBOARD_TOKENS.ink,
                      '&:hover': {
                        bgcolor: DASHBOARD_TOKENS.primaryStrong,
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {syncing ? <CircularProgress size={20} color="inherit" /> : 'Salvare și Conectare'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          ) : (
            // Active connection summary
            <div>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                  Stare Conexiune
                </Typography>
                <Chip
                  icon={integration.isConnected ? <CloudDoneRoundedIcon fontSize="small" /> : <ErrorOutlineRoundedIcon fontSize="small" />}
                  label={integration.isConnected ? 'Conectat' : 'Eroare'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: DASHBOARD_TOKENS.radius.full,
                    color: integration.isConnected ? '#16a34a' : '#dc2626',
                    bgcolor: integration.isConnected ? alpha('#22c55e', 0.1) : alpha('#ef4444', 0.1),
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />
              </Stack>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <Paper elevation={0} sx={{ p: 1.8, border: `1px solid ${DASHBOARD_TOKENS.border}`, bgcolor: DASHBOARD_TOKENS.surface, borderRadius: DASHBOARD_TOKENS.radius.md }}>
                  <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>PARTENER FLEET</Typography>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.95rem', mt: 0.4 }}>
                    {integration.companyName || 'Bolt Client'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
                    ID Companie: {integration.companyId}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.8, border: `1px solid ${DASHBOARD_TOKENS.border}`, bgcolor: DASHBOARD_TOKENS.surface, borderRadius: DASHBOARD_TOKENS.radius.md }}>
                  <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>CREDENTIELE MASCATE</Typography>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem', mt: 0.4 }}>
                    Client ID: {integration.clientId}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1.8, border: `1px solid ${DASHBOARD_TOKENS.border}`, bgcolor: DASHBOARD_TOKENS.surface, borderRadius: DASHBOARD_TOKENS.radius.md }}>
                  <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textSubtle, fontWeight: 700 }}>ULTIMA SINCRONIZARE</Typography>
                  <Typography sx={{ fontWeight: 700, color: DASHBOARD_TOKENS.ink, fontSize: '0.9rem', mt: 0.4 }}>
                    {integration.lastFetchedAtUtc ? new Date(integration.lastFetchedAtUtc).toLocaleString('ro-RO') : 'Niciodată'}
                  </Typography>
                </Paper>

                {integration.errorMessage && (
                  <Alert severity="warning" sx={{ borderRadius: DASHBOARD_TOKENS.radius.md, fontSize: '0.8rem' }}>
                    Sincronizarea automată a raportat o eroare: {integration.errorMessage}
                  </Alert>
                )}
              </Stack>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setConfiguring(true)}
                sx={{
                  py: 1,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  borderColor: alpha(DASHBOARD_TOKENS.ink, 0.12),
                  color: DASHBOARD_TOKENS.ink,
                  '&:hover': {
                    borderColor: DASHBOARD_TOKENS.primary,
                    bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.03)
                  }
                }}
              >
                Reconfigurare cont Bolt
              </Button>
            </div>
          )}
        </Paper>

        {/* Orders list and stats - Only visible when connected */}
        {!showForm && (
          <Stack spacing={3} sx={{ minWidth: 0 }}>
            {/* Quick stats widgets */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2
              }}
            >
              {[
                { title: 'Curse Month YTD', value: totalOrdersCount, icon: <LocalTaxiRoundedIcon />, color: DASHBOARD_TOKENS.primary },
                { title: 'Venit Net Luna', value: `${totalNetEarnings.toFixed(2)} lei`, icon: <MonetizationOnRoundedIcon />, color: '#10b981' },
                { title: 'Comision Bolt', value: `${totalCommissions.toFixed(2)} lei`, icon: <PercentRoundedIcon />, color: '#f59e0b' },
                { title: 'Tips Primite', value: `${totalTips.toFixed(2)} lei`, icon: <AccountBalanceWalletRoundedIcon />, color: '#3b82f6' }
              ].map((stat, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: DASHBOARD_TOKENS.radius.lg,
                    border: `1px solid ${DASHBOARD_TOKENS.border}`,
                    bgcolor: DASHBOARD_TOKENS.paper,
                    boxShadow: DASHBOARD_TOKENS.shadow.sm,
                    minWidth: 0
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1, minWidth: 0 }}>
                    <Typography sx={{ minWidth: 0, fontSize: { xs: '0.7rem', sm: '0.78rem' }, color: DASHBOARD_TOKENS.textMuted, fontWeight: 700 }}>
                      {stat.title}
                    </Typography>
                    <Box sx={{ flexShrink: 0, color: stat.color, display: 'flex', alignItems: 'center', '& svg': { fontSize: { xs: 18, sm: 24 } } }}>
                      {stat.icon}
                    </Box>
                  </Stack>
                  <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                    {stat.value}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Orders Table */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: DASHBOARD_TOKENS.radius.lg,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                boxShadow: DASHBOARD_TOKENS.shadow.sm,
                bgcolor: DASHBOARD_TOKENS.paper,
                minWidth: 0,
                overflow: 'hidden'
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ p: 1, borderRadius: DASHBOARD_TOKENS.radius.sm, bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.12), color: DASHBOARD_TOKENS.primaryStrong }}>
                  <CalendarMonthRoundedIcon fontSize="small" />
                </Box>
                <div>
                  <Typography sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                    Istoric Curse
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.8rem' }}>
                    Cursele Bolt înregistrate în luna curentă
                  </Typography>
                </div>
              </Stack>

              {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ElectricCarRoundedIcon sx={{ fontSize: 44, color: alpha(DASHBOARD_TOKENS.ink, 0.12), mb: 2 }} />
                  <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontWeight: 700 }}>
                    Nicio cursă înregistrată
                  </Typography>
                  <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.85rem', mt: 0.5 }}>
                    Dacă ai curse recente, apasă pe butonul de sincronizare pentru a le descărca.
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Table View for Desktop Devices */}
                  <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', maxWidth: '100%' }}>
                    <Table sx={{ minWidth: 880 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`, fontWeight: 700, color: DASHBOARD_TOKENS.textMuted } }}>
                          <TableCell>Referință</TableCell>
                          <TableCell>Data cursei</TableCell>
                          <TableCell>Șofer / Nr. Înmatriculare</TableCell>
                          <TableCell align="right">Distanță (km)</TableCell>
                          <TableCell align="right">Preț Cursă</TableCell>
                          <TableCell align="right">Venit Net</TableCell>
                          <TableCell>Metodă plată</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.map((order) => {
                          const statusCfg = STATUS_CHIP_CONFIG[order.orderStatus.toLowerCase()] || { label: order.orderStatus, color: '#4b5563', bg: alpha('#9ca3af', 0.1) }
                          return (
                            <TableRow
                              key={order.id}
                              sx={{
                                '& td': { borderBottom: `1px solid ${DASHBOARD_TOKENS.border}`, py: 1.8 },
                                '&:hover': { bgcolor: DASHBOARD_TOKENS.surface }
                              }}
                            >
                              <TableCell sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink }}>
                                {order.orderReference}
                              </TableCell>
                              <TableCell sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.85rem' }}>
                                {new Date(order.orderCreatedTime).toLocaleString('ro-RO')}
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: DASHBOARD_TOKENS.ink }}>
                                  {order.driverName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle }}>
                                  {order.vehicleLicensePlate} ({order.vehicleModel})
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 500 }}>
                                {(order.rideDistance / 1000).toFixed(1)} km
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {Number(order.ridePrice).toFixed(2)} lei
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: '#16a34a' }}>
                                {Number(order.netEarnings).toFixed(2)} lei
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                                {order.paymentMethod}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusCfg.label}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    color: statusCfg.color,
                                    bgcolor: statusCfg.bg,
                                    borderRadius: DASHBOARD_TOKENS.radius.full
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Card List View for Mobile Devices */}
                  <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 0 }}>
                    {orders.map((order) => {
                      const statusCfg = STATUS_CHIP_CONFIG[order.orderStatus.toLowerCase()] || { label: order.orderStatus, color: '#4b5563', bg: alpha('#9ca3af', 0.1) }
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
                            '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05) }
                          }}
                        >
                          <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, minWidth: 0 }}>
                            <Typography
                              title={order.orderReference}
                              noWrap
                              sx={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink }}
                            >
                              {order.orderReference}
                            </Typography>
                            <Chip
                              label={statusCfg.label}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                color: statusCfg.color,
                                bgcolor: statusCfg.bg,
                                borderRadius: DASHBOARD_TOKENS.radius.full,
                                flexShrink: 0,
                                maxWidth: 112
                              }}
                            />
                          </Stack>

                          <Stack spacing={1} sx={{ mb: 1.5 }}>
                            <MobileDetailRow label="Data cursei:">
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: DASHBOARD_TOKENS.ink }}>
                                {new Date(order.orderCreatedTime).toLocaleString('ro-RO')}
                              </Typography>
                            </MobileDetailRow>

                            <MobileDetailRow label="Șofer / Auto:">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.ink }}>
                                  {order.driverName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.74rem', color: DASHBOARD_TOKENS.textSubtle }}>
                                  {order.vehicleLicensePlate} ({order.vehicleModel})
                                </Typography>
                              </Box>
                            </MobileDetailRow>

                            <MobileDetailRow label="Distanță:">
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: DASHBOARD_TOKENS.ink }}>
                                {(order.rideDistance / 1000).toFixed(1)} km
                              </Typography>
                            </MobileDetailRow>

                            <MobileDetailRow label="Preț / Plată:">
                              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: DASHBOARD_TOKENS.ink }}>
                                {Number(order.ridePrice).toFixed(2)} lei ({order.paymentMethod})
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
                              minWidth: 0
                            }}
                          >
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: DASHBOARD_TOKENS.textMuted }}>Venit Net:</Typography>
                            <Typography sx={{ minWidth: 0, textAlign: 'right', overflowWrap: 'anywhere', fontSize: '1.05rem', fontWeight: 900, color: '#16a34a' }}>
                              {Number(order.netEarnings).toFixed(2)} lei
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>

                  {/* Load More Button */}
                  {orders.length < totalOrdersCount && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        startIcon={loadingMore ? <CircularProgress size={16} color="inherit" /> : null}
                        sx={{
                          borderRadius: DASHBOARD_TOKENS.radius.md,
                          fontWeight: 700,
                          textTransform: 'none',
                          borderColor: alpha(DASHBOARD_TOKENS.ink, 0.12),
                          color: DASHBOARD_TOKENS.ink,
                          px: 4,
                          py: 1.2,
                          '&:hover': {
                            borderColor: DASHBOARD_TOKENS.primary,
                            bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04)
                          }
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
    </Box>
  )
}
