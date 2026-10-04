import { createContext, useContext } from 'react'

import type { PanelMode } from '../../theme/panelTheme'

export interface PanelThemeValue {
  mode: PanelMode
  toggle: () => void
}

export const PanelThemeContext = createContext<PanelThemeValue | null>(null)

export function usePanelTheme(): PanelThemeValue {
  return useContext(PanelThemeContext) ?? { mode: 'dark', toggle: () => undefined }
}
