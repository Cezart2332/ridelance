import type { DocumentSummary } from '../../../services/document.service'
import {
  onboardingService,
  type ArrFleetState,
  type ArrFleetVehicleOwnership,
  type PlatformProvider,
} from '../../../services/onboarding.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'
import { toE164 } from './contact'

/**
 * Pasul „ARR & Cont Flotă”, ca ecrane. Clientul doar încarcă acte, răspunde la câteva întrebări și
 * plătește; contul ARR, conturile de flotă, autorizația, copia conformă și ecusoanele le obține
 * agentul RIDElance din admin.
 *
 * Secțiunile, în ordine: documente personale, platforme, plată, vehicul, documente auto, trimitere.
 * După trimitere pasul e doar de citit: rămâne ecranul cu statusul și, dacă agentul respinge un act,
 * ecranul acelui act, ca să-l poată reîncărca.
 */

const EYEBROW = 'ARR & CONT FLOTĂ'
const MACRO = 'arr_fleet'

const arrFleetOf = (c: MicroStepContext) => (c.resources.arrFleet as ArrFleetState | undefined) ?? null

const submitted = (c: MicroStepContext) => arrFleetOf(c)?.submittedAtUtc != null

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

const newestOf = (c: MicroStepContext, category: string) =>
  c.documents.filter((d) => d.category === category && !d.isSuperseded).sort(byNewest)[0]

function hasDocument(c: MicroStepContext, category: string): boolean {
  const newest = newestOf(c, category)
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

/** Actul a fost respins (de AI sau de agent): ecranul lui rămâne vizibil și după trimitere. */
const rejected = (c: MicroStepContext, category: string) => {
  const newest = newestOf(c, category)
  return newest !== undefined && (newest.status.toLowerCase() === 'rejected' || newest.aiStatus === 'Failed')
}

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

/** Platformele: alegerea din sesiune, altfel ce s-a salvat. */
const selectedPlatforms = (c: MicroStepContext): PlatformProvider[] => {
  const value = c.answers.arr_fleet_platforme
  if (Array.isArray(value)) return value as PlatformProvider[]
  return arrFleetOf(c)?.platforms ?? []
}

const ownership = (c: MicroStepContext): string => {
  const answer = c.answers.arr_fleet_detinere
  if (typeof answer === 'string') return answer
  return arrFleetOf(c)?.vehicleOwnership ?? ''
}

/** Un ecran de upload. Înainte de trimitere e mereu vizibil; după, doar dacă actul a fost respins. */
const uploadStep = (
  id: string,
  category: string,
  label: string,
  hint: string,
  extra: Partial<MicroStepDef> = {},
): MicroStepDef => ({
  id,
  macroStep: MACRO,
  kind: 'upload',
  eyebrow: EYEBROW,
  icon: 'folder',
  railLabel: label,
  title: `Încarcă: ${label}`,
  document: { category, label, hint },
  ...extra,
  visibleWhen: (c) => (extra.visibleWhen?.(c) ?? true) && (!submitted(c) || rejected(c, category)),
  isDone: extra.isDone ?? ((c) => hasDocument(c, category)),
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const validateEmail = (value: string): string | null => {
  if (value.trim() === '') return 'Emailul e obligatoriu.'
  return EMAIL_PATTERN.test(value.trim()) ? null : 'Verifică adresa de email.'
}

const validatePhone = (value: string): string | null => {
  if (value.trim() === '') return 'Telefonul e obligatoriu.'
  return toE164(value) === null ? 'Verifică numărul de telefon.' : null
}

/** Cele două ecrane ale unei platforme alese: ai cont de șofer, apoi datele lui. */
function driverAccountSteps(provider: PlatformProvider): MicroStepDef[] {
  const answerId = `arr_fleet_cont_${provider.toLowerCase()}`
  const detailsId = `arr_fleet_date_${provider.toLowerCase()}`

  const accountOf = (c: MicroStepContext) => arrFleetOf(c)?.driverAccounts.find((a) => a.platform === provider) ?? null
  const isChosen = (c: MicroStepContext) => !submitted(c) && selectedPlatforms(c).includes(provider)

  /** Are cont de șofer: din sesiune dacă tocmai a răspuns, altfel ce s-a salvat. */
  const hasAccount = (c: MicroStepContext): boolean | null => {
    const answer = c.answers[answerId]
    if (typeof answer === 'string') return answer === 'yes'
    return accountOf(c)?.hasAccount ?? null
  }

  return [
    {
      id: answerId,
      macroStep: MACRO,
      kind: 'question',
      eyebrow: EYEBROW,
      icon: 'user',
      railLabel: `Cont ${provider}`,
      title: `Ai cont de șofer pe ${provider}?`,
      choices: [
        { value: 'yes', title: 'Da' },
        { value: 'no', title: 'Nu am cont pe această platformă' },
      ],
      submit: async (value) => {
        await onboardingService.saveArrFleetDraft({
          driverAccounts: [{ platform: provider, hasAccount: value === 'yes' }],
        })
      },
      visibleWhen: isChosen,
      isDone: (c) => hasAccount(c) !== null,
    },
    {
      id: detailsId,
      macroStep: MACRO,
      kind: 'text',
      manualContinue: true,
      eyebrow: EYEBROW,
      icon: 'idCard',
      railLabel: `Contul ${provider}`,
      title: `Datele contului de șofer ${provider}`,
      fields: [
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          initialValue: (c) => accountOf(c)?.email ?? '',
          validate: validateEmail,
        },
        {
          key: 'phone',
          label: 'Telefon',
          type: 'tel',
          initialValue: (c) => accountOf(c)?.phone ?? '',
          validate: validatePhone,
        },
        {
          key: 'fullName',
          label: 'Nume și prenume',
          optional: true,
          initialValue: (c) => accountOf(c)?.fullName ?? c.state?.contactName ?? '',
        },
      ],
      persist: async (values) => {
        if (!values.email?.trim() && !values.phone?.trim()) return
        await onboardingService.saveArrFleetDraft({
          driverAccounts: [
            {
              platform: provider,
              hasAccount: true,
              email: values.email || null,
              phone: values.phone || null,
              fullName: values.fullName || null,
            },
          ],
        })
      },
      persistPrefilledOnContinue: true,
      // „Nu am cont”: câmpurile se ascund și nu se cer.
      visibleWhen: (c) => isChosen(c) && hasAccount(c) === true,
      isDone: (c) => {
        const account = accountOf(c)
        if (account?.email && account.phone) return true
        return validateEmail(field(c, detailsId, 'email')) === null && validatePhone(field(c, detailsId, 'phone')) === null
      },
    },
  ]
}

/** Contractul cerut de fiecare mod de deținere; proprietatea nu cere niciunul. */
const OWNERSHIP_CONTRACTS: { mode: ArrFleetVehicleOwnership; category: string; label: string; hint: string }[] = [
  {
    mode: 'Loan',
    category: 'ContractComodat',
    label: 'Comodat autentificat la notariat',
    hint: 'Contractul de comodat, cu încheierea de autentificare a notarului.',
  },
  {
    mode: 'Rental',
    category: 'ContractInchiriere',
    label: 'Contract de închiriere',
    hint: 'Semnat de ambele părți. Semnăturile trebuie să se vadă.',
  },
  {
    mode: 'Leasing',
    category: 'ContractLeasing',
    label: 'Contract de leasing',
    hint: 'Contractul de leasing al mașinii.',
  },
]

const FINAL_MESSAGE =
  'Am primit documentele. Agentul RIDElance le verifică și se ocupă de deschiderea contului ARR, deschiderea conturilor de flotă, obținerea autorizației de transport, a copiei conforme și a ecusoanelor. Le vei primi în dashboard, la secțiunea Documente, odată cu accesul oficial.'

export const arrFleetMicroSteps: MicroStepDef[] = [
  // ── 1. Documente personale ──
  uploadStep('arr_fleet_aviz_medical', 'AdeverintaMedicala', 'Aviz medical', 'Eliberat de cabinetul de medicina muncii. Data expirării trebuie să fie lizibilă.'),
  uploadStep('arr_fleet_aviz_psihologic', 'AvizPsihologic', 'Aviz psihologic', 'Eliberat de un cabinet de psihologie autorizat.'),
  uploadStep('arr_fleet_cazier', 'CazierJudiciar', 'Cazier judiciar', 'Eliberat de poliție, valabil 6 luni de la emitere.'),

  // ── 2. Platforme ──
  {
    id: 'arr_fleet_platforme',
    macroStep: MACRO,
    kind: 'multi',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Platforme',
    title: 'Cu ce platforme dorești să colaborezi?',
    choices: [
      { value: 'Uber', title: 'Uber' },
      { value: 'Bolt', title: 'Bolt' },
    ],
    minSelected: 1,
    commit: async (c) => {
      await onboardingService.saveArrFleetDraft({ platforms: selectedPlatforms(c) })
    },
    visibleWhen: (c) => !submitted(c),
    isDone: (c) => (arrFleetOf(c)?.platforms.length ?? 0) > 0,
  },
  ...driverAccountSteps('Uber'),
  ...driverAccountSteps('Bolt'),

  // ── 3. Plată ──
  uploadStep(
    'arr_fleet_plata',
    'DovadaPlataArr',
    'Dovada plății',
    'Chitanța sau ordinul de plată pentru suma de mai sus.',
    {
      railLabel: 'Plată',
      title: 'Plătește și încarcă dovada plății',
      slot: 'arrFleetPayment',
      slotBeforeBody: true,
      // Dovada pentru o sumă veche nu mai închide ecranul.
      isDone: (c) => hasDocument(c, 'DovadaPlataArr') && !arrFleetOf(c)?.paymentProofOutdated,
    },
  ),

  // ── 4. Vehicul ──
  {
    id: 'arr_fleet_detinere',
    macroStep: MACRO,
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Deținerea mașinii',
    title: 'Cum deții mașina cu care vei lucra?',
    choices: [
      { value: 'Ownership', title: 'Proprietate' },
      { value: 'Loan', title: 'Comodat' },
      { value: 'Rental', title: 'Contract de închiriere' },
      { value: 'Leasing', title: 'Leasing' },
    ],
    submit: async (value) => {
      await onboardingService.saveArrFleetDraft({ vehicleOwnership: value as ArrFleetVehicleOwnership })
    },
    visibleWhen: (c) => !submitted(c),
    isDone: (c) => arrFleetOf(c)?.vehicleOwnership != null,
  },
  ...OWNERSHIP_CONTRACTS.map((contract) =>
    uploadStep(`arr_fleet_${contract.category.toLowerCase()}`, contract.category, contract.label, contract.hint, {
      // Doar contractul modului ales; cel al unui mod părăsit e marcat înlocuit pe server.
      visibleWhen: (c) => ownership(c) === contract.mode,
    }),
  ),

  // ── 5. Documente auto ──
  uploadStep('arr_fleet_talon', 'Talon', 'Talon', 'ITP-ul trebuie să fie valabil încă cel puțin 6 luni.', {
    icon: 'car',
    title: 'Încarcă talonul cu ITP valabil',
  }),
  uploadStep('arr_fleet_rca', 'RCA', 'Asigurare RCA', 'Data expirării trebuie să fie lizibilă.', {
    icon: 'shield',
    slot: 'insuranceOffer',
  }),
  uploadStep(
    'arr_fleet_calatori',
    'AsigurareCalatori',
    'Asigurare de călători și bagaje',
    'O cere ARR pentru transportul alternativ.',
    { icon: 'shield', slot: 'insuranceOffer' },
  ),
  uploadStep('arr_fleet_casco', 'Casco', 'CASCO', 'Opțional. Dacă ai CASCO, încarcă polița.', {
    icon: 'shield',
    railLabel: 'CASCO (opțional)',
    title: 'Încarcă CASCO (opțional)',
    slot: 'insuranceOffer',
    // Opțional: nu ține pasul pe loc.
    isDone: () => true,
  }),

  // ── Trimitere ──
  {
    id: 'arr_fleet_trimite',
    macroStep: MACRO,
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Trimite',
    title: 'Trimite documentele',
    lines: (c) => {
      const state = arrFleetOf(c)
      if (submitted(c)) return [FINAL_MESSAGE]

      const lines: string[] = []
      if (state?.reopenedReason) lines.push(`Agentul a redeschis pasul: ${state.reopenedReason}`)
      lines.push(
        state && state.missing.length > 0
          ? `Mai lipsește: ${state.missing.join(', ')}.`
          : 'Totul e completat. După trimitere, agentul RIDElance preia procedura.',
      )
      return lines
    },
    slot: 'arrFleetStatus',
    action: {
      label: 'Trimite',
      busyLabel: 'Se trimite...',
      run: () => onboardingService.submitArrFleet(),
      enabledWhen: (c) => (arrFleetOf(c)?.missing.length ?? 1) === 0,
      successDialog: { title: 'Am primit documentele', message: FINAL_MESSAGE },
    },
    isDone: submitted,
  },
]
