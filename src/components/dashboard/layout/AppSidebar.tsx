import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Button, Collapse, Divider, Drawer, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import { DASHBOARD_TOKENS } from '../dashboardTheme';
import {
  findActiveGroupId,
  findActiveLeaf,
  type DashboardNavConfig,
  type NavEntry,
  type NavLeaf,
} from '../../../config/dashboardNav';
import logo from '../../../assets/logo.svg';

interface AppSidebarProps {
  /** Meniul de randat. Sidebar-ul nu cunoaște niciun dashboard anume. */
  nav: DashboardNavConfig;
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  onLogout?: () => void;
  /**
   * Bloc opțional deasupra butonului de deconectare — identitatea contului.
   * PFA-ul nu îl folosește; SRL-ul pune acolo firma (spec §2.1).
   */
  footer?: ReactNode;
}

/** Sursa unică pentru culoarea iconițelor de navigație. */
const navIconColor = (isActive: boolean) =>
  isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.55);

function readStoredOpenGroups(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    // localStorage indisponibil (mod privat, cotă plină) — meniul funcționează și fără memorie.
    return [];
  }
}

function persistOpenGroups(storageKey: string, ids: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    /* pierderea preferinței de expand nu merită să rupă navigarea */
  }
}

function ComingSoonBadge() {
  return (
    <Box
      component="span"
      sx={{
        ml: 'auto',
        flexShrink: 0,
        px: 0.7,
        py: 0.15,
        borderRadius: DASHBOARD_TOKENS.radius.full,
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: 0.2,
        color: DASHBOARD_TOKENS.textMuted,
        backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.06),
      }}
    >
      În curând
    </Box>
  );
}

const focusRingSx = {
  '&:focus-visible': {
    outline: `2px solid ${DASHBOARD_TOKENS.primaryStrong}`,
    outlineOffset: 2,
  },
};

function SubPageLink({
  leaf,
  isActive,
  onNavigate,
}: {
  leaf: NavLeaf;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Button
        component={RouterLink}
        to={leaf.path}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        sx={{
          justifyContent: 'flex-start',
          px: 1.5,
          py: 0.62,
          width: '100%',
          borderRadius: DASHBOARD_TOKENS.radius.md,
          textTransform: 'none',
          fontWeight: isActive ? 700 : 500,
          fontSize: '0.85rem',
          textAlign: 'left',
          color: isActive ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.7),
          border: `1px solid ${isActive ? alpha(DASHBOARD_TOKENS.primary, 0.2) : 'transparent'}`,
          backgroundColor: isActive ? alpha(DASHBOARD_TOKENS.primary, 0.08) : 'transparent',
          '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
          ...focusRingSx,
        }}
      >
        <Box
          component="span"
          sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {leaf.label}
        </Box>
        {leaf.badge === 'coming-soon' && <ComingSoonBadge />}
      </Button>
    </Box>
  );
}

function TopLevelLink({
  entry,
  isActive,
  onNavigate,
}: {
  entry: Extract<NavEntry, { kind: 'link' }>;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = entry.icon;

  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Button
        component={RouterLink}
        to={entry.path}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
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
          ...focusRingSx,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%', minWidth: 0 }}>
          <Icon sx={{ fontSize: 18, flexShrink: 0, color: navIconColor(isActive) }} />
          <Box
            component="span"
            sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {entry.label}
          </Box>
        </Stack>
      </Button>
    </Box>
  );
}

function NavGroup({
  entry,
  isExpanded,
  containsActiveRoute,
  activeLeafPath,
  onToggle,
  onNavigate,
  reduceMotion,
}: {
  entry: Extract<NavEntry, { kind: 'group' }>;
  isExpanded: boolean;
  containsActiveRoute: boolean;
  activeLeafPath?: string;
  onToggle: () => void;
  onNavigate: () => void;
  reduceMotion: boolean;
}) {
  const Icon = entry.icon;
  const listId = `nav-group-${entry.id}`;

  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <Button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={listId}
        sx={{
          justifyContent: 'flex-start',
          px: 1.5,
          py: 0.8,
          width: '100%',
          minHeight: 38,
          borderRadius: DASHBOARD_TOKENS.radius.md,
          textTransform: 'none',
          // Categoria care conține ruta curentă rămâne marcată și când e colapsată.
          border: `1px solid ${containsActiveRoute ? alpha(DASHBOARD_TOKENS.primary, 0.25) : 'transparent'}`,
          backgroundColor: containsActiveRoute ? alpha(DASHBOARD_TOKENS.primary, 0.08) : 'transparent',
          '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.04) },
          ...focusRingSx,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%', minWidth: 0 }}>
          <Icon sx={{ fontSize: 18, flexShrink: 0, color: navIconColor(containsActiveRoute) }} />
          <Typography
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              minWidth: 0,
              flex: 1,
              textAlign: 'left',
              color: containsActiveRoute ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.8),
            }}
          >
            {entry.label}
          </Typography>
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 18,
              flexShrink: 0,
              color: alpha(DASHBOARD_TOKENS.ink, 0.6),
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 180ms ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          />
        </Stack>
      </Button>

      <Collapse in={isExpanded} timeout={reduceMotion ? 0 : 'auto'} unmountOnExit>
        <Stack component="ul" id={listId} spacing={0.5} sx={{ p: 0, pl: 2.2, m: 0, mt: 0.6 }}>
          {entry.children.map((child) => (
            <SubPageLink
              key={child.id}
              leaf={child}
              isActive={activeLeafPath === child.path}
              onNavigate={onNavigate}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function AppSidebar({ nav, sidebarOpen, setSidebarOpen, onLogout, footer }: AppSidebarProps) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { pathname } = useLocation();

  const activeGroupId = useMemo(() => findActiveGroupId(nav, pathname), [nav, pathname]);
  const activeLeafPath = useMemo(() => findActiveLeaf(nav, pathname)?.path, [nav, pathname]);
  const [openGroups, setOpenGroups] = useState<string[]>(() => readStoredOpenGroups(nav.storageKey));

  useEffect(() => {
    persistOpenGroups(nav.storageKey, openGroups);
  }, [nav.storageKey, openGroups]);

  /**
   * Categoriile închise manual **cât timp** ele conțin ruta curentă.
   *
   * Categoria activă se deschide singură — altfel ai ateriza pe o pagină al cărei item nu se
   * vede. Dar închiderea ei trebuie să funcționeze: până acum regula bătea preferința, iar
   * click-ul pe antetul categoriei active nu făcea nimic vizibil, ceea ce se citește ca buton
   * stricat.
   *
   * `key` e categoria activă la momentul închiderii. Când navighezi în altă categorie, cheia nu
   * mai corespunde și lista se golește de la sine, fără efect de sincronizare: preferința e
   * despre ecranul pe care ești, nu una permanentă.
   */
  const [collapsed, setCollapsed] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] });
  const activeKey = activeGroupId ?? '';
  const collapsedIds = collapsed.key === activeKey ? collapsed.ids : [];

  const isGroupExpanded = useCallback(
    (id: string) => {
      if (collapsedIds.includes(id)) return false;
      return id === activeGroupId || openGroups.includes(id);
    },
    [activeGroupId, collapsedIds, openGroups],
  );

  const toggleGroup = useCallback(
    (id: string) => {
      // Categoria activă are propriul mecanism: `openGroups` n-o poate închide, fiindcă e
      // deschisă prin apartenența la rută, nu prin preferință.
      if (id === activeGroupId) {
        setCollapsed((prev) => {
          const ids = prev.key === activeKey ? prev.ids : [];
          return {
            key: activeKey,
            ids: ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
          };
        });
        return;
      }

      setOpenGroups((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    },
    [activeGroupId, activeKey],
  );

  // Pe mobil, alegerea unei subpagini închide sertarul; pe desktop nu există sertar de închis.
  const closeDrawer = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);

  const navHeadingId = `${nav.ownerType.toLowerCase()}-nav-heading`;

  const sidebarContent = (
    <Stack
      sx={{
        height: '100%',
        px: 2,
        py: 1.5,
        backgroundColor: DASHBOARD_TOKENS.paper,
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
        <Box component="img" src={logo} alt="RIDElance" sx={{ height: 38, width: 'auto', display: 'block' }} />
      </Box>

      <Box
        component="nav"
        aria-label="Meniu principal"
        sx={{
          flex: 1,
          minHeight: 0,
          mt: 1.45,
          overflowY: 'auto',
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
          id={navHeadingId}
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
          {nav.menuLabel}
        </Typography>

        <Stack component="ul" aria-labelledby={navHeadingId} spacing={0.35} sx={{ p: 0, m: 0 }}>
          {nav.entries.map((entry) => {
            if (entry.kind === 'separator') {
              return (
                <Box component="li" key={entry.id} sx={{ listStyle: 'none' }}>
                  <Divider sx={{ my: 1.2, opacity: 0.6 }} />
                </Box>
              );
            }

            // Deconectarea stă în subsolul fix, nu în lista de navigare.
            if (entry.kind === 'action') return null;

            if (entry.kind === 'group') {
              return (
                <NavGroup
                  key={entry.id}
                  entry={entry}
                  isExpanded={isGroupExpanded(entry.id)}
                  containsActiveRoute={activeGroupId === entry.id}
                  activeLeafPath={activeLeafPath}
                  onToggle={() => toggleGroup(entry.id)}
                  onNavigate={closeDrawer}
                  reduceMotion={reduceMotion}
                />
              );
            }

            return (
              <TopLevelLink
                key={entry.id}
                entry={entry}
                isActive={activeLeafPath === entry.path}
                onNavigate={closeDrawer}
              />
            );
          })}
        </Stack>
      </Box>

      <Divider sx={{ opacity: 0.5, mx: 1, mt: 1.2, flexShrink: 0 }} />

      {nav.bottomEntries && nav.bottomEntries.length > 0 && (
        // Landmark propriu: Setările sunt tot navigație, doar că nu stau în lista principală.
        <Stack
          component="nav"
          aria-label="Meniu secundar"
          sx={{ mx: 1, mt: 0.6, flexShrink: 0 }}
        >
        <Stack component="ul" spacing={0.35} sx={{ p: 0, m: 0 }}>
          {nav.bottomEntries.map((entry) =>
            entry.kind === 'link' ? (
              <TopLevelLink
                key={entry.id}
                entry={entry}
                isActive={activeLeafPath === entry.path}
                onNavigate={closeDrawer}
              />
            ) : null,
          )}
        </Stack>
        </Stack>
      )}

      {footer && (
        <Box sx={{ mx: 1, mt: 1, flexShrink: 0 }}>{footer}</Box>
      )}

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
          color: DASHBOARD_TOKENS.stateError,
          '&:hover': { backgroundColor: alpha(DASHBOARD_TOKENS.stateError, 0.06) },
          '&:focus-visible': { outline: `2px solid ${DASHBOARD_TOKENS.stateError}`, outlineOffset: 2 },
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
          flexShrink: 0,
          borderRight: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
          backgroundColor: DASHBOARD_TOKENS.paper,
          height: '100%',
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
      onClose={closeDrawer}
      slotProps={{ paper: { sx: { width: 284, backgroundColor: DASHBOARD_TOKENS.paper } } }}
    >
      {sidebarContent}
    </Drawer>
  );
}
