import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'

import { OwnerAvatar } from '../components/common/OwnerAvatar'
import AppLayout from '../components/dashboard/layout/AppLayout'
import { DASHBOARD_TOKENS } from '../components/dashboard/dashboardTheme'
import { PendingBackendProvider } from '../components/dashboard/srl/PendingBackend'
import { SrlRoutes } from '../components/dashboard/srl/SrlRoutes'
import { useCompanyProfile } from '../components/dashboard/srl/useCompanyProfile'
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
 *
 * Fără profil salvat, blocul **nu dispare**: un cont nou ar fi văzut un gol în sidebar și niciun
 * indiciu că mai are ceva de completat. Arată în schimb invitația de a-l completa. Denumirea tot
 * nu se inventează din email — asta ajunge public pe anunțuri.
 */
function CompanyIdentityPlaceholder() {
  return (
    <ButtonBase
      component={RouterLink}
      to={SRL_PATHS.profile}
      aria-label="Completează profilul firmei"
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 1.2,
        px: 1,
        py: 0.9,
        borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
        textAlign: 'left',
        border: `1px dashed ${alpha(DASHBOARD_TOKENS.ink, 0.18)}`,
        '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06) },
        '&:focus-visible': { outline: `2px solid ${DASHBOARD_TOKENS.primaryStrong}`, outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.06),
          color: DASHBOARD_TOKENS.textMuted,
        }}
      >
        <BusinessRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.85rem', color: DASHBOARD_TOKENS.ink }}>
          Completează profilul
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: DASHBOARD_TOKENS.textMuted }}>
          Denumire, CUI, logo
        </Typography>
      </Box>
    </ButtonBase>
  )
}

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
  const { data: company } = useCompanyProfile()

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
          company ? (
            <CompanyIdentity
              name={company.legalName}
              logoUrl={company.logoUrl}
              verified={company.isVerified}
            />
          ) : (
            <CompanyIdentityPlaceholder />
          )
        }
      >
        <SrlRoutes />
      </AppLayout>
    </PendingBackendProvider>
  )
}
