import { Box, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useRef, type ReactNode } from 'react'

import { displaySx, TOKENS } from './onboardingTheme'

/**
 * Acțiunea principală a unui panou. Pe telefon se lipește de marginea de jos, ca să rămână în
 * treimea inferioară a ecranului — acolo ajunge degetul mare fără să muți mâna.
 */
export function PanelActions({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (!isMobile) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        {children}
      </Stack>
    )
  }

  return (
    <>
      {/* Spacer, ca bara fixată să nu acopere ultimul câmp din formular. */}
      <Box sx={{ height: 68 }} />
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          px: 2,
          py: 1.5,
          pb: 'max(12px, env(safe-area-inset-bottom))',
          backgroundColor: TOKENS.paper,
          borderTop: `1px solid ${TOKENS.border}`,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
          {children}
        </Stack>
      </Box>
    </>
  )
}

/**
 * Cardul standard din zona de conținut. Un singur tratament, folosit de toate panourile.
 * Nu are subtitlu: dacă un card are nevoie de o explicație ca să se înțeleagă, titlul lui
 * e greșit.
 */
export function PanelCard({
  title,
  action,
  children,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, md: 3 },
        borderRadius: `${TOKENS.radius.lg}px`,
        border: `1px solid ${TOKENS.border}`,
      }}
    >
      {title && (
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...displaySx, fontWeight: 700, fontSize: '1.02rem', color: TOKENS.ink }}>
              {title}
            </Typography>
          </Box>
          {action}
        </Stack>
      )}
      <Box sx={{ mt: title ? 2 : 0 }}>{children}</Box>
    </Paper>
  )
}

/**
 * Antetul unui pas: titlul, atât. Primește focus la fiecare schimbare de pas, ca cititorul de
 * ecran să anunțe unde a ajuns userul (spec §10).
 */
export function PanelHeading({ title }: { title: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [title])

  return (
    <Box sx={{ mb: 0.5 }}>
      <Typography
        ref={ref}
        component="h1"
        tabIndex={-1}
        sx={{
          ...displaySx,
          fontWeight: 800,
          fontSize: { xs: '1.35rem', md: '1.55rem' },
          color: TOKENS.ink,
          outline: 'none',
        }}
      >
        {title}
      </Typography>
    </Box>
  )
}
