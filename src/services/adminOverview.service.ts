import { api } from '../lib/axios'

export type AdminPeriodPreset = 'today' | '7d' | 'current_month' | 'last_month' | 'custom'
export type AdminRevenueType = '' | 'recurring' | 'one_time' | 'commission'
export type AdminProductFilter = '' | 'pfa' | 'cars' | 'services' | 'partners'
export type AdminPaymentStatusFilter = '' | 'succeeded' | 'failed' | 'pending' | 'refund'
export type AdminPlanFilter = '' | 'solo' | 'start' | 'pro'

export interface AdminOverviewFilters {
  periodPreset: AdminPeriodPreset
  dateFrom?: string
  dateTo?: string
  revenueType?: AdminRevenueType
  product?: AdminProductFilter
  paymentStatus?: AdminPaymentStatusFilter
  plan?: AdminPlanFilter
  city?: string
  partner?: string
}

export interface AdminMetric {
  label: string
  value: number
  amountBani?: number
  helper?: string | null
}

export interface AdminRevenueCategory {
  label: string
  amountBani: number
  count?: number
}

export interface AdminPaymentRow {
  id: string
  client: string
  productOrService: string
  paymentType: string
  amountBani: number
  status: string
  dateUtc: string
  paymentMethod: string
}

export interface AdminServiceSaleRow {
  id: string
  client: string
  service: string
  priceBani: number
  paymentStatus: string
  deliveryStatus: string
  responsible: string
  orderedAtUtc: string
}

export interface AdminOverviewPfaCard {
  id: string
  userId: string
  companyName: string
  holderName: string
  email: string
  phone: string
  plan: string
  subscriptionStatus: string
  customerAgeLabel: string
  accountStatus: string
  currentMonthStatus: string
  lastActivityLabel: string
  lastActivityAtUtc: string | null
}

export interface AdminOverviewData {
  isFallback?: boolean
  generatedAtUtc: string
  financialKpis: {
    totalCurrentMonthRevenueBani: number
    estimatedMonthlyRecurringRevenueBani: number
    oneTimeCurrentMonthRevenueBani: number
    partnerCommissionsBani: number
    successfulPayments: number
    failedPayments: number
  }
  revenueCategories: AdminRevenueCategory[]
  pfaSubscriptions: AdminMetric[]
  carSubscriptions: AdminMetric[]
  recentPayments: AdminPaymentRow[]
  failedPayments: AdminPaymentRow[]
  serviceSales: AdminServiceSaleRow[]
  carStats: {
    totalListed: number
    paidActive: number
    pendingReview: number
    failedPayment: number
    leadsGenerated: number
    monthlyRevenueBani: number
  }
  pfaStats: {
    totalEnrolled: number
    active: number
    newRequests: number
    clientBlocked: number
    inactive: number
    failedPayment: number
  }
  enrolledPfas: AdminOverviewPfaCard[]
}

export interface AdminPfaDetail {
  id: string
  userId: string
  companyName: string
  holderName: string
  email: string
  phone: string
  accountStatus: string
  plan: string
  subscriptionStatus: string
  registrationType: string
  currentMonthStatus: string
  lastActivityLabel: string
  priceBani: number | null
  subscriptionStartedAtUtc: string | null
  nextPaymentAtUtc: string | null
  lastPaymentAtUtc: string | null
  failedPayments: number
  activeDiscount: string | null
  customerAgeLabel: string
  lastProcessedMonth: string | null
  missingMonthlyDocuments: number
  documentsToReview: number
  internalNote: string
  activityLog: Array<{
    id: string
    description: string
    createdAtUtc: string
    performedBy: string
  }>
}

interface RawPfa {
  id: string
  userId: string
  userEmail: string
  userName: string
  registrationType: string
  status: string
  accountStatus?: string | null
  subscriptionStatus?: string | null
  fullName?: string | null
  phone?: string | null
  city?: string | null
  createdAtUtc: string
  lastActivityAtUtc?: string | null
  documentCount?: number | null
}

interface RawCar {
  id: string
  active: boolean
  approvalStatus: string
  paymentStatus: string
  createdAtUtc: string
  stats?: { forms?: number | null }
}

interface RawServiceOrder {
  id: string
  serviceTitle: string
  customerName: string
  customerEmail: string
  status: string
  amountBani: number | null
  createdAtUtc: string
  paidAtUtc: string | null
}

interface RawLead {
  id: string
  createdAtUtc: string
}

function getDateRange(filters: AdminOverviewFilters) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (filters.periodPreset === 'custom' && filters.dateFrom && filters.dateTo) {
    return {
      start: new Date(`${filters.dateFrom}T00:00:00`),
      end: new Date(`${filters.dateTo}T23:59:59`),
    }
  }

  if (filters.periodPreset === 'today') {
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  if (filters.periodPreset === '7d') {
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  if (filters.periodPreset === 'last_month') {
    start.setMonth(now.getMonth() - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(now.getMonth(), 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function isInRange(utc: string | null | undefined, start: Date, end: Date) {
  if (!utc) return false
  const date = new Date(utc)
  return date >= start && date <= end
}

function relativeTime(utc: string | null | undefined) {
  if (!utc) return 'Fără activitate'
  const date = new Date(utc)
  const diff = Date.now() - date.getTime()
  const mins = Math.max(0, Math.floor(diff / 60000))
  if (mins < 60) return `Acum ${mins} minute`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Acum ${hours} ${hours === 1 ? 'oră' : 'ore'}`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ieri'
  return `Acum ${days} zile`
}

function customerAge(createdAtUtc: string) {
  const created = new Date(createdAtUtc)
  const weeks = Math.max(0, Math.floor((Date.now() - created.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  if (weeks < 1) return 'Client RIDElance activ de sub o săptămână'
  if (weeks === 1) return 'Client RIDElance activ de 1 săptămână'
  return `Client RIDElance activ de ${weeks} săptămâni`
}

function normalizeStatus(status: string | null | undefined) {
  if (!status) return 'Necunoscut'
  const s = status.toLowerCase()
  if (s === 'active' || s === 'paid' || s === 'approved' || s === 'activ') return 'Activ'
  if (s === 'trial') return 'Trial'
  if (s === 'pastdue' || s === 'failed' || s === 'plată eșuată') return 'Plată eșuată'
  if (s === 'cancelled' || s === 'canceled') return 'Anulat'
  if (s === 'suspended') return 'Suspendat'
  if (s === 'pending') return 'În verificare'
  return status
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'paid' || s === 'succeeded' || s === 'active') return 'Reușită'
  if (s === 'failed' || s === 'pastdue') return 'Eșuată'
  if (s === 'pending') return 'În așteptare'
  if (s === 'refunded' || s === 'refund') return 'Refund'
  if (s === 'cancelled' || s === 'canceled') return 'Anulată'
  if (s === 'dispute' || s === 'disputed') return 'Dispută'
  return status
}

function getResponseStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return null
  const response = (error as { response?: { status?: unknown } }).response
  return typeof response?.status === 'number' ? response.status : null
}

function makePfaCard(pfa: RawPfa): AdminOverviewPfaCard {
  return {
    id: pfa.id,
    userId: pfa.userId,
    companyName: pfa.userName || pfa.fullName || 'PFA fără nume',
    holderName: pfa.fullName || pfa.userName || 'Titular necompletat',
    email: pfa.userEmail,
    phone: pfa.phone || 'Telefon necompletat',
    plan: pfa.subscriptionStatus ? 'Nespecificat' : 'Fără plan',
    subscriptionStatus: normalizeStatus(pfa.subscriptionStatus),
    customerAgeLabel: customerAge(pfa.createdAtUtc),
    accountStatus: normalizeStatus(pfa.accountStatus ?? pfa.status),
    currentMonthStatus: pfa.documentCount && pfa.documentCount > 0 ? 'În verificare' : 'Documente lipsă',
    lastActivityLabel: relativeTime(pfa.lastActivityAtUtc ?? pfa.createdAtUtc),
    lastActivityAtUtc: pfa.lastActivityAtUtc ?? null,
  }
}

async function buildFallbackOverview(filters: AdminOverviewFilters): Promise<AdminOverviewData> {
  const { start, end } = getDateRange(filters)
  const [pfaRes, carsRes, leadsRes, servicesRes] = await Promise.allSettled([
    api.get<RawPfa[] | { items: RawPfa[] }>('/pfa-registrations'),
    api.get<RawCar[]>('/cars/admin'),
    api.get<RawLead[]>('/cars/leads'),
    api.get<RawServiceOrder[]>('/payments/service-orders'),
  ])

  const pfaPayload = pfaRes.status === 'fulfilled' ? pfaRes.value.data : []
  const pfas = Array.isArray(pfaPayload) ? pfaPayload : pfaPayload.items ?? []
  const cars = carsRes.status === 'fulfilled' ? carsRes.value.data : []
  const leads = leadsRes.status === 'fulfilled' ? leadsRes.value.data : []
  const services = servicesRes.status === 'fulfilled' ? servicesRes.value.data : []

  const filteredServices = services.filter((order) =>
    isInRange(order.paidAtUtc ?? order.createdAtUtc, start, end)
  )
  const paidServices = filteredServices.filter((order) => order.status.toLowerCase() === 'paid')
  const oneTimeRevenueBani = paidServices.reduce((sum, order) => sum + (order.amountBani ?? 0), 0)

  const paidActiveCars = cars.filter((car) =>
    car.active && car.approvalStatus === 'Approved' && car.paymentStatus === 'Paid'
  )
  const failedCars = cars.filter((car) => car.paymentStatus === 'PastDue')
  const carMonthlyRevenueBani = paidActiveCars.length * 3000
  const failedPaymentsCount = failedCars.length

  const recentPayments: AdminPaymentRow[] = [
    ...filteredServices.map((order) => ({
      id: order.id,
      client: order.customerName || order.customerEmail,
      productOrService: order.serviceTitle,
      paymentType: 'One-time',
      amountBani: order.amountBani ?? 0,
      status: statusLabel(order.status),
      dateUtc: order.paidAtUtc ?? order.createdAtUtc,
      paymentMethod: 'Card / Stripe',
    })),
    ...failedCars.map((car) => ({
      id: `car-${car.id}`,
      client: 'Poster auto',
      productOrService: 'Anunț auto lunar',
      paymentType: 'Recurentă',
      amountBani: 3000,
      status: 'Eșuată',
      dateUtc: car.createdAtUtc,
      paymentMethod: 'Card / Stripe',
    })),
  ]
    .sort((a, b) => new Date(b.dateUtc).getTime() - new Date(a.dateUtc).getTime())
    .slice(0, 8)

  const enrolledPfas = pfas
    .filter((pfa) => pfa.status?.toLowerCase() === 'approved')
    .map(makePfaCard)

  return {
    isFallback: true,
    generatedAtUtc: new Date().toISOString(),
    financialKpis: {
      totalCurrentMonthRevenueBani: oneTimeRevenueBani + carMonthlyRevenueBani,
      estimatedMonthlyRecurringRevenueBani: carMonthlyRevenueBani,
      oneTimeCurrentMonthRevenueBani: oneTimeRevenueBani,
      partnerCommissionsBani: 0,
      successfulPayments: paidServices.length + paidActiveCars.length,
      failedPayments: failedPaymentsCount,
    },
    revenueCategories: [
      { label: 'Abonamente PFA', amountBani: 0, count: enrolledPfas.length },
      { label: 'Anunțuri auto lunare', amountBani: carMonthlyRevenueBani, count: paidActiveCars.length },
      { label: 'Servicii individuale', amountBani: oneTimeRevenueBani, count: paidServices.length },
      { label: 'Comisioane parteneri', amountBani: 0 },
      { label: 'Alte venituri', amountBani: 0 },
    ],
    pfaSubscriptions: [
      { label: 'Solo active', value: 0 },
      { label: 'Start active', value: 0 },
      { label: 'Pro active', value: 0 },
      { label: 'Trial', value: pfas.filter((pfa) => pfa.subscriptionStatus?.toLowerCase() === 'trial').length },
      { label: 'Anulate', value: pfas.filter((pfa) => pfa.subscriptionStatus?.toLowerCase() === 'cancelled').length },
      { label: 'Suspendate', value: pfas.filter((pfa) => pfa.accountStatus?.toLowerCase() === 'suspended').length },
      { label: 'Plată eșuată', value: pfas.filter((pfa) => pfa.subscriptionStatus?.toLowerCase() === 'pastdue').length },
    ],
    carSubscriptions: [
      { label: 'Anunțuri auto active', value: cars.filter((car) => car.active).length },
      { label: 'Anunțuri în verificare', value: cars.filter((car) => car.approvalStatus === 'Pending').length },
      { label: 'Anunțuri cu plată activă', value: paidActiveCars.length },
      { label: 'Anunțuri cu plată eșuată', value: failedCars.length },
      { label: 'Anunțuri suspendate', value: cars.filter((car) => !car.active).length },
    ],
    recentPayments,
    failedPayments: recentPayments.filter((payment) => payment.status === 'Eșuată'),
    serviceSales: filteredServices.slice(0, 8).map((order) => ({
      id: order.id,
      client: order.customerName || order.customerEmail,
      service: order.serviceTitle,
      priceBani: order.amountBani ?? 0,
      paymentStatus: statusLabel(order.status),
      deliveryStatus: order.status.toLowerCase() === 'paid' ? 'De livrat' : 'Așteaptă plata',
      responsible: 'Admin',
      orderedAtUtc: order.createdAtUtc,
    })),
    carStats: {
      totalListed: cars.length,
      paidActive: paidActiveCars.length,
      pendingReview: cars.filter((car) => car.approvalStatus === 'Pending').length,
      failedPayment: failedCars.length,
      leadsGenerated: leads.filter((lead) => isInRange(lead.createdAtUtc, start, end)).length,
      monthlyRevenueBani: carMonthlyRevenueBani,
    },
    pfaStats: {
      totalEnrolled: enrolledPfas.length,
      active: pfas.filter((pfa) => normalizeStatus(pfa.accountStatus ?? pfa.status) === 'Activ').length,
      newRequests: pfas.filter((pfa) => pfa.status?.toLowerCase() === 'pending').length,
      clientBlocked: 0,
      inactive: pfas.filter((pfa) => normalizeStatus(pfa.accountStatus ?? pfa.status) === 'Inactiv').length,
      failedPayment: pfas.filter((pfa) => pfa.subscriptionStatus?.toLowerCase() === 'pastdue').length,
    },
    enrolledPfas,
  }
}

export const adminOverviewService = {
  async getOverview(filters: AdminOverviewFilters): Promise<AdminOverviewData> {
    try {
      const response = await api.get<AdminOverviewData>('/admin/overview', { params: filters })
      return response.data
    } catch (error: unknown) {
      const status = getResponseStatus(error)
      if (status && status !== 404) throw error
      return buildFallbackOverview(filters)
    }
  },

  async getPfaDetails(pfaId: string): Promise<AdminPfaDetail> {
    const response = await api.get<AdminPfaDetail>(`/admin/pfas/${pfaId}/details`)
    return response.data
  },

  async changePfaPlan(pfaId: string, plan: 'solo' | 'start' | 'pro', effective: 'immediate' | 'next_cycle') {
    const response = await api.post(`/admin/pfas/${pfaId}/change-plan`, { plan, effective })
    return response.data
  },

  async applyPfaDiscount(
    pfaId: string,
    data: { type: 'percent' | 'fixed'; value: number; validUntilUtc?: string | null; note?: string | null },
  ) {
    const response = await api.post(`/admin/pfas/${pfaId}/discount`, data)
    return response.data
  },

  async suspendPfa(pfaId: string, reason?: string) {
    const response = await api.post(`/admin/pfas/${pfaId}/suspend`, { reason })
    return response.data
  },

  async reactivatePfa(pfaId: string, note?: string) {
    const response = await api.post(`/admin/pfas/${pfaId}/reactivate`, { note })
    return response.data
  },

  async updatePfaInternalNote(pfaId: string, content: string) {
    const response = await api.put(`/admin/pfas/${pfaId}/internal-note`, { content })
    return response.data
  },
}
