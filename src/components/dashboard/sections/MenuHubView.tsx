import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Avatar, Box, Button, CircularProgress, Divider, Paper, Stack, Typography, alpha } from '@mui/material';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';

import { userService, type UserProfile } from '../../../services/user.service';
import { DASHBOARD_TOKENS } from '../dashboardTheme';
import { displayName, initials as accountInitials } from '../../../utils/displayName';

interface MenuHubViewProps {
  onNavigate: (sectionId: string) => void;
  onLogout: () => void;
}

interface MenuEntry {
  id: string;
  label: string;
  sub: string;
  icon: ReactNode;
}

/**
 * Grouped like a phone settings screen: a few short lists instead of one long one,
 * with a single accent colour so the eye follows the labels, not the icons.
 */
const MENU_GROUPS: { title: string; items: MenuEntry[] }[] = [
  {
    title: 'Activitatea mea',
    items: [
      { id: 'banca', label: 'Banca', sub: 'Cont conectat și tranzacții', icon: <AccountBalanceRoundedIcon /> },
      { id: 'expenses', label: 'Cheltuieli', sub: 'Ce poți deduce din taxe', icon: <AccountBalanceWalletRoundedIcon /> },
    ],
  },
  {
    title: 'Documente',
    items: [
      { id: 'documents', label: 'Documentele mele', sub: 'Acte, contracte și fișiere', icon: <FolderRoundedIcon /> },
      { id: 'doc_recurring', label: 'Documentație recurentă', sub: 'Ce trebuie încărcat lunar', icon: <FolderSpecialRoundedIcon /> },
    ],
  },
  {
    title: 'Contul meu',
    items: [
      { id: 'abonamente', label: 'Abonament', sub: 'Planul tău și schimbarea lui', icon: <WorkspacePremiumRoundedIcon /> },
      { id: 'istoric_plati', label: 'Istoric plăți', sub: 'Chitanțe și facturi', icon: <ReceiptLongRoundedIcon /> },
    ],
  },
  {
    title: 'Altele',
    items: [
      { id: 'servicii', label: 'Servicii', sub: 'Cumperi separat, fără abonament', icon: <ShoppingCartRoundedIcon /> },
      { id: 'cars', label: 'Mașini', sub: 'Mașini de închiriat', icon: <DirectionsCarFilledRoundedIcon /> },
      { id: 'asigurari', label: 'Asigurări', sub: 'Oferte prin asigurari.ro', icon: <ShieldRoundedIcon /> },
    ],
  },
];

function MenuRow({ entry, first, onClick }: { entry: MenuEntry; first: boolean; onClick: () => void }) {
  return (
    <>
      {!first && <Divider sx={{ borderColor: DASHBOARD_TOKENS.border, ml: 8.4 }} />}
      <Stack
        direction="row"
        spacing={2}
        onClick={onClick}
        sx={{
          alignItems: 'center',
          px: 2.2,
          py: 1.8,
          minHeight: 64,
          cursor: 'pointer',
          transition: 'background-color 160ms ease',
          '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
          '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.09) },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: DASHBOARD_TOKENS.radius.md,
            display: 'grid',
            placeItems: 'center',
            color: DASHBOARD_TOKENS.primaryStrong,
            bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.14),
            '& svg': { fontSize: 21 },
          }}
        >
          {entry.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 750, fontSize: '0.95rem', color: DASHBOARD_TOKENS.ink }}>
            {entry.label}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.79rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.15 }}>
            {entry.sub}
          </Typography>
        </Box>
        <ChevronRightRoundedIcon sx={{ color: DASHBOARD_TOKENS.textSubtle, flexShrink: 0 }} />
      </Stack>
    </>
  );
}

export function MenuHubView({ onNavigate, onLogout }: MenuHubViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getProfile()
      .then(setProfile)
      .catch((err) => console.error('Failed to load profile in Menu Hub', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 220 }}>
        <CircularProgress size={28} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    );
  }

  // Contul poate exista fără nume (RL-05) — helperul decide ce se afișează în locul lui.
  const initials = accountInitials(profile);
  const fullName = displayName(profile);

  return (
    <Stack spacing={3} sx={{ maxWidth: 620, mx: 'auto', width: '100%' }}>
      {/* ── Account ── */}
      <Paper
        elevation={0}
        onClick={() => onNavigate('profile')}
        sx={{
          p: 2.6,
          borderRadius: DASHBOARD_TOKENS.radius.xl,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          bgcolor: DASHBOARD_TOKENS.paper,
          cursor: 'pointer',
          transition: 'background-color 160ms ease',
          '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05) },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 54,
              height: 54,
              bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.18),
              color: DASHBOARD_TOKENS.ink,
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 800, fontSize: '1.08rem', color: DASHBOARD_TOKENS.ink, lineHeight: 1.25 }}>
              {fullName}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.2 }}>
              {profile?.email}
            </Typography>
          </Box>
          <ChevronRightRoundedIcon sx={{ color: DASHBOARD_TOKENS.textSubtle }} />
        </Stack>
      </Paper>

      {/* ── Grouped lists ── */}
      {MENU_GROUPS.map((group) => (
        <Box key={group.title}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: DASHBOARD_TOKENS.textSubtle,
              textTransform: 'uppercase',
              letterSpacing: 0.9,
              mb: 1.2,
              px: 0.6,
            }}
          >
            {group.title}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: DASHBOARD_TOKENS.radius.xl,
              border: `1px solid ${DASHBOARD_TOKENS.border}`,
              boxShadow: DASHBOARD_TOKENS.shadow.sm,
              bgcolor: DASHBOARD_TOKENS.paper,
              overflow: 'hidden',
            }}
          >
            {group.items.map((entry, index) => (
              <MenuRow
                key={entry.id}
                entry={entry}
                first={index === 0}
                onClick={() => onNavigate(entry.id)}
              />
            ))}
          </Paper>
        </Box>
      ))}

      <Button
        fullWidth
        variant="text"
        onClick={onLogout}
        startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{
          py: 1.6,
          fontWeight: 750,
          textTransform: 'none',
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          color: DASHBOARD_TOKENS.stateError,
          bgcolor: alpha(DASHBOARD_TOKENS.stateError, 0.05),
          '&:hover': { bgcolor: alpha(DASHBOARD_TOKENS.stateError, 0.1) },
        }}
      >
        Deconectare
      </Button>
    </Stack>
  );
}
