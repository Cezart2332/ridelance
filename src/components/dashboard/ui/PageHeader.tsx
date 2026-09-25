import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

import { DASHBOARD_TOKENS } from '../dashboardTheme'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Butoane / toggle-uri aliniate dreapta. */
  actions?: ReactNode
  /**
   * Titlul rămâne și pe telefon. Implicit dispare acolo: antetul aplicației scrie deja numele
   * paginii, iar încă un titlu, cu descriere, împingea conținutul sub primul ecran. Rămâne doar
   * unde spune altceva decât antetul — pe pagina unei mașini, titlul e chiar mașina.
   */
  keepTitleOnMobile?: boolean
  /**
   * Acțiunile se văd și pe telefon. Fals unde meniul „+” din antet face deja același lucru
   * („Adaugă mașină”): pe telefon butonul stătea singur pe un rând, împingând lista mai jos.
   */
  actionsOnMobile?: boolean
}

/** Antetul unei secțiuni. Aceeași greutate și aceeași spațiere pe toate paginile. */
export function PageHeader({ title, subtitle, actions, keepTitleOnMobile = false, actionsOnMobile = true }: PageHeaderProps) {
  const titleDisplay = keepTitleOnMobile ? 'block' : { xs: 'none', md: 'block' }
  const mobileActions = Boolean(actions) && actionsOnMobile

  return (
    <Stack
      direction="row"
      sx={{
        // Pe telefon, fără titlu și fără acțiuni, antetul nu mai are ce arăta.
        display: !keepTitleOnMobile && !mobileActions ? { xs: 'none', md: 'flex' } : 'flex',
        alignItems: 'center',
        justifyContent: { xs: keepTitleOnMobile ? 'space-between' : 'flex-end', md: 'space-between' },
        flexWrap: 'wrap',
        // `gap`, nu `spacing`: `spacing` pune margine și pe ce trece pe rândul următor.
        columnGap: 2,
        rowGap: 1.2,
        flexShrink: 0,
      }}
    >
      <Box sx={{ minWidth: 0, display: titleDisplay }}>
        <Typography
          sx={{
            color: DASHBOARD_TOKENS.ink,
            fontWeight: 900,
            fontSize: { xs: '1.25rem', md: '1.4rem' },
            letterSpacing: -0.4,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: DASHBOARD_TOKENS.textMuted, fontSize: '0.86rem', mt: 0.3, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1.2,
            // Pe telefon butoanele trec pe rândul următor în loc să iasă din ecran.
            flexShrink: { xs: 1, md: 0 },
            minWidth: 0,
            flexWrap: 'wrap',
            rowGap: 1,
            display: actionsOnMobile ? 'flex' : { xs: 'none', md: 'flex' },
          }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  )
}

export default PageHeader
