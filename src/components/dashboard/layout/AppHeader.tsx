import { Box, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { NotificationsBell } from '../../notifications/NotificationsBell';
import { MOBILE_TAB_PATHS } from '../../../config/pfaNavigation';
import logo from '../../../assets/logo.svg';

interface AppHeaderProps {
  title: string;
  showNotifications?: boolean;
  onOpenRecurringDocumentation?: () => void;
  /** Deschide sertarul de navigare — pe mobil e singura cale înapoi din subpagini. */
  onOpenMenu?: () => void;
}

export default function AppHeader({
  title,
  showNotifications,
  onOpenRecurringDocumentation,
  onOpenMenu,
}: AppHeaderProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { pathname } = useLocation();

  // Subpagină pe mobil = orice rută care nu e una dintre cele trei destinații din bara de jos.
  const isSubPageOnMobile = !isMdUp && !MOBILE_TAB_PATHS.some((path) => path === pathname);

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
        {isSubPageOnMobile && onOpenMenu && (
          <IconButton
            size="small"
            aria-label="Deschide meniul"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu();
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
        {!isMdUp && (
          <Box component="img" src={logo} alt="RIDElance" sx={{ height: 26, width: 'auto', flexShrink: 0 }} />
        )}
        <Typography noWrap sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.15rem', letterSpacing: -0.4, minWidth: 0 }}>
          {title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        {showNotifications && (
          <NotificationsBell onOpenRecurringDocumentation={onOpenRecurringDocumentation} />
        )}
      </Stack>
    </Paper>
  );
}
