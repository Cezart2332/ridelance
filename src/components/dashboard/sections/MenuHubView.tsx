import { useState, useEffect } from 'react';
import { Box, Paper, Stack, Typography, Grid, Button, CircularProgress, Avatar, alpha } from '@mui/material';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FolderSpecialRoundedIcon from '@mui/icons-material/FolderSpecialRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ElectricCarRoundedIcon from '@mui/icons-material/ElectricCarRounded';

import { userService, type UserProfile } from '../../../services/user.service';
import { DASHBOARD_TOKENS } from '../dashboardTheme';

interface MenuHubViewProps {
  onNavigate: (sectionId: string) => void;
  onLogout: () => void;
}

export function MenuHubView({ onNavigate, onLogout }: MenuHubViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error('Failed to load profile in Menu Hub', err))
      .finally(() => setLoading(false));
  }, []);

  const menuItems = [
    { id: 'documents', label: 'Documente', sub: 'Declarații, contracte & fișiere', icon: <FolderRoundedIcon />, color: '#3b82f6', bg: alpha('#3b82f6', 0.1) },
    { id: 'expenses', label: 'Cheltuieli', sub: 'Managementul cheltuielilor', icon: <AccountBalanceWalletRoundedIcon />, color: '#ef4444', bg: alpha('#ef4444', 0.1) },
    { id: 'bolt_integration', label: 'Integrare Bolt', sub: 'Sincronizare curse & facturare', icon: <ElectricCarRoundedIcon />, color: '#10b981', bg: alpha('#10b981', 0.1) },
    { id: 'doc_recurring', label: 'Documente Recurente', sub: 'Declarații & facturi recurente', icon: <FolderSpecialRoundedIcon />, color: '#f59e0b', bg: alpha('#f59e0b', 0.1) },
    { id: 'cars', label: 'Mașini', sub: 'Managementul vehiculelor', icon: <DirectionsCarFilledRoundedIcon />, color: '#8b5cf6', bg: alpha('#8b5cf6', 0.1) },
    { id: 'abonamente', label: 'Abonamente', sub: 'Pachete active & prețuri', icon: <WorkspacePremiumRoundedIcon />, color: '#d97706', bg: alpha('#d97706', 0.1) },
    { id: 'servicii', label: 'Servicii', icon: <ShoppingCartRoundedIcon />, sub: 'Magazin & comenzi', color: '#ec4899', bg: alpha('#ec4899', 0.1) },
    { id: 'istoric_plati', label: 'Istoric Plăți', sub: 'Chitanțe & tranzacții', icon: <ReceiptLongRoundedIcon />, color: '#06b6d4', bg: alpha('#06b6d4', 0.1) },
  ];

  if (loading) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <CircularProgress size={30} sx={{ color: DASHBOARD_TOKENS.primary }} />
      </Stack>
    );
  }

  const initials = profile ? `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase() : 'U';
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'Utilizator Ridelance';

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Profile Card summary */}
      <Paper
        elevation={0}
        onClick={() => onNavigate('profile')}
        sx={{
          p: 2.5,
          borderRadius: DASHBOARD_TOKENS.radius.lg,
          border: `1px solid ${DASHBOARD_TOKENS.border}`,
          boxShadow: DASHBOARD_TOKENS.shadow.sm,
          bgcolor: DASHBOARD_TOKENS.paper,
          mb: 3,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05), transform: 'scale(0.99)' }
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: DASHBOARD_TOKENS.primary,
              color: DASHBOARD_TOKENS.ink,
              fontWeight: 800,
              fontSize: '1.25rem',
              border: `2px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: DASHBOARD_TOKENS.ink, lineHeight: 1.2 }}>
              {fullName}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.3 }}>
              {profile?.email}
            </Typography>
            {profile?.phoneNumber && (
              <Typography sx={{ fontSize: '0.78rem', color: DASHBOARD_TOKENS.textSubtle, mt: 0.1 }}>
                {profile.phoneNumber}
              </Typography>
            )}
          </Box>
          <KeyboardArrowRightRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.3) }} />
        </Stack>
      </Paper>

      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: DASHBOARD_TOKENS.textSubtle,
          textTransform: 'uppercase',
          letterSpacing: 0.9,
          mb: 1.5,
          px: 0.5
        }}
      >
        Servicii & Setări
      </Typography>

      {/* Grid of options */}
      <Grid container spacing={1.5} sx={{ mb: 4 }}>
        {menuItems.map((item) => (
          <Grid size={12} key={item.id}>
            <Paper
              elevation={0}
              onClick={() => onNavigate(item.id)}
              sx={{
                p: 2,
                borderRadius: DASHBOARD_TOKENS.radius.md,
                border: `1px solid ${DASHBOARD_TOKENS.border}`,
                bgcolor: DASHBOARD_TOKENS.paper,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:active': { bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.04), transform: 'scale(0.99)' }
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: DASHBOARD_TOKENS.radius.md,
                    color: item.color,
                    bgcolor: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: DASHBOARD_TOKENS.ink }}>
                    {item.label}
                  </Typography>
                  {item.sub && (
                    <Typography sx={{ fontSize: '0.76rem', color: DASHBOARD_TOKENS.textMuted, mt: 0.1 }}>
                      {item.sub}
                    </Typography>
                  )}
                </Box>
                <KeyboardArrowRightRoundedIcon sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.25), fontSize: 20 }} />
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Logout button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={onLogout}
        startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
        sx={{
          py: 1.5,
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: DASHBOARD_TOKENS.radius.md,
          borderColor: alpha('#f43f5e', 0.2),
          color: '#f43f5e',
          bgcolor: 'transparent',
          '&:hover': {
            borderColor: '#f43f5e',
            bgcolor: alpha('#f43f5e', 0.04)
          },
          '&:active': {
            transform: 'scale(0.98)',
            bgcolor: alpha('#f43f5e', 0.08)
          }
        }}
      >
        Deconectare cont
      </Button>
    </Box>
  );
}
