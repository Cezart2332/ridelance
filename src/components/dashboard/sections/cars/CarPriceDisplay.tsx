import { Box, Typography } from '@mui/material';
import type { Car } from '../../../../services/cars.service';
import { hasActiveDiscount, getDiscountSavings } from '../../../../utils/carPricing';

interface CarPriceDisplayProps {
  car: Pick<Car, 'pricePerWeek' | 'oldPrice' | 'discountActive' | 'garantie'>;
  primaryColor: string;
  mutedColor: string;
  size?: 'card' | 'compact';
}

export default function CarPriceDisplay({
  car,
  primaryColor,
  mutedColor,
  size = 'card',
}: CarPriceDisplayProps) {
  const discounted = hasActiveDiscount(car);
  const savings = getDiscountSavings(car);
  const priceVariant = size === 'card' ? 'h5' : 'h6';
  const priceFontSize = size === 'card' ? undefined : '1.25rem';

  return (
    <Box sx={{ minHeight: size === 'card' ? 92 : 84 }}>
      {discounted && (
        <Typography
          sx={{
            color: mutedColor,
            fontSize: '0.78rem',
            textDecoration: 'line-through',
            mb: 0.25,
          }}
        >
          {car.oldPrice!.toLocaleString('ro-RO')} lei / săptămână
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography
          variant={priceVariant}
          sx={{ fontWeight: 900, color: primaryColor, fontSize: priceFontSize }}
        >
          {car.pricePerWeek.toLocaleString('ro-RO')} lei
        </Typography>
        <Typography sx={{ color: mutedColor, fontSize: '0.85rem' }}>/ săptămână</Typography>
      </Box>

      {discounted && (
        <Typography
          sx={{
            color: primaryColor,
            fontSize: '0.72rem',
            fontWeight: 700,
            mt: 0.4,
            opacity: 0.9,
          }}
        >
          Economisești {savings.toLocaleString('ro-RO')} lei/săptămână
        </Typography>
      )}

      {car.garantie != null && car.garantie > 0 && (
        <Typography
          sx={{
            color: mutedColor,
            fontSize: '0.72rem',
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          Garanție: {car.garantie.toLocaleString('ro-RO')} lei
        </Typography>
      )}
    </Box>
  );
}

export function CarDiscountChip({ sx }: { sx?: object }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        px: 1.2,
        py: 0.4,
        borderRadius: 1,
        bgcolor: 'rgba(239, 68, 68, 0.92)',
        color: '#fff',
        fontSize: '0.62rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        ...sx,
      }}
    >
      Reducere
    </Box>
  );
}
