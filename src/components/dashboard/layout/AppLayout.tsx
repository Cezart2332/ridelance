import React, { useState } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<any>>;
  sectionConfig: readonly { id: string; label: string }[];
}

export default function AppLayout({ children, activeSection, setActiveSection, sectionConfig }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionTitle = sectionConfig.find((item) => item.id === activeSection)?.label || '';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: DASHBOARD_TOKENS.surface,
        backgroundImage: `radial-gradient(circle at 100% 0, ${alpha(DASHBOARD_TOKENS.primary, 0.08)} 0%, transparent 40%)`,
      }}
    >
      <AppSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        sectionConfig={sectionConfig} 
      />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={sectionTitle}
        />
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
