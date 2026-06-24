import { api } from '../lib/axios';

export type UberDashboardPeriod = 'month' | 'year' | 'total';

export interface UberStatsDto {
  netEarnings: number;
  grossEarnings: number;
  cashCollected: number;
  commission: number;
  trips: number;
  kilometers: number;
  onlineHours: number;
  rideHours: number;
}

export interface UberImportDto extends UberStatsDto {
  id: string;
  year: number;
  month: number;
  fileType: 'earnings' | 'hours' | 'trips' | string;
  fileName: string;
  importedAtUtc: string;
}

export interface UberDashboardDto {
  period: UberDashboardPeriod;
  year: number | null;
  month: number | null;
  stats: UberStatsDto;
  imports: UberImportDto[];
}

export const uberService = {
  getDashboard: async (
    period: UberDashboardPeriod = 'month',
    year?: number,
    month?: number,
  ): Promise<UberDashboardDto> => {
    const response = await api.get<UberDashboardDto>('/uber/dashboard', {
      params: { period, year, month },
    });
    return response.data;
  },

  importCsv: async (
    files: File[],
    year?: number | null,
    month?: number | null,
  ): Promise<UberDashboardDto> => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));

    const response = await api.post<UberDashboardDto>('/uber/imports', form, {
      params: { year: year || undefined, month: month || undefined },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
