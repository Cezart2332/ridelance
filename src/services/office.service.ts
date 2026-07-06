import { api } from '../lib/axios';

export type OfficeDayStatus = 'available' | 'full' | 'closed' | 'past';
export type OfficeSlotStatus = 'free' | 'past' | 'booked' | 'blocked';

export interface OfficeDayAvailability {
  date: string; // yyyy-MM-dd
  status: OfficeDayStatus;
  freeSlots: number;
}

export interface OfficeMonthAvailability {
  year: number;
  month: number;
  days: OfficeDayAvailability[];
}

export interface OfficeSlot {
  time: string; // HH:mm
  status: OfficeSlotStatus;
  // Present only on the admin endpoint:
  appointmentId?: string | null;
  visitorName?: string | null;
  visitorPhone?: string | null;
  blockedSlotId?: string | null;
  blockNote?: string | null;
}

export interface OfficeDaySlots {
  date: string;
  isOpen: boolean;
  wholeDayBlocked: boolean;
  /** Present only on the admin endpoint, when the whole day is blocked. */
  wholeDayBlockId?: string | null;
  openTime: string | null;
  closeTime: string | null;
  slots: OfficeSlot[];
}

export interface BookOfficeVisitRequest {
  date: string;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  reason: string;
}

export interface OfficeAppointment {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  status: 'Confirmed' | 'Cancelled';
  createdAtUtc: string;
}

export interface OfficeScheduleDay {
  day: number; // 0 = duminică … 6 = sâmbătă (DayOfWeek .NET)
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export const officeService = {
  // ── Public ──
  async getAvailability(year: number, month: number): Promise<OfficeMonthAvailability> {
    const res = await api.get<OfficeMonthAvailability>('/office/availability', { params: { year, month } });
    return res.data;
  },

  async getDaySlots(date: string): Promise<OfficeDaySlots> {
    const res = await api.get<OfficeDaySlots>('/office/slots', { params: { date } });
    return res.data;
  },

  async bookVisit(data: BookOfficeVisitRequest): Promise<string> {
    const res = await api.post<{ appointmentId: string }>('/office/appointments', data);
    return res.data.appointmentId;
  },

  // ── Admin ──
  async getAppointments(from?: string, to?: string): Promise<OfficeAppointment[]> {
    const res = await api.get<OfficeAppointment[]>('/office/admin/appointments', { params: { from, to } });
    return res.data;
  },

  async getAdminDay(date: string): Promise<OfficeDaySlots> {
    const res = await api.get<OfficeDaySlots>('/office/admin/day', { params: { date } });
    return res.data;
  },

  async cancelAppointment(id: string): Promise<void> {
    await api.delete(`/office/admin/appointments/${id}`);
  },

  async getSchedule(): Promise<OfficeScheduleDay[]> {
    const res = await api.get<OfficeScheduleDay[]>('/office/admin/schedule');
    return res.data;
  },

  async saveSchedule(days: OfficeScheduleDay[]): Promise<void> {
    await api.put('/office/admin/schedule', days);
  },

  async blockSlot(date: string, time: string | null, note?: string): Promise<string> {
    const res = await api.post<{ blockId: string }>('/office/admin/blocks', { date, time, note });
    return res.data.blockId;
  },

  async unblock(blockId: string): Promise<void> {
    await api.delete(`/office/admin/blocks/${blockId}`);
  },
};
