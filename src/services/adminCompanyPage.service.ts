import { api } from '../lib/axios'
import type {
  BlockableSectionId,
  CompanyPageContent,
  CompanyPageModeration,
  CompanyPageReviewStatus,
  CompanyPageTheme,
  PickupLocation,
} from './company.service'

/**
 * Moderarea mini-site-urilor firmelor, din administrare.
 *
 * Pagina unei firme e singurul loc din platformă unde un cont scrie text liber și încarcă o
 * fotografie care ajung apoi pe un domeniu al nostru. De aceea nu se publică singură: proprietarul
 * salvează o ciornă, iar de aici se decide dacă versiunea aia pleacă mai departe.
 *
 * Toate acțiunile întorc detaliul complet, nu un „ok": ecranul arată ciorna și versiunea publicată
 * una lângă alta, iar o reîncărcare separată după fiecare buton ar fi clipit prin starea veche.
 */

/** O versiune a paginii — ciorna proprietarului sau copia aprobată. */
export interface AdminCompanyPageVersion {
  tagline: string | null
  publicDescription: string | null
  coverImageUrl: string | null
  theme: CompanyPageTheme
  content: CompanyPageContent
  pickup: PickupLocation
}

export interface AdminCompanyPageListItem {
  profileId: string
  userId: string
  legalName: string
  slug: string
  ownerType: 'Pfa' | 'Srl'
  cui: string | null
  ownerEmail: string
  status: CompanyPageReviewStatus
  blockedSections: BlockableSectionId[]
  submittedAtUtc: string | null
  reviewedAtUtc: string | null
  publishedAtUtc: string | null
  /** Câte anunțuri publice atârnă de pagina asta. Un refuz pe o flotă activă cântărește altfel. */
  publicCarCount: number
}

export interface AdminCompanyPageDetail {
  profileId: string
  userId: string
  legalName: string
  slug: string
  ownerType: 'Pfa' | 'Srl'
  cui: string | null
  ownerEmail: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  moderation: CompanyPageModeration
  /** Ce a scris proprietarul ultima dată. Nu e neapărat ce se vede public. */
  draft: AdminCompanyPageVersion
  /** Ce vede publicul acum. `null` când pagina n-a fost publicată niciodată. */
  published: AdminCompanyPageVersion | null
  publicCarCount: number
}

/** Ce se poate corecta din administrare. Aceleași câmpuri ca în editorul proprietarului. */
export interface AdminCompanyPageEdit {
  tagline: string | null
  publicDescription: string | null
  theme: CompanyPageTheme
  content: CompanyPageContent
  pickup: PickupLocation
}

export const adminCompanyPageService = {
  async list(params: { status?: CompanyPageReviewStatus; search?: string } = {}): Promise<AdminCompanyPageListItem[]> {
    const res = await api.get<AdminCompanyPageListItem[]>('/admin/company-pages', { params })
    return res.data
  },

  async get(profileId: string): Promise<AdminCompanyPageDetail> {
    const res = await api.get<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}`)
    return res.data
  },

  /**
   * Aprobă ciorna: copia ei devine ce vede publicul.
   *
   * `blockedSections` e starea finală, nu o adăugare — ce lipsește din listă se deblochează.
   */
  async approve(
    profileId: string,
    options: { note?: string | null; blockedSections?: BlockableSectionId[] } = {},
  ): Promise<AdminCompanyPageDetail> {
    const res = await api.post<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/review`, {
      decision: 'approve',
      note: options.note ?? null,
      blockedSections: options.blockedSections ?? null,
    })
    return res.data
  },

  /** Refuză pagina și o scoate de pe internet. Motivul e obligatoriu — proprietarul îl citește. */
  async reject(profileId: string, note: string): Promise<AdminCompanyPageDetail> {
    const res = await api.post<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/review`, {
      decision: 'reject',
      note,
      blockedSections: null,
    })
    return res.data
  },

  /** Pornește sau oprește secțiuni, fără să schimbe verdictul. */
  async setSections(
    profileId: string,
    blockedSections: BlockableSectionId[],
    note: string | null,
  ): Promise<AdminCompanyPageDetail> {
    const res = await api.put<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/sections`, {
      blockedSections,
      note,
    })
    return res.data
  },

  /** Corectează ciorna. Nu publică nimic: aprobarea rămâne un pas separat, apăsat explicit. */
  async edit(profileId: string, input: AdminCompanyPageEdit): Promise<AdminCompanyPageDetail> {
    const res = await api.put<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/content`, input)
    return res.data
  },

  /** Scoate fotografia de fundal, și din ciornă, și din versiunea publicată. */
  async removeCover(profileId: string): Promise<AdminCompanyPageDetail> {
    const res = await api.delete<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/cover`)
    return res.data
  },

  /**
   * Scoate logo-ul firmei.
   *
   * Se aplică imediat, fără aprobare: logo-ul apare și pe cardurile de anunț din marketplace, nu
   * doar pe mini-site. Fără el se afișează inițialele firmei.
   */
  async removeLogo(profileId: string): Promise<AdminCompanyPageDetail> {
    const res = await api.delete<AdminCompanyPageDetail>(`/admin/company-pages/${profileId}/logo`)
    return res.data
  },
}
