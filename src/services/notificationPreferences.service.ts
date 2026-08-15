import { api } from '../lib/axios'

export interface NotificationPreferenceItem {
  category: string
  label: string
  /** `operational` sau `commercial` — cele două grupe se afișează separat. */
  group: 'operational' | 'commercial'
  enabled: boolean
}

export interface NotificationPreferences {
  items: NotificationPreferenceItem[]
}

export const notificationPreferencesService = {
  get: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>('/notifications/preferences')
    return response.data
  },

  update: async (items: { category: string; enabled: boolean }[]): Promise<NotificationPreferences> => {
    const response = await api.put<NotificationPreferences>('/notifications/preferences', { items })
    return response.data
  },
}
