import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TOKENS } from './constants/tokens'
import { store } from './store/store'
import { AuthInitializer } from './components/auth/AuthInitializer'
// @ts-ignore
import '@fontsource-variable/geist'

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

const fontStack = [
  '"Geist Variable"',
  '"Geist"',
  '"SF Compact Display"',
  '"SF Pro Display"',
  '"SF Compact Text"',
  '"SF Pro Text"',
  '"SF Pro"',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(', ')

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
          '&:hover': {
            transform: 'translateY(-1.5px)',
          },
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: TOKENS.radius.lg, // 12px for cards
          border: `1px solid ${TOKENS.border}`,
          boxShadow: TOKENS.shadow.md,
          transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: TOKENS.shadow.lg,
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
          },
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
