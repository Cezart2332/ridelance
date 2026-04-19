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
  shape: {
    borderRadius: 4,
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
        '@media (prefers-reduced-motion: reduce)': {
          html: {
            scrollBehavior: 'auto',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': {
              transform: 'none',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${alpha('#007AFF', 0.2)}`,
          backgroundImage: 'none',
          transition: 'border-color 180ms ease, transform 180ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': {
              transform: 'none',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha('#007AFF', 0.22)}`,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&:not(:last-child)': {
            marginBottom: 12,
          },
        },
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
