import React, { useState } from 'react';
import { Box, Paper, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import HeadphonesRoundedIcon from '@mui/icons-material/HeadphonesRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<any>>;
  sectionConfig: readonly { id: string; label: string; icon?: string; subItems?: readonly { id: string; label: string }[] }[];
  bottomSectionConfig?: readonly { id: string; label: string; icon?: string }[];
  onLogout?: () => void;
  showNotifications?: boolean;
  onOpenRecurringDocumentation?: () => void;
}

export default function AppLayout({
  children,
  activeSection,
  setActiveSection,
  sectionConfig,
  bottomSectionConfig = [],
  onLogout,
  showNotifications,
  onOpenRecurringDocumentation
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const allSections = [...sectionConfig, ...bottomSectionConfig];
  
  const pageTitles: Record<string, string> = {
    home: 'Dashboard PFA',
    profile: 'Profilul meu',
    documents: 'Documentele mele',
    support: 'Chat & Suport',
    expenses: 'Cheltuieli deductibile',
    doc_recurring: 'Documentație recurentă',
    cars: 'Mașini disponibile',
    abonamente: 'Abonamente',
    servicii: 'Servicii',
    istoric_plati: 'Istoric plăți',
    more: 'Meniu',
  };

  const sectionTitle = pageTitles[activeSection] ?? allSections.find((item) => item.id === activeSection)?.label ?? '';

  const getBottomNavValue = () => {
    if (['home', 'profile', 'support'].includes(activeSection)) {
      return activeSection;
    }
    return 'more';
  };

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
      {isMdUp && (
        <AppSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          sectionConfig={sectionConfig}
          bottomSectionConfig={bottomSectionConfig}
          onLogout={onLogout}
        />
      )}
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
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={sectionTitle}
          showNotifications={showNotifications}
          onOpenRecurringDocumentation={onOpenRecurringDocumentation}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
        <Box 
          component="main" 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            pb: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 3 },
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch'
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
          value={getBottomNavValue()}
          onChange={(_, newValue) => {
            setActiveSection(newValue);
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
          <BottomNavigationAction
            label="Acasă"
            value="home"
            icon={<HomeRoundedIcon />}
          />
          <BottomNavigationAction
            label="Profil"
            value="profile"
            icon={<PersonRoundedIcon />}
          />
          <BottomNavigationAction
            label="Chat"
            value="support"
            icon={<HeadphonesRoundedIcon />}
          />
          <BottomNavigationAction
            label="Meniu"
            value="more"
            icon={<MenuRoundedIcon />}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
