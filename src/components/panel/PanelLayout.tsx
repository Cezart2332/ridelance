import { useState, type ReactNode } from 'react'
import { Avatar, Box, ButtonBase, Drawer, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'

import logoOnDark from '../../assets/logo-on-dark.svg'
import logo from '../../assets/logo.svg'
import { NotificationsBell } from '../notifications/NotificationsBell'
import { usePanelTheme } from './panelThemeContext'
import { TrailContext } from './panelTrail'

export interface PanelNavItem {
  id: string
  label: string
  group: string
  icon: ReactNode
  /** Un număr mic lângă etichetă (de ex. documente nealocate). */
  count?: number
}

const SIDEBAR = 240
const RAIL = 64

function Brand({ compact }: { compact?: boolean }) {
  const { mode } = usePanelTheme()
  if (compact) {
    return (
      <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>
        R
      </Box>
    )
  }
  return <Box component="img" src={mode === 'dark' ? logoOnDark : logo} alt="RIDElance" sx={{ width: 128, display: 'block' }} />
}

function NavButton({ item, active, compact, onClick }: { item: PanelNavItem; active: boolean; compact: boolean; onClick: () => void }) {
  const button = (
    <ButtonBase
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? item.label : undefined}
      sx={{
        width: '100%',
        minHeight: 36,
        px: compact ? 0 : 1.25,
        my: '2px',
        gap: 1.25,
        justifyContent: compact ? 'center' : 'flex-start',
        borderRadius: '7px',
        border: '1px solid',
        borderColor: active ? 'var(--rl-border)' : 'transparent',
        bgcolor: active ? 'var(--rl-card)' : 'transparent',
        color: active ? 'var(--rl-fg)' : 'var(--rl-text-muted)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        textAlign: 'left',
        '&:hover': { bgcolor: 'var(--rl-card)', color: 'var(--rl-fg)' },
        '& svg': { fontSize: 18, color: active ? 'var(--rl-fg)' : 'var(--rl-text-subtle)' },
      }}
    >
      {item.icon}
      {!compact && (
        <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </Box>
      )}
      {!compact && item.count ? (
        <Box component="span" sx={{ px: 0.75, borderRadius: 999, bgcolor: 'var(--rl-muted)', color: 'var(--rl-fg)', fontSize: 11, fontWeight: 600, lineHeight: '18px' }}>
          {item.count}
        </Box>
      ) : null}
    </ButtonBase>
  )
  return compact ? (
    <Tooltip title={item.label} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  )
}

/**
 * Cadrul panourilor Admin și Contabil, ca un dashboard shadcn/ui: bara laterală cu grupuri,
 * bara de sus cu breadcrumb, notificări și tema, apoi conținutul. Sub 1200 px bara laterală se
 * strânge la iconițe; pe telefon devine sertar.
 */
export function PanelLayout({
  children,
  workspace,
  navItems,
  activeId,
  onNavClick,
  onLogout,
  userName,
  userRole,
  actions,
}: {
  children: ReactNode
  /** Primul pas din breadcrumb: „Admin” sau „Contabil”. */
  workspace: string
  navItems: PanelNavItem[]
  activeId: string
  onNavClick: (id: string) => void
  onLogout: () => void
  userName: string
  userRole: string
  actions?: ReactNode
}) {
  const { mode, toggle } = usePanelTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('rl-panel-collapsed') === 'true' } catch { return false }
  })
  const toggleSidebar = () => {
    if (mobile) { setMobileOpen(true); return }
    setCollapsed((value) => {
      try { localStorage.setItem('rl-panel-collapsed', String(!value)) } catch { /* Stocarea este opțională. */ }
      return !value
    })
  }
  const [trail, setTrail] = useState<string[]>([])
  const active = navItems.find((item) => item.id === activeId)
  const groups = [...new Set(navItems.map((item) => item.group))]
  const crumbs = [workspace, active?.group, active?.label, ...trail].filter((part): part is string => Boolean(part))

  const sidebar = (compact: boolean, mobile: boolean) => (
    <Stack sx={{ height: '100%', bgcolor: 'var(--rl-sidebar)', color: 'var(--rl-fg-soft)' }}>
      <Stack direction="row" sx={{ px: compact ? 0 : 2, pt: 2, pb: 1.5, alignItems: 'center', justifyContent: compact ? 'center' : 'space-between', minHeight: 56 }}>
        <Brand compact={compact} />
        {mobile && (
          <IconButton aria-label="Închide meniul" size="small" onClick={() => setMobileOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
      <Box component="nav" aria-label={`Navigare ${workspace.toLowerCase()}`} sx={{ flex: 1, overflowY: 'auto', px: compact ? 1 : 1.5, pb: 2 }}>
        {groups.map((group) => (
          <Box component="section" key={group}>
            {compact ? (
              <Box sx={{ my: 1.25, mx: 1, borderTop: '1px solid var(--rl-border)' }} />
            ) : (
              <Typography component="h2" sx={{ px: 1.25, pt: 2, pb: 0.75, fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--rl-text-subtle)' }}>
                {group}
              </Typography>
            )}
            {navItems
              .filter((item) => item.group === group)
              .map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  compact={compact}
                  onClick={() => {
                    onNavClick(item.id)
                    setMobileOpen(false)
                  }}
                />
              ))}
          </Box>
        ))}
      </Box>
      <Stack direction={compact ? 'column' : 'row'} sx={{ p: compact ? 1 : 1.5, gap: 1, alignItems: 'center', borderTop: '1px solid var(--rl-border)' }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: 'var(--rl-muted)', color: 'var(--rl-fg)', border: '1px solid var(--rl-border-strong)' }}>
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        {!compact && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: 'var(--rl-fg)' }}>
              {userName}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: 'var(--rl-text-subtle)' }}>
              {userRole}
            </Typography>
          </Box>
        )}
        <Tooltip title="Deconectare">
          <IconButton onClick={onLogout} aria-label="Deconectare" size="small">
            <LogoutRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )

  return (
    <TrailContext.Provider value={setTrail}>
      <Box sx={{ minHeight: '100dvh', bgcolor: 'var(--rl-bg)', color: 'var(--rl-fg)' }}>
        <Box
          component="a"
          href="#panel-content"
          sx={{ position: 'fixed', left: 16, top: -100, zIndex: 1500, px: 2, py: 1, borderRadius: 1, bgcolor: 'var(--rl-primary)', color: 'var(--rl-primary-fg)', '&:focus': { top: 8 } }}
        >
          Sari la conținut
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block', lg: 'none' }, position: 'fixed', inset: '0 auto 0 0', width: RAIL, borderRight: '1px solid var(--rl-border)', zIndex: 1100 }}>
          {sidebar(true, false)}
        </Box>
        <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'fixed', inset: '0 auto 0 0', width: collapsed ? RAIL : SIDEBAR, borderRight: '1px solid var(--rl-border)', zIndex: 1100 }}>
          {sidebar(collapsed, false)}
        </Box>
        <Drawer open={mobile && mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' } }} slotProps={{ paper: { sx: { width: 272, maxWidth: '88vw', borderRight: '1px solid var(--rl-border)' } } }}>
          {sidebar(false, true)}
        </Drawer>

        <Box sx={{ ml: { md: `${RAIL}px`, lg: `${collapsed ? RAIL : SIDEBAR}px` }, minWidth: 0 }}>
          <Box
            component="header"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1050,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: { xs: 2, md: 3 },
              borderBottom: '1px solid var(--rl-border)',
              bgcolor: mode === 'dark' ? 'rgba(9,9,11,0.88)' : 'rgba(250,250,250,0.88)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Tooltip title={mobile ? 'Deschide meniul' : collapsed ? 'Extinde meniul' : 'Restrânge meniul'}>
              <IconButton aria-label={mobile ? 'Deschide meniul' : collapsed ? 'Extinde meniul' : 'Restrânge meniul'} aria-expanded={mobile ? mobileOpen : !collapsed} onClick={toggleSidebar} size="small" sx={{ display: { xs: 'inline-flex', md: 'none', lg: 'inline-flex' } }}>
                {mobile ? <MenuRoundedIcon fontSize="small" /> : <MenuOpenRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Box component="nav" aria-label="Breadcrumb" sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 13 }}>
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1
                return (
                  <Box
                    key={`${crumb}-${index}`}
                    component="span"
                    sx={{
                      display: { xs: last ? 'inline' : 'none', sm: 'inline' },
                      color: last ? 'var(--rl-fg)' : 'var(--rl-text-subtle)',
                      fontWeight: last ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      '&:not(:last-of-type)::after': { content: '"/"', ml: 0.75, color: 'var(--rl-border-strong)' },
                    }}
                  >
                    {crumb}
                  </Box>
                )
              })}
            </Box>
            {actions}
            <Tooltip title={mode === 'dark' ? 'Temă deschisă' : 'Temă întunecată'}>
              <IconButton onClick={toggle} aria-label="Schimbă tema" size="small" sx={{ border: '1px solid var(--rl-border-strong)', bgcolor: 'var(--rl-input)' }}>
                {mode === 'dark' ? <LightModeOutlinedIcon sx={{ fontSize: 17 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>
            <NotificationsBell />
          </Box>
          <Box component="main" id="panel-content" tabIndex={-1} sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2.5, md: 3 }, pb: 6, minWidth: 0, outline: 'none' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </TrailContext.Provider>
  )
}
