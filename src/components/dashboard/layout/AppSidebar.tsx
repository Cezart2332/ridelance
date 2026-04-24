import { Box, Button, Drawer, Stack, Typography, useMediaQuery, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  sectionConfig: readonly { id: string; label: string; icon?: string; subItems?: readonly { id: string; label: string }[] }[];
}

export default function AppSidebar({ sidebarOpen, setSidebarOpen, activeSection, setActiveSection, sectionConfig }: AppSidebarProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const sidebarContent = (
    <Stack sx={{ height: '100%', p: 2, backgroundColor: '#fff' }} spacing={2}>
      <Box sx={{ mt: 2 }}>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: '1rem' }}>
          Ridelance Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography sx={{ px: 1.3, mb: 1, fontSize: '0.75rem', fontWeight: 600, color: DASHBOARD_TOKENS.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Meniu Principal
        </Typography>
        <Stack spacing={0.8}>
          {sectionConfig.map((item) => {
            const isActive = activeSection === item.id;
            
            // If the item has subItems, render an accordion instead of a simple button
            if ('subItems' in item && item.subItems) {
              const isChildActive = item.subItems.some(sub => activeSection === sub.id);
              
              return (
                <Accordion 
                  key={item.id} 
                  elevation={0}
                  disableGutters
                  defaultExpanded={isChildActive}
                  sx={{
                    backgroundColor: 'transparent',
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    m: '0 !important',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.6) }} />}
                    sx={{
                      minHeight: 'auto',
                      m: 0,
                      px: 1.5,
                      py: 1,
                      borderRadius: DASHBOARD_TOKENS.radius.md,
                      '& .MuiAccordionSummary-content': { m: 0 },
                      '&.Mui-expanded': { minHeight: 'auto' },
                      '&:hover': {
                        backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.04),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      {item.icon && (
                        <img 
                          src={item.icon} 
                          alt="" 
                          style={{ 
                            width: 18, 
                            height: 18, 
                            filter: isChildActive 
                              ? 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)' 
                              : 'invert(15%) sepia(10%) saturate(704%) hue-rotate(201deg) brightness(94%) contrast(89%)', 
                            opacity: isChildActive ? 1 : 0.6 
                          }} 
                        />
                      )}
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: isChildActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8) }}>
                        {item.label}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pl: 2, mt: 0.5 }}>
                    <Stack spacing={0.5}>
                      {item.subItems.map(subItem => {
                        const isSubActive = activeSection === subItem.id;
                        return (
                          <Button
                            key={subItem.id}
                            onClick={() => {
                              setActiveSection(subItem.id);
                              setSidebarOpen(false);
                            }}
                            sx={{
                              justifyContent: 'flex-start',
                              px: 1.5,
                              py: 0.8,
                              borderRadius: DASHBOARD_TOKENS.radius.md,
                              textTransform: 'none',
                              fontWeight: isSubActive ? 700 : 500,
                              fontSize: '0.85rem',
                              color: isSubActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.7),
                              backgroundColor: isSubActive ? alpha(DASHBOARD_TOKENS.primary, 0.08) : 'transparent',
                              '&:hover': {
                                backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.05),
                              },
                            }}
                          >
                            {subItem.label}
                          </Button>
                        )
                      })}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            }

            return (
              <Button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  textTransform: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                  color: isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8),
                  backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.12) : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  {item.icon && (
                    <img 
                      src={item.icon} 
                      alt="" 
                      style={{ 
                        width: 18, 
                        height: 18, 
                        filter: isActive 
                          ? 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)' 
                          : 'invert(15%) sepia(10%) saturate(704%) hue-rotate(201deg) brightness(94%) contrast(89%)', 
                        opacity: isActive ? 1 : 0.6 
                      }} 
                    />
                  )}
                  <span>{item.label}</span>
                </Stack>
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );

  if (isMdUp) {
    return (
      <Box sx={{ width: 280, borderRight: `1px solid ${DASHBOARD_TOKENS.border}`, backgroundColor: '#fff', position: 'sticky', top: 72, alignSelf: 'flex-start', height: 'calc(100vh - 72px)' }}>
        {sidebarContent}
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      slotProps={{ paper: { sx: { width: 280 } } }}
    >
      {sidebarContent}
    </Drawer>
  );
}
