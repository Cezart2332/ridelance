import { Box, Button, Drawer, Stack, Typography, useMediaQuery, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ElectricCarRoundedIcon from '@mui/icons-material/ElectricCarRounded';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

type NavItem = {
  id: string;
  label: string;
  icon?: string;
  subItems?: readonly { id: string; label: string }[];
};

interface AppSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  sectionConfig: readonly NavItem[];
  bottomSectionConfig?: readonly NavItem[];
  onLogout?: () => void;
}

function MuiNavIcon({ iconName, isActive }: { iconName: string; isActive: boolean }) {
  const color = isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.5);
  const sx = { fontSize: 18, color };
  switch (iconName) {
    case 'DirectionsCarFilledRounded':
      return <DirectionsCarFilledRoundedIcon sx={sx} />;
    case 'WorkspacePremiumRounded':
      return <WorkspacePremiumRoundedIcon sx={sx} />;
    case 'ShoppingCartRounded':
      return <ShoppingCartRoundedIcon sx={sx} />;
    case 'ReceiptLongRounded':
      return <ReceiptLongRoundedIcon sx={sx} />;
    case 'ElectricCarRounded':
      return <ElectricCarRoundedIcon sx={sx} />;
    default:
      return null;
  }
}

function NavItems({
  items,
  activeSection,
  setActiveSection,
  setSidebarOpen,
}: {
  items: readonly NavItem[];
  activeSection: string;
  setActiveSection: (id: string) => void;
  setSidebarOpen: (arg: boolean) => void;
}) {
  return (
    <>
      {items.map((item) => {
        const isActive = activeSection === item.id;
        const displayLabel =
          item.label === 'Cheltuieli & Documentatie recurenta'
            ? 'Cheltuieli & documente'
            : item.label;

        if (item.subItems?.length) {
          const isChildActive = item.subItems.some((sub) => activeSection === sub.id);

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
                  py: 0.8,
                  borderRadius: DASHBOARD_TOKENS.radius.md,
                  border: `1px solid ${isChildActive ? alpha(DASHBOARD_TOKENS.primary, 0.25) : 'transparent'}`,
                  backgroundColor: isChildActive ? alpha(DASHBOARD_TOKENS.primary, 0.08) : 'transparent',
                  '& .MuiAccordionSummary-content': { m: 0 },
                  '&.Mui-expanded': { minHeight: 'auto' },
                  '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.04) },
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%', minWidth: 0 }}>
                  {item.icon &&
                    (item.icon.startsWith('MUI:') ? (
                      <Box sx={{ width: 20, height: 20, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                        <MuiNavIcon iconName={item.icon.split(':')[1]} isActive={isChildActive} />
                      </Box>
                    ) : (
                      <img
                        src={item.icon}
                        alt=""
                        style={{
                          width: 18,
                          height: 18,
                          flexShrink: 0,
                          filter: isChildActive
                            ? 'invert(62%) sepia(49%) saturate(512%) hue-rotate(155deg) brightness(96%) contrast(92%)'
                            : 'invert(15%) sepia(10%) saturate(704%) hue-rotate(201deg) brightness(94%) contrast(89%)',
                          opacity: isChildActive ? 1 : 0.55,
                        }}
                      />
                    ))}
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      minWidth: 0,
                      color: isChildActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8),
                    }}
                  >
                    {displayLabel}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, pl: 2.2, mt: 0.6 }}>
                <Stack spacing={0.5}>
                  {item.subItems.map((subItem) => {
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
                          py: 0.62,
                          borderRadius: DASHBOARD_TOKENS.radius.md,
                          textTransform: 'none',
                          fontWeight: isSubActive ? 700 : 500,
                          fontSize: '0.85rem',
                          width: '100%',
                          color: isSubActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.7),
                          border: `1px solid ${isSubActive ? alpha(DASHBOARD_TOKENS.primary, 0.2) : 'transparent'}`,
                          backgroundColor: isSubActive ? alpha(DASHBOARD_TOKENS.primary, 0.08) : 'transparent',
                          '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
                        }}
                      >
                        {subItem.label}
                      </Button>
                    );
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
              py: 0.72,
              width: '100%',
              minHeight: 38,
              borderRadius: DASHBOARD_TOKENS.radius.md,
              textTransform: 'none',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              color: isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8),
              border: `1px solid ${isActive ? alpha(DASHBOARD_TOKENS.primary, 0.25) : 'transparent'}`,
              backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.12) : 'transparent',
              '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.08) },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%', minWidth: 0 }}>
              {item.icon &&
                (item.icon.startsWith('MUI:') ? (
                  <Box sx={{ width: 20, height: 20, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    <MuiNavIcon iconName={item.icon.split(':')[1]} isActive={isActive} />
                  </Box>
                ) : (
                  <img
                    src={item.icon}
                    alt=""
                    style={{
                        width: 18,
                        height: 18,
                        flexShrink: 0,
                        filter: isActive
                        ? 'invert(62%) sepia(49%) saturate(512%) hue-rotate(155deg) brightness(96%) contrast(92%)'
                        : 'invert(15%) sepia(10%) saturate(704%) hue-rotate(201deg) brightness(94%) contrast(89%)',
                        opacity: isActive ? 1 : 0.55,
                    }}
                  />
                ))}
              <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayLabel}
              </Box>
            </Stack>
          </Button>
        );
      })}
    </>
  );
}

export default function AppSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeSection,
  setActiveSection,
  sectionConfig,
  bottomSectionConfig = [],
  onLogout,
}: AppSidebarProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const sidebarContent = (
    <Stack
      sx={{
        height: '100%',
        px: 2,
        py: 1.5,
        backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.96),
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          mt: 0.4,
          px: 1,
          py: 1.2,
          borderBottom: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.06)}`,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: DASHBOARD_TOKENS.ink, fontWeight: 900, fontSize: '1rem' }}>
          Ridelance Dashboard
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          mt: 1.45,
          overflowY: 'hidden',
          overflowX: 'hidden',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.12),
            borderRadius: DASHBOARD_TOKENS.radius.full,
          },
        }}
      >
        <Typography
          sx={{
            px: 1.3,
            mb: 0.75,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: DASHBOARD_TOKENS.textSubtle,
            textTransform: 'uppercase',
            letterSpacing: 0.9,
          }}
        >
          Meniu Principal
        </Typography>
        <Stack spacing={0.35}>
          <NavItems
            items={sectionConfig}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            setSidebarOpen={setSidebarOpen}
          />
        </Stack>

        {bottomSectionConfig.length > 0 && (
          <Box sx={{ mt: 1.45, pt: 1.35, borderTop: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.06)}` }}>
            <Typography
              sx={{
                px: 1.3,
                mb: 0.75,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: DASHBOARD_TOKENS.textSubtle,
                textTransform: 'uppercase',
                letterSpacing: 0.9,
              }}
            >
              Servicii & Plăți
            </Typography>
            <Stack spacing={0.35}>
              <NavItems
                items={bottomSectionConfig}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                setSidebarOpen={setSidebarOpen}
              />
            </Stack>
          </Box>
        )}
      </Box>

      <Divider sx={{ opacity: 0.5, mx: 1, mt: 1.2, flexShrink: 0 }} />

      <Button
        onClick={onLogout}
        startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{
          justifyContent: 'flex-start',
          mx: 1,
          mb: 0.5,
          mt: 0.6,
          flexShrink: 0,
          px: 1.5,
          py: 0.75,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#f43f5e',
          '&:hover': { backgroundColor: alpha('#f43f5e', 0.06) },
        }}
      >
        Deconectare
      </Button>
    </Stack>
  );

  if (isMdUp) {
    return (
      <Box
        sx={{
          width: 284,
          borderRight: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.96),
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100vh',
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      slotProps={{ paper: { sx: { width: 284, backgroundColor: alpha(DASHBOARD_TOKENS.paper, 0.96) } } }}
    >
      {sidebarContent}
    </Drawer>
  );
}
