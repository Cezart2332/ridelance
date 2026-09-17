import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'

import { DASHBOARD_TOKENS as T } from '../dashboardTheme'
import type { DashboardNavConfig, NavEntry, NavGroupEntry, NavLeaf } from '../../../config/dashboardNav'

/**
 * Meniul de pe telefon: o pagină cu tot ce are dashboardul, nu un sertar cu lista din sidebar.
 *
 * Categoriile apar ca grile de iconițe — atingi pagina de care ai nevoie, ca într-o aplicație de
 * bancă — iar ce ține de cont (profil, suport, setări) stă dedesubt, ca listă. Structura vine
 * integral din config: aceeași pagină servește PFA-ul și SRL-ul.
 */
interface MobileMenuProps {
  nav: DashboardNavConfig
  onLogout?: () => void
  /** Identitatea contului, dacă dashboardul o are (SRL-ul își arată firma). */
  header?: ReactNode
}

export function MobileMenu({ nav, onLogout, header }: MobileMenuProps) {
  const navigate = useNavigate()
  const tabPaths = new Set(nav.mobileTabs.map((tab) => tab.path))

  const groups = nav.entries.filter((entry): entry is NavGroupEntry => entry.kind === 'group')
  // Linkurile de nivel unu care nu sunt deja în bara de jos, apoi cele din subsol (profil, suport).
  const links = [...nav.entries, ...(nav.bottomEntries ?? [])].filter(
    (entry): entry is Extract<NavEntry, { kind: 'link' }> => entry.kind === 'link' && !tabPaths.has(entry.path),
  )

  const iconFor = (path: string, fallback: SvgIconComponent) => nav.leafIcons?.[path] ?? fallback

  return (
    <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 560, mx: 'auto', pb: 2 }}>
      {header && <Box>{header}</Box>}

      {groups.map((group) => (
        <Box key={group.id} component="section" aria-labelledby={`menu-${group.id}`}>
          <Typography
            id={`menu-${group.id}`}
            sx={{
              px: 0.5,
              mb: 1,
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: T.textMuted,
            }}
          >
            {group.label}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            {group.children.map((leaf) => (
              <MenuTile
                key={leaf.id}
                leaf={leaf}
                icon={iconFor(leaf.path, group.icon)}
                onClick={() => navigate(leaf.path)}
              />
            ))}
          </Box>
        </Box>
      ))}

      {(links.length > 0 || onLogout) && (
        <Box component="section" aria-label="Cont și ajutor">
          <Typography
            sx={{
              px: 0.5,
              mb: 1,
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: T.textMuted,
            }}
          >
            Cont și ajutor
          </Typography>
          <Box
            sx={{
              bgcolor: T.paper,
              border: `1px solid ${T.border}`,
              borderRadius: `${T.radius.lg}px`,
              overflow: 'hidden',
            }}
          >
            {links.map((link) => (
              <MenuRow
                key={link.id}
                label={link.label}
                hint={link.hint}
                icon={iconFor(link.path, link.icon)}
                onClick={() => navigate(link.path)}
              />
            ))}
            {onLogout && (
              <MenuRow label="Deconectare" icon={LogoutRoundedIcon} tone="danger" onClick={onLogout} />
            )}
          </Box>
        </Box>
      )}
    </Stack>
  )
}

function MenuTile({ leaf, icon: Icon, onClick }: { leaf: NavLeaf; icon: SvgIconComponent; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0.9,
        px: 0.75,
        pt: 1.6,
        pb: 1.3,
        minHeight: 96,
        bgcolor: T.paper,
        border: `1px solid ${T.border}`,
        borderRadius: `${T.radius.lg}px`,
        textAlign: 'center',
        transition: 'transform 120ms ease, background-color 120ms ease',
        '&:active': { transform: 'scale(0.97)', bgcolor: alpha(T.primary, 0.06) },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${T.radius.md}px`,
          bgcolor: alpha(T.primary, 0.12),
          color: T.primaryStrong,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Typography
        sx={{
          fontSize: '0.76rem',
          fontWeight: 650,
          lineHeight: 1.25,
          color: T.ink,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {leaf.label}
      </Typography>
      {leaf.badge === 'coming-soon' && (
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: T.textMuted, mt: -0.5 }}>În curând</Typography>
      )}
    </ButtonBase>
  )
}

function MenuRow({
  label,
  hint,
  icon: Icon,
  tone = 'default',
  onClick,
}: {
  label: string
  hint?: string
  icon: SvgIconComponent
  tone?: 'default' | 'danger'
  onClick: () => void
}) {
  const color = tone === 'danger' ? '#DC2626' : T.primaryStrong

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.75,
        py: 1.35,
        textAlign: 'left',
        '& + &': { borderTop: `1px solid ${T.border}` },
        '&:active': { bgcolor: alpha(T.ink, 0.04) },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${T.radius.md}px`,
          bgcolor: alpha(color, 0.1),
          color,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: tone === 'danger' ? color : T.ink }}>
          {label}
        </Typography>
        {hint && (
          <Typography noWrap sx={{ fontSize: '0.76rem', color: T.textMuted }}>
            {hint}
          </Typography>
        )}
      </Box>
      {tone !== 'danger' && <ChevronRightRoundedIcon sx={{ color: T.textSubtle, fontSize: 20 }} />}
    </ButtonBase>
  )
}
