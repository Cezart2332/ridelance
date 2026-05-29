import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pricingCards } from '../data/constants'
import { pageFrameSx } from '../constants/layout'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useAppSelector } from '../store/hooks'

export function PricingPage() {
  const navigate = useNavigate()
  const { accessToken, isInitialized } = useAppSelector((s) => s.auth)

  const handleStart = () => {
    if (!isInitialized) return
    navigate(accessToken ? '/app' : '/auth')
  }

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={4} >
          <SectionHeader
            title="Abonamente"
            subtitle="Planuri simple. Beneficii reale. Sprijin complet."
          />
          <Typography
            sx={{
              textAlign: 'center',
              color: TOKENS.textMuted,
              fontSize: '1.05rem',
              maxWidth: 600,
              mx: 'auto',
              mt: -2,
            }}
          >
            Alege varianta care ți se potrivește și concentrează-te pe drum, nu pe birocrație.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'stretch' },
              justifyContent: 'center',
              gap: 4,
              width: '100%',
            }}
          >
            {pricingCards.map((item, index) => (
              <Card
                key={`${item.title}-${index}`}
                elevation={0}
                sx={{
                  width: { xs: '100%', sm: '80%', md: '30%' },
                  maxWidth: { md: 420 },
                  display: 'flex',
                  flexDirection: 'column',
                  p: { xs: 3, md: 4.5 },
                  borderRadius: TOKENS.radius.xl,
                  backgroundColor: TOKENS.paper,
                  position: 'relative',
                  border:
                    index === 2
                      ? `1.5px solid ${TOKENS.primaryStrong}`
                      : `1px solid ${alpha(TOKENS.ink, 0.06)}`,
                  boxShadow:
                    index === 2
                      ? '0 16px 40px rgba(92,203,245,0.14)'
                      : '0 4px 20px rgba(0,0,0,0.01)',
                  transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow:
                      index === 2
                        ? '0 24px 50px rgba(92,203,245,0.22)'
                        : '0 16px 36px rgba(0,0,0,0.04)',
                  },
                }}
              >
                {index === 2 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: TOKENS.primaryStrong,
                      color: '#fff',
                      px: 1.8,
                      py: 0.5,
                      borderRadius: TOKENS.radius.sm,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(92,203,245,0.2)',
                    }}
                  >
                    Recomandat
                  </Box>
                )}

                <CardContent
                  sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                    gap: 2.5,
                  }}
                >
                  <Box sx={{ minHeight: { xs: 'auto', md: 105 } }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.35rem',
                        color: TOKENS.ink,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: TOKENS.primaryStrong,
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        mt: 0.5,
                      }}
                    >
                      {item.price}
                    </Typography>
                    {item.priceNote && (
                      <Typography
                        sx={{
                          color: TOKENS.textMuted,
                          fontSize: '0.78rem',
                          mt: 0.5,
                          fontStyle: 'italic',
                        }}
                      >
                        {item.priceNote}
                      </Typography>
                    )}
                  </Box>

                  <Typography
                    sx={{
                      color: TOKENS.textMuted,
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.summary}
                  </Typography>

                  <Box
                    component="ul"
                    sx={{
                      p: 0,
                      m: 0,
                      alignSelf: 'stretch',
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      gap: 1.2,
                      flexGrow: 1,
                    }}
                  >
                    {item.intro && (
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: TOKENS.ink,
                          pr: 1.2,
                        }}
                      >
                        {item.intro}
                      </Typography>
                    )}
                    {item.list.map((point) => (
                      <Box
                        component="li"
                        key={point}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.2,
                        }}
                      >
                        <CheckCircleOutlineRoundedIcon
                          sx={{
                            fontSize: 18,
                            minWidth: 18,
                            mt: 0.2,
                            color: alpha(TOKENS.primary, 0.8),
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            color: alpha(TOKENS.ink, 0.85),
                            lineHeight: 1.6,
                          }}
                        >
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {item.footnote && (
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        color: TOKENS.textMuted,
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}
                    >
                      {item.footnote}
                    </Typography>
                  )}

                  <Button
                    onClick={handleStart}
                    variant={index === 2 ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    sx={{
                      mt: 'auto',
                      py: 1.4,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      borderRadius: TOKENS.radius.lg,
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      color: index === 2 ? '#fff' : TOKENS.ink,
                      borderColor: index === 2 ? 'transparent' : alpha(TOKENS.ink, 0.12),
                      '&:hover':
                        index === 2
                          ? {
                            backgroundColor: TOKENS.primaryStrong,
                            boxShadow: 'none',
                          }
                          : {
                            borderColor: alpha(TOKENS.ink, 0.3),
                            backgroundColor: alpha(TOKENS.ink, 0.01),
                          },
                    }}
                  >
                    {item.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
