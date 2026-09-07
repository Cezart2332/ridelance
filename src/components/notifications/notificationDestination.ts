import type { Notification } from '../../services/notification.service'
import { PFA_PATHS } from '../../config/pfaNavigation'
import { SRL_PATHS } from '../../config/srlNavigation'

const TITLES: Record<string, string> = {
  RecurringDocumentation: 'Documente lunare', TaxThreshold: 'Situație fiscală',
  ChatRoomMessage: 'Mesaj nou', PfaStatusUpdate: 'Dosarul PFA',
  OnboardingStarted: 'Onboarding nou', OnboardingSectionUpdate: 'Actualizare onboarding',
  OnboardingStepAwaitingAdmin: 'Dosar de verificat', OnboardingStepUpdate: 'Actualizare onboarding',
  DocumentUploaded: 'Document nou', DocumentAiCheck: 'Verificare document',
  DocumentStatusUpdate: 'Status document', PaymentConfirmed: 'Plată confirmată',
  DocumentExpiringSoon: 'Document aproape de expirare', MonthProcessed: 'Lună procesată',
  FleetAccountConfigured: 'Cont de platformă configurat', BankConnection: 'Cont bancar',
}

export function notificationTitle(notification: Notification) {
  return TITLES[notification.type] ?? 'Notificare'
}

export function notificationDestination(notification: Notification, role: string | null): string | null {
  const type = notification.type
  if (!TITLES[type]) return null
  if (role === 'Admin' || role === 'Contabil') {
    const tab = role === 'Admin' ? (type === 'ChatRoomMessage' ? 'chat' : 'pfa') : 'clients'
    const query = new URLSearchParams({ tab })
    if (notification.relatedUserId) query.set('user', notification.relatedUserId)
    if (type === 'DocumentUploaded' || type === 'DocumentExpiringSoon') query.set('section', 'documents')
    if (type === 'ChatRoomMessage') query.set('section', 'chat')
    return `/${role === 'Admin' ? 'admin' : 'contabil'}?${query}`
  }
  if (role === 'CarPoster') {
    if (type === 'ChatRoomMessage') return SRL_PATHS.support
    if (type === 'PaymentConfirmed') return SRL_PATHS.home
    if (type === 'BankConnection') return SRL_PATHS.bankAccount
    if (type.startsWith('Document')) return SRL_PATHS.companyDocuments
    return null
  }
  if (role !== 'Client') return null
  if (type === 'RecurringDocumentation') return PFA_PATHS.docsRecurring
  if (type === 'TaxThreshold') return PFA_PATHS.taxes
  if (type === 'MonthProcessed') return PFA_PATHS.financialOverview
  if (type === 'ChatRoomMessage') return notification.sectionKey === 'Contabil' ? PFA_PATHS.accountantChat : PFA_PATHS.support
  if (type === 'PaymentConfirmed') return PFA_PATHS.paymentHistoryAnchor
  if (type === 'BankConnection') return PFA_PATHS.bankAccount
  if (type === 'FleetAccountConfigured') return '/onboarding/platforms'
  if (type.startsWith('Onboarding') || type === 'PfaStatusUpdate') {
    const steps: Record<string, string> = { Pfa: 'pfa', Fiscal: 'step2', AutorizatieTransport: 'arr', CopieConforma: 'vehicle', Vehicul: 'vehicle' }
    return steps[notification.sectionKey ?? ''] ? `/onboarding/${steps[notification.sectionKey!]}` : '/onboarding'
  }
  if (type.startsWith('Document')) {
    const category = notification.sectionKey ?? ''
    if (['Talon', 'CarteIdentitateAuto', 'RCA', 'ITP', 'AsigurareCalatori', 'Casco', 'CopieConforma', 'EcusonUber', 'EcusonBolt', 'ContractVehicul', 'AcordLeasing'].includes(category)) return PFA_PATHS.docsVehicle
    if (['CertificatInregistrare', 'CertificatConstatator', 'CertificatTvaIntracomunitar', 'AutorizatieTransportAlternativ', 'RezolutieOnrc', 'AlteDocumenteInfiintare'].includes(category)) return PFA_PATHS.docsPfa
    if (['ExtrasBancar', 'RaportUber', 'RaportBolt', 'Cheltuiala', 'FacturaComisionUber', 'FacturaComisionBolt'].includes(category)) return PFA_PATHS.docsRecurring
    return PFA_PATHS.documents
  }
  return null
}
