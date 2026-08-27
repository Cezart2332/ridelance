import type {
  CompanyProfile,
  Integration,
  ListingScore,
  SrlFiscalOverview,
} from '../types'

/**
 * Datele de FAZA 1. Un singur fișier, ca înlocuirea cu API-ul din FAZA 2 să fie o modificare
 * per pagină, nu o vânătoare prin componente (spec §6.2).
 *
 * Nimic de aici nu se randează în producție: paginile importă prin `useSrlMock`, care ține și
 * comutatoarele de loading/error.
 */

export const companyProfileMock: CompanyProfile = {
  id: 'company-1',
  ownerType: 'Srl',
  legalName: 'TUKI GO SRL',
  cui: 'RO12345678',
  regCom: 'J40/1234/2021',
  legalRepresentative: 'Ionescu Victor',
  registeredOffice: 'Str. Splaiul Unirii 4, București, Sector 4',
  phone: '0736 186 400',
  email: 'contact@tukigo.ro',
  website: 'https://tukigo.ro',
  publicDescription:
    'Flotă de ridesharing cu vehicule electrice și clasice. Colaborări flexibile, condiții clare și preluare rapidă.',
  logoUrl: null,
  slug: 'tuki-go',
  isVerified: true,
  visibility: { phone: true, email: true, whatsapp: true, location: true },
}

/**
 * Cele trei integrări din §3.4, fiecare într-o altă stare — altfel n-am fi văzut niciodată
 * cum arată cardul care expiră sau cel în eroare până la primul bug din producție.
 */
export const integrationsMock: Integration[] = [
  {
    provider: 'Oblio',
    status: 'connected',
    connectedAtUtc: '2026-03-11T09:20:00Z',
    expiresAtUtc: null,
    lastSyncAtUtc: '2026-08-19T06:00:00Z',
    errorMessage: null,
    details: [
      { label: 'CIF asociat', value: 'RO12345678' },
      { label: 'Serie facturi', value: 'RMS' },
    ],
  },
  {
    provider: 'Bank',
    status: 'expiring',
    connectedAtUtc: '2026-05-28T11:05:00Z',
    expiresAtUtc: '2026-08-26T11:05:00Z',
    lastSyncAtUtc: '2026-08-20T04:30:00Z',
    errorMessage: null,
    details: [
      { label: 'Bancă', value: 'Banca Transilvania' },
      { label: 'IBAN', value: 'RO** **** **** **** **** 4471' },
    ],
  },
  {
    provider: 'Eldrive',
    status: 'disconnected',
    connectedAtUtc: null,
    expiresAtUtc: null,
    lastSyncAtUtc: null,
    errorMessage: null,
    details: [],
  },
]

/**
 * TODO: confirm SRL fiscal rules.
 *
 * Valorile de mai jos sunt un exemplu de formă, nu un calcul. Spec §3.3.2 e marcat drept
 * asumpție neconfirmată și cere explicit să nu se inventeze formule fiscale — deci pagina
 * afișează ce primește și nu derivă nimic.
 */
export const fiscalOverviewMock: SrlFiscalOverview = {
  regime: 'Micro',
  vatPayer: true,
  vatPeriodicity: 'Trimestrial',
  quarterLabel: 'Trimestrul III 2026',
  estimatedQuarterlyTaxBani: 4_18000,
  declarations: [
    { code: 'D300', label: 'Decont de TVA', period: 'Trim. III 2026', dueDateUtc: '2026-10-25T00:00:00Z' },
    { code: 'D394', label: 'Declarație informativă livrări/achiziții', period: 'Trim. III 2026', dueDateUtc: '2026-10-30T00:00:00Z' },
    { code: 'D100', label: 'Obligații de plată la bugetul de stat', period: 'Trim. III 2026', dueDateUtc: '2026-10-25T00:00:00Z' },
    { code: 'D112', label: 'Contribuții și impozit pe venit', period: 'August 2026', dueDateUtc: '2026-09-25T00:00:00Z' },
    { code: 'D101', label: 'Impozit pe profit anual', period: '2026', dueDateUtc: '2027-03-25T00:00:00Z' },
  ],
}

/** Scorurile de anunț, pe id de mașină. §5.2: scorul brut se vede doar de proprietar. */
export const listingScoresMock: Record<string, ListingScore> = {
  'car-1': {
    carId: 'car-1',
    score: 72,
    suggestions: [
      { id: 'photos', label: 'Adaugă 3 poze', points: 7 },
      { id: 'map', label: 'Setează locația pe hartă', points: 10 },
      { id: 'logo', label: 'Încarcă logo-ul firmei', points: 5 },
    ],
  },
  'car-2': {
    carId: 'car-2',
    score: 45,
    suggestions: [
      { id: 'description', label: 'Scrie o descriere de cel puțin 200 de caractere', points: 15 },
      { id: 'photos', label: 'Adaugă 4 poze', points: 15 },
      { id: 'discount', label: 'Setează un preț redus', points: 20 },
    ],
  },
}
