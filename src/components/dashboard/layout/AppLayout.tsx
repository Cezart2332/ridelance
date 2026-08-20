import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { pageTitleFor, type DashboardNavConfig } from '../../../config/dashboardNav';

interface AppLayoutProps {
  /** Meniul dashboardului curent. Layout-ul e agnostic la tipul de cont. */
  nav: DashboardNavConfig;
  children: React.ReactNode;
  onLogout?: () => void;
  showNotifications?: boolean;
  onOpenRecurringDocumentation?: () => void;
}

/** Valoarea barei de jos: una dintre cele trei destinații directe, altfel „Meniu". */
const MORE_TAB = 'more';

export default function AppLayout({
  nav,
  children,
  onLogout,
  showNotifications,
  onOpenRecurringDocumentation,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sectionTitle = pageTitleFor(nav, pathname);
  const bottomNavValue: string = nav.mobileTabs.find((tab) => tab.path === pathname)?.path ?? MORE_TAB;

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        backgroundColor: DASHBOARD_TOKENS.surface,
      }}
    >
      {/* Pe mobil sidebar-ul se randează tot, dar ca sertar — de acolo își ia „Meniu" conținutul. */}
      <AppSidebar nav={nav} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <AppHeader
          nav={nav}
          title={sectionTitle}
          showNotifications={showNotifications}
          onOpenRecurringDocumentation={onOpenRecurringDocumentation}
          onOpenMenu={() => setSidebarOpen(true)}
        />
        <Box
          component="main"
          sx={{
            p: { xs: 2, md: 3 },
            pb: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 3 },
            flexGrow: 1,
            // Coloană flex cu minHeight:0 ca o secțiune cu height:100% (ex. Acasă)
            // să se poată încadra exact în ecran, fără să declanșeze scroll.
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            // Într-o coloană care face scroll, copiii nu au voie să se comprime —
            // altfel paginile lungi s-ar strivi în loc să deruleze.
            '& > *': { flexShrink: 0 },
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Premium Glassmorphic Bottom Navigation for Mobile Devices */}
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: { xs: 'block', md: 'none' },
          backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.85),
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px -5px rgba(0,0,0,0.08)',
        }}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={(_, newValue: string) => {
            if (newValue === MORE_TAB) {
              setSidebarOpen(true);
              return;
            }
            navigate(newValue);
          }}
          showLabels
          sx={{
            height: 64,
            backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '6px 0',
              color: alpha(DASHBOARD_TOKENS.ink, 0.4),
              '&.Mui-selected': {
                color: DASHBOARD_TOKENS.primaryStrong,
                fontWeight: 700,
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.15)',
                  color: DASHBOARD_TOKENS.primaryStrong,
                },
              },
            },
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              mb: 0.3,
              transition: 'transform 0.2s ease, color 0.2s ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              fontWeight: 500,
              transition: 'font-size 0.2s, font-weight 0.2s',
              '&.Mui-selected': {
                fontSize: '0.7rem',
              },
            },
          }}
        >
          {nav.mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <BottomNavigationAction key={tab.path} label={tab.label} value={tab.path} icon={<Icon />} />
            );
          })}
          <BottomNavigationAction label="Meniu" value={MORE_TAB} icon={<MenuRoundedIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export type { AppLayoutProps };
