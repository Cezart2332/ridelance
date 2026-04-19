import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const sfFontStack = [
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
      main: '#007AFF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#007AFF',
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#007AFF',
      secondary: '#007AFF',
    },
    divider: alpha('#007AFF', 0.2),
    background: {
      default: '#EAF4FF',
      paper: '#FFFFFF',
    },
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
      easeInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
      easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
      easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
      sharp: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: sfFontStack,
    h1: {
      fontFamily: sfFontStack,
      fontWeight: 650,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: sfFontStack,
      fontWeight: 650,
      letterSpacing: '-0.018em',
    },
    h3: {
      fontFamily: sfFontStack,
      fontWeight: 640,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: sfFontStack,
      fontWeight: 620,
      letterSpacing: '-0.01em',
    },
    button: {
      fontWeight: 610,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
          backgroundColor: '#EAF4FF',
        },
        body: {
          color: '#007AFF',
          backgroundColor: '#EAF4FF',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'background-color 200ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${alpha('#007AFF', 0.2)}`,
          backgroundImage: 'none',
          transition: 'border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'background-color 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 200ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha('#007AFF', 0.22)}`,
          borderRadius: 12,
          overflow: 'hidden',
          transition: 'background-color 200ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:before': {
            display: 'none',
          },
          '&:not(:last-child)': {
            marginBottom: 12,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          transition: 'background-color 200ms cubic-bezier(0.22, 1, 0.36, 1), color 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
        expandIconWrapper: {
          transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
        content: {
          transition: 'margin 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          transition: 'opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        },
      },
    },
    MuiCollapse: {
      defaultProps: {
        timeout: 200,
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
