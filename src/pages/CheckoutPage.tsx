import { useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { motion } from 'motion/react' // In motion v12, the package name is motion or motion/react depending on setup, but typically motion is used or motion/react. Let's make sure we import standard motion.
import logo from '../assets/logo.svg'

// Initialize Stripe outside component render
const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE || '')

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  border: 'rgba(0, 0, 0, 0.08)',
  textMuted: 'rgba(26, 26, 46, 0.55)',
  radius: { md: 12, lg: 16, xl: 24, full: 9999 },
  shadow: {
    sm: '0 2px 4px rgba(0,0,0,0.02)',
    md: '0 8px 30px rgba(0,0,0,0.06)',
    glow: '0 4px 20px rgba(92,203,245,0.15)',
  },
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [cancelUrl, setCancelUrl] = useState<string>('/app')
  const [title, setTitle] = useState<string>('Plată RIDElance')
  const [price, setPrice] = useState<string>('')
  const [desc, setDesc] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Read from sessionStorage
    const secret = sessionStorage.getItem('stripe_client_secret')
    const cancel = sessionStorage.getItem('stripe_cancel_url')
    const t = sessionStorage.getItem('stripe_checkout_title')
    const p = sessionStorage.getItem('stripe_checkout_price')
    const d = sessionStorage.getItem('stripe_checkout_desc')

    if (secret) {
      setClientSecret(secret)
    }
    if (cancel) setCancelUrl(cancel)
    if (t) setTitle(t)
    if (p) setPrice(p)
    if (d) setDesc(d)

    setLoading(false)
  }, [])

  const handleCancel = () => {
    // Clear storage on cancel
    sessionStorage.removeItem('stripe_client_secret')
    sessionStorage.removeItem('stripe_checkout_title')
    sessionStorage.removeItem('stripe_checkout_price')
    sessionStorage.removeItem('stripe_checkout_desc')
    window.location.href = cancelUrl
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: TOKENS.surface }}>
        <CircularProgress size={40} sx={{ color: TOKENS.primary }} />
      </Box>
    )
  }

  if (!clientSecret) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TOKENS.surface,
          p: 3,
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: TOKENS.radius.lg,
              border: `1px solid ${TOKENS.border}`,
              boxShadow: TOKENS.shadow.md,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 2 }}>
              Sesiune lipsă
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, mb: 4, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Nu s-a detectat nicio sesiune de plată activă. Te rugăm să reiei procesul de plată din aplicație.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => window.location.href = '/app'}
              sx={{
                py: 1.4,
                fontWeight: 700,
                borderRadius: TOKENS.radius.md,
                backgroundColor: TOKENS.primary,
                boxShadow: TOKENS.shadow.glow,
                '&:hover': { backgroundColor: TOKENS.primaryStrong },
              }}
            >
              Mergi la Dashboard
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: TOKENS.surface,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          py: 2.5,
          px: { xs: 3, md: 6 },
          borderBottom: `1px solid ${TOKENS.border}`,
          backgroundColor: TOKENS.paper,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={handleCancel}
          sx={{
            textTransform: 'none',
            color: TOKENS.ink,
            fontWeight: 700,
            fontSize: '0.9rem',
            '&:hover': { backgroundColor: 'transparent', color: TOKENS.primaryStrong },
          }}
        >
          Înapoi la site
        </Button>
        <Box
          component="img"
          src={logo}
          alt="Ridelance"
          sx={{ height: 32, width: 'auto', cursor: 'pointer' }}
          onClick={() => window.location.href = '/app'}
        />
      </Box>

      {/* Main Grid Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: { md: 'calc(100vh - 83px)' },
          overflow: 'hidden',
        }}
      >
        {/* Left Panel: Order Summary */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          sx={{
            width: { xs: '100%', md: '45%' },
            backgroundColor: '#0c0c1e', // Dark premium panel
            color: '#fff',
            p: { xs: 4, sm: 6, md: 8 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: `1px solid rgba(255,255,255,0.06)`,
            overflowY: 'auto',
          }}
        >
          <Box>
            <Typography
              sx={{
                color: TOKENS.primary,
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 2,
                mb: 2,
              }}
            >
              Sumar Comandă
            </Typography>

            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              {title}
            </Typography>

            {price && (
              <Typography variant="h4" sx={{ fontWeight: 800, color: TOKENS.primary, mb: 3 }}>
                {price}
              </Typography>
            )}

            {desc && (
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  fontSize: '1rem',
                  mb: 4,
                  fontWeight: 400,
                }}
              >
                {desc}
              </Typography>
            )}

            {/* List of checkout trust factors */}
            <Stack spacing={2} sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleOutlineRoundedIcon sx={{ color: TOKENS.primary, fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                  Acces instant la platformă după plată
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleOutlineRoundedIcon sx={{ color: TOKENS.primary, fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                  Factură automată trimisă pe email
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleOutlineRoundedIcon sx={{ color: TOKENS.primary, fontSize: 20 }} />
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                  Anulezi oricând fără costuri suplimentare
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ mt: { xs: 6, md: 4 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(92,203,245,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockRoundedIcon sx={{ color: TOKENS.primary, fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Plată securizată prin Stripe</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                Conexiune criptată SSL de nivel bancar.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel: Embedded Stripe Form */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          sx={{
            flex: 1,
            backgroundColor: TOKENS.surface,
            p: { xs: 4, sm: 6, md: 8 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 540 }}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
