import { useContext, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, GlobalStyles } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { createPanelTheme, panelCssVars, type PanelMode } from '../../theme/panelTheme'
import { setStaffThemeMode, storedStaffThemeMode } from '../dashboard/dashboardSkin'
import { PanelThemeContext, type PanelThemeValue } from './panelThemeContext'

/**
 * Tema Admin/Contabil: tema MUI a modului ales și variabilele `--rl-*` pe `:root` (le văd și
 * dialogurile și meniurile, care se randează în afara panoului). Imbricat într-un panou deja
 * deschis, nu mai face nimic: modulul de contabilitate o pune și singur, pentru pagina de dev.
 */
export function PanelThemeProvider({ children }: { children: ReactNode }) {
  const parent = useContext(PanelThemeContext)
  const [mode, setMode] = useState<PanelMode>(storedStaffThemeMode)
  const theme = useMemo(() => createPanelTheme(mode), [mode])
  const value = useMemo<PanelThemeValue>(
    () => ({
      mode,
      // În Admin/Contabil schimbarea reîncarcă pagina (vezi `setStaffThemeMode`); pe pagina de dev a
      // contabilității, unde tokenii statici nu depind de temă, se schimbă pe loc.
      toggle: () => {
        const next = mode === 'dark' ? 'light' : 'dark'
        setStaffThemeMode(next)
        setMode(next)
      },
    }),
    [mode],
  )

  if (parent) return <>{children}</>

  return (
    <PanelThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <GlobalStyles styles={{ ':root': panelCssVars(mode), body: { backgroundColor: 'var(--rl-bg)' } }} />
        {children}
      </ThemeProvider>
    </PanelThemeContext.Provider>
  )
}
