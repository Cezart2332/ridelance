import { onboardingService } from '../../../services/onboarding.service'

/**
 * Ce sub-stare are nevoie fiecare pas mare ca predicatele lui din config să poată răspunde.
 *
 * Cheile sunt aceleași ca înainte (`step2`, `arr`, `platforms`, `vehicle`), fiindcă `refresh()`-ul
 * global le reîmprospătează pe toate deodată — un singur ciclu de reîncărcare pentru tot pasul.
 */
export interface MicroResource {
  key: string
  fetch: () => Promise<unknown>
}

export const MICRO_RESOURCES: Record<string, MicroResource[]> = {
  fiscal: [{ key: 'step2', fetch: () => onboardingService.getStep2State() }],
  arr: [{ key: 'arr', fetch: () => onboardingService.getArrState() }],
  platforms: [{ key: 'platforms', fetch: () => onboardingService.getPlatformOnboarding() }],
  vehicle: [
    { key: 'vehicle', fetch: () => onboardingService.getVehicleState() },
    // Numărul de seturi de ecusoane se derivă din platformele alese la pasul anterior.
    { key: 'platforms', fetch: () => onboardingService.getPlatformOnboarding() },
  ],
}
