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
  /**
   * Cheia pasului activ — singurul pe care serverul acceptă scrieri. Null când onboardingul e
   * complet. Frontendul nu mai calculează asta singur.
   */
  currentStep: string | null
  /** Dosarul de înființare e semnat, deci poate fi depus — abia acum se poate plăti (RL-03). */
  canPay: boolean
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED'
  /** Ramura „Nu am PFA": starea dosarului de înființare. Null pentru „Am PFA". */
  companyFormationStatus: string | null
  /** Etapa la care a rămas dosarul: `PersonalData`, `RegisteredOffice` sau `Consent`. */
  companyFormationStage: string | null
  /** DOAR PENTRU TESTARE — de șters odată cu skipStep(). */
  testSkipEnabled: boolean

  /**
   * Emailul contului. **Singura** sursă pentru precompletarea câmpurilor de email din onboarding
   * (Oblio, Uber Fleet, Bolt Fleet). Editarea lor nu îl schimbă — de asta vine de aici, nu din
   * state-ul vreunui formular.
   */
  contactEmail: string | null
  contactPhone: string | null
  /** Numele titularului contului; precompletează contul de șofer deschis de noi. */
  contactName?: string | null

  /**
   * Județul cu care se precompletează agenția ARR: sediul social, apoi adresa din buletin.
   * Null când nu avem încă niciuna — selectul rămâne gol, nu ghicește.
   */
  primaryCounty: string | null

  /** Avansul de abonament (prima lună de PFA Full), în bani. Vine din `Pricing` — UI-ul nu are sume scrise în el. */
  onboardingAdvanceBani: number
  onboardingAdvanceIsRefundable: boolean

  /** OCR-ul n-a citit sigur datele de identitate: dosarul merge mai departe, dar e marcat. */
  requiresManualIdentityReview: boolean

  /**
   * Dosarul a fost atins de uneltele de dezvoltare. Sesiunea e în sandbox: fără plăți reale,
   * fără emailuri, dosarele generate poartă filigran „TEST".
   */
  isDevSession: boolean

  /**
   * Uneltele de dezvoltare sunt disponibile pentru utilizatorul curent. Decizia e a serverului:
   * UI-ul o citește, nu o ia. În producție e mereu `false`.
   */
  devToolsEnabled: boolean

  /**
   * Pașii săriți sau completați cu fixtures din panoul dev. `null` pentru sesiunile normale —
   * nu-i interogăm degeaba la fiecare încărcare.
   */
  devSkippedSteps: string[] | null
}

/** Ce readuce la zero un reset din panoul dev. */
export type OnboardingDevResetScope = 'step' | 'section' | 'all'

export type OnboardingStepStatus = 'Locked' | 'InProgress' | 'AwaitingValidation' | 'Completed'

/**
 * Vocabularul din specul v3, emis de server alături de `status`. Mai fin: separă „pasul e al tău
 * dar n-ai început” de „ești în mijlocul lui” și aduce respingerea de pe client pe server.
 * `status` rămâne pentru consumatorii care nu au migrat încă.
 */
export type OnboardingStepState =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'pending_admin'
  | 'completed'
  | 'rejected'

/** Un item din checklistul pasului curent, compus pe server (rail-ul dreapta). */
export interface OnboardingChecklistItem {
  key: string
  label: string
  state: 'missing' | 'uploaded' | 'verifying' | 'rejected'
  /** Motivul respingerii, afișat pe rând — nu într-un tooltip. */
  note: string | null
}

export interface OnboardingStep {
  order: number
  key: string
  label: string
  status: OnboardingStepStatus
  blockReason: string | null
  path: string
  state: OnboardingStepState
  /** Cine face tranziția finală a pasului. Un pas `admin` nu poate fi închis de șofer. */
  ownedBy: 'user' | 'admin'
  /** Șoferul și-a făcut partea din pas, indiferent dacă adminul a validat-o. */
  userPartDone: boolean
  /** Ce mai lipsește. Populat doar pe pasul curent; `null` în rest. */
  checklist: OnboardingChecklistItem[] | null
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
  /** Motivul respingerii din admin, cât timp respingerea e în vigoare. */
  adminReviewNote?: string | null
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

/** Pasul 3 văzut din admin: ce a făcut clientul, cu IBAN-ul declarat întreg. */
export interface AdminFiscalReview {
  step2: Step2State
  bank: {
    status: string
    institutionName: string | null
    linkedAtUtc: string | null
    accounts: { iban: string | null; currency: string | null; ownerName: string | null }[]
  } | null
  declaredIban: string | null
}

export interface Step2State {
  pfaRegistrationId: string | null
  fiscal: { vatAnswer: VatAnswer; vatRegistrationKind: VatRegistrationKind } | null
  bank: {
    bankName: string | null
    iban: string | null
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
    /** Setat când șoferul a trimis pasul spre admin — de aici nu mai are ce face. */
    submittedForReviewAtUtc: string | null
    packageName: string | null
    signatureCount: number | null
    expiresAtUtc: string | null
    /** Motivul respingerii, scris de admin pentru client. */
    rejectionReason: string | null
  } | null
  /** Partea șoferului e completă și pasul nu e deja la admin. */
  canSubmitForReview: boolean
}

// --- Pasul 4: ARR & Cont Flotă ---
export type PlatformProvider = 'Uber' | 'Bolt'

export type ArrFleetStatus =
  | 'Draft'
  | 'DocumentsSubmitted'
  | 'InReview'
  | 'InProgress'
  | 'AuthorizationIssued'
  | 'CertifiedCopyIssued'
  | 'BadgesIssued'
  | 'Completed'

export type ArrFleetVehicleOwnership = 'Ownership' | 'Loan' | 'Rental' | 'Leasing'

export type ArrFleetOfficialDocumentType = 'TransportAuthorization' | 'CertifiedCopy' | 'UberBadge' | 'BoltBadge'

/** Contul de șofer pe o platformă aleasă. `hasAccount: false` = „Nu am cont”: agentul îl sună pe client. */
export interface ArrFleetDriverAccount {
  platform: PlatformProvider
  hasAccount: boolean | null
  email: string | null
  phone: string | null
  fullName: string | null
  requiresPhoneCall: boolean
}

/** O plată separată către ARR: autorizația, copia conformă sau ecusoanele. */
export interface ArrFleetPayment {
  kind: 'Authorization' | 'CertifiedCopy' | 'Badges'
  label: string
  explanation: string
  amountBani: number
  /** Categoria în care se încarcă dovada: `ArrAuthorizationPaymentProof`, … */
  proofCategory: string
  proofUploaded: boolean
}

/** Agenția teritorială ARR și contul ei de trezorerie. */
export interface ArrAgency {
  countyCode: string
  countyName: string
  beneficiaryName: string
  treasury: string
  fiscalCode: string
  /** Fără spații; gruparea în blocuri de 4 e a UI-ului. */
  iban: string
}

/** Starea pasului „ARR & Cont Flotă”, aceeași pentru client și admin. */
export interface ArrFleetState {
  pfaRegistrationId: string
  status: ArrFleetStatus
  statusLabel: string
  platforms: PlatformProvider[]
  driverAccounts: ArrFleetDriverAccount[]
  vehicleOwnership: ArrFleetVehicleOwnership | null
  /** Totalul celor trei plăți, calculat pe server: 408 lei pentru o platformă, 416 pentru ambele. */
  paymentAmountBani: number
  /** Cele trei plăți separate cerute de ARR, fiecare cu dovada ei. */
  payments: ArrFleetPayment[]
  /** Agenția ARR din județul sediului social, cu contul de trezorerie. Null = vezi `agencyError`. */
  agency: ArrAgency | null
  /** De ce n-am putut stabili agenția (județul lipsește sau nu e recunoscut). */
  agencyError: string | null
  /** Dovada plății ecusoanelor e pentru o sumă care între timp s-a schimbat. */
  paymentProofOutdated: boolean
  submittedAtUtc: string | null
  /** Motivul pentru care un agent a redeschis pasul. */
  reopenedReason: string | null
  /** Ce mai lipsește până la trimitere. */
  missing: string[]
  statusLog: { fromStatus: ArrFleetStatus; toStatus: ArrFleetStatus; changedBy: string | null; changedAtUtc: string }[]
}

export interface ArrFleetDraft {
  platforms?: PlatformProvider[]
  driverAccounts?: { platform: PlatformProvider; hasAccount: boolean; email?: string | null; phone?: string | null; fullName?: string | null }[]
  vehicleOwnership?: ArrFleetVehicleOwnership
}

/** Un răspuns din onboarding, cum îl vede adminul: ultimul dat și, dacă s-a schimbat, cele dinainte. */
export interface OnboardingAnswerRecord {
  stepKey: string
  questionId: string
  question: string
  value: string
  valueLabel: string
  answeredAtUtc: string
  previousLabels: string[]
}

export const onboardingService = {
  /** Starea de onboarding a userului curent. */
  async getState(): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>('/onboarding/state')
    return data
  },

  /** Pasul „ARR & Cont Flotă” — starea curentă. */
  async getArrFleetState(): Promise<ArrFleetState> {
    const { data } = await api.get<ArrFleetState>('/onboarding/arr-fleet')
    return data
  },

  /** Salvează progresul; câmpurile lipsă rămân neschimbate. Suma se recalculează pe server. */
  async saveArrFleetDraft(draft: ArrFleetDraft): Promise<ArrFleetState> {
    const { data } = await api.put<ArrFleetState>('/onboarding/arr-fleet', draft)
    return data
  },

  /** Trimite pasul. Serverul validează actele obligatorii. */
  async submitArrFleet(): Promise<ArrFleetState> {
    const { data } = await api.post<ArrFleetState>('/onboarding/arr-fleet/submit')
    return data
  },

  /** Admin — pasul „ARR & Cont Flotă” al unui dosar. */
  async getAdminArrFleet(pfaId: string): Promise<ArrFleetState> {
    const { data } = await api.get<ArrFleetState>(`/admin/onboarding/${pfaId}/arr-fleet`)
    return data
  },

  /** Admin — avansează procedura. Statusurile de la autorizație încolo cer documentul oficial. */
  async changeArrFleetStatus(pfaId: string, status: ArrFleetStatus): Promise<ArrFleetState> {
    const { data } = await api.patch<ArrFleetState>(`/admin/onboarding/${pfaId}/arr-fleet/status`, { status })
    return data
  },

  /** Admin — redeschide pasul pentru corecturi, cu motivul pe care îl vede clientul. */
  async reopenArrFleet(pfaId: string, reason: string): Promise<ArrFleetState> {
    const { data } = await api.post<ArrFleetState>(`/admin/onboarding/${pfaId}/arr-fleet/reopen`, { reason })
    return data
  },

  /** Admin — încarcă un document oficial; tipul decide unde apare în dashboardul clientului. */
  async uploadArrFleetOfficialDocument(
    pfaId: string,
    payload: { file: File; type: ArrFleetOfficialDocumentType; documentNumber?: string; issuedAt?: string; expiresAt?: string },
  ): Promise<ArrFleetState> {
    const form = new FormData()
    form.append('file', payload.file)
    form.append('type', payload.type)
    if (payload.documentNumber) form.append('documentNumber', payload.documentNumber)
    if (payload.issuedAt) form.append('issuedAt', payload.issuedAt)
    if (payload.expiresAt) form.append('expiresAt', payload.expiresAt)
    const { data } = await api.post<ArrFleetState>(`/admin/onboarding/${pfaId}/arr-fleet/official-documents`, form)
    return data
  },

  /**
   * Permisiunile de flotă, acceptate din onboarding (pasul 5).
   *
   * Aceeași rută ca în Dashboard: consimțământul e al proprietarului dosarului, iar serverul
   * verifică asta oricum. Nu se poate „retrage" de aici — cine acceptă rămâne acceptat.
   */
  async acceptFleetConsent(
    pfaId: string,
    consent: { fleetAccountsAccepted: boolean; boltApiAccepted: boolean },
  ): Promise<void> {
    await api.post(`/pfa-registrations/${pfaId}/fleet-consent`, consent)
  },

  /**
   * DOAR PENTRU DEZVOLTARE (§13.2). Endpoint-urile răspund 404 când poarta serverului nu trece,
   * deci un apel de aici nu poate deveni o portiță în producție.
   */
  async devJumpToStep(onboardingId: string, targetStepId: string): Promise<void> {
    await api.post(`/dev/onboarding/${onboardingId}/jump`, { targetStepId })
  },

  async devCompleteStep(onboardingId: string, stepId: string, useMockData = true): Promise<void> {
    await api.post(`/dev/onboarding/${onboardingId}/complete`, { stepId, useMockData })
  },

  async devReset(
    onboardingId: string,
    scope: OnboardingDevResetScope,
    targetId?: string,
  ): Promise<void> {
    await api.post(`/dev/onboarding/${onboardingId}/reset`, { scope, targetId: targetId ?? null })
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

  /** Pasul fiscal — șoferul își declară partea terminată; pasul trece la admin (RL-02). */
  async submitFiscalForReview(): Promise<void> {
    await api.post('/onboarding/step2/submit-for-review')
  },

  /** Admin — alocă pachetul de semnături și închide pasul fiscal. */
  async completeSignaturePacket(
    pfaId: string,
    payload: {
      provider: 'EasyStreamTransSped' | 'Manual'
      packageName?: string | null
      signatureCount?: number | null
      expiresAtUtc?: string | null
      providerReference?: string | null
      adminNote?: string | null
    },
  ): Promise<void> {
    await api.post(`/admin/onboarding/${pfaId}/steps/signatures/complete`, payload)
  },

  /** Admin — refă împuternicirea ANAF cu datele completate între timp; numărul rămâne același. */
  async regenerateAnafMandate(pfaId: string): Promise<{ documentId: string; number: string; missing: string[] }> {
    const { data } = await api.post<{ documentId: string; number: string; missing: string[] }>(
      `/admin/onboarding/${pfaId}/anaf-mandate/regenerate`,
    )
    return data
  },

  /** Admin — întoarce pasul fiscal la șofer, cu motiv. */
  async rejectSignaturePacket(pfaId: string, reason: string, adminNote?: string | null): Promise<void> {
    await api.post(`/admin/onboarding/${pfaId}/steps/signatures/reject`, { reason, adminNote })
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

  /**
   * Salvează un răspuns din onboarding, cu textele de pe ecran, ca adminul să vadă tot parcursul.
   * Un răspuns identic cu ultimul nu creează nimic nou pe server.
   */
  async saveAnswer(answer: { stepKey: string; questionId: string; question: string; value: string; valueLabel: string }): Promise<void> {
    const { questionId, ...body } = answer
    await api.put(`/onboarding/answers/${encodeURIComponent(questionId)}`, body)
  },

  /** Ultimul răspuns la fiecare întrebare, ca fluxul să se reia după refresh. */
  async getMyAnswers(): Promise<{ stepKey: string; questionId: string; value: string }[]> {
    const { data } = await api.get<{ stepKey: string; questionId: string; value: string }[]>('/onboarding/answers')
    return data
  },

  /** Toate răspunsurile din onboarding ale unui dosar, în ordinea în care au fost date (admin). */
  async getAnswersForRegistration(pfaId: string): Promise<OnboardingAnswerRecord[]> {
    const { data } = await api.get<OnboardingAnswerRecord[]>(`/pfa-registrations/${pfaId}/onboarding/answers`)
    return data
  },

  /** Starea de onboarding a unui dosar (admin/contabil). */
  async getForRegistration(pfaId: string): Promise<OnboardingState> {
    const { data } = await api.get<OnboardingState>(`/pfa-registrations/${pfaId}/onboarding`)
    return data
  },

  /** Adminul validează pasul de eligibilitate. Singurul lucru care îl bifează. */
  async validateEligibility(pfaId: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/eligibility/validate`)
  },

  /** Adminul respinge pasul de eligibilitate, cu motiv obligatoriu. */
  async rejectEligibility(pfaId: string, note: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/eligibility/reject`, { note })
  },

  /** Adminul validează o secțiune. */
  /** Ce a făcut clientul la pasul 3 — TVA, banca legată, Oblio — ca adminul să vadă ce validează. */
  async getFiscalReview(pfaId: string): Promise<AdminFiscalReview> {
    const { data } = await api.get<AdminFiscalReview>(`/admin/onboarding/${pfaId}/steps/fiscal`)
    return data
  },

  async validateSection(pfaId: string, key: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/validate`)
  },

  /** Adminul respinge o secțiune, cu motiv obligatoriu. */
  async rejectSection(pfaId: string, key: string, note: string): Promise<void> {
    await api.put(`/pfa-registrations/${pfaId}/sections/${key}/reject`, { note })
  },
}
