import { api } from '../lib/axios'
import type { Car } from './cars.service'

/**
 * Profilul firmei — identitatea juridică și publică a contului.
 *
 * Tipurile sunt cele pe care le folosea deja mock-ul din FAZA 1, deci paginile nu s-au schimbat
 * odată cu sursa.
 */

export interface PublicVisibility {
  phone: boolean
  email: boolean
  whatsapp: boolean
  location: boolean
}

/** O cheie de iconiță pentru avantaje. Sincronizată cu `CompanyPageIcons` de pe server. */
export type HighlightIconKey =
  | 'check'
  | 'shield'
  | 'clock'
  | 'wallet'
  | 'car'
  | 'phone'
  | 'star'
  | 'wrench'
  | 'map'
  | 'bolt'

/** Culorile mini-site-ului. Control complet — serverul verifică doar că sunt hex-uri valide. */
export interface CompanyPageTheme {
  accent: string
  background: string
  surface: string
  text: string
  buttonText: string
  heroOverlay: string
  /** 0..90. 100 ar ascunde complet fotografia de cover. */
  heroOverlayOpacity: number
}

export interface CompanyPageHighlight {
  iconKey: HighlightIconKey
  title: string
  text: string
}

export interface CompanyPageScheduleRow {
  day: string
  hours: string
}

export interface CompanyPageFaq {
  question: string
  answer: string
}

/**
 * Conținutul secțiunilor proprii ale mini-site-ului.
 *
 * Fără comutatoare de vizibilitate: o secțiune apare dacă are conținut. Vezi `sections.ts`.
 */
export interface CompanyPageContent {
  highlights: CompanyPageHighlight[]
  schedule: CompanyPageScheduleRow[]
  coverageAreas: string[]
  coverageNote: string | null
  faq: CompanyPageFaq[]
}

/**
 * Locul de unde se preiau mașinile.
 *
 * Separat de sediul social: sediul e o adresă juridică, de multe ori a contabilului, și e supus
 * comutatorului de vizibilitate din Profil. Ăsta e locul unde omul chiar vine după mașină, iar
 * completarea lui e chiar actul de a-l publica.
 *
 * Coordonatele pot lipsi când s-a scris doar adresa: secțiunea arată atunci textul, fără hartă.
 */
export interface PickupLocation {
  address: string | null
  latitude: number | null
  longitude: number | null
  /** Indicația practică de lângă hartă: „intrarea din spate", „lângă benzinărie". */
  note: string | null
}

export const EMPTY_PICKUP: PickupLocation = {
  address: null,
  latitude: null,
  longitude: null,
  note: null,
}

/** Ce se salvează din editorul de mini-site. Identitatea juridică se salvează separat. */
export interface CompanyPageInput {
  tagline: string | null
  publicDescription: string | null
  theme: CompanyPageTheme
  content: CompanyPageContent
  pickup: PickupLocation
}

export interface SuggestedHighlight {
  iconKey: HighlightIconKey
  title: string
  text: string
}

/** Propunerile modelului. Nu se salvează nimic până nu alege omul. */
export interface CompanyDescriptionSuggestion {
  tagline: string | null
  descriptions: string[]
  highlights: SuggestedHighlight[]
}

/**
 * Unde a ajuns mini-site-ul în drumul lui către public.
 *
 * `Approved` nu înseamnă că ciorna din editor e cea live: după orice salvare, pagina redevine
 * `Pending`, dar versiunea aprobată anterior rămâne vizibilă. `publishedAtUtc` e cel care spune
 * dacă publicul chiar vede ceva.
 */
export type CompanyPageReviewStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'

/** Secțiunile pe care administrarea le poate opri. Sincronizată cu `CompanyPageSections` de pe server. */
export type BlockableSectionId = 'despre' | 'avantaje' | 'program' | 'intrebari' | 'locatie'

export interface CompanyPageModeration {
  status: CompanyPageReviewStatus
  /** Oprite de RIDElance. Proprietarul nu le poate reactiva singur. */
  blockedSections: BlockableSectionId[]
  /** Motivul scris de administrare, când există unul. */
  note: string | null
  submittedAtUtc: string | null
  reviewedAtUtc: string | null
  /** Când a fost aprobată versiunea live. `null` = pagina n-a fost publicată niciodată. */
  publishedAtUtc: string | null
}

/** Starea unui cont care încă n-a salvat nimic: nimic scris, deci nimic de verificat. */
export const EMPTY_PAGE_MODERATION: CompanyPageModeration = {
  status: 'Draft',
  blockedSections: [],
  note: null,
  submittedAtUtc: null,
  reviewedAtUtc: null,
  publishedAtUtc: null,
}

export interface CompanyProfile {
  id: string
  ownerType: 'Pfa' | 'Srl'
  legalName: string
  cui: string | null
  regCom: string | null
  legalRepresentative: string | null
  registeredOffice: string | null
  /** Contul în care se încasează chiriile. Intră în contracte și în facturi. */
  iban: string | null
  phone: string | null
  email: string | null
  website: string | null
  publicDescription: string | null
  /** Fraza scurtă de sub denumire, în antetul mini-site-ului. */
  tagline: string | null
  logoUrl: string | null
  /** Fotografia de fundal a mini-site-ului. */
  coverImageUrl: string | null
  pageTheme: CompanyPageTheme
  pageContent: CompanyPageContent
  pickup: PickupLocation
  /** Specimenul de semnătură al firmei, dacă a fost salvat unul. */
  signatureDocumentId: string | null
  slug: string
  isVerified: boolean
  visibility: PublicVisibility
  /** Verdictul administrării asupra paginii publice. Ce e mai sus e ciorna, nu ce se vede afară. */
  pageModeration: CompanyPageModeration
}

/** Ce se poate edita. `slug`, `isVerified` și `logoUrl` nu sunt aici: nu le stabilește clientul. */
export interface CompanyProfileInput {
  legalName: string
  cui: string | null
  regCom: string | null
  legalRepresentative: string | null
  registeredOffice: string | null
  iban: string | null
  phone: string | null
  email: string | null
  website: string | null
  showPhone: boolean
  showEmail: boolean
  showWhatsApp: boolean
  showLocation: boolean
}

/** Mini-site-ul public. Contactele lipsesc când proprietarul le-a marcat private. */
export interface PublicCompany {
  legalName: string
  slug: string
  logoUrl: string | null
  coverImageUrl: string | null
  tagline: string | null
  publicDescription: string | null
  isVerified: boolean
  phone: string | null
  email: string | null
  website: string | null
  whatsAppEnabled: boolean
  location: string | null
  theme: CompanyPageTheme
  content: CompanyPageContent
  pickup: PickupLocation
  cars: Car[]
}

/** Datele publice ale unei firme din registrul ANAF. */
export interface CompanyLookup {
  cui: string
  name: string
  address: string | null
  city: string | null
  county: string | null
  registrationNumber: string | null
  vatPayer: boolean
}

export const companyService = {
  /**
   * Caută firma după CUI, în registrul ANAF.
   *
   * `null` când registrul n-o are: un CUI greșit nu e o eroare de sistem, e un CUI greșit, și se
   * spune omului ca atare, nu printr-o alertă roșie de eșec.
   */
  async lookupByCui(cui: string): Promise<CompanyLookup | null> {
    try {
      const res = await api.get<CompanyLookup>(`/companies/lookup/${encodeURIComponent(cui)}`)
      return res.data
    } catch {
      return null
    }
  },

  /** Public: nu cere autentificare și e filtrat de serverul care decide ce e vizibil. */
  async getPublic(slug: string): Promise<PublicCompany> {
    const res = await api.get<PublicCompany>(`/companies/${slug}/public`)
    return res.data
  },

  /**
   * `null` când contul încă nu și-a completat datele — serverul răspunde 204, nu 404.
   * E starea normală a unui cont nou, nu o eroare.
   */
  async getProfile(): Promise<CompanyProfile | null> {
    const res = await api.get<CompanyProfile | ''>('/companies/profile')
    return res.status === 204 || !res.data ? null : res.data
  },

  async saveProfile(input: CompanyProfileInput): Promise<CompanyProfile> {
    const res = await api.put<CompanyProfile>('/companies/profile', input)
    return res.data
  },

  /**
   * Salvează tot ce ține de mini-site: slogan, descriere, culori, secțiuni.
   *
   * Salvarea e și cererea de verificare — profilul se întoarce cu `pageModeration.status`
   * `Pending`. Versiunea aprobată anterior, dacă există, rămâne live până la noul verdict.
   */
  async savePage(input: CompanyPageInput): Promise<CompanyProfile> {
    const res = await api.put<CompanyProfile>('/companies/profile/page', input)
    return res.data
  },

  async uploadCover(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)

    const res = await api.post<{ coverImageUrl: string }>('/companies/profile/cover', form)
    return res.data.coverImageUrl
  },

  async deleteCover(): Promise<void> {
    await api.delete('/companies/profile/cover')
  },

  /**
   * Cere modelului propuneri de text. Nu salvează nimic — alegerea rămâne a omului.
   */
  async suggestDescription(hints: string | null): Promise<CompanyDescriptionSuggestion> {
    const res = await api.post<CompanyDescriptionSuggestion>('/companies/profile/page/description', {
      hints,
    })
    return res.data
  },

  async uploadLogo(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)

    const res = await api.post<{ logoUrl: string }>('/companies/profile/logo', form)
    return res.data.logoUrl
  },

  /**
   * Salvează specimenul de semnătură. `image` e PNG-ul din pânză, ca data-URL.
   *
   * Se trimite ca text, nu ca fișier: vine dintr-o pânză de desenat, nu de pe discul cuiva.
   */
  async saveSignature(image: string): Promise<string> {
    const res = await api.put<{ signatureDocumentId: string }>('/companies/profile/signature', {
      signatureImage: image,
    })
    return res.data.signatureDocumentId
  },

  async deleteSignature(): Promise<void> {
    await api.delete('/companies/profile/signature')
  },
}
