import type { Car } from '../services/cars.service';

export function hasActiveDiscount(car: Pick<Car, 'discountActive' | 'oldPrice' | 'pricePerWeek'>): boolean {
  return Boolean(
    car.discountActive &&
    car.oldPrice != null &&
    car.oldPrice > car.pricePerWeek
  );
}

export function getDiscountSavings(car: Pick<Car, 'oldPrice' | 'pricePerWeek'>): number {
  if (car.oldPrice == null) return 0;
  return Math.max(0, car.oldPrice - car.pricePerWeek);
}
