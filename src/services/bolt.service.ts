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

  syncOrders: async (): Promise<boolean> => {
    const response = await api.post<boolean>('/bolt/sync');
    return response.data;
  },
};
