/** API enum values → Romanian labels for display */

const OFFER_TYPE_LABELS: Record<string, string> = {
  Weekly: 'Închiriere săptămânală',
  Stay: 'La rămânere',
};

const STATUS_LABELS: Record<string, string> = {
  Available: 'Disponibil',
  ComingSoon: 'În curând',
  Unavailable: 'Indisponibilă',
  InService: 'În service',
};

/** Romanian admin form labels → API values (save) */
export const OFFER_TYPE_TO_API: Record<string, string> = {
  'Închiriere săptămânală': 'Weekly',
  'La rămânere': 'Stay',
};

/** API values → Romanian admin form labels (edit) */
export const OFFER_TYPE_FROM_API: Record<string, string> = {
  Weekly: 'Închiriere săptămânală',
  Stay: 'La rămânere',
};

export const STATUS_TO_API: Record<string, string> = {
  'Disponibilă acum': 'Available',
  Disponibil: 'Available',
  'În curând': 'ComingSoon',
  Indisponibilă: 'Unavailable',
  'În service': 'InService',
};

export const STATUS_FROM_API: Record<string, string> = {
  Available: 'Disponibilă acum',
  ComingSoon: 'În curând',
  Unavailable: 'Indisponibilă',
  InService: 'În service',
};

export function formatCarOfferType(offerType: string | null | undefined): string {
  if (!offerType) return '—';
  return OFFER_TYPE_LABELS[offerType] ?? offerType;
}

export function formatCarStatus(status: string | null | undefined): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status;
}

export function isCarComingSoon(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'comingsoon' || status === 'În curând';
}

export function isCarUnavailable(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'unavailable' || status === 'Indisponibilă';
}

export function isCarInService(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'inservice' || status === 'În service';
}

export function isCarRentDisabled(status: string): boolean {
  return isCarUnavailable(status) || isCarInService(status);
}

export function getCarStatusColor(status: string): string {
  if (status === 'Available' || status === 'Disponibil' || status === 'Disponibilă acum') return '#10b981';
  if (isCarComingSoon(status)) return '#f59e0b';
  if (isCarUnavailable(status)) return '#ef4444';
  if (isCarInService(status)) return '#6366f1';
  return '#94a3b8';
}

export function matchesOfferTypeFilter(carOfferType: string, filter: string): boolean {
  if (filter === 'Toate') return true;
  return formatCarOfferType(carOfferType) === filter;
}

export function matchesStatusFilter(carStatus: string, filter: string): boolean {
  if (filter === 'Toate') return true;
  if (filter === 'Disponibilă') {
    return carStatus === 'Available' || carStatus === 'Disponibilă acum' || carStatus === 'Disponibil';
  }
  if (filter === 'În curând') {
    return isCarComingSoon(carStatus);
  }
  return false;
}
