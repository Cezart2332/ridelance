import type { StepIntro } from '../config/stepIntro'
import type { StepView, StepViewState } from '../stepModel'

/**
 * Cei șapte pași ai înrolării de flotă, în forma pe care o cere cadrul comun.
 *
 * Există ca să folosim exact rail-ul, antetul și bara de sus de la PFA. Pagina își desena înainte
 * propriul stepper — alte etichete, alte spații, alt antet — deci același produs arăta ca două
 * aplicații diferite. Aici sunt doar date: componentele sunt cele din `shell/` și `rail/`.
 */

export interface FleetStepDef {
  /** Cheia pasului. Nu se suprapune cu cele de la PFA — cataloagele sunt separate. */
  key: string
  /** Eticheta din rail și din bara de sus. */
  label: string
  /** Titlul cardului central. */
  title: string
  /** Supratitlul cardului. */
  eyebrow: string
}

export const FLEET_STEPS: FleetStepDef[] = [
  { key: 'firma', label: 'Firma ta', title: 'Hai să configurăm firma ta', eyebrow: 'FIRMĂ' },
  {
    key: 'administrator',
    label: 'Administrator',
    title: 'Cine va administra contul RIDElance?',
    eyebrow: 'ADMINISTRATOR',
  },
  { key: 'flota', label: 'Despre flotă', title: 'Spune-ne câteva lucruri despre flota ta', eyebrow: 'FLOTĂ' },
  { key: 'banca', label: 'Cont bancar', title: 'Contul bancar al firmei', eyebrow: 'BANCĂ' },
  { key: 'oblio', label: 'Oblio', title: 'Conectează programul de facturare', eyebrow: 'FACTURARE' },
  {
    key: 'abonament',
    label: 'Abonament',
    title: 'Alege abonamentul potrivit flotei tale',
    eyebrow: 'ABONAMENT',
  },
  { key: 'plata', label: 'Plată', title: 'Finalizează configurarea', eyebrow: 'PLATĂ' },
]

/** Antetul mare al fiecărui pas, în aceeași formă ca la PFA: ce faci, cu ce. */
export const FLEET_STEP_INTRO: Record<string, StepIntro> = {
  firma: {
    lead: 'Identificăm',
    accent: 'firma.',
    subtitle: 'CUI-ul, iar restul îl luăm de la ANAF.',
    tags: ['Completare automată'],
  },
  administrator: {
    lead: 'Cine',
    accent: 'administrează contul.',
    subtitle: 'Datele tale de contact și funcția în firmă.',
    tags: ['Poți reveni oricând'],
  },
  flota: {
    lead: 'Despre',
    accent: 'flota ta.',
    subtitle: 'Platformele pe care lucrați și câte mașini aveți.',
    tags: ['Fără documente'],
  },
  banca: {
    lead: 'Conectează',
    accent: 'contul bancar.',
    subtitle: 'Încasările firmei, cu oferta BCR pentru parteneri.',
    tags: ['Se poate amâna'],
  },
  oblio: {
    lead: 'Conectează',
    accent: 'facturarea.',
    subtitle: 'Contul Oblio, pentru facturi și e-Factura.',
    tags: ['Se poate amâna'],
  },
  abonament: {
    lead: 'Alege',
    accent: 'abonamentul.',
    subtitle: 'Lunar sau anual, cu reducerea aplicată automat.',
    tags: ['Anulezi oricând'],
  },
  plata: {
    lead: 'Finalizează',
    accent: 'configurarea.',
    subtitle: 'Documentele juridice și plata, într-un singur ecran.',
    tags: ['Acces imediat după plată'],
  },
}

/**
 * Pașii în forma cerută de rail. `path` e același pentru toți: fluxul de flotă trăiește într-o
 * singură rută, iar navigarea între pași se face prin stare, nu prin URL — de aceea selecția din
 * rail se traduce în index, la apelant.
 */
export function fleetStepViews(
  currentStep: number,
  completedStep: number,
  navigationLocked: boolean,
): StepView[] {
  return FLEET_STEPS.map((def, index) => {
    const position = index + 1

    let state: StepViewState
    if (position <= completedStep) {
      state = 'approved'
    } else if (position === currentStep) {
      state = 'in_progress'
    } else if (navigationLocked || position > completedStep + 1) {
      state = 'locked'
    } else {
      state = 'todo'
    }

    return {
      order: index,
      key: def.key,
      label: def.label,
      path: '/onboarding-srl',
      state,
      reason:
        state === 'locked' && !navigationLocked
          ? `Finalizează întâi pasul „${FLEET_STEPS[index - 1]?.label ?? ''}”.`
          : null,
      checklist: null,
      skippedInDev: false,
    }
  })
}
