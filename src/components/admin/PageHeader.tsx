import { Avatar, Box, Button, Link, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { ActionMenu, type ActionMenuItem } from './ActionMenu'

/**
 * Antetul unei pagini de detaliu: unde ești, cine e clientul, ce poți face.
 *
 * O singură acțiune primară vizibilă. Restul intră în „⋯" — o bară de șase butoane cu aceeași
 * greutate nu spune care e lucrul de făcut acum.
 */
export function PageHeader({
  backLabel,
  onBack,
  avatarText,
  title,
  /** O singură linie de identificatori, separați prin `·`. Lipsurile intră ca text estompat. */
  subtitle,
  primaryAction,
  menuItems = [],
  status,
}: {
  backLabel: string
  onBack: () => void
  avatarText: string
  title: string
  subtitle: ReactNode
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean }
  menuItems?: ActionMenuItem[]
  status?: ReactNode
}) {
  return (
    <Stack spacing={1.5}>
      <Link
        component="button"
        type="button"
        underline="hover"
        variant="body2"
        color="text.secondary"
        onClick={onBack}
        sx={{ alignSelf: 'flex-start' }}
      >
        ← {backLabel}
      </Link>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.100', color: 'text.secondary' }}>
          {avatarText}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h1">{title}</Typography>
            {status}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {primaryAction && (
            <Button
              variant="contained"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Button>
          )}
          <ActionMenu items={menuItems} />
        </Stack>
      </Stack>
    </Stack>
  )
}
