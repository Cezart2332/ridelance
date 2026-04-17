export type ThemeMode = 'dark' | 'light'

export const brandColors = {
  base: '#435058',
  mid: '#848C8E',
  lime: '#DCF763',
  soft: '#BFB7B6',
} as const

const modePalettes = {
  dark: {
    bg: '#0F1316',
    surface: '#1B252C',
    surfaceAlt: '#243139',
    text: '#EDF2F4',
    textSoft: '#C8D1D6',
    border: 'rgba(191, 183, 182, 0.3)',
    headerBg: 'rgba(27, 37, 44, 0.9)',
    heroBg: '#2A3942',
    contrastBg: '#212D34',
    badgeBg: 'rgba(38, 52, 60, 0.52)',
    chipBg: 'rgba(38, 52, 60, 0.45)',
    ghostHoverBg: 'rgba(38, 52, 60, 0.55)',
    inputBg: 'rgba(36, 49, 57, 0.75)',
    toggleIdleBg: 'rgba(36, 49, 57, 0.82)',
    success: '#B6F98C',
    warning: '#FF9B9B',
  },
  light: {
    bg: '#D3D8DC',
    surface: '#E2E7EB',
    surfaceAlt: '#D9E0E5',
    text: '#1C262D',
    textSoft: '#4A5962',
    border: 'rgba(67, 80, 88, 0.34)',
    headerBg: 'rgba(226, 231, 235, 0.94)',
    heroBg: '#C8D1D6',
    contrastBg: '#D4DCE1',
    badgeBg: 'rgba(132, 140, 142, 0.42)',
    chipBg: 'rgba(132, 140, 142, 0.34)',
    ghostHoverBg: 'rgba(132, 140, 142, 0.3)',
    inputBg: 'rgba(244, 247, 249, 0.95)',
    toggleIdleBg: 'rgba(204, 213, 219, 0.95)',
    success: '#2E7D32',
    warning: '#B04141',
  },
} as const

export function getPalette(mode: ThemeMode) {
  return {
    ...brandColors,
    ...modePalettes[mode],
  }
}

export const palette = getPalette('dark')
