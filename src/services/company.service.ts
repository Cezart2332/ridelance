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
  logoUrl: string | null
  /** Specimenul de semnătură al firmei, dacă a fost salvat unul. */
  signatureDocumentId: string | null
  slug: string
  isVerified: boolean
  visibility: PublicVisibility
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
  publicDescription: string | null
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
  publicDescription: string | null
  isVerified: boolean
  phone: string | null
  email: string | null
  whatsAppEnabled: boolean
  location: string | null
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
