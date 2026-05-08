import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Chip, 
  IconButton,
  Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import { DASHBOARD_TOKENS } from '../../dashboardTheme';
import { type Car, getCarImageUrl } from '../../../../services/cars.service';

interface CarCardProps {
  car: Car;
  onRentClick: (car: Car) => void;
}

export default function CarCard({ car, onRentClick }: CarCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = car.images.length > 0 ? car.images : [{ id: 'placeholder', imageUrl: '' }];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponibilă acum': return '#10b981';
      case 'În curând': return '#f59e0b';
      case 'Indisponibilă': return '#ef4444';
      case 'În service': return '#6366f1';
      default: return DASHBOARD_TOKENS.textSubtle;
    }
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
      <Box sx={{ position: 'relative', height: 240, overflow: 'hidden', bgcolor: '#f8fafc' }}>
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
            {/* Navigation Buttons */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', 
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
                <Box key={i} sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: i === activeImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s'
                }} />
              ))}
            </Stack>
          </>
        )}

        {/* Status Badge Over Image */}
        <Chip 
          label={car.status} 
          size="small"
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            fontWeight: 700, 
            fontSize: '0.65rem',
            bgcolor: 'white',
            color: getStatusColor(car.status),
            border: `1px solid ${alpha(getStatusColor(car.status), 0.2)}`
          }} 
        />
      </Box>

      {/* Info Section */}
      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack spacing={2} sx={{ flexGrow: 1 }}>
          {/* Brand & Model */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: DASHBOARD_TOKENS.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {car.offerType}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: DASHBOARD_TOKENS.ink, lineHeight: 1.2 }}>
              {car.brand} {car.model}, {car.year}
            </Typography>
          </Box>

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: DASHBOARD_TOKENS.primary }}>
              {car.pricePerWeek.toLocaleString('ro-RO')} lei
            </Typography>
            <Typography sx={{ color: DASHBOARD_TOKENS.textSubtle, fontSize: '0.85rem' }}>
              / săptămână
            </Typography>
          </Box>

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
          onClick={() => onRentClick(car)}
          disabled={car.status === 'Indisponibilă' || car.status === 'În service'}
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
          {car.status === 'În curând' ? 'Vreau detalii' : 'Închiriază acum'}
        </Button>
      </Box>
    </Box>
  );
}

import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
