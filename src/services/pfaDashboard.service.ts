import { api } from '../lib/axios';

/* ── Filtre ──────────────────────────────────────────────────────────────── */

export type DashboardPlatform = 'all' | 'bolt' | 'uber';
export type DashboardPayment = 'all' | 'card' | 'cash';

export interface DashboardQuery {
  from: string;
  to: string;
  platform: DashboardPlatform;
  payment: DashboardPayment;
}

/* ── /pfa/dashboard/summary ──────────────────────────────────────────────── */

/** `previous` e null când nu există date de comparat — atunci nu se randează delta. */
export interface DashboardMetric {
  value: number;
  previous: number | null;
}

export interface DashboardFeeMetric extends DashboardMetric {
  byPlatform: { bolt: number; uber: number };
}

export interface DashboardKpis {
  netEarnings: DashboardMetric;
  platformFees: DashboardFeeMetric;
  onlineHours: DashboardMetric;
  rideKm: DashboardMetric;
  netPerHour: DashboardMetric;
  netPerKm: DashboardMetric;
}

export interface TaxComponent {
  key: string;
  label: string;
  amount: number;
  rate: number | null;
  basis: number | null;
  note: string | null;
}

export interface TaxReserve {
  scope: 'period' | 'fiscalMonth';
  total: number;
  components: TaxComponent[];
  fiscalMonth: { month: string; total: number };
}

export interface RealProfit {
  netEarnings: number;
  deductibleExpenses: number;
  estimatedTaxes: number;
  value: number;
  retentionRatio: number | null;
  /**
   * Cât din cheltuielile perioadei a intrat deja în calcul, dar are documentul neverificat de
   * RIDElance. Zero înseamnă că totul e validat.
   */
  expensesAwaitingReview: number;
}

export interface PlatformSplitRow {
  platform: 'bolt' | 'uber';
  net: number;
  fees: number;
  cash: number;
  card: number;
  rides: number;
}

export interface NetEarningsPoint {
  bucket: string;
  label: string;
  bolt: number;
  uber: number;
  total: number;
  rides: number;
}

export interface FeesAndTaxesPoint {
  bucket: string;
  label: string;
  boltFee: number;
  uberFee: number;
  vatIntracom: number;
  boltNonResident: number;
}

/**
 * Un bucket din seria financiară. Cheltuielile și taxele vin deja repartizate de server —
 * proporția e regula lui, nu a graficului.
 */
export interface RealProfitPoint {
  bucket: string;
  label: string;
  netEarnings: number;
  deductibleExpenses: number;
  estimatedTaxes: number;
  value: number;
}

export interface DashboardSources {
  bolt: {
    configured: boolean;
    connected: boolean;
    lastSyncAt: string | null;
    errorMessage: string | null;
  };
  uber: {
    connected: boolean;
    lastReportAt: string | null;
    detectedRange: string | null;
  };
}

export interface PfaDashboardSummary {
  period: { from: string; to: string; granularity: 'day' | 'month' };
  kpis: DashboardKpis;
  taxReserve: TaxReserve;
  realProfit: RealProfit;
  platformSplit: PlatformSplitRow[];
  series: {
    netEarnings: NetEarningsPoint[];
    feesAndTaxes: FeesAndTaxesPoint[];
    realProfit: RealProfitPoint[];
  };
  sources: DashboardSources;
  /** Uber livrează doar totaluri lunare; în serii sunt repartizate, nu măsurate. */
  uberIsMonthlyAggregate: boolean;
}

/* ── /pfa/dashboard/rides ────────────────────────────────────────────────── */

export interface RideRow {
  id: string;
  platform: 'bolt' | 'uber';
  startedAtUtc: string;
  category: string | null;
  pickup: string | null;
  dropoff: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  paymentType: 'card' | 'cash';
  net: number;
}

export interface RidesPage {
  items: RideRow[];
  page: number;
  pageSize: number;
  total: number;
  /** Fals cât timp Uber nu expune curse individuale, doar rapoarte lunare. */
  uberRidesAvailable: boolean;
}

export interface RidesQuery extends DashboardQuery {
  page: number;
  pageSize: number;
  sort: string;
  q: string;
}

export const pfaDashboardService = {
  getSummary: async (query: DashboardQuery, signal?: AbortSignal): Promise<PfaDashboardSummary> => {
    const response = await api.get<PfaDashboardSummary>('/pfa/dashboard/summary', {
      params: query,
      signal,
    });
    return response.data;
  },

  getRides: async (query: RidesQuery, signal?: AbortSignal): Promise<RidesPage> => {
    const response = await api.get<RidesPage>('/pfa/dashboard/rides', {
      params: query,
      signal,
    });
    return response.data;
  },
};
