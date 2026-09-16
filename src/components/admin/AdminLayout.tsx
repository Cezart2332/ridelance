import { useState, type ReactNode } from 'react'
import { AppBar, Avatar, Box, Breadcrumbs, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography } from '@mui/material'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { NotificationsBell } from '../notifications/NotificationsBell'
import logo from '../../assets/logo.svg'

export interface AdminNavItem {
  id: string
  label: string
  group: string
  icon: ReactNode
}

/** Admin chrome is scoped here; client and accountant workspaces keep their own layout. */
export function AdminLayout({ children, navItems, activeId, onNavClick, onLogout, userName }: {
  children: ReactNode
  navItems: AdminNavItem[]
  activeId: string
  onNavClick: (id: string) => void
  onLogout: () => void
  userName: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const active = navItems.find((item) => item.id === activeId)
  const groups = [...new Set(navItems.map((item) => item.group))]
  const navigation = (mobile: boolean) => (
    <Stack sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Stack direction="row" sx={{ px: 3, py: 2.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="img" src={logo} alt="RIDElance" sx={{ width: 150 }} />
        {mobile && <IconButton aria-label="Închide meniul" onClick={() => setMobileOpen(false)}><CloseRoundedIcon /></IconButton>}
      </Stack>
      <Box sx={{ mx: 2.5, px: 1.5, py: 1, mb: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle2">Spațiu de administrare</Typography>
        <Typography variant="caption" color="text.secondary">Echipa RIDElance</Typography>
      </Box>
      <Box component="nav" aria-label="Navigare admin" sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {groups.map((group) => (
          <Box component="section" key={group} sx={{ mt: 1.5 }}>
            <Typography component="h2" variant="caption" sx={{ px: 1.75, mb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 600 }}>{group}</Typography>
            <List disablePadding>
              {navItems.filter((item) => item.group === group).map((item) => (
                <ListItemButton key={item.id} selected={activeId === item.id} aria-current={activeId === item.id ? 'page' : undefined}
                  onClick={() => { onNavClick(item.id); setMobileOpen(false) }}
                  sx={{ borderRadius: 2, px: 1.75, py: 0.5, minHeight: 36, mb: 0.25, color: activeId === item.id ? 'text.primary' : 'text.secondary', '&.Mui-selected': { bgcolor: 'primary.light', boxShadow: 'inset 3px 0 0 var(--admin-accent)' } }}>
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit', '& svg': { fontSize: 19 } }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: activeId === item.id ? 650 : 500 } } }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
      <Divider />
      <Stack direction="row" sx={{ p: 2.5, gap: 1.25, alignItems: 'center' }}>
        <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: 'grey.100', color: 'text.primary', fontSize: 14 }}>{userName.charAt(0)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="subtitle2" noWrap>{userName}</Typography><Typography variant="caption" color="text.secondary">Administrator</Typography></Box>
        <IconButton onClick={onLogout} aria-label="Deconectare" size="small"><LogoutRoundedIcon fontSize="small" /></IconButton>
      </Stack>
    </Stack>
  )
  return (
    <Box sx={{ '--admin-accent': (theme) => theme.palette.primary.main, minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Button component="a" href="#admin-content" sx={{ position: 'fixed', left: 280, top: -100, zIndex: 1500, bgcolor: 'background.paper', '&:focus': { top: 8 }, '@media (max-width: 899px)': { left: 16 } }}>Sari la conținut</Button>
      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'fixed', inset: '0 auto 0 0', width: 256, borderRight: 1, borderColor: 'divider', zIndex: (theme) => theme.zIndex.appBar + 1 }}>{navigation(false)}</Box>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }} slotProps={{ paper: { sx: { width: 280, maxWidth: '90vw', borderRadius: 0 } } }}>{navigation(true)}</Drawer>
      <Box sx={{ ml: { md: '256px' }, minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', border: 0, borderBottom: 1, borderColor: 'divider', borderRadius: 0 }}>
          <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 4 }, minHeight: 64 }}>
            <IconButton aria-label="Deschide meniul" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}><MenuRoundedIcon /></IconButton>
            <Breadcrumbs sx={{ flex: 1, minWidth: 0, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' }, '& .MuiBreadcrumbs-separator': { display: { xs: 'none', sm: 'flex' } } }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{active?.group}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{active?.label}</Typography>
            </Breadcrumbs>
            <NotificationsBell />
          </Toolbar>
        </AppBar>
        <Box component="main" id="admin-content" tabIndex={-1} sx={{ maxWidth: 1480, mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 2.5, md: 4 }, pb: 6, minWidth: 0, outline: 'none' }}>{children}</Box>
      </Box>
    </Box>
  )
}
