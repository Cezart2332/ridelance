import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Avatar, Box, Stack, Typography } from '@mui/material'

import AppLayout from '../components/dashboard/layout/AppLayout'
import { DASHBOARD_TOKENS } from '../components/dashboard/dashboardTheme'
import { CarsAdminView } from '../components/dashboard/sections/admin/CarsAdminView'
import { InsuranceTab } from '../components/dashboard/sections/InsuranceTab'
import { ROUTES } from '../constants/routes'
import { SRL_NAV_CONFIG, SRL_PATHS } from '../config/srlNavigation'
import { OWNER_TYPE_LABELS } from '../config/ownerType'
import { authService } from '../services/auth.service'
import { userService, type UserProfile } from '../services/user.service'
import { displayName } from '../utils/displayName'

/**
 * Dashboard-ul SRL (contul de flotă).
 *
 * Folosește **exact** layout-ul dashboard-ului PFA, diferind doar prin `SRL_NAV_CONFIG` — cerința
 * din spec §0.3.2 și DoD 2. Înainte avea layout propriu (`components/layout/DashboardLayout`) și
 * naviga prin `useState`, nu prin rute, deci nicio pagină nu avea adresă proprie.
 *
 * Secțiunile sunt cele reale de azi. Structura completă din spec §2.1 se adaugă în FAZA 1.
 */

/** Blocul de identitate din subsolul sidebar-ului. §2.1 îl va extinde cu logo și badge de verificare. */
function CompanyIdentity({ name }: { name: string }) {
  return (
    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', px: 1, py: 0.8, minWidth: 0 }}>
      <Avatar
        sx={{
          width: 34,
          height: 34,
          bgcolor: DASHBOARD_TOKENS.primary,
          color: DASHBOARD_TOKENS.paper,
          fontWeight: 800,
          fontSize: '0.85rem',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.85rem', color: DASHBOARD_TOKENS.ink }}>
          {name}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted }}>
          {OWNER_TYPE_LABELS.Srl}
        </Typography>
      </Box>
    </Stack>
  )
}

export function CarPosterDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    userService.getProfile().then(setProfile).catch(() => {})
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  const userName = profile ? displayName(profile) : '...'

  // Rutele se declară relativ la `/app/dashboard-srl/*`, splat-ul din App.tsx.
  const rel = (path: string) => path.slice(`${SRL_PATHS.home}/`.length)

  return (
    <AppLayout
      nav={SRL_NAV_CONFIG}
      onLogout={handleLogout}
      sidebarFooter={<CompanyIdentity name={userName} />}
    >
      <Routes>
        <Route index element={<CarsAdminView variant="poster" posterSection="overview" />} />
        <Route path={rel(SRL_PATHS.cars)} element={<CarsAdminView variant="poster" posterSection="manage" />} />
        <Route path={rel(SRL_PATHS.insurance)} element={<InsuranceTab />} />
        <Route path="*" element={<Navigate to={SRL_PATHS.home} replace />} />
      </Routes>
    </AppLayout>
  )
}
