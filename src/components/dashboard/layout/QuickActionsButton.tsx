import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import type { QuickActionsMenu } from '../../../config/dashboardNav'
import { DASHBOARD_TOKENS } from '../dashboardTheme'

/**
 * Butonul „+” din antet, cu acțiunile rapide ale dashboardului.
 *
 * Fiecare acțiune duce la pagina care o face și îi cere, prin adresă, să deschidă formularul
 * (`?actiune=…`, vezi `useQuickActionIntent`). Meniul nu are formulare proprii: dacă le-ar avea,
 * ar exista două feluri de a adăuga o cheltuială, iar unul ar rămâne în urmă la prima regulă nouă.
 *
 * Pe desktop meniul se deschide sub buton; pe telefon urcă de jos, ca foaia de acțiuni a unei
 * aplicații.
 */
export function QuickActionsButton({ menu }: { menu: QuickActionsMenu }) {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const menuId = useId()

  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = anchor !== null
  const close = () => setAnchor(null)

  const HeaderIcon = menu.icon

  const content = (
    <Box sx={{ width: { xs: '100%', md: 400 }, p: { xs: 2, md: 2.25 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
            backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.14),
            color: DASHBOARD_TOKENS.primaryStrong,
          }}
        >
          <HeaderIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 850, fontSize: '1.1rem', color: DASHBOARD_TOKENS.ink, lineHeight: 1.2 }}>
            {menu.title}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: DASHBOARD_TOKENS.textMuted }}>{menu.subtitle}</Typography>
        </Box>
        <Box
          component="span"
          sx={{
            px: 1.1,
            py: 0.3,
            flexShrink: 0,
            borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
            fontSize: '0.74rem',
            fontWeight: 800,
            color: DASHBOARD_TOKENS.primaryStrong,
            backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.14),
          }}
        >
          {menu.items.length} acțiuni
        </Box>
      </Stack>

      <Divider sx={{ my: 1.75 }} />

      <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1rem', color: DASHBOARD_TOKENS.ink, mb: 0.75 }}>
        Acțiuni rapide
      </Typography>

      <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {menu.items.map((item, index) => {
          const Icon = item.icon
          return (
            <Box
              component="li"
              key={item.id}
              sx={{ borderTop: index === 0 ? 'none' : `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.07)}` }}
            >
              <ButtonBase
                onClick={() => {
                  close()
                  navigate(item.to(pathname))
                }}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  gap: 1.5,
                  py: 1.25,
                  px: 0.75,
                  mx: -0.75,
                  borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                  '&:hover, &.Mui-focusVisible': { backgroundColor: alpha(DASHBOARD_TOKENS.primary, 0.06) },
                  '&:hover .quick-chevron': { transform: 'translateX(2px)', color: DASHBOARD_TOKENS.primaryStrong },
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
                    backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.04),
                    color: item.primary ? DASHBOARD_TOKENS.primaryStrong : alpha(DASHBOARD_TOKENS.ink, 0.72),
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.93rem', color: DASHBOARD_TOKENS.ink }}>{item.label}</Typography>
                    {item.primary && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.9,
                          py: 0.15,
                          borderRadius: `${DASHBOARD_TOKENS.radius.full}px`,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#1f7a4d',
                          backgroundColor: alpha('#1f9d55', 0.14),
                        }}
                      >
                        Principală
                      </Box>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: '0.8rem', color: DASHBOARD_TOKENS.textMuted }}>{item.hint}</Typography>
                </Box>
                <ChevronRightRoundedIcon
                  className="quick-chevron"
                  sx={{ color: alpha(DASHBOARD_TOKENS.ink, 0.35), transition: 'transform .15s ease, color .15s ease' }}
                />
              </ButtonBase>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )

  return (
    <>
      {isMdUp ? (
        <Button
          variant="contained"
          disableElevation
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
          startIcon={<AddRoundedIcon />}
          endIcon={<KeyboardArrowDownRoundedIcon sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: `${DASHBOARD_TOKENS.radius.md}px`,
            px: 1.75,
            backgroundColor: DASHBOARD_TOKENS.primary,
            color: DASHBOARD_TOKENS.ink,
            '&:hover': { backgroundColor: DASHBOARD_TOKENS.primaryStrong },
          }}
        >
          Adaugă
        </Button>
      ) : (
        <IconButton
          aria-label="Acțiuni rapide"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            width: 38,
            height: 38,
            backgroundColor: DASHBOARD_TOKENS.primary,
            color: DASHBOARD_TOKENS.ink,
            '&:hover': { backgroundColor: DASHBOARD_TOKENS.primaryStrong },
          }}
        >
          <AddRoundedIcon />
        </IconButton>
      )}

      {isMdUp ? (
        <Popover
          id={menuId}
          open={open}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                borderRadius: `${DASHBOARD_TOKENS.radius.lg}px`,
                border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
                boxShadow: `0 24px 48px -24px ${alpha(DASHBOARD_TOKENS.ink, 0.35)}`,
              },
            },
          }}
        >
          {content}
        </Popover>
      ) : (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={close}
          slotProps={{
            paper: {
              sx: {
                borderTopLeftRadius: `${DASHBOARD_TOKENS.radius.xl}px`,
                borderTopRightRadius: `${DASHBOARD_TOKENS.radius.xl}px`,
                pb: 'env(safe-area-inset-bottom)',
                maxHeight: '85vh',
              },
            },
          }}
        >
          {/* Mânerul foii, ca pe telefon */}
          <Box aria-hidden sx={{ width: 40, height: 4, borderRadius: 2, backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.15), mx: 'auto', mt: 1.25 }} />
          {content}
        </Drawer>
      )}
    </>
  )
}
