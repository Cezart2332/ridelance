import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TOKENS } from './constants/tokens'
import { fontStack } from './theme/fontStack'
import { store } from './store/store'
import { AuthInitializer } from './components/auth/AuthInitializer'
import { clearChunkReloadFlag } from './utils/lazyWithRetry'
// @ts-ignore
import '@fontsource-variable/geist'
// Display face pentru onboarding (titluri de pas, progres) — body-ul rămâne Geist.
// @ts-ignore
import '@fontsource-variable/bricolage-grotesque'

clearChunkReloadFlag()

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (!sessionStorage.getItem('rl_chunk_reload')) {
    sessionStorage.setItem('rl_chunk_reload', '1')
    window.location.reload()
  }
})

// Service Worker (push notifications only). Avoid reload loops on mobile:
// skipWaiting + controllerchange + reload resets in-memory flags every load.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.error('SW registration failed:', error))
  })

  // Check for updates when user returns to the tab (not on every load)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    navigator.serviceWorker.ready
      .then((reg) => reg.update())
      .catch(() => {})
  })
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: TOKENS.primary,
      dark: TOKENS.primaryStrong,
      contrastText: '#FFFFFF',
    },
    background: {
      default: TOKENS.surface,
      paper: TOKENS.paper,
    },
    text: {
      primary: TOKENS.ink,
      secondary: TOKENS.textMuted,
    },
    divider: TOKENS.border,
  },
  typography: {
    fontFamily: fontStack,
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1.08,
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.12,
    },
    h3: {
      fontWeight: 750,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 750,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.65,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 650,
    },
  },
  shape: {
    borderRadius: 1, // Let numbers represent exact pixels
  },
  transitions: {
    duration: {
      shortest: 200,
      shorter: 200,
      short: 200,
      standard: 200,
      complex: 200,
      enteringScreen: 200,
      leavingScreen: 200,
    },
    easing: {
      easeInOut: TOKENS.easing,
      easeOut: TOKENS.easing,
      easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
      sharp: TOKENS.easing,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
          backgroundColor: TOKENS.surface,
          overflowX: 'hidden',
          overflowY: 'auto',
          minHeight: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
          WebkitTextSizeAdjust: '100%',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        },
        body: {
          color: TOKENS.ink,
          backgroundColor: TOKENS.surface,
          overflowX: 'hidden',
          overflowY: 'auto',
          minHeight: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'pan-y pinch-zoom',
        },
        '#root': {
          minHeight: '100%',
          width: '100%',
          overflowX: 'hidden',
        },
        'input, textarea': {
          WebkitUserSelect: 'text',
          userSelect: 'text',
        },
        '::selection': {
          backgroundColor: 'rgba(92, 203, 245, 0.3)',
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(26, 26, 46, 0.14)',
          borderRadius: 8,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(26, 26, 46, 0.24)',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.md, // 8px for standard buttons
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          // Calm interactions: no hover "jump" (nav items are buttons too),
          // just a gentle press and a visible keyboard-focus ring.
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&.Mui-focusVisible': {
            boxShadow: `0 0 0 3px rgba(92, 203, 245, 0.35)`,
          },
          '&.MuiButton-containedPrimary:hover': {
            backgroundColor: TOKENS.primaryStrong,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.lg, // 12px for cards
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.sm,
          transition: `border-color ${TOKENS.duration} ${TOKENS.easing}, box-shadow ${TOKENS.duration} ${TOKENS.easing}`,
          '&:hover': {
            borderColor: TOKENS.borderHover,
            boxShadow: TOKENS.shadow.md,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.lg, // 12px for paper containers
          backgroundImage: 'none',
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${TOKENS.border}`,
          borderRadius: `${TOKENS.radius.lg}px !important`, // 12px for accordions
          overflow: 'hidden',
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        expandIconWrapper: {
          transition: `transform ${TOKENS.duration} ${TOKENS.easing}`,
        },
      },
    },
    MuiCollapse: {
      defaultProps: {
        timeout: 200,
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: TOKENS.radius.md, // 8px for text fields
            transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
            '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: TOKENS.borderHover,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: TOKENS.ink,
          borderRadius: TOKENS.radius.sm,
          fontWeight: 600,
          fontSize: '0.74rem',
          padding: '6px 10px',
        },
        arrow: {
          color: TOKENS.ink,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: TOKENS.radius.xl,
          boxShadow: TOKENS.shadow.xl,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: TOKENS.radius.md,
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.lg,
          marginTop: 4,
        },
        list: {
          padding: 6,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.sm,
          fontSize: '0.9rem',
          fontWeight: 550,
          minHeight: 38,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: TOKENS.border,
        },
        head: {
          fontWeight: 750,
          color: TOKENS.textMuted,
          fontSize: '0.8rem',
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.full,
        },
        bar: {
          borderRadius: TOKENS.radius.full,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 650,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 650,
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthInitializer>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthInitializer>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
