import React, { useState } from 'react';
import { Box } from '@mui/material';
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

export default function AppLayout({ children, activeSection, setActiveSection, sectionConfig, bottomSectionConfig = [], onLogout, showNotifications, onOpenRecurringDocumentation }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const allSections = [...sectionConfig, ...bottomSectionConfig];
  const sectionTitle = allSections.find((item) => item.id === activeSection)?.label || '';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: DASHBOARD_TOKENS.surface,
      }}
    >
      <AppSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        sectionConfig={sectionConfig}
        bottomSectionConfig={bottomSectionConfig}
        onLogout={onLogout}
      />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={sectionTitle}
          showNotifications={showNotifications}
          onOpenRecurringDocumentation={onOpenRecurringDocumentation}
        />
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
