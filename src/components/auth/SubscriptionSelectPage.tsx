import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { SUBSCRIPTION_PLANS, type PlanKey, stripeService } from '../../services/stripe.service'
import { getNextMondayBillingDate, formatRomanianDate } from '../../utils/billing'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { PaymentPolicyAcceptance } from '../common/PaymentPolicyAcceptance'
import logo from '../../assets/logo.svg'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: '#F8F9FC',
  surfaceAlt: '#EEF2F7',
  border: 'rgba(0,0,0,0.06)',
  borderHover: 'rgba(0,0,0,0.12)',
  textMuted: 'rgba(26,26,46,0.55)',
  radius: { md: 8, lg: 12, xl: 16, full: 9999 },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    glow: '0 4px 24px rgba(92,203,245,0.18)',
    proGlow: '0 8px 40px rgba(92,203,245,0.28)',
  },
}

export default function SubscriptionSelectPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PlanKey | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)
  const nextBilling = getNextMondayBillingDate()

  const handleSelect = (key: PlanKey) => {
    setSelected(key)
    stripeService.setSelectedPlan(key)
  }

  const handleContinue = () => {
    if (!selected || !termsAccepted || !paymentPolicyAccepted) return
    stripeService.activateSubscription(selected, nextBilling)
    stripeService.redirectToPlan(selected)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: TOKENS.surface,
        py: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="Ridelance"
            sx={{ height: 46, width: 'auto', cursor: 'pointer' }}
            onClick={() => navigate('/app')}
          />

          {/* Header */}
          <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.6rem', md: '2rem' },
                color: TOKENS.ink,
                mb: 1,
              }}
            >
              Alege abonamentul tău
            </Typography>
            <Typography sx={{ color: TOKENS.textMuted, fontSize: '1rem', lineHeight: 1.7 }}>
              După confirmarea contului, alegi abonamentul potrivit. Reînnoirea automată se face în fiecare{' '}
              <strong>luni la 15:00</strong>, următoarea plată fiind programată pe{' '}
              <Box component="span" sx={{ color: TOKENS.primaryStrong, fontWeight: 700 }}>
                {formatRomanianDate(nextBilling)}
              </Box>
              .
            </Typography>
          </Box>

          {/* Info banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: TOKENS.radius.lg,
              backgroundColor: alpha(TOKENS.primary, 0.06),
              border: `1px solid ${alpha(TOKENS.primary, 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              maxWidth: 640,
              width: '100%',
            }}
          >
            <InfoOutlinedIcon sx={{ color: TOKENS.primaryStrong, fontSize: 20, flexShrink: 0 }} />
            <Typography sx={{ color: TOKENS.ink, fontSize: '0.88rem', lineHeight: 1.6 }}>
              Abonamentul se activează imediat după plată. Nu mai aștepți până luni pentru acces;
              luni la 15:00 este doar momentul recurent de facturare.
            </Typography>
          </Paper>

          {/* Plan Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              width: '100%',
            }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selected === plan.key
              const isHighlighted = plan.highlighted

              return (
                <Paper
                  key={plan.key}
                  elevation={0}
                  onClick={() => handleSelect(plan.key)}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: TOKENS.radius.xl,
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${TOKENS.primary}`
                      : isHighlighted
                      ? `2px solid ${alpha(TOKENS.primary, 0.35)}`
                      : `1px solid ${TOKENS.border}`,
                    boxShadow: isSelected
                      ? TOKENS.shadow.proGlow
                      : isHighlighted
                      ? TOKENS.shadow.glow
                      : TOKENS.shadow.sm,
                    backgroundColor: isSelected
                      ? alpha(TOKENS.primary, 0.04)
                      : TOKENS.paper,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    '&:hover': {
                      boxShadow: TOKENS.shadow.glow,
                      borderColor: TOKENS.primary,
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {/* Popular badge */}
                  {isHighlighted && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        px: 2,
                        py: 0.5,
                        borderRadius: TOKENS.radius.full,
                        backgroundColor: TOKENS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <StarRoundedIcon sx={{ fontSize: 13, color: '#fff' }} />
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>
                        Cel mai popular
                      </Typography>
                    </Box>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: TOKENS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />
                    </Box>
                  )}

                  {/* Title & Price */}
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        color: TOKENS.ink,
                        mb: 0.5,
                      }}
                    >
                      {plan.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        color: TOKENS.primaryStrong,
                      }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.78rem', mt: 0.5, fontStyle: 'italic' }}>
                      {plan.priceNote}
                    </Typography>
                  </Box>

                  {/* Summary */}
                  <Typography sx={{ color: TOKENS.textMuted, fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {plan.summary}
                  </Typography>

                  {/* Intro */}
                  {plan.intro && (
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: TOKENS.ink }}>
                      {plan.intro}
                    </Typography>
                  )}

                  {/* Feature List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flexGrow: 1 }}>
                    {plan.list.map((point) => (
                      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.2, alignItems: 'flex-start' }} key={point}>
                        <CheckCircleOutlineRoundedIcon
                          sx={{ color: TOKENS.primary, fontSize: 17, flexShrink: 0, mt: 0.15 }}
                        />
                        <Typography sx={{ fontSize: '0.88rem', color: alpha(TOKENS.ink, 0.82), lineHeight: 1.55 }}>
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {plan.footnote && (
                    <Typography sx={{ fontSize: '0.78rem', color: TOKENS.textMuted, fontStyle: 'italic' }}>
                      {plan.footnote}
                    </Typography>
                  )}

                  {/* Select button */}
                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(plan.key)
                    }}
                    sx={{
                      mt: 1,
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRadius: TOKENS.radius.md,
                      borderColor: isSelected ? 'transparent' : TOKENS.borderHover,
                      color: isSelected ? '#fff' : TOKENS.ink,
                      backgroundColor: isSelected ? TOKENS.primary : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? TOKENS.primaryStrong : alpha(TOKENS.primary, 0.06),
                        borderColor: TOKENS.primary,
                        color: isSelected ? '#fff' : TOKENS.primary,
                      },
                    }}
                  >
                    {isSelected ? '✓ Selectat' : plan.cta}
                  </Button>
                </Paper>
              )
            })}
          </Box>

          {/* Continue CTA */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: '100%', maxWidth: 400 }}>
            <TermsAcceptance checked={termsAccepted} onChange={setTermsAccepted} />
            <PaymentPolicyAcceptance checked={paymentPolicyAccepted} onChange={setPaymentPolicyAccepted} />
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!selected || !termsAccepted || !paymentPolicyAccepted}
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={handleContinue}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: '1.05rem',
                borderRadius: TOKENS.radius.md,
                backgroundColor: TOKENS.primary,
                boxShadow: TOKENS.shadow.glow,
                '&:hover': {
                  backgroundColor: TOKENS.primaryStrong,
                  transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(TOKENS.primary, 0.35),
                  color: '#fff',
                },
              }}
            >
              {selected
                ? termsAccepted && paymentPolicyAccepted
                  ? `Continuă cu ${SUBSCRIPTION_PLANS.find(p => p.key === selected)?.title}`
                  : 'Acceptă politicile pentru a continua'
                : 'Selectează un plan pentru a continua'}
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              sx={{
                textTransform: 'none',
                color: TOKENS.textMuted,
                fontWeight: 600,
                '&:hover': { color: TOKENS.ink, backgroundColor: 'transparent' },
              }}
            >
              ← Înapoi la autentificare
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
