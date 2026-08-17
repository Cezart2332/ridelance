import type { DocumentSummary } from '../../../services/document.service'
import {
  onboardingService,
  type PlatformOnboardingState,
  type PlatformProvider,
  type VehicleOwnershipMode,
  type VehicleState,
} from '../../../services/onboarding.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 6 — vehiculul, copia conformă și ecusoanele, ca ecrane.
 *
 * Modul de deținere decide ce contract se cere; „adaug mașina mai târziu" sare tot restul, în loc
 * să lase pe ecran câmpuri pe care userul le-ar completa degeaba.
 *
 * Numărul de înmatriculare, VIN-ul și marca nu se tastează nicăieri: le citește OCR-ul din talon
 * și CIV. Erau și înainte doar câmpuri invizibile în payload — acum lipsa lor e explicită.
 */

const byNewest = (a: DocumentSummary, b: DocumentSummary) =>
  new Date(b.uploadedAtUtc).getTime() - new Date(a.uploadedAtUtc).getTime()

function hasDocument(c: MicroStepContext, categories: string[]): boolean {
  const newest = c.documents.filter((d) => categories.includes(d.category)).sort(byNewest)[0]
  if (!newest) return false
  return newest.status.toLowerCase() !== 'rejected' && newest.aiStatus !== 'Failed'
}

const vehicleOf = (c: MicroStepContext) => (c.resources.vehicle as VehicleState | undefined) ?? null

const platformsOf = (c: MicroStepContext) =>
  (c.resources.platforms as PlatformOnboardingState | undefined) ?? null

/** Un set de ecusoane pentru fiecare platformă aleasă — cantitatea nu se întreabă, se derivă. */
const badgeSets = (c: MicroStepContext): { provider: PlatformProvider; setCount: number }[] => {
  const chosen = (platformsOf(c)?.platforms ?? []).filter((p) => p.isSelectedByUser)
  return (['Uber', 'Bolt'] as PlatformProvider[]).map((provider) => ({
    provider,
    setCount: chosen.some((p) => p.provider === provider) ? 1 : 0,
  }))
}

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

const lei = (bani: number) => (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2 })

const EYEBROW = 'VEHICUL'

/**
 * Mașina e obligatorie pentru finalizarea înrolării: fără ea nu există copie conformă, deci nu
 * există activitate. „Adaug mașina mai târziu" a fost scoasă din UI ȘI din tranziții — vezi
 * specul de fix-uri §11.1.
 */
const OWNERSHIP: { value: ActiveOwnershipMode; title: string }[] = [
  { value: 'Owned', title: 'Proprietate' },
  { value: 'Rented', title: 'Închiriere' },
  { value: 'Leased', title: 'Leasing' },
  { value: 'Comodat', title: 'Comodat' },
]

/**
 * Ce acte cere fiecare mod de deținere, peste documentele comune (talon, CIV, RCA, asigurare).
 *
 * Oglindește `OnboardingSectionCatalog.RequirementsForVehicle` de pe backend. Leasingul cere
 * DOUĂ acte, nu unul: contractul și acordul finanțatorului. Al doilea lipsea cu totul, iar
 * primul se numea, generic, „Contract" (spec fix-uri §11.2).
 */
interface OwnershipDocument {
  category: 'ContractVehicul' | 'AcordLeasing'
  label: string
  hint: string
}

type ActiveOwnershipMode = Exclude<VehicleOwnershipMode, 'AddedLater'>

const OWNERSHIP_DOCUMENTS: Record<ActiveOwnershipMode, OwnershipDocument[]> = {
  Owned: [],
  Rented: [
    {
      category: 'ContractVehicul',
      label: 'Contract de închiriere',
      hint: 'Contractul semnat cu proprietarul mașinii. Semnăturile trebuie să se vadă.',
    },
  ],
  Leased: [
    {
      category: 'ContractVehicul',
      label: 'Contract de leasing',
      hint: 'Contractul semnat cu societatea de leasing. Semnăturile trebuie să se vadă.',
    },
    {
      category: 'AcordLeasing',
      label: 'Acord de leasing',
      hint: 'Acordul societății de leasing pentru utilizarea vehiculului în activitatea de transport alternativ.',
    },
  ],
  Comodat: [
    {
      category: 'ContractVehicul',
      label: 'Contract de comodat',
      hint: 'Contractul de folosință gratuită, semnat de ambele părți.',
    },
    {
      category: 'AcordLeasing',
      label: 'Acordul proprietarului',
      hint: 'Acordul scris al proprietarului pentru folosirea mașinii în transport alternativ.',
    },
  ],
}

/** Modul ales acum, sau cel deja salvat. */
const ownership = (c: MicroStepContext): string => {
  const answer = c.answers.mod_detinere
  if (typeof answer === 'string') return answer
  return vehicleOf(c)?.ownershipMode ?? ''
}

const hasVehicle = (c: MicroStepContext) => ownership(c) !== ''

/**
 * Un ecran de upload per (mod de deținere × document cerut). Câte unul singur e vizibil la un
 * moment dat, iar titlul și descrierea sunt cele ale modului — de asta nu e un singur ecran
 * „Contract" cu text generic: eticheta „Contract" pe ramura de leasing era chiar defectul.
 */
const ownershipDocumentSteps: MicroStepDef[] = (
  Object.entries(OWNERSHIP_DOCUMENTS) as [ActiveOwnershipMode, OwnershipDocument[]][]
).flatMap(([mode, documents]) =>
  documents.map<MicroStepDef>((doc) => ({
    id: `${mode.toLowerCase()}_${doc.category.toLowerCase()}`,
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: 'VEHICUL',
    icon: 'folder',
    railLabel: doc.label,
    title: `Încarcă: ${doc.label}`,
    document: { category: doc.category, label: doc.label, hint: doc.hint },
    visibleWhen: (c) => ownership(c) === mode,
    isDone: (c) => hasDocument(c, [doc.category]),
  })),
)

export const vehicleMicroSteps: MicroStepDef[] = [
  {
    id: 'mod_detinere',
    macroStep: 'vehicle',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Mod de deținere',
    title: 'Cum deții mașina?',
    choices: OWNERSHIP,
    submit: async (value) => {
      await onboardingService.submitVehicle({
        ownershipMode: value as VehicleOwnershipMode,
        // Mașina nu se mai poate amâna: nu există parcurs de înrolare fără ea.
        addLater: false,
        plateNumber: null,
        vin: null,
        make: null,
        model: null,
        firstRegistrationYear: null,
      })
    },
    isDone: (c) => ownership(c) !== '',
  },
  ...ownershipDocumentSteps,
  {
    id: 'talon',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Talon',
    title: 'Încarcă talonul',
    document: {
      category: 'Talon',
      label: 'Talon (certificat de înmatriculare)',
      hint: 'Numărul de înmatriculare și seria de șasiu trebuie să fie lizibile — le citim de acolo.',
    },
    visibleWhen: hasVehicle,
    isDone: (c) => hasDocument(c, ['Talon', 'ITP']),
  },
  {
    id: 'civ',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'CIV',
    title: 'Încarcă cartea de identitate a vehiculului',
    document: {
      category: 'CarteIdentitateAuto',
      label: 'Carte de identitate a vehiculului (CIV)',
      hint: 'Față și verso, în aceeași încărcare.',
      requireBothSides: true,
    },
    visibleWhen: hasVehicle,
    isDone: (c) => hasDocument(c, ['CarteIdentitateAuto']),
  },
  {
    id: 'rca',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'RCA',
    title: 'Încarcă polița RCA',
    document: {
      category: 'RCA',
      label: 'RCA',
      hint: 'Data expirării trebuie să fie lizibilă — te anunțăm înainte să expire.',
    },
    visibleWhen: hasVehicle,
    isDone: (c) => hasDocument(c, ['RCA']),
  },
  {
    id: 'asigurare_calatori',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Asigurare călători',
    title: 'Încarcă asigurarea de călători și bagaje',
    document: {
      category: 'AsigurareCalatori',
      label: 'Asigurare călători și bagaje',
      hint: 'O cere ARR pentru transportul alternativ.',
    },
    visibleWhen: hasVehicle,
    isDone: (c) => hasDocument(c, ['AsigurareCalatori']),
  },
  {
    id: 'perioada_copie',
    macroStep: 'vehicle',
    kind: 'question',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Perioadă copie conformă',
    title: 'Pe ce perioadă vrei copia conformă?',
    choices: [1, 2, 3].map((years) => ({
      value: String(years),
      title: years === 1 ? '1 an' : `${years} ani`,
    })),
    submit: async () => {
      // Se trimite pe ecranul de confirmare, împreună cu ecusoanele.
    },
    visibleWhen: (c) => hasVehicle(c) && vehicleOf(c)?.vehicleId != null,
    isDone: (c) =>
      vehicleOf(c)?.copyRequest != null || typeof c.answers.perioada_copie === 'string',
  },
  {
    id: 'confirma_taxe',
    macroStep: 'vehicle',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Confirmă cererea',
    title: 'Confirmă cererea de copie conformă',
    lines: (c) => {
      const vehicle = vehicleOf(c)
      const years = Number(field(c, 'perioada_copie', '') || c.answers.perioada_copie || 1)
      const copyTotal = (vehicle?.copyFeePerYearBani ?? 10000) * years
      const sets = badgeSets(c).reduce((total, badge) => total + badge.setCount, 0)
      const badgesTotal = (vehicle?.badgeFeePerSetBani ?? 800) * sets

      return [
        `Copie conformă pe ${years} ${years === 1 ? 'an' : 'ani'}: ${lei(copyTotal)} lei.`,
        sets > 0
          ? `Ecusoane, un set pentru fiecare platformă aleasă: ${lei(badgesTotal)} lei.`
          : 'Fără ecusoane — n-ai ales încă nicio platformă la pasul anterior.',
      ]
    },
    action: {
      label: 'Confirmă cererea',
      busyLabel: 'Se salvează...',
      run: async (c) => {
        const years = Number(c.answers.perioada_copie ?? 1)
        await onboardingService.submitCopyRequest(years, badgeSets(c))
      },
    },
    visibleWhen: (c) => hasVehicle(c) && vehicleOf(c)?.vehicleId != null,
    isDone: (c) => vehicleOf(c)?.copyRequest != null,
  },
  {
    id: 'vehicul_cont_arr',
    macroStep: 'vehicle',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'idCard',
    railLabel: 'Contul ARR',
    title: 'Unde plătești copia conformă și ecusoanele',
    lines: () => [
      'Plata se face în contul agenției teritoriale ARR din județul tău. Dovada se atașează la dosar.',
    ],
    slot: 'arrPaymentDetails',
    visibleWhen: (c) => vehicleOf(c)?.copyRequest != null,
    isDone: (c) => hasDocument(c, ['DovadaPlataCopieConformaEcusoane']),
  },
  {
    id: 'dovada_plata',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Dovada plății',
    title: 'Încarcă dovada plății',
    document: {
      category: 'DovadaPlataCopieConformaEcusoane',
      label: 'Dovada plății copie conformă și ecusoane',
      hint: 'Chitanța sau ordinul de plată pentru sumele de mai sus.',
    },
    visibleWhen: (c) => vehicleOf(c)?.copyRequest != null,
    isDone: (c) => hasDocument(c, ['DovadaPlataCopieConformaEcusoane']),
  },
  {
    id: 'vehicul_dosar',
    macroStep: 'vehicle',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Dosarul',
    title: 'Generează și depune dosarul',
    lines: () => [
      'Punem cap la cap documentele de mai sus într-un singur PDF, în ordinea cerută de ARR.',
      'Verifică-l, descarcă-l și abia apoi marchează depunerea.',
    ],
    // Exact aceeași componentă ca la pasul ARR — inclusiv pe ramura de leasing, unde înainte
    // lipsea cu totul (spec fix-uri §11.3).
    slot: 'vehicleDossier',
    visibleWhen: (c) => vehicleOf(c)?.copyRequest != null,
    isDone: (c) => vehicleOf(c)?.copyRequest?.submittedAtUtc != null,
  },
  {
    id: 'copie_conforma',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Copia conformă',
    title: 'Încarcă copia conformă primită',
    document: {
      category: 'CopieConforma',
      label: 'Copia conformă',
      hint: 'Numărul și data expirării trebuie să fie lizibile.',
    },
    visibleWhen: (c) => vehicleOf(c)?.copyRequest?.submittedAtUtc != null,
    isDone: (c) => hasDocument(c, ['CopieConforma']),
  },
  ...(['Uber', 'Bolt'] as PlatformProvider[]).map<MicroStepDef>((provider) => ({
    id: `ecuson_${provider.toLowerCase()}`,
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: `Ecuson ${provider}`,
    title: `Încarcă ecusonul ${provider}`,
    document: {
      category: `Ecuson${provider}`,
      label: `Ecuson ${provider}`,
      hint: 'Fotografie clară a ecusonului primit.',
    },
    // Doar pentru platformele alese: un ecuson Bolt n-are ce căuta la cineva care lucrează pe Uber.
    visibleWhen: (c) =>
      vehicleOf(c)?.copyRequest?.submittedAtUtc != null &&
      badgeSets(c).some((badge) => badge.provider === provider && badge.setCount > 0),
    isDone: (c) => hasDocument(c, [`Ecuson${provider}`]),
  })),
]
