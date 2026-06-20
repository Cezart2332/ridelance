import type {
  DashboardMetric,
  DocumentItem,
  FaqItem,
  ProfileField,
  RideAccount,
  ChatMessage,
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
  { label: 'Prenume', value: 'Andrei' },
  { label: 'Nume', value: 'Popescu' },
  { label: 'Email', value: 'sofer.demo@ridelance.ro' },
  { label: 'Telefon', value: '0722 456 190' },
  { label: 'Rol', value: 'Client PFA' },
  { label: 'Parola', value: '**********' },
  { label: 'Plan activ', value: 'RIDElance Pro' },
]

export const dashboardRideAccounts: RideAccount[] = [
  {
    provider: 'Cont Uber driver',
    accountEmail: 'demo.uber@ridelance.ro',
    status: 'Completat',
  },
  {
    provider: 'Cont Bolt Driver',
    accountEmail: 'demo.bolt@ridelance.ro',
    status: 'Completat',
  },
  {
    provider: 'Uber Fleet',
    accountEmail: 'fleet.uber@ridelance.ro',
    status: 'Configurat',
  },
  {
    provider: 'Bolt Fleet',
    accountEmail: 'fleet.bolt@ridelance.ro',
    status: 'Configurat',
  },
]

export const personalPfaDocuments: DocumentItem[] = [
  { title: 'Certificat de înregistrare (CAEN 4939)', status: 'Valid', tooltip: 'Certificat de înregistrare din care reiese codul CAEN 4939.' },
  { title: 'Certificat constatator (CAEN 4939)', status: 'Valid', tooltip: 'Certificat constatator cu domeniul de activitate actualizat.' },
  {
    title: 'Certificat de atestare profesională (Atestat)',
    status: 'In verificare',
    tooltip: 'Atestat profesional pentru transport de persoane în regim de închiriere.',
  },
  { title: 'Cazier judiciar al conducătorilor auto', status: 'Valid', tooltip: 'Original, valabilitate 6 luni.' },
  {
    title: 'Aviz medical și psihologic al titularului',
    status: 'Valid',
    tooltip: 'Aviz medical și psihologic al persoanei fizice titulare.',
  },
  { title: 'Dovada plății tarifului de eliberare ARR', status: 'Lipsa', tooltip: 'Dovada plății tarifului ARR de 300 lei.' },
]

export const conformityDocuments: DocumentItem[] = [
  { title: 'Autorizația pentru transport alternativ', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Certificatul de înmatriculare (Talon)', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Cartea de identitate a autoturismului (toate paginile)', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Contract de închiriere / comodat autentificat / leasing', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Acord de leasing', status: 'Lipsa', tooltip: dashboardLoremText },
  { title: 'Dovada plății tarif copie conformă și ecusoane', status: 'In verificare', tooltip: '1 an: 116 lei; 2 ani: 216 lei; 3 ani: 316 lei.' },
]

export const vehicleDocuments: DocumentItem[] = [
  { title: 'Talon (ITP 6 luni)', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'RCA', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Copie conformă', status: 'Valid', tooltip: dashboardLoremText },
  { title: 'Ecuson Uber', status: 'In verificare', tooltip: dashboardLoremText },
  { title: 'Ecuson Bolt', status: 'Lipsa', tooltip: dashboardLoremText },
  {
    title: 'Asigurare calatori si bagaje',
    status: 'Lipsa',
    tooltip: dashboardLoremText,
    purchaseLink: '#',
    complianceNote: 'Optional pentru Uber, obligatoriu pentru Bolt.',
  },
  { title: 'Contract de comodat / de închiriere vehicul', status: 'Valid', tooltip: dashboardLoremText },
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


export const defaultExpenses: string[] = []

export const monthlyRequiredDocuments = [
  'Extrase bancare',
  'Raport venituri Uber',
  'Raport venituri Bolt',
]

export const dashboardInitialChat: ChatMessage[] = [
  { sender: 'Suport', text: 'Salut! Cu ce te putem ajuta astăzi?', time: '09:00' }
]
