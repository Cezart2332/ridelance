import { api } from '../lib/axios';

export interface BoltIntegrationDto {
  id: string;
  clientId: string;
  companyId: number;
  companyName: string | null;
  isConnected: boolean;
  errorMessage: string | null;
  lastFetchedAtUtc: string | null;
}

export interface BoltOrderDto {
  id: string;
  orderReference: string;
  driverName: string;
  driverPhone: string | null;
  paymentMethod: string;
  orderCreatedTime: string;
  orderStatus: string;
  pickupAddress: string;
  destinationAddress: string;
  rideDistance: number;
  ridePrice: number;
  netEarnings: number;
  tip: number;
  commission: number;
  vehicleModel: string;
  vehicleLicensePlate: string;
  orderFinishedTime: string | null;
}

export interface BoltOrdersResponse {
  orders: BoltOrderDto[];
  totalOrdersCount: number;
  totalNetEarnings: number;
  totalCommissions: number;
  totalTips: number;
}

export type BoltDashboardPeriod = 'month' | 'year' | 'total';

export interface BoltDashboardPointDto {
  label: string;
  netEarnings: number;
  ordersCount: number;
  tips: number;
  commissions: number;
  rideHours: number;
}

export interface BoltDashboardRideDto {
  id: string;
  orderCreatedTime: string;
  orderFinishedTime: string | null;
  pickupAddress: string;
  destinationAddress: string;
  rideDistanceKm: number;
  ridePrice: number;
  netEarnings: number;
  tip: number;
  commission: number;
  paymentMethod: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  rideHours: number;
}

export interface BoltDashboardDto {
  isConfigured: boolean;
  isConnected: boolean;
  lastFetchedAtUtc: string | null;
  errorMessage: string | null;
  period: BoltDashboardPeriod;
  year: number | null;
  month: number | null;
  totalOrdersCount: number;
  totalNetEarnings: number;
  totalCashEarnings: number;
  totalCardEarnings: number;
  totalBusinessEarnings: number;
  totalTips: number;
  totalCommissions: number;
  totalRideDistanceKm: number;
  totalRideHours: number;
  averageNetPerRide: number;
  averageNetPerRideHour: number;
  series: BoltDashboardPointDto[];
  recentRides: BoltDashboardRideDto[];
}

export const boltService = {
  getIntegration: async (): Promise<BoltIntegrationDto | null> => {
    const response = await api.get<BoltIntegrationDto | null>('/bolt/integration');
    return response.data;
  },

  configureIntegration: async (clientId: string, clientSecret: string): Promise<string> => {
    const response = await api.post<string>('/bolt/integration', { clientId, clientSecret });
    return response.data;
  },

  getOrders: async (limit?: number, offset?: number): Promise<BoltOrdersResponse> => {
    const response = await api.get<BoltOrdersResponse>('/bolt/orders', {
      params: { limit, offset }
    });
    return response.data;
  },

  getDashboard: async (
    period: BoltDashboardPeriod = 'month',
    year?: number,
    month?: number
  ): Promise<BoltDashboardDto> => {
    const response = await api.get<BoltDashboardDto>('/bolt/dashboard', {
      params: { period, year, month }
    });
    return response.data;
  },

  syncOrders: async (): Promise<boolean> => {
    const response = await api.post<boolean>('/bolt/sync');
    return response.data;
  },
};
