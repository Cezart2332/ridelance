export type DashboardMetric = {
  label: string
  value: string
}

export type ProfileField = {
  label: string
  value: string
}

export type RideAccount = {
  provider: string
  accountEmail: string
  status: string
}

export type DocumentItem = {
  title: string
  status: 'Valid' | 'In verificare' | 'Lipsa'
  tooltip: string
  purchaseLink?: string
  complianceNote?: string
}

export type FaqItem = {
  title: string
  text: string
}

export type ChatMessage = {
  sender: string
  text: string
  time: string
}
