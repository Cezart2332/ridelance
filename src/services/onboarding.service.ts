import { api } from '../lib/axios'

export type OnboardingSectionStatus =
  | 'Locked'
  | 'InProgress'
  | 'AwaitingValidation'
  | 'Validated'
  | 'Rejected'

export interface OnboardingSectionState {
  key: string
  status: OnboardingSectionStatus
  note: string | null
  submittedAtUtc: string | null
  validatedAtUtc: string | null
}

export interface OnboardingState {
  pfaRegistrationId: string | null
  pfaStatus: string | null
  registrationType: string | null
  pfaReviewNote: string | null
  hasPaidInfiintare: boolean
  sections: OnboardingSectionState[]
  allSectionsValidated: boolean
  /** Proiecția pe 6 pași (status derivat pe server). */
  steps: OnboardingStep[]
  /** Ramura „Nu am PFA": starea dosarului de înființare. Null pentru „Am PFA". */
  companyFormationStatus: string | null
  /** Etapa la care a rămas dosarul: `PersonalData`, `RegisteredOffice` sau `Consent`. */
  companyFormationStage: string | null
  /** DOAR PENTRU TESTARE — de șters odată cu skipStep(). */
  testSkipEnabled: boolean
}

export type OnboardingStepStatus = 'Locked' | 'InProgress' | 'AwaitingValidation' | 'Completed'

export interface OnboardingStep {
  order: number
  key: string
  label: string
  status: OnboardingStepStatus
  blockReason: string | null
  path: string
}

export type EligibilityStatus = 'Pending' | 'Eligible' | 'Ineligible' | 'NeedsReview'

export interface EligibilityProfile {
  id: string | null
  dateOfBirth: string | null
  idSeriesMask: string | null
  categoryBObtainedOn: string | null
  drivingCategories: string | null
  drivingLicenceExpiresOn: string | null
  hasDriverCertificate: boolean
  driverCertificateExpiresOn: string | null
  status: EligibilityStatus
  reasons: string[]
}

export interface EligibilityPayload {
  dateOfBirth?: string | null
  idSeriesMask?: string | null
  categoryBObtainedOn?: string | null
  drivingCategories?: string | null
  drivingLicenceExpiresOn?: string | null
  hasDriverCertificate: boolean
  driverCertificateExpiresOn?: string | null
}

export type PartnerLeadStatus =
  | 'RequestSent'
  | 'Contacted'
  | 'InProgress'
  | 'PfaCreated'
  | 'Cancelled'

export interface PartnerLead {
  id: string
  pfaRegistrationId: string
  provider: string
  phone: string | null
  email: string | null
  county: string | null
  housingType: string | null
  dataSharingConsent: boolean
  status: PartnerLeadStatus
  adminNote: string | null
}

export interface PartnerLeadPayload {
  phone?: string | null
  email?: string | null
  county?: string | null
  housingType?: string | null
  dataSharingConsent: boolean
}

// --- Pasul 2: TVA intracomunitar, semnături, bancă, Oblio ---
/**
 * Ce poate întoarce serverul. `Unknown` = încă nu a răspuns, `DontKnow` = valoare istorică
 * („nu știu”), păstrată doar ca dosarele vechi să se poată citi — nu mai poate fi trimisă.
 */
export type VatAnswer = 'Unknown' | 'Yes' | 'No' | 'DontKnow'
/** Ce se poate declara: doar un răspuns ferm. */
export type VatDeclaration = 'Yes' | 'No'
/** Derivat pe server din răspuns — clientul îl citește, nu îl trimite. */
export type VatRegistrationKind = 'None' | 'SpecialArticle317' | 'StandardVat' | 'Unknown'
export type BankDeclarationStatus = 'Pending' | 'Verified' | 'Rejected'
export type OblioIntegrationStatus = 'Pending' | 'Requested' | 'Active'
export type SignaturePacketStatus = 'Draft' | 'Sent' | 'Completed' | 'Rejected'

export interface Step2State {
  pfaRegistrationId: string | null
  fiscal: { vatAnswer: VatAnswer; vatRegistrationKind: VatRegistrationKind } | null
  bank: {
    bankName: string | null
    ibanMasked: string | null
    hasConfirmationDocument: boolean
    ocrIbanMatches: boolean | null
    source: 'Manual' | 'OpenBanking'
    status: BankDeclarationStatus
  } | null
  oblio: {
    accountEmail: string | null
    accountCreationConsent: boolean
    dataProcessingConsent: boolean
    eInvoiceConsent: boolean
    autoInvoicingConsent: boolean
    ridelanceManagementConsent: boolean
    termsAcceptedConsent: boolean
    allConsentsAccepted: boolean
    integrationStatus: OblioIntegrationStatus
  } | null
  signature: {
    provider: 'EasyStreamTransSped' | 'Manual'
    status: SignaturePacketStatus
    documents: { type: string; label: string | null; isSigned: boolean }[]
  } | null
}

// --- Pasul 3: autorizația ARR ---
export type ArrStatus = 'Draft' | 'DossierGenerated' | 'Submitted' | 'Issued' | 'Rejected'
export type ArrSubmissionMethod = 'InPersonByClient' | 'OnlineByRidelance'

export interface ArrState {
  pfaRegistrationId: string | null
  agencyName: string | null
  feeSnapshotBani: number
  submissionMethod: ArrSubmissionMethod
  status: ArrStatus
  hasDossier: boolean
  dossierDocumentId: string | null
  dossierGeneratedAtUtc: string | null
  submittedAtUtc: string | null
  authorizationDocumentId: string | null
  authorizationNumber: string | null
  authorizationIssuedOn: string | null
  authorizationExpiresOn: string | null
  adminNote: string | null
}

// --- Pasul 4: conturi Uber & Bolt ---
export type PlatformProvider = 'Uber' | 'Bolt'
export type PlatformOnboardingStatus =
  | 'NotStarted'
  | 'Selected'
  | 'AccountLinked'
  | 'ContractSigned'
  | 'Active'
  | 'Skipped'

export type ExistingAccountAnswer = 'HasOperatorAccount' | 'None' | 'DriverOnly' | 'Unknown'

export interface PlatformAccount {
  provider: PlatformProvider
  isSelectedByUser: boolean
  hasExistingAccount: boolean
  operatorAccountId: string | null
  hasAffiliationContract: boolean
  onboardingStatus: PlatformOnboardingStatus
  existingAccountAnswer: ExistingAccountAnswer | null
}

export interface PlatformOnboardingState {
  pfaRegistrationId: string | null
  platforms: PlatformAccount[]
}

// --- Pasul 5: vehicul, copie conformă & ecusoane ---
export type VehicleOwnershipMode = 'Owned' | 'Rented' | 'Leased' | 'Comodat' | 'AddedLater'
export type VehicleStatus = 'Draft' | 'DocumentsPending' | 'Active'
export type CopyRequestStatus = 'Draft' | 'DossierGenerated' | 'Submitted' | 'Issued' | 'Rejected'
export type BadgeStatus = 'Requested' | 'Paid' | 'Issued'

export interface VehicleBadge {
  provider: PlatformProvider
  setCount: number
  feePerSetSnapshotBani: number
  totalFeeSnapshotBani: number
  status: BadgeStatus
  badgeDocumentId: string | null
}

export interface CopyRequest {
  years: number
  feePerYearSnapshotBani: number
  totalFeeSnapshotBani: number
  status: CopyRequestStatus
  hasDossier: boolean
  dossierDocumentId: string | null
  dossierGeneratedAtUtc: string | null
  submittedAtUtc: string | null
  copyConformaDocumentId: string | null
  copyConformaNumber: string | null
  issuedOn: string | null
  expiresOn: string | null
  adminNote: string | null
}

export interface VehicleState {
  vehicleId: string | null
  ownershipMode: VehicleOwnershipMode
  addLater: boolean
  plateNumber: string | null
  vin: string | null
  make: string | null
  model: string | null
  firstRegistrationYear: number | null
  marketplaceCarId: string | null
  status: VehicleStatus
  copyRequest: CopyRequest | null
  badges: VehicleBadge[]
  copyFeePerYearBani: number
  badgeFeePerSetBani: number
  maxCopyYears: number
}

export const onboardingService = {
  /** Starea de onboarding a userului curent. */
  async getState(): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>('/onboarding/state')
    return data
  },

  /** Pasul 4 — starea conturilor de platformă. */
  async getPlatformOnboarding(): Promise<PlatformOnboardingState> {
    const { data } = await api.get<PlatformOnboardingState>('/onboarding/platforms')
    return data
  },

  /** Pasul 4 — selectează platformele. */
  async selectPlatforms(uberSelected: boolean, boltSelected: boolean): Promise<PlatformOnboardingState> {
    const { data } = await api.post<PlatformOnboardingState>('/onboarding/platforms/select', { uberSelected, boltSelected })
    return data
  },

  /** Pasul 4 — completează detaliile contului de operator. */
  async submitPlatformAccount(payload: {
    provider: PlatformProvider
    hasExistingAccount: boolean
    operatorAccountId?: string | null
    affiliationContractDocumentId?: string | null
    existingAccountAnswer?: ExistingAccountAnswer | null
  }): Promise<PlatformOnboardingState> {
    const { data } = await api.post<PlatformOnboardingState>('/onboarding/platforms/account', payload)
    return data
  },

  /** Admin — avansează statusul de onboarding al unei platforme. */
  async advancePlatformOnboarding(pfaId: string, provider: PlatformProvider, onboardingStatus: PlatformOnboardingStatus): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/platforms/advance`, { provider, onboardingStatus })
  },

  /** Pasul 3 — starea cererii ARR (null dacă nu a fost inițiată). */
  async getArrState(): Promise<ArrState | null> {
    const { data } = await api.get<ArrState | null>('/onboarding/arr')
    return data
  },

  /** Pasul 3 — inițiază/actualizează cererea ARR. */
  async submitArrRequest(agencyName: string | null, submissionMethod: ArrSubmissionMethod): Promise<ArrState> {
    const { data } = await api.post<ArrState>('/onboarding/arr', { agencyName, submissionMethod })
    return data
  },

  /** Pasul 3 — generează dosarul PDF ARR. */
  async generateArrDossier(): Promise<ArrState> {
    const { data } = await api.post<ArrState>('/onboarding/arr/dossier', {})
    return data
  },

  /** Pasul 3 — „Am depus dosarul" la ARR. */
  async markArrSubmitted(): Promise<void> {
    await api.post('/onboarding/arr/submitted', {})
  },

  /** Admin — înregistrează autorizația ARR emisă. */
  async recordArrAuthorization(
    pfaId: string,
    payload: {
      authorizationDocumentId?: string | null
      authorizationNumber?: string | null
      authorizationIssuedOn?: string | null
      authorizationExpiresOn?: string | null
      adminNote?: string | null
    },
  ): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/arr/authorization`, payload)
  },

  /** Pasul 5 — starea vehiculului, copiei conforme și ecusoanelor. */
  async getVehicleState(): Promise<VehicleState> {
    const { data } = await api.get<VehicleState>('/onboarding/vehicle')
    return data
  },

  /** Pasul 5 — declară/actualizează vehiculul. */
  async submitVehicle(payload: {
    ownershipMode: VehicleOwnershipMode
    addLater: boolean
    plateNumber?: string | null
    vin?: string | null
    make?: string | null
    model?: string | null
    firstRegistrationYear?: number | null
    marketplaceCarId?: string | null
  }): Promise<VehicleState> {
    const { data } = await api.post<VehicleState>('/onboarding/vehicle', payload)
    return data
  },

  /** Pasul 5 — solicită copia conformă (perioada) și ecusoanele (per platformă). */
  async submitCopyRequest(
    years: number,
    badges: { provider: PlatformProvider; setCount: number }[],
  ): Promise<VehicleState> {
    const { data } = await api.post<VehicleState>('/onboarding/vehicle/copy-request', { years, badges })
    return data
  },

  /** Pasul 5 — generează dosarul PDF copie conformă & ecusoane. */
  async generateVehicleDossier(): Promise<VehicleState> {
    const { data } = await api.post<VehicleState>('/onboarding/vehicle/dossier', {})
    return data
  },

  /** Pasul 5 — „Am depus dosarul" copie conformă la ARR. */
  async markVehicleSubmitted(): Promise<void> {
    await api.post('/onboarding/vehicle/submitted', {})
  },

  /** Admin — înregistrează copia conformă emisă. */
  async recordCopyConforma(
    pfaId: string,
    payload: {
      copyConformaDocumentId?: string | null
      copyConformaNumber?: string | null
      issuedOn?: string | null
      expiresOn?: string | null
      adminNote?: string | null
    },
  ): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/vehicle/copy-conforma`, payload)
  },

  /** Admin — avansează statusul unui set de ecusoane. */
  async advanceBadge(
    pfaId: string,
    provider: PlatformProvider,
    status: BadgeStatus,
    badgeDocumentId?: string | null,
  ): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/vehicle/badges/advance`, { provider, status, badgeDocumentId })
  },

  /** Pasul 2 — starea combinată (TVA, bancă, Oblio, semnături). */
  async getStep2State(): Promise<Step2State> {
    const { data } = await api.get<Step2State>('/onboarding/step2')
    return data
  },

  /**
   * Pasul 2.1 — răspunsul la TVA intracomunitar. Pentru „Yes” serverul cere să existe deja
   * certificatul/decizia ANAF încărcată și refuză declarația fără dovadă.
   */
  async submitVat(vatAnswer: VatDeclaration): Promise<void> {
    await api.post('/onboarding/step2/vat', { vatAnswer })
  },

  /** Pasul 2.3 — declarația contului bancar. */
  async submitBankDeclaration(payload: {
    bankName?: string | null
    /** Opțional — în mod normal IBAN-ul se citește din documentul încărcat (OCR). */
    iban?: string | null
    confirmationDocumentId?: string | null
  }): Promise<Step2State['bank']> {
    const { data } = await api.post<Step2State['bank']>('/onboarding/step2/bank', payload)
    return data
  },

  /** Pasul 2.4 — consimțăminte Oblio. */
  async acceptOblioConsents(payload: {
    accountEmail?: string | null
    accountCreationConsent: boolean
    dataProcessingConsent: boolean
    eInvoiceConsent: boolean
    autoInvoicingConsent: boolean
    ridelanceManagementConsent: boolean
    termsAcceptedConsent: boolean
  }): Promise<Step2State['oblio']> {
    const { data } = await api.post<Step2State['oblio']>('/onboarding/step2/oblio', payload)
    return data
  },

  /** Admin — validează/respinge contul bancar. */
  async verifyBankDeclaration(pfaId: string, status: BankDeclarationStatus, adminNote?: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/step2/bank`, { status, adminNote })
  },

  /** Admin — avansează integrarea Oblio. */
  async advanceOblioIntegration(pfaId: string, integrationStatus: OblioIntegrationStatus, adminNote?: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/step2/oblio`, { integrationStatus, adminNote })
  },

  /** Admin — creează/avansează pachetul de semnături. */
  async updateSignaturePacket(
    pfaId: string,
    payload: { provider: 'EasyStreamTransSped' | 'Manual'; status: SignaturePacketStatus; providerReference?: string | null; adminNote?: string | null },
  ): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/step2/signature`, payload)
  },

  /** Pasul 0 — starea de eligibilitate (null dacă nu a fost completată). */
  async getEligibility(): Promise<EligibilityProfile | null> {
    const { data } = await api.get<EligibilityProfile | null>('/onboarding/eligibility')
    return data
  },

  /** Pasul 0 — trimite/actualizează datele de eligibilitate; întoarce evaluarea. */
  async submitEligibility(payload: EligibilityPayload): Promise<EligibilityProfile> {
    const { data } = await api.post<EligibilityProfile>('/onboarding/eligibility', payload)
    return data
  },

  /** Pasul 1 (Nu am PFA) — trimite cererea către partenerul de înființare. */
  async submitPartnerLead(payload: PartnerLeadPayload): Promise<PartnerLead> {
    const { data } = await api.post<PartnerLead>('/onboarding/pfa/partner-lead', payload)
    return data
  },

  /** Pasul 1 — adminul avansează manual statusul lead-ului. */
  async updatePartnerLeadStatus(
    pfaId: string,
    status: PartnerLeadStatus,
    adminNote?: string,
  ): Promise<PartnerLead> {
    const { data } = await api.put<PartnerLead>(`/pfa-registrations/${pfaId}/partner-lead`, {
      status,
      adminNote,
    })
    return data
  },

  /** Trimite o secțiune de documente la validare. */
  async submitSection(key: string): Promise<void> {
    await api.post(`/onboarding/sections/${key}/submit`)
  },

  /** DOAR PENTRU TESTARE — sare peste pasul curent de onboarding. De șters. */
  async skipStep(): Promise<void> {
    await api.post('/onboarding/test/skip')
  },

  /** Starea de onboarding a unui dosar (admin/contabil). */
  async getForRegistration(pfaId: string): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>(`/pfa-registrations/${pfaId}/onboarding`)
    return data
  },

  /** Adminul validează o secțiune. */
  async validateSection(pfaId: string, key: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/validate`)
  },

  /** Adminul respinge o secțiune, cu motiv obligatoriu. */
  async rejectSection(pfaId: string, key: string, note: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/reject`, { note })
  },
}
