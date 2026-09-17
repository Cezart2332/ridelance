import { Box, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { NotificationsBell } from '../../notifications/NotificationsBell';
import type { DashboardNavConfig } from '../../../config/dashboardNav';
import logo from '../../../assets/logo.svg';

interface AppHeaderProps {
  /** Meniul curent — antetul are nevoie doar de destinațiile din bara de jos. */
  nav: DashboardNavConfig;
  title: string;
  showNotifications?: boolean;
  onOpenRecurringDocumentation?: () => void;
  /** Pagina de meniu de pe mobil: ținta lui „Înapoi” când subpagina a fost deschisă direct. */
  menuPath?: string;
}

export default function AppHeader({
  nav,
  title,
  showNotifications,
  menuPath,
}: AppHeaderProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Subpagină pe mobil = nici o destinație din bara de jos, nici meniul. Ca într-o aplicație, are
  // „Înapoi” în loc de logo.
  const isSubPageOnMobile =
    !isMdUp && pathname !== menuPath && !nav.mobileTabs.some((tab) => tab.path === pathname);

  const goBack = () => {
    // `idx` e poziția în istoricul aplicației (React Router). La 0 pagina a fost deschisă direct —
    // dintr-o notificare sau un link — și nu are unde să se întoarcă, deci merge la meniu.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else if (menuPath) navigate(menuPath);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 0,
        borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
        px: { xs: 1.8, md: 3 },
        py: 1.3,
        backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.9),
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
        {isSubPageOnMobile && (
          <IconButton
            size="small"
            aria-label="Înapoi"
            onClick={(e) => {
              e.stopPropagation();
              goBack();
            }}
            sx={{
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.9),
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.1) },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" color="primary" />
          </IconButton>
        )}
        {!isMdUp && !isSubPageOnMobile && (
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 26, width: 'auto', flexShrink: 0 }} />
        )}
        <Typography noWrap sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.15rem', letterSpacing: -0.4, minWidth: 0 }}>
          {title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        {showNotifications && (
          <NotificationsBell />
        )}
      </Stack>
    </Paper>
  );
}
