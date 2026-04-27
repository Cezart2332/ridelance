import { Badge, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  title: string;
}

export default function AppHeader({ sidebarOpen, setSidebarOpen, title }: AppHeaderProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

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
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        {!isMdUp && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            sx={{
              border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
              backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.9),
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.1) },
            }}
          >
            <MenuRoundedIcon fontSize="small" color="primary" />
          </IconButton>
        )}
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 800, fontSize: '1.15rem', letterSpacing: -0.4 }}>
          {title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5}>
        <IconButton
          size="small"
          aria-label="Notificari"
          sx={{
            border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
            backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.92),
            transition: '0.2s',
            '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.1), color: DASHBOARD_TOKENS.primaryStrong },
          }}
        >
          <Badge badgeContent={3} color="error" overlap="circular">
            <NotificationsRoundedIcon fontSize="small" sx={{ color: DASHBOARD_TOKENS.textMuted }} />
          </Badge>
        </IconButton>
      </Stack>
    </Paper>
  );
}
