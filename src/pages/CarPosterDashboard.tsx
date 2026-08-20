import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../components/common/OwnerAvatar'
import AppLayout from '../components/dashboard/layout/AppLayout'
import { DASHBOARD_TOKENS } from '../components/dashboard/dashboardTheme'
import { PendingBackendProvider } from '../components/dashboard/srl/PendingBackend'
import { SrlRoutes } from '../components/dashboard/srl/SrlRoutes'
import { companyProfileMock } from '../components/dashboard/srl/mocks/srl.mock'
import { ROUTES } from '../constants/routes'
import { SRL_NAV_CONFIG, SRL_PATHS } from '../config/srlNavigation'
import { authService } from '../services/auth.service'

/**
 * Dashboard-ul SRL.
 *
 * Folosește **exact** layout-ul dashboard-ului PFA, diferind doar prin `SRL_NAV_CONFIG` — cerința
 * din spec §0.3.2 și DoD 2. Rutele stau în `SrlRoutes`, ca la PFA.
 */

/**
 * Blocul de firmă din subsolul sidebar-ului (spec §2.1): logo sau inițiale, denumire, badge de
 * verificare. E clicabil și duce în Profil, adică exact acolo unde se editează ce se vede aici.
 */
function CompanyIdentity({ name, logoUrl, verified }: { name: string; logoUrl: string | null; verified: boolean }) {
  return (
    <ButtonBase
      component={RouterLink}
      to={SRL_PATHS.profile}
      aria-label={`Profilul firmei ${name}`}
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.2,
        px: 1,
        py: 0.9,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        textAlign: 'left',
        '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06) },
        '&:focus-visible': { outline: `2px solid ${DASHBOARD_TOKENS.primaryStrong}`, outlineOffset: 2 },
      }}
    >
      <OwnerAvatar name={name} logoUrl={logoUrl} size={34} />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.85rem', color: DASHBOARD_TOKENS.ink }}>
          {name}
        </Typography>
        {verified && (
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mt: 0.1 }}>
            <VerifiedRoundedIcon sx={{ fontSize: 13, color: DASHBOARD_TOKENS.accent }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: DASHBOARD_TOKENS.textMuted }}>
              Flotă verificată
            </Typography>
          </Stack>
        )}
      </Box>
    </ButtonBase>
  )
}

export function CarPosterDashboard() {
  const navigate = useNavigate()
  // FAZA 1: identitatea firmei vine din mock, ca peste tot în dashboardul SRL (spec §6.2).
  const [company] = useState(companyProfileMock)

  const handleLogout = async () => {
    await authService.logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <PendingBackendProvider>
      <AppLayout
        nav={SRL_NAV_CONFIG}
        onLogout={handleLogout}
        sidebarFooter={
          <CompanyIdentity name={company.legalName} logoUrl={company.logoUrl} verified={company.isVerified} />
        }
      >
        <SrlRoutes />
      </AppLayout>
    </PendingBackendProvider>
  )
}
