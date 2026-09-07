import { useEffect, useState } from 'react'
import { ROUTES } from '../../constants/routes'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { subscriptionPlansFor, type PlanKey, stripeService } from '../../services/stripe.service'
import { canAccessDashboard } from '../../utils/clientOnboarding'
import { ANNUAL_DISCOUNT, type BillingCycle } from '../../data/plans'
import { Switcher } from '../pricing/Switcher'
import { BcrDiscountCheckbox } from '../pricing/BcrDiscountCheckbox'
import { PlanCard } from '../pricing/PlanCard'
import { PlanPrice } from '../pricing/PlanPrice'
import { bcrDiscountedLei, readBcrDiscountIntent, writeBcrDiscountIntent } from '../../data/bcrDiscount'
import { advanceCreditFor, ONBOARDING_ADVANCE_LEI } from '../../data/onboardingAdvance'
import { TermsAcceptance } from '../common/TermsAcceptance'
import { PaymentPolicyAcceptance } from '../common/PaymentPolicyAcceptance'
import { TOKENS as GLOBAL_TOKENS } from '../../constants/tokens'

const TOKENS = {
  ink: '#1a1a2e',
  primary: '#5CCBF5',
  primaryStrong: '#45B8E2',
  paper: '#FFFFFF',
  surface: GLOBAL_TOKENS.surface,
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
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState<PlanKey | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paymentPolicyAccepted, setPaymentPolicyAccepted] = useState(false)
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const plans = subscriptionPlansFor(cycle)
  const isSuspendedAccount = searchParams.get('reason') === 'suspended'
  const [gateChecking, setGateChecking] = useState(true)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  /**
   * Avansul din onboarding e plătit, deci primul abonament vine cu reducere.
   *
   * Se citește din același răspuns ca poarta de mai jos — nu dintr-un al doilea apel — ca pagina
   * să nu poată afișa o reducere pe care backendul n-o va aplica la checkout.
   */
  const [advancePaid, setAdvancePaid] = useState(false)
  // Pornește de la ce a bifat omul pe pagina publică, dacă a trecut pe acolo în sesiunea asta.
  const [bcrDiscount, setBcrDiscount] = useState(readBcrDiscountIntent)

  // Abonamentul se alege doar după onboarding complet; cu abonament activ → dashboard.
  useEffect(() => {
    stripeService
      .getSubscriptionStatus()
      .then((sub) => {
        if (sub && !sub.onboardingSectionsValidated) {
          navigate('/onboarding', { replace: true })
          return
        }
        if (canAccessDashboard(sub)) {
          navigate('/app/dashboard', { replace: true })
          return
        }
        setAdvancePaid(sub?.hasPaidInfiintare === true)
        setGateChecking(false)
      })
      .catch(() => setGateChecking(false))
  }, [navigate])

  const handleSelect = (key: PlanKey) => {
    setSelected(key)
    stripeService.setSelectedPlan(key)
  }

  const handleContinue = () => {
    if (!selected || !termsAccepted || !paymentPolicyAccepted) return
    setCheckoutError(null)
    stripeService.redirectToPlan(selected, undefined, undefined, { cycle, bcrDiscountRequested: bcrDiscount }).catch(() => {
      setCheckoutError('Nu am putut deschide plata. Încearcă din nou în câteva momente.')
    })
  }

  if (gateChecking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TOKENS.surface,
        }}
      >
        <CircularProgress sx={{ color: TOKENS.primary }} />
      </Box>
    )
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
              După confirmarea contului, alegi abonamentul potrivit. Plata se face acum, iar
              reînnoirea automată cade {cycle === 'annual' ? 'peste un an' : 'peste o lună'}, la
              aceeași dată.
            </Typography>
          </Box>

          {isSuspendedAccount && (
            <Alert severity="warning" sx={{ maxWidth: 640, width: '100%', borderRadius: TOKENS.radius.lg }}>
              Contul tău este suspendat. Pentru reactivare, alege un abonament sau contactează suportul dacă ai nevoie de ajutor.
            </Alert>
          )}

          {checkoutError && (
            <Alert severity="error" sx={{ maxWidth: 640, width: '100%', borderRadius: TOKENS.radius.lg }}>
              {checkoutError}
            </Alert>
          )}

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
              {/*
                Banda spune de unde vine reducerea de pe carduri. Fără ea, prețurile de început ar
                fi arătat ca o promoție oarecare, nu ca banii pe care omul i-a dat deja la început.
              */}
              {advancePaid
                ? `Avansul de ${ONBOARDING_ADVANCE_LEI} lei plătit la înrolare se scade din primul abonament — vezi pe fiecare plan cât plătești la început. Din luna următoare, prețul e cel normal.`
                : 'Abonamentul se activează imediat după plată — nu mai aștepți nimic. Îl poți anula oricând din contul tău.'}
            </Typography>
          </Paper>

          {/* Lunar sau anual — aceeași alegere ca pe pagina publică de Abonamente. */}
          <Switcher
            value={cycle}
            onChange={setCycle}
            options={[
              { value: 'monthly', label: 'Lunar' },
              { value: 'annual', label: 'Anual', badge: `-${Math.round(ANNUAL_DISCOUNT * 100)}%` },
            ]}
          />

          {/* Plan Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              width: '100%',
            }}
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                title={plan.title}
                selected={selected === plan.key}
                highlighted={plan.highlighted}
                onSelect={() => handleSelect(plan.key)}
                price={
                  <PlanPrice
                    monthlyLei={plan.monthlyLei}
                    unit={plan.priceUnit}
                    discounted={bcrDiscount}
                    size="md"
                    // Doar pe plata lunară: reducerea se aplică pe primele facturi, iar la plata
                    // anuală „prima lună" nu e o factură separată — ar fi o promisiune ambiguă.
                    //
                    // Calculat pe suma chiar facturată: cu bifa BCR pusă, cuponul avansului se
                    // aplică peste prețul deja redus, deci pe el trebuie socotit.
                    advanceCredit={
                      advancePaid && cycle === 'monthly'
                        ? advanceCreditFor(
                            plan.key,
                            bcrDiscount ? bcrDiscountedLei(plan.monthlyLei) : plan.monthlyLei,
                          )
                        : null
                    }
                  />
                }
                priceNote={plan.priceNote}
                belowPrice={
                  <BcrDiscountCheckbox
                    checked={bcrDiscount}
                    onChange={(next) => {
                      setBcrDiscount(next)
                      writeBcrDiscountIntent(next)
                    }}
                    stopPropagation
                  />
                }
                summary={plan.summary}
                intro={plan.intro}
                features={plan.list}
                footnote={plan.footnote}
                cta={plan.cta}
              />
            ))}
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
                  ? `Continuă cu ${plans.find(p => p.key === selected)?.title}`
                  : 'Acceptă politicile pentru a continua'
                : 'Selectează un plan pentru a continua'}
            </Button>
            <Button
              onClick={() => navigate(ROUTES.login)}
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
