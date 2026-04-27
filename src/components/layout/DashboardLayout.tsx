import React, { useState } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Avatar,
  Stack,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import { TOKENS } from '../../constants/tokens'
import logo from '../../assets/logo.svg'

export interface NavSubItem {
  id: string
  label: string
}

export interface NavItem {
  id: string
  label: string
  icon: React.ReactNode | string // Can be MUI icon or image URL
  subItems?: NavSubItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  activeId: string
  onNavClick: (id: string) => void
  userName?: string
  userRole?: string
  userAvatar?: string
  sidebarExtra?: React.ReactNode
}

const SIDEBAR_WIDTH = 290

export function DashboardLayout({
  children,
  navItems,
  activeId,
  onNavClick,
  userName = 'Utilizator',
  userRole = 'Admin',
  userAvatar,
  sidebarExtra,
}: DashboardLayoutProps) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeParentItem = navItems.find((n) => n.subItems?.some((s) => s.id === activeId))
  const activeItem = navItems.find((n) => n.id === activeId) ?? activeParentItem
  const activeSubItem = activeParentItem?.subItems?.find((s) => s.id === activeId)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const renderIcon = (icon: React.ReactNode | string, isActive: boolean) => {
    if (typeof icon === 'string') {
      return (
        <Box
          component="img"
          src={icon}
          sx={{
            width: 20,
            height: 20,
            filter: isActive
              ? 'invert(31%) sepia(85%) saturate(2853%) hue-rotate(211deg) brightness(98%) contrast(93%)'
              : 'invert(15%) sepia(10%) saturate(704%) hue-rotate(201deg) brightness(94%) contrast(89%)',
            opacity: isActive ? 1 : 0.6,
          }}
        />
      )
    }
    return icon
  }

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: alpha(TOKENS.paper, 0.96),
        backdropFilter: 'blur(10px)',
        borderRight: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          mb: 1.5,
          borderBottom: `1px solid ${alpha(TOKENS.ink, 0.06)}`,
          background: `linear-gradient(180deg, ${alpha(TOKENS.primary, 0.09)} 0%, transparent 72%)`,
        }}
      >
        <Box component="img" src={logo} sx={{ height: 42 }} />
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TOKENS.ink, 0.08), borderRadius: 10 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 2,
            display: 'block',
            color: TOKENS.textSubtle,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: '0.65rem'
          }}
        >
          Meniu Principal
        </Typography>

        <List disablePadding>
          {navItems.map((item) => {
            const isActive = activeId === item.id || (item.subItems?.some(s => s.id === activeId))
            
            if (item.subItems) {
              return (
                <Accordion
                  key={item.id}
                  elevation={0}
                  disableGutters
                  defaultExpanded={isActive}
                  sx={{
                    bgcolor: 'transparent',
                    '&:before': { display: 'none' },
                    mb: 0.5,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ fontSize: 18, color: isActive ? TOKENS.primaryStrong : TOKENS.textMuted }} />}
                    sx={{
                      minHeight: 46,
                      px: 1.5,
                      borderRadius: TOKENS.radius.md,
                      border: `1px solid ${isActive ? alpha(TOKENS.primary, 0.25) : 'transparent'}`,
                      '& .MuiAccordionSummary-content': { m: 0, alignItems: 'center' },
                      '&:hover': { bgcolor: alpha(TOKENS.primary, 0.04) },
                      '&.Mui-expanded': { minHeight: 46 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 38, color: isActive ? TOKENS.primaryStrong : TOKENS.textMuted }}>
                      {renderIcon(item.icon, Boolean(isActive))}
                    </ListItemIcon>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 650,
                        color: isActive ? TOKENS.primaryStrong : alpha(TOKENS.ink, 0.8),
                      }}
                    >
                      {item.label}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pl: 4.5, mt: 0.5 }}>
                    <Stack spacing={0.5}>
                      {item.subItems.map((sub) => {
                        const isSubActive = activeId === sub.id
                        return (
                          <ListItemButton
                            key={sub.id}
                            onClick={() => {
                              onNavClick(sub.id)
                              if (!isMdUp) setMobileOpen(false)
                            }}
                            sx={{
                              py: 0.9,
                              pl: 1.2,
                              borderRadius: TOKENS.radius.sm,
                              borderLeft: `2px solid ${isSubActive ? alpha(TOKENS.primaryStrong, 0.65) : 'transparent'}`,
                              bgcolor: isSubActive ? alpha(TOKENS.primary, 0.08) : 'transparent',
                              color: isSubActive ? TOKENS.primaryStrong : TOKENS.textMuted,
                              '&:hover': { bgcolor: alpha(TOKENS.primary, 0.05) },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: isSubActive ? 750 : 500 }}>
                                  {sub.label}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        )
                      })}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )
            }

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    onNavClick(item.id)
                    if (!isMdUp) setMobileOpen(false)
                  }}
                  sx={{
                    py: 1.15,
                    px: 1.5,
                    borderRadius: TOKENS.radius.md,
                    border: `1px solid ${isActive ? alpha(TOKENS.primary, 0.25) : 'transparent'}`,
                    bgcolor: isActive ? alpha(TOKENS.primary, 0.1) : 'transparent',
                    color: isActive ? TOKENS.primaryStrong : TOKENS.textMuted,
                    '&:hover': {
                      bgcolor: isActive ? alpha(TOKENS.primary, 0.15) : alpha(TOKENS.primary, 0.04),
                    },
                    transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                    {renderIcon(item.icon, Boolean(isActive))}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: isActive ? 750 : 600, fontSize: '0.9rem', color: isActive ? TOKENS.primaryStrong : alpha(TOKENS.ink, 0.8) }}>
                        {item.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      <Divider sx={{ mx: 2, mb: 2, opacity: 0.65 }} />

      {/* Customizable Extra Content (Stats, etc.) */}
      {sidebarExtra && (
        <Box sx={{ px: 2, mb: 2 }}>
          {sidebarExtra}
        </Box>
      )}

      {/* Profile Section (The new "Combination" part) */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: alpha(TOKENS.surfaceAlt, 0.95),
            background: `linear-gradient(135deg, ${alpha(TOKENS.primary, 0.1)} 0%, ${TOKENS.surfaceAlt} 38%)`,
            borderRadius: TOKENS.radius.lg,
            border: `1px solid ${TOKENS.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Avatar 
            src={userAvatar}
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: TOKENS.primary, 
              fontWeight: 800,
              fontSize: '0.9rem',
              border: `2px solid ${TOKENS.paper}`,
              boxShadow: `0 0 0 1px ${alpha(TOKENS.primaryStrong, 0.18)}`,
            }}
          >
            {userName[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: TOKENS.ink, fontSize: '0.85rem' }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: TOKENS.textMuted, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
              {userRole}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{
              color: alpha(TOKENS.ink, 0.35),
              border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
              '&:hover': { color: '#f43f5e', bgcolor: alpha('#f43f5e', 0.05) },
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: TOKENS.surface,
        backgroundImage: `radial-gradient(circle at 95% 0%, ${alpha(TOKENS.primary, 0.08)} 0%, transparent 42%)`,
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH, border: 'none', boxShadow: TOKENS.shadow.lg },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: SIDEBAR_WIDTH },
          flexShrink: { md: 0 },
          display: { xs: 'none', md: 'block' },
        }}
      >
        {sidebarContent}
      </Box>

      {/* Main Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: alpha(TOKENS.paper, 0.86),
            borderBottom: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
            backdropFilter: 'blur(10px)',
            color: TOKENS.ink,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  mr: 1,
                  display: { md: 'none' },
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  bgcolor: alpha(TOKENS.paper, 0.9),
                }}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, color: TOKENS.ink, fontSize: '1.08rem' }}>
                {activeItem?.label}
                {activeParentItem && (
                   <Box component="span" sx={{ color: TOKENS.textSubtle, fontWeight: 500, mx: 1 }}>/</Box>
                )}
                {activeSubItem?.label}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IconButton
                sx={{
                  bgcolor: alpha(TOKENS.paper, 0.9),
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong },
                }}
              >
                <Badge variant="dot" color="error">
                  <NotificationsNoneRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
              
              <IconButton
                sx={{
                  bgcolor: alpha(TOKENS.paper, 0.9),
                  border: `1px solid ${alpha(TOKENS.ink, 0.08)}`,
                  '&:hover': { bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong },
                }}
              >
                <HelpOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, md: 3.5 }, flex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
