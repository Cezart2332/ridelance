import { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, alpha, Stack, Paper, Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import { TOKENS } from '../../constants/tokens';
import { carsService, type Car, getCarImageUrl } from '../../services/cars.service';
import { formatCarOfferType } from '../../utils/carLabels';
import { hasActiveDiscount } from '../../utils/carPricing';
import CarPriceDisplay, { CarDiscountChip } from '../dashboard/sections/cars/CarPriceDisplay';

export function CarCarousel() {
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carsService.getAll()
      .then((data) => {
        // Take only active cars and limit to 10
        setCars(data.filter(c => c.active).slice(0, 10));
      })
      .catch((err) => console.error('Error fetching cars:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box id="masini" sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', alignItems: 'center', mb: 2 }} component="div">
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(TOKENS.primary, 0.1), color: TOKENS.primaryStrong, display: 'flex' }}>
              <DirectionsCarFilledRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5, color: TOKENS.primaryStrong }}>
              FLOTA NOASTRĂ
            </Typography>
          </Stack>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, color: TOKENS.ink }}>
            Mașini Disponibile
          </Typography>
          <Typography sx={{ color: TOKENS.textMuted, maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
            Alege dintr-o gamă variată de mașini verificate, pregătite special pentru Uber și Bolt.
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'stretch',
            gap: 3, 
            overflowX: 'auto', 
            pb: 4,
            px: 1,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(TOKENS.ink, 0.1), borderRadius: 10 },
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {loading ? (
            // Skeletons for loading state
            [1, 2, 3, 4].map((i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  minWidth: { xs: 280, sm: 320, md: 360 },
                  borderRadius: '24px',
                  border: `1px solid ${TOKENS.border}`,
                  overflow: 'hidden',
                  backgroundColor: TOKENS.paper,
                }}
              >
                <Skeleton variant="rectangular" height={200} />
                <Box sx={{ p: 3 }}>
                  <Skeleton width="60%" height={32} sx={{ mb: 1 }} />
                  <Skeleton width="40%" sx={{ mb: 2 }} />
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 3 }} component="div">
                    <Box><Skeleton width={80} height={40} /></Box>
                    <Box><Skeleton width={60} /></Box>
                  </Stack>
                  <Skeleton variant="rectangular" height={48} sx={{ borderRadius: '14px' }} />
                </Box>
              </Paper>
            ))
          ) : cars.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', width: '100%' }}>
              <Typography sx={{ color: TOKENS.textMuted }}>Momentan nu există mașini disponibile.</Typography>
            </Box>
          ) : (
            cars.map((car) => (
              <Paper
                key={car.id}
                elevation={0}
                sx={{
                  minWidth: { xs: 280, sm: 320, md: 360 },
                  borderRadius: '24px',
                  border: `1px solid ${TOKENS.border}`,
                  overflow: 'hidden',
                  backgroundColor: TOKENS.paper,
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    borderColor: TOKENS.primary
                  }
                }}
              >
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  <Box 
                    component="img" 
                    src={getCarImageUrl(car.images[0]?.imageUrl)} 
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16, 
                    bgcolor: alpha(TOKENS.ink, 0.8), 
                    color: '#fff', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: '10px',
                    backdropFilter: 'blur(4px)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {formatCarOfferType(car.offerType)}
                  </Box>
                  {hasActiveDiscount(car) && (
                    <CarDiscountChip sx={{ top: 16, left: 'auto', right: 16 }} />
                  )}
                </Box>

                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: TOKENS.ink, mb: 0.5 }}>
                      {car.brand} {car.model}
                    </Typography>
                    <Typography variant="body2" sx={{ color: TOKENS.textMuted, mb: 2 }}>
                      {car.year} • {car.engine} • {car.transmission}
                    </Typography>
                  </Box>

                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, minHeight: 110 }} component="div">
                    <Box>
                      <Typography variant="caption" sx={{ color: TOKENS.textMuted, fontWeight: 700, display: 'block', mb: 0.5 }}>
                        PREȚ / SĂPTĂMÂNĂ
                      </Typography>
                      <CarPriceDisplay
                        car={car}
                        primaryColor={TOKENS.primaryStrong}
                        mutedColor={TOKENS.textMuted}
                        size="compact"
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                       <Typography variant="caption" sx={{ color: TOKENS.textMuted, display: 'block' }}>
                          {car.location}
                       </Typography>
                    </Box>
                  </Stack>

                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => navigate('/masini')}
                    sx={{ 
                      py: 1.5, 
                      mt: 'auto',
                      borderRadius: '14px', 
                      fontWeight: 800, 
                      bgcolor: TOKENS.primary,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: TOKENS.primaryStrong }
                    }}
                  >
                    Închiriază acum
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/masini')}
            sx={{
              px: 4,
              py: 1.4,
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '14px',
              textTransform: 'none',
              color: TOKENS.ink,
              backgroundColor: TOKENS.primary,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: TOKENS.primaryStrong,
                boxShadow: 'none',
              },
            }}
          >
            Vezi toată flota disponibilă
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
