import { api } from '../lib/axios'

/**
 * Predarea și primirea unei mașini închiriate.
 *
 * Aceleași câmpuri în ambele momente, plus deconturile la primire. Sumele sunt în bani, ca peste
 * tot; `null` înseamnă „necompletat", nu zero.
 */

export type CheckKind = 'CheckIn' | 'CheckOut'

/** Unghiurile fotografiate. Aceleași pe ambele părți, ca să se poată pune una lângă alta. */
export const CHECK_SLOTS = ['Front', 'Rear', 'Left', 'Right', 'Interior', 'Dashboard', 'Extra'] as const

export type CheckSlot = (typeof CHECK_SLOTS)[number]

export const SLOT_LABELS: Record<CheckSlot, string> = {
  Front: 'Față',
  Rear: 'Spate',
  Left: 'Stânga',
  Right: 'Dreapta',
  Interior: 'Interior',
  Dashboard: 'Bord',
  Extra: 'Altele',
}

export interface CheckPhoto {
  id: string
  slot: CheckSlot
  documentId: string
}

export interface CheckRecord {
  id: string
  kind: CheckKind
  occurredAtUtc: string
  mileage: number
  fuelLevel: string | null
  accessories: string[]
  notes: string | null
  depositReturnedBani: number | null
  depositWithheldBani: number | null
  withholdingReason: string | null
  extraMileageChargeBani: number | null
  otherChargesBani: number | null
  photos: CheckPhoto[]
}

export interface Checks {
  checkIn: CheckRecord | null
  checkOut: CheckRecord | null
}

export interface CheckInput {
  occurredAtUtc: string
  mileage: number
  fuelLevel: string | null
  accessories: string[]
  notes: string | null
  depositReturnedBani: number | null
  depositWithheldBani: number | null
  withholdingReason: string | null
  extraMileageChargeBani: number | null
  otherChargesBani: number | null
}

export interface VehicleEvent {
  id: string
  type: string
  description: string
  occurredAtUtc: string
}

export const checksService = {
  async get(rentalId: string): Promise<Checks> {
    const res = await api.get<Checks>(`/rentals/${rentalId}/checks`)
    return res.data
  },

  async save(rentalId: string, kind: CheckKind, input: CheckInput): Promise<string> {
    const res = await api.put<{ id: string }>(`/rentals/${rentalId}/checks/${kind}`, input)
    return res.data.id
  },

  /** Urcă fotografia unui slot. A doua o înlocuiește pe prima — un slot, o poză. */
  async addPhoto(rentalId: string, kind: CheckKind, slot: CheckSlot, file: File): Promise<void> {
    const form = new FormData()
    form.append('file', file)
    form.append('slot', slot)
    await api.post(`/rentals/${rentalId}/checks/${kind}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async getTimeline(carId: string): Promise<VehicleEvent[]> {
    const res = await api.get<VehicleEvent[]>(`/cars/${carId}/timeline`)
    return res.data
  },
}
