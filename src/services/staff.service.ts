import { api } from '../lib/axios'

export type StaffRole = 'Admin' | 'Contabil'

export interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  isOwner: boolean
  twoFactorEnabled: boolean
  createdAtUtc: string
  lastActivityAtUtc: string | null
  closed: boolean
}

export interface StaffInvitation {
  id: string
  fullName: string
  email: string
  role: StaffRole
  createdAtUtc: string
  expiresAtUtc: string
}

export interface StaffOverview {
  members: StaffMember[]
  invitations: StaffInvitation[]
  /** Doar proprietarul platformei invită admini. */
  canInviteAdmins: boolean
}

/** Echipa RIDElance: membrii, invitațiile și resetarea 2FA. */
export const staffService = {
  get: async (): Promise<StaffOverview> => (await api.get<StaffOverview>('/admin/staff')).data,
  invite: async (fullName: string, email: string, role: StaffRole): Promise<StaffInvitation> =>
    (await api.post<StaffInvitation>('/admin/staff/invitations', { fullName, email, role })).data,
  revoke: async (id: string): Promise<void> => {
    await api.post(`/admin/staff/invitations/${id}/revoke`)
  },
  resetTwoFactor: async (userId: string): Promise<void> => {
    await api.post(`/admin/staff/${userId}/reset-2fa`)
  },
}
