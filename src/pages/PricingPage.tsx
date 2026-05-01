import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { TOKENS } from '../constants/tokens'
import { SectionHeader } from '../components/common/SectionHeader'
import { pricingCards } from '../data/constants'
import { pageFrameSx } from '../constants/layout'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'

export function PricingPage() {
  const navigate = useNavigate()

  return (
    <Box sx={pageFrameSx}>
      <Container maxWidth="xl">
        <Stack sx={{ justifyContent: 'center', alignItems: 'center' }} spacing={4} >
          <SectionHeader
            title="Abonamente/Preturi"
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
                  borderRadius: TOKENS.radius.sm,
                  backgroundColor: TOKENS.paper,
                    border:
                      index === 2
                        ? `2px solid ${TOKENS.primary}`
                        : `1px solid ${TOKENS.border}`,
                    boxShadow:
                      index === 2 ? TOKENS.shadow.glow : TOKENS.shadow.md,
                  transition: `all ${TOKENS.duration} ${TOKENS.easing}`,
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow:
                        index === 2
                          ? '0 20px 56px rgba(26,100,237,0.2)'
                          : TOKENS.shadow.lg,
                    },
                }}
              >
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
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        color: TOKENS.ink,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: TOKENS.primaryStrong,
                        fontWeight: 800,
                        fontSize: '1.15rem',
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
                    <Typography
                      sx={{
                        color: TOKENS.textMuted,
                        fontSize: '0.95rem',
                        mt: 1.2,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.summary}
                    </Typography>
                  </Box>

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
                    }}
                  >
                    {item.intro && (
                      <Typography
                        sx={{
                          fontSize: '0.9rem',
                          color: TOKENS.textMuted,
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
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/auth')}
                    sx={{
                      mt: 'auto',
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      borderRadius: TOKENS.radius.full,
                      color: '#fff',
                      backgroundColor: TOKENS.primary,
                      boxShadow: TOKENS.shadow.glow,
                      '&:hover': {
                        backgroundColor: TOKENS.primaryStrong,
                        transform: 'translateY(-2px)',
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
