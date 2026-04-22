import type {
  DashboardMetric,
  DocumentItem,
  FaqItem,
  ProfileField,
  RideAccount,
} from './types'

export const dashboardLoremText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

export const dashboardLoremLongText =
  'Actualizăm statusul documentelor pe măsură ce sunt încărcate, verificate și aprobate. Pentru completări sau clarificări, folosește tab-ul Suport.'

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Venit cash', value: '6.420 RON' },
  { label: 'Venit card', value: '8.960 RON' },
  { label: 'Taxe estimate', value: '3.180 RON'},
  { label: 'Venit Bolt', value: '7.010 RON'},
  { label: 'Venit Uber', value: '8.370 RON'},
  { label: 'Venit total', value: '15.380 RON' },
]

export const dashboardProfileFields: ProfileField[] = [
  { label: 'Email', value: 'sofer.demo@ridelance.ro' },
  { label: 'Parola', value: '**********' },
  { label: 'Plan activ', value: 'RIDElance Pro' },
]

export const dashboardRideAccounts: RideAccount[] = [
  {
    provider: 'Uber',
    accountEmail: 'demo.uber@ridelance.ro',
    status: 'Activ',
  },
  {
    provider: 'Bolt',
    accountEmail: 'demo.bolt@ridelance.ro',
    status: 'Activ',
  },
]

export const personalPfaDocuments: DocumentItem[] = [
  { title: 'Carte de identitate', status: 'In verificare', tooltip: dashboardLoremText },
  { title: 'Permis de conducere', status: 'Valid', tooltip: dashboardLoremText },
  {
    title: 'Atestat transport alternativ (Uber/Bolt)',
    status: 'Lipsa',
    tooltip: dashboardLoremText,
  },
  {
    title: 'Adeverinta medicala + psihologica',
    status: 'Valid',
    tooltip: dashboardLoremText,
  },
  { title: 'Certificat de cazier judiciar', status: 'Valid', tooltip: dashboardLoremText },
]

export const vehicleDocuments: DocumentItem[] = [
  { title: 'ITP', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'RCA', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Ecuson Uber', status: 'In verificare', tooltip: dashboardLoremText },
  { title: 'Ecuson Bolt', status: 'Lipsa', tooltip: dashboardLoremText },
  {
    title: 'Asigurare calatori si bagaje',
    status: 'Lipsa',
    tooltip: dashboardLoremText,
    purchaseLink: '#',
    complianceNote: 'Optional pentru Uber, obligatoriu pentru Bolt.',
  },
]

export const dashboardFaqItems: FaqItem[] = [
  {
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam viverra est vitae elementum interdum. Duis tempor, ante posuere feugiat blandit.',
  },
  {
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam viverra est vitae elementum interdum. Duis tempor, ante posuere feugiat blandit.',
  },
  {
    title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam viverra est vitae elementum interdum. Duis tempor, ante posuere feugiat blandit.',
  },
]


export const defaultExpenses = [
  'Leasing auto',
  'Service si mentenanta',
  'Piese auto',
  'Abonament internet',
  'Chirie masina',
  'Asigurari RCA',
  'Asigurari CASCO',
  'Alte cheltuieli cu persoane/colaboratori',
]

export const monthlyRequiredDocuments = [
  'Extrase bancare',
  'Raport venituri Uber',
  'Raport venituri Bolt',
]
