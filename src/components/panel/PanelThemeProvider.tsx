import { useContext, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, GlobalStyles } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'

import { createPanelTheme, panelCssVars, type PanelMode } from '../../theme/panelTheme'
import { PanelThemeContext, type PanelThemeValue } from './panelThemeContext'

const STORAGE_KEY = 'rl-panel-theme'

function storedMode(): PanelMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * Tema Admin/Contabil: tema MUI a modului ales și variabilele `--rl-*` pe `:root` (le văd și
 * dialogurile și meniurile, care se randează în afara panoului). Imbricat într-un panou deja
 * deschis, nu mai face nimic: modulul de contabilitate o pune și singur, pentru pagina de dev.
 */
export function PanelThemeProvider({ children }: { children: ReactNode }) {
  const parent = useContext(PanelThemeContext)
  const [mode, setMode] = useState<PanelMode>(storedMode)
  const theme = useMemo(() => createPanelTheme(mode), [mode])
  const value = useMemo<PanelThemeValue>(
    () => ({
      mode,
      toggle: () =>
        setMode((current) => {
          const next = current === 'dark' ? 'light' : 'dark'
          try {
            window.localStorage.setItem(STORAGE_KEY, next)
          } catch {
            // Fără stocare (fereastră privată): modul ține doar până la reîncărcare.
          }
          return next
        }),
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
