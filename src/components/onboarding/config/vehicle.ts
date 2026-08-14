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

const OWNERSHIP: { value: VehicleOwnershipMode | 'AddedLater'; title: string }[] = [
  { value: 'Owned', title: 'Proprietate' },
  { value: 'Rented', title: 'Închiriere' },
  { value: 'Leased', title: 'Leasing' },
  { value: 'Comodat', title: 'Comodat' },
  { value: 'AddedLater', title: 'Adaug mașina mai târziu' },
]

const CONTRACT_LABELS: Record<string, string> = {
  Rented: 'Contract de închiriere',
  Leased: 'Contract de leasing',
  Comodat: 'Contract de comodat',
}

/** Modul ales acum, sau cel deja salvat. `AddedLater` e o stare separată pe server. */
const ownership = (c: MicroStepContext): string => {
  const answer = c.answers.mod_detinere
  if (typeof answer === 'string') return answer
  const vehicle = vehicleOf(c)
  if (!vehicle) return ''
  return vehicle.addLater ? 'AddedLater' : vehicle.ownershipMode
}

const hasVehicle = (c: MicroStepContext) => ownership(c) !== '' && ownership(c) !== 'AddedLater'

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
        ownershipMode: value === 'AddedLater' ? 'Owned' : (value as VehicleOwnershipMode),
        addLater: value === 'AddedLater',
        plateNumber: null,
        vin: null,
        make: null,
        model: null,
        firstRegistrationYear: null,
      })
    },
    isDone: (c) => ownership(c) !== '',
  },
  {
    id: 'contract_vehicul',
    macroStep: 'vehicle',
    kind: 'upload',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Contract',
    title: 'Încarcă contractul pentru mașină',
    document: {
      category: 'ContractVehicul',
      label: 'Contract vehicul',
      hint: 'Contractul care arată că ai dreptul să folosești mașina. Semnăturile trebuie să se vadă.',
    },
    // Doar când mașina nu e a ta: la proprietate nu există contract de arătat.
    visibleWhen: (c) => CONTRACT_LABELS[ownership(c)] !== undefined,
    isDone: (c) => hasDocument(c, ['ContractVehicul']),
  },
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
    id: 'vehicul_genereaza',
    macroStep: 'vehicle',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'folder',
    railLabel: 'Dosarul',
    title: 'Generăm dosarul de depus',
    lines: () => [
      'Punem cap la cap documentele de mai sus într-un singur PDF, în ordinea cerută de ARR.',
    ],
    action: {
      label: 'Generează dosarul',
      busyLabel: 'Se generează...',
      run: () => onboardingService.generateVehicleDossier(),
    },
    visibleWhen: (c) => vehicleOf(c)?.copyRequest != null,
    isDone: (c) => vehicleOf(c)?.copyRequest?.hasDossier === true,
  },
  {
    id: 'vehicul_depus',
    macroStep: 'vehicle',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Am depus dosarul',
    title: 'Ai depus dosarul la ARR?',
    lines: () => [
      'Marchează asta după ce dosarul a ajuns la agenție. Din acel moment așteptăm copia conformă.',
    ],
    action: {
      label: 'Am depus dosarul la ARR',
      busyLabel: 'Se salvează...',
      run: () => onboardingService.markVehicleSubmitted(),
    },
    visibleWhen: (c) => vehicleOf(c)?.copyRequest?.hasDossier === true,
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
  {
    id: 'vehicul_adaugat_mai_tarziu',
    macroStep: 'vehicle',
    kind: 'info',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Mașina, mai târziu',
    title: 'Revii cu mașina când o ai',
    lines: () => [
      'Am notat că adaugi mașina mai târziu. Restul înrolării merge mai departe fără ea.',
      'Când ai mașina, revino la acest pas: documentele și copia conformă se cer de aici.',
    ],
    visibleWhen: (c) => ownership(c) === 'AddedLater',
    isDone: (c) => ownership(c) === 'AddedLater',
  },
]
