import { api } from '../lib/axios';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: string;
  createdAtUtc: string;
}

export interface MonthlyRevenuePoint {
  month: number;
  venitTotal: number;
}

export interface RecentDocumentDto {
  id: string;
  originalFileName: string;
  category: string;
  status: string;
  uploadedAtUtc: string;
}

export interface DashboardSummary {
  pfaRegistrationId?: string | null;
  pfaStatus: string | null;
  pfaRegistrationType: string | null;
  pfaCui: string | null;
  pfaCertificatId: string | null;
  pfaCreatedAtUtc: string | null;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  unreadNotifications: number;
  recentDocuments: RecentDocumentDto[];
  venitCash?: number | null;
  venitCard?: number | null;
  venitBolt?: number | null;
  venitUber?: number | null;
  taxeEstimate?: number | null;
  venitTotal?: number | null;
  incomeYear?: number | null;
  incomeMonth?: number | null;
  revenueChartYear?: number;
  monthlyRevenue?: MonthlyRevenuePoint[];
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/users/dashboard-summary');
    return response.data;
  },

  inviteContabil: async (fullName: string, email: string): Promise<string> => {
    const response = await api.post<string>('/users/invite-contabil', { fullName, email });
    return response.data;
  },
};

