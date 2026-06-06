import { IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { NotificationsBell } from '../../notifications/NotificationsBell';

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  title: string;
  showNotifications?: boolean;
  onOpenRecurringDocumentation?: () => void;
  activeSection?: string;
  setActiveSection?: (sectionId: string) => void;
}

export default function AppHeader({
  sidebarOpen,
  setSidebarOpen,
  title,
  showNotifications,
  onOpenRecurringDocumentation,
  activeSection,
  setActiveSection,
}: AppHeaderProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  // A sub-page on mobile is any active section that is NOT one of the primary tabs
  const isSubPageOnMobile = 
    !isMdUp && 
    activeSection && 
    !['home', 'profile', 'support', 'more'].includes(activeSection);

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
        {isSubPageOnMobile && setActiveSection && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSection('more');
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
