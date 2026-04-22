import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Drawer, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  sectionConfig: readonly { id: string; label: string }[];
}

export default function AppSidebar({ sidebarOpen, setSidebarOpen, activeSection, setActiveSection, sectionConfig }: AppSidebarProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const recurringSectionIds = ['expenses', 'recurring-docs'];
  const regularSections = sectionConfig.filter((item) => !recurringSectionIds.includes(item.id));
  const recurringSections = sectionConfig.filter((item) => recurringSectionIds.includes(item.id));
  const recurringExpanded = recurringSectionIds.includes(activeSection);

  const sidebarContent = (
    <Stack sx={{ height: '100%', p: 2, backgroundColor: '#fff' }} spacing={2}>
      <Box sx={{ mt: 2 }}>
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: '1rem' }}>
          Ridelance Dashboard(Demo)
        </Typography>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography sx={{ px: 1.3, mb: 1, fontSize: '0.75rem', fontWeight: 600, color: DASHBOARD_TOKENS.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Meniu Principal
        </Typography>
        <Stack spacing={0.8}>
          {regularSections.map((item) => {
            const isActive = activeSection === item.id;
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
                {item.label}
              </Button>
            );
          })}

          <Accordion
            elevation={0}
            expanded={recurringExpanded}
            disableGutters
            sx={{
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              backgroundColor: recurringExpanded ? alpha(DASHBOARD_TOKENS.primary, 0.05) : 'transparent',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon sx={{ color: DASHBOARD_TOKENS.textMuted }} />}
              onClick={() => {
                if (!recurringExpanded) {
                  setActiveSection('expenses');
                  setSidebarOpen(false);
                }
              }}
              sx={{ px: 1.5, minHeight: 44, '& .MuiAccordionSummary-content': { my: 0.7 } }}
            >
              <Typography
                sx={{
                  fontWeight: recurringExpanded ? 700 : 600,
                  color: recurringExpanded ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8),
                  fontSize: '0.88rem',
                }}
              >
                • Cheltuilei & Documentatie recurenta
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.2, pb: 1, px: 1 }}>
              <Stack spacing={0.6}>
                {recurringSections.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setSidebarOpen(false);
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 1.3,
                        py: 0.8,
                        borderRadius: DASHBOARD_TOKENS.radius.md,
                        textTransform: 'none',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.86rem',
                        color: isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.78),
                        backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.12) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08),
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
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
