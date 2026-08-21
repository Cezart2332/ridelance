import { api } from '../lib/axios'

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
  phone: string | null
  email: string | null
  website: string | null
  publicDescription: string | null
  logoUrl: string | null
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
  phone: string | null
  email: string | null
  website: string | null
  publicDescription: string | null
  showPhone: boolean
  showEmail: boolean
  showWhatsApp: boolean
  showLocation: boolean
}

export const companyService = {
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
}
