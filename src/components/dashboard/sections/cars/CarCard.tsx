import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Chip, 
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import { DASHBOARD_TOKENS } from '../../dashboardTheme';
import { carsService, type Car, getCarImageUrl } from '../../../../services/cars.service';
import { hasActiveDiscount } from '../../../../utils/carPricing';
import {
  formatCarOfferType,
  formatCarListingLabel,
  formatCarStatus,
  getCarStatusColor,
  isCarComingSoon,
  isCarRentDisabled,
} from '../../../../utils/carLabels';
import CarPriceDisplay, { CarDiscountChip } from './CarPriceDisplay';
import { useSwipeGallery } from './useSwipeGallery';

interface CarCardProps {
  car: Car;
  onRentClick: (car: Car) => void;
}

export default function CarCard({ car, onRentClick }: CarCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = car.images.length > 0 ? car.images : [{ id: 'placeholder', imageUrl: '' }];
  const { swipeHandlers, goNext, goPrev } = useSwipeGallery(images.length, setActiveImageIndex);

  useEffect(() => {
    if (!car.id) return;
    carsService.trackView(car.id).catch(() => {});
  }, [car.id]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    goNext();
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    goPrev();
  };

  return (
    <Box sx={{
      borderRadius: DASHBOARD_TOKENS.radius.lg,
      overflow: 'hidden',
      backgroundColor: DASHBOARD_TOKENS.paper,
      border: `1px solid ${alpha(DASHBOARD_TOKENS.ink, 0.08)}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: `0 20px 40px ${alpha(DASHBOARD_TOKENS.ink, 0.1)}`,
        borderColor: alpha(DASHBOARD_TOKENS.primary, 0.2),
      }
    }}>
      {/* Gallery Section */}
      <Box
        sx={{
          position: 'relative',
          height: 240,
          overflow: 'hidden',
          bgcolor: '#f8fafc',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
        {...(images.length > 1 ? swipeHandlers : {})}
      >
        {images[activeImageIndex]?.imageUrl ? (
          <img 
            src={getCarImageUrl(images[activeImageIndex].imageUrl)} 
            alt={`${car.brand} ${car.model}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(DASHBOARD_TOKENS.ink, 0.05) }}>
             <Box sx={{ textAlign: 'center', opacity: 0.2 }}>
                <DirectionsCarFilledRoundedIcon sx={{ fontSize: 64 }} />
                <Typography variant="caption" sx={{ display: 'block' }}>Fără foto</Typography>
             </Box>
          </Box>
        )}
        
        {images.length > 1 && (
          <>
            {/* Navigation Buttons (desktop / pointer devices) */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center', 
              justifyContent: 'space-between',
              px: 1,
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1 }
            }}>
              <IconButton 
                size="small" 
                onClick={prevImage}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={nextImage}
                sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </Box>

            {/* Dots */}
            <Stack direction="row" spacing={0.8} sx={{ 
              position: 'absolute', 
              bottom: 12, 
              left: '50%', 
              transform: 'translateX(-50%)' 
            }}>
              {images.map((_, i) => (
                <Box
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`Imaginea ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(i);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImageIndex(i);
                    }
                  }}
                  sx={{ 
                  width: i === activeImageIndex ? 8 : 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: i === activeImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }} />
              ))}
            </Stack>
          </>
        )}

        {hasActiveDiscount(car) && <CarDiscountChip />}

        {/* Status Badge Over Image */}
        <Chip 
          label={formatCarStatus(car.status)} 
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            fontWeight: 700, 
            fontSize: '0.65rem',
            bgcolor: 'white',
            color: getCarStatusColor(car.status),
            border: `1px solid ${alpha(getCarStatusColor(car.status), 0.2)}`
          }} 
        />
      </Box>

      {/* Info Section */}
      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={2} sx={{ flexGrow: 1 }}>
          {/* Brand & Model */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: DASHBOARD_TOKENS.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {formatCarOfferType(car.offerType)}
            </Typography>
            <Chip
              label={formatCarListingLabel(car.listingSource)}
              size="small"
              sx={{
                mt: 0.75,
                height: 22,
                fontWeight: 700,
                fontSize: '0.65rem',
                bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.1),
                color: DASHBOARD_TOKENS.primaryStrong,
                border: `1px solid ${alpha(DASHBOARD_TOKENS.primary, 0.2)}`,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink, lineHeight: 1.2 }}>
              {car.brand} {car.model}, {car.year}
            </Typography>
            {car.description && (
              <Typography 
                sx={{ 
                  fontSize: '0.82rem', 
                  color: alpha(DASHBOARD_TOKENS.ink, 0.7), 
                  mt: 1.5, 
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  backgroundColor: alpha(DASHBOARD_TOKENS.ink, 0.03),
                  p: 1.5,
                  borderRadius: `${DASHBOARD_TOKENS.radius.sm}px`,
                  borderLeft: `3px solid ${DASHBOARD_TOKENS.primary}`,
                  fontStyle: 'italic',
                }}
              >
                {car.description}
              </Typography>
            )}
          </Box>

          {/* Price */}
          <CarPriceDisplay
            car={car}
            primaryColor={DASHBOARD_TOKENS.primary}
            mutedColor={DASHBOARD_TOKENS.textSubtle}
          />

          {/* Quick Details Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <LocalGasStationOutlinedIcon sx={{ fontSize: 16, color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} />
              <Typography sx={{ fontSize: '0.8rem', color: alpha(DASHBOARD_TOKENS.ink, 0.7) }}>{car.engine}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <SettingsOutlinedIcon sx={{ fontSize: 16, color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} />
              <Typography sx={{ fontSize: '0.8rem', color: alpha(DASHBOARD_TOKENS.ink, 0.7) }}>{car.transmission}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gridColumn: 'span 2' }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 16, color: alpha(DASHBOARD_TOKENS.ink, 0.4) }} />
              <Typography sx={{ fontSize: '0.8rem', color: alpha(DASHBOARD_TOKENS.ink, 0.7) }}>{car.location}</Typography>
            </Stack>
          </Box>

          {/* Categories */}
          {(car.uberCategories.length > 0 || car.boltCategories.length > 0) && (
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: alpha(DASHBOARD_TOKENS.ink, 0.4), textTransform: 'uppercase' }}>
                  Categorii acceptate
                </Typography>
                <Tooltip title="Mașina este eligibilă pentru aceste categorii pe Uber și Bolt">
                  <InfoOutlinedIcon sx={{ fontSize: 12, color: alpha(DASHBOARD_TOKENS.ink, 0.3) }} />
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {[...car.uberCategories, ...car.boltCategories].map((cat, i) => (
                  <Chip 
                    key={i} 
                    label={cat} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.65rem', 
                      fontWeight: 600, 
                      borderColor: alpha(DASHBOARD_TOKENS.ink, 0.08),
                      color: alpha(DASHBOARD_TOKENS.ink, 0.6)
                    }} 
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Badges */}
          {car.badges.length > 0 && (
            <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 'auto', flexWrap: 'wrap' }}>
              {car.badges.map((badge, i) => (
                <Box key={i} sx={{ 
                  px: 1, 
                  py: 0.4, 
                  borderRadius: 1, 
                  bgcolor: alpha(DASHBOARD_TOKENS.primary, 0.05),
                  color: DASHBOARD_TOKENS.primaryStrong,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {badge}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>

        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            carsService.trackClick(car.id).catch(() => {});
            onRentClick(car);
          }}
          disabled={isCarRentDisabled(car.status)}
          sx={{
            mt: 3,
            py: 1.4,
            borderRadius: DASHBOARD_TOKENS.radius.md,
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'none',
            background: `linear-gradient(135deg, ${DASHBOARD_TOKENS.primary} 0%, ${DASHBOARD_TOKENS.primaryStrong} 100%)`,
            boxShadow: `0 4px 12px ${alpha(DASHBOARD_TOKENS.primary, 0.2)}`,
            '&:hover': {
              boxShadow: `0 6px 16px ${alpha(DASHBOARD_TOKENS.primary, 0.3)}`,
              transform: 'translateY(-1px)',
            }
          }}
        >
          {isCarComingSoon(car.status) ? 'Vreau detalii' : 'Închiriază acum'}
        </Button>
      </Box>
    </Box>
  );
}
