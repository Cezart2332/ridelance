import { useMemo, type ReactNode } from 'react'
import { GlobalStyles } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { createSrlTheme } from '../../../theme/srlTheme'
import { IS_DARK_SKIN, IS_SRL_SKIN } from '../dashboardSkin'
import { DASHBOARD_TOKENS as T } from '../dashboardTheme'

/**
 * Tema dashboardului SRL: tema MUI a pielii încărcate și fundalul paginii. Tokenii sunt deja ai
 * pielii SRL (vezi `dashboardSkin`); aici ajung și la ce nu primește culori prin `sx`.
 *
 * Dacă pagina s-a încărcat în altă piele (navigare din altă zonă a aplicației), nu face nimic:
 * `SkinBoundary` o reîncarcă imediat, iar între timp nu amestecăm două palete.
 */
export function SrlThemeProvider({ children }: { children: ReactNode }) {
  const theme = useMemo(() => createSrlTheme(), [])

  if (!IS_SRL_SKIN) return <>{children}</>

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          ':root': { colorScheme: IS_DARK_SKIN ? 'dark' : 'light' },
          'html, body': { backgroundColor: T.surface, color: T.ink },
        }}
      />
      {children}
    </ThemeProvider>
  )
}
