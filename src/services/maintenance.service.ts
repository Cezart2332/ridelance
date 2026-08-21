import { api } from '../lib/axios'

/** O intervenție de service. Sumele sunt în bani, ca peste tot în platformă. */
export interface MaintenanceEntry {
  id: string
  carId: string
  carLabel: string
  title: string
  notes: string | null
  performedAtUtc: string
  mileage: number | null
  costBani: number
  reminderDateUtc: string | null
  reminderMileage: number | null
}

export interface MaintenanceSummary {
  costLast30DaysBani: number
  scheduledCount: number
  activeReminders: number
  monitoredCars: number
}

export interface MaintenanceOverview {
  summary: MaintenanceSummary
  entries: MaintenanceEntry[]
}

export interface MaintenanceInput {
  carId: string
  title: string
  notes: string | null
  performedAtUtc: string
  mileage: number | null
  costBani: number
  reminderDateUtc: string | null
  reminderMileage: number | null
}

export const maintenanceService = {
  async getOverview(carId?: string): Promise<MaintenanceOverview> {
    const res = await api.get<MaintenanceOverview>('/maintenance', {
      params: carId ? { carId } : undefined,
    })
    return res.data
  },

  async add(input: MaintenanceInput): Promise<string> {
    const res = await api.post<{ id: string }>('/maintenance', input)
    return res.data.id
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/maintenance/${id}`)
  },
}
