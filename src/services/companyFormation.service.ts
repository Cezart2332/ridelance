import { api } from '../lib/axios'

// --- Ramura „Nu am PFA": dosarul de înființare a societății prin partener ---

export type CompanyFormationStatus =
  | 'Draft'
  | 'Submitted'
  | 'InReviewConsulto'
  | 'InfoRequested'
  | 'Approved'
  | 'Rejected'

export type CompanyFormationStage = 'PersonalData' | 'RegisteredOffice' | 'Consent'

export type TipActIdentitate = 'CI' | 'CIE' | 'BI' | 'PasaportStrain' | 'PermisSedere'

export type RegisteredOfficeType = 'ConsultoProvided' | 'Own'

export interface Adresa {
  judet: string | null
  localitate: string | null
  strada: string | null
  numar: string | null
  bloc: string | null
  scara: string | null
  etaj: string | null
  apartament: string | null
}

export interface PersoanaFizica {
  nume: string | null
  prenume: string | null
  /** În clar doar către proprietarul dosarului; adminul primește `null` și doar masca. */
  cnp: string | null
  cnpMasked: string | null
  tipAct: TipActIdentitate
  serieAct: string | null
  numarAct: string | null
  autoritateEmitenta: string | null
  dataEmiterii: string | null
  dataExpirarii: string | null
  domiciliu: Adresa
}

export interface CompanyFormationOwner {
  id: string
  position: number
  persoana: PersoanaFizica
}

export interface CompanyFormationOffice {
  type: RegisteredOfficeType | null
  consultoOfficeId: string | null
  isOwner: boolean | null
  adresa: Adresa
  acknowledgedOwnershipDocs: boolean
  acknowledgedSubmitLater: boolean
  acknowledgedOwnerConsent: boolean | null
}

export interface CompanyFormationState {
  id: string | null
  pfaRegistrationId: string | null
  status: CompanyFormationStatus
  currentStage: CompanyFormationStage
  isLocked: boolean
  adminNote: string | null
  solicitant: PersoanaFizica
  /**
   * Câmpurile completate de OCR și neatinse încă de user (chei majuscule, ex. `CNP`,
   * `DOMICILIU_STRADA`). Poartă indicatorul „completat automat din CI".
   */
  prefilledFields: string[]
  office: CompanyFormationOffice
  owners: CompanyFormationOwner[]
  personalDataComplete: boolean
  registeredOfficeComplete: boolean
  signature: { signedAtUtc: string; imageDocumentId: string | null } | null
}

export interface PersoanaFizicaPayload {
  nume?: string | null
  prenume?: string | null
  cnp?: string | null
  tipAct?: TipActIdentitate | null
  serieAct?: string | null
  numarAct?: string | null
  autoritateEmitenta?: string | null
  dataEmiterii?: string | null
  dataExpirarii?: string | null
  domiciliu?: Partial<Adresa> | null
}

/** Un proprietar trimis spre server. `id` lipsește la cei adăugați în pagină și încă nesalvați. */
export interface OwnerPayload {
  id?: string | null
  persoana: PersoanaFizicaPayload
}

export interface RegisteredOfficePayload {
  type: RegisteredOfficeType | null
  consultoOfficeId?: string | null
  isOwner?: boolean | null
  adresa?: Partial<Adresa> | null
  acknowledgedOwnershipDocs: boolean
  acknowledgedSubmitLater: boolean
  acknowledgedOwnerConsent?: boolean | null
  owners: OwnerPayload[]
}

export interface ConsultoOffice {
  id: string
  adresa: string
  monthlyFeeBani: number
  yearlyFeeBani: number
}

export interface LegalConsentStep {
  key: string
  title: string
  subtitle: string
  body: string
  checkboxLabel: string
}

export interface LegalConsentFlow {
  version: string
  effectiveFrom: string
  steps: LegalConsentStep[]
}

export interface SignPayload {
  /** PNG cu fundal transparent, ca data URL. */
  signatureImage: string
  /** Traseele brute, ca JSON — pentru re-randare la orice rezoluție în actele PDF. */
  signatureVector: string
  canvasWidth: number
  canvasHeight: number
  consents: { stepKey: string }[]
}

// --- Vederea de operator ---

export interface ConsentAudit {
  stepKey: string
  version: string
  textSnapshot: string
  checkboxLabelSnapshot: string
  acceptedAtUtc: string
}

export interface SignatureAudit {
  signedAtUtc: string
  imageDocumentId: string | null
  ipAddress: string | null
  userAgent: string | null
  deviceType: string | null
  os: string | null
  browser: string | null
  payloadHash: string
}

export interface AdminCompanyFormation {
  /** CNP-ul vine `null`; operatorul vede doar masca, iar valoarea se cere separat. */
  dosar: CompanyFormationState
  consents: ConsentAudit[]
  signatureAudit: SignatureAudit | null
}

export const emptyAdresa = (): Adresa => ({
  judet: null,
  localitate: null,
  strada: null,
  numar: null,
  bloc: null,
  scara: null,
  etaj: null,
  apartament: null,
})

export const companyFormationService = {
  /** Starea dosarului, pentru reluare de unde a rămas. */
  async getState(): Promise<CompanyFormationState> {
    const { data } = await api.get<CompanyFormationState>('/onboarding/company-formation')
    return data
  },

  /** Etapa 1 — salvare de draft a datelor solicitantului. Se apelează la ieșirea din câmp. */
  async savePersonalData(payload: PersoanaFizicaPayload): Promise<CompanyFormationState> {
    const { data } = await api.put<CompanyFormationState>(
      '/onboarding/company-formation/personal-data',
      payload,
    )
    return data
  },

  /** Etapa 2 — sediul social, cu tot cu lista de proprietari. */
  async saveRegisteredOffice(payload: RegisteredOfficePayload): Promise<CompanyFormationState> {
    const { data } = await api.put<CompanyFormationState>(
      '/onboarding/company-formation/registered-office',
      payload,
    )
    return data
  },

  /** Adresele de sediu puse la dispoziție de Consulto. */
  async getConsultoOffices(): Promise<ConsultoOffice[]> {
    const { data } = await api.get<ConsultoOffice[]>('/onboarding/sedii-disponibile')
    return data
  },

  /** Textele wizardului, în versiunea activă. Nu trăiesc în frontend. */
  async getConsentFlow(context = 'infiintare-societate'): Promise<LegalConsentFlow> {
    const { data } = await api.get<LegalConsentFlow>('/legal/consent-flow', { params: { context } })
    return data
  },

  /**
   * Etapa 3 — consimțămintele și semnătura, atomic. `idempotencyKey` face ca un dublu-click să
   * întoarcă rezultatul primei cereri în loc să creeze a doua semnătură.
   */
  async sign(payload: SignPayload, idempotencyKey: string): Promise<CompanyFormationState> {
    const { data } = await api.post<CompanyFormationState>(
      '/onboarding/company-formation/sign',
      payload,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    )
    return data
  },

  // --- Operator ---

  /** Dosarul văzut de operator: CNP mascat plus probatoriul semnăturii. */
  async getAdminView(pfaRegistrationId: string): Promise<AdminCompanyFormation> {
    const { data } = await api.get<AdminCompanyFormation>(
      `/admin/company-formation/${pfaRegistrationId}`,
    )
    return data
  },

  /** Dezvăluie CNP-ul unei persoane din dosar. Fiecare apel intră în jurnalul dosarului. */
  async revealCnp(pfaRegistrationId: string, ownerId: string | null): Promise<string> {
    const { data } = await api.post<{ cnp: string }>(
      `/admin/company-formation/${pfaRegistrationId}/reveal-cnp`,
      { ownerId },
    )
    return data.cnp
  },

  /** Redeschide dosarul cu un motiv; consimțămintele și semnătura se invalidează. */
  async requestInfo(pfaRegistrationId: string, reason: string): Promise<AdminCompanyFormation> {
    const { data } = await api.post<AdminCompanyFormation>(
      `/admin/company-formation/${pfaRegistrationId}/request-info`,
      { reason },
    )
    return data
  },

  /** Pachetul ZIP pentru Consulto. */
  async exportPackage(pfaRegistrationId: string): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/admin/company-formation/${pfaRegistrationId}/export`,
      { responseType: 'blob' },
    )
    return data
  },
}

/** Persoană goală, pentru un proprietar nou adăugat în pagină. */
export const emptyPersoana = (): PersoanaFizica => ({
  nume: null,
  prenume: null,
  cnp: null,
  cnpMasked: null,
  tipAct: 'CI',
  serieAct: null,
  numarAct: null,
  autoritateEmitenta: null,
  dataEmiterii: null,
  dataExpirarii: null,
  domiciliu: emptyAdresa(),
})
