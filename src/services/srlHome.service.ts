import { api } from '../lib/axios'

/** Severitatea e decisă pe server, ca UI-ul să nu-și inventeze propriile praguri. */
export type AttentionSeverity = 'danger' | 'warning' | 'info'

export interface AttentionItem {
  id: string
  severity: AttentionSeverity
  title: string
  detail: string
  /** Segmentul de rută care rezolvă problema, relativ la rădăcina dashboardului. */
  target: string
}

export interface ActiveRentalRow {
  id: string
  carLabel: string
  tenantName: string
  startAtUtc: string
  endAtUtc: string
  weeklyRentBani: number
  status: 'active' | 'ending_soon'
}

export interface SrlHome {
  fleetSize: number
  publishedCount: number
  rentedCount: number
  availableCount: number
  activeRentals: number
  monthlyContractValueBani: number
  documentsExpiringSoon: number
  scheduledMaintenance: number
  attention: AttentionItem[]
  activeRentalRows: ActiveRentalRow[]
}

export const srlHomeService = {
  async get(): Promise<SrlHome> {
    const res = await api.get<SrlHome>('/srl/home')
    return res.data
  },
}
