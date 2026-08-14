import {
  onboardingService,
  type ExistingAccountAnswer,
  type PlatformOnboardingState,
  type PlatformProvider,
} from '../../../services/onboarding.service'
import type { MicroStepContext, MicroStepDef } from '../microStepTypes'

/**
 * Pasul 5 — conturile Uber Fleet și Bolt Fleet, ca ecrane.
 *
 * Întâi alegi platformele, apoi răspunzi și completezi doar pentru cele alese: ecranele celeilalte
 * nu apar deloc. Înainte, ambele carduri erau pe pagină și dispăreau la debifare — același efect,
 * dar userul trebuia să-l observe.
 */

const platformsOf = (c: MicroStepContext) =>
  (c.resources.platforms as PlatformOnboardingState | undefined) ?? null

const accountOf = (c: MicroStepContext, provider: PlatformProvider) =>
  platformsOf(c)?.platforms.find((p) => p.provider === provider) ?? null

const selectedPlatforms = (c: MicroStepContext): string[] => {
  const value = c.answers.platforme
  if (Array.isArray(value)) return value
  // La revenire, alegerea e deja pe server.
  return (platformsOf(c)?.platforms ?? [])
    .filter((p) => p.isSelectedByUser)
    .map((p) => p.provider)
}

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

const EYEBROW = 'UBER & BOLT'

const LABELS: Record<PlatformProvider, string> = {
  Uber: 'Uber Fleet',
  Bolt: 'Bolt Fleet',
}

/** Cele două ecrane ale unei platforme: ce cont ai, apoi datele lui. */
function platformSteps(provider: PlatformProvider): MicroStepDef[] {
  const label = LABELS[provider]
  const answerId = `cont_${provider.toLowerCase()}`
  const detailsId = `date_${provider.toLowerCase()}`

  const isChosen = (c: MicroStepContext) => selectedPlatforms(c).includes(provider)

  return [
    {
      id: answerId,
      macroStep: 'platforms',
      kind: 'question',
      eyebrow: EYEBROW,
      icon: 'user',
      railLabel: `Cont ${label}`,
      title: `Ai deja cont de ${label}?`,
      choices: [
        { value: 'HasOperatorAccount', title: 'Da, am cont de flotă' },
        { value: 'DriverOnly', title: 'Am cont de șofer, dar nu de flotă' },
        { value: 'None', title: 'Nu am cont' },
      ],
      visibleWhen: isChosen,
      isDone: (c) =>
        c.answers[answerId] !== undefined || accountOf(c, provider)?.existingAccountAnswer != null,
    },
    {
      id: detailsId,
      macroStep: 'platforms',
      kind: 'text',
      eyebrow: EYEBROW,
      icon: 'idCard',
      railLabel: `Date ${label}`,
      title: `Datele contului de ${label}`,
      fields: [
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Telefon', type: 'tel' },
        {
          key: 'password',
          label: 'Parola contului',
          type: 'password',
          helper: 'O parolă deja salvată rămâne neschimbată dacă lași câmpul gol.',
          optional: true,
        },
        { key: 'operatorId', label: `ID cont ${label}`, optional: true },
      ],
      persist: async (values, c) => {
        if (!values.email?.trim() && !values.phone?.trim()) return

        // Răspunsul de la ecranul dinainte decide dacă legăm un cont existent sau deschidem unul.
        const answer = c.answers[answerId]
        const existingAccountAnswer =
          typeof answer === 'string'
            ? (answer as ExistingAccountAnswer)
            : (accountOf(c, provider)?.existingAccountAnswer ?? 'None')

        await onboardingService.submitPlatformAccount({
          provider,
          hasExistingAccount: existingAccountAnswer === 'HasOperatorAccount',
          operatorAccountId: values.operatorId || null,
          existingAccountAnswer,
          email: values.email || null,
          phone: values.phone || null,
          password: values.password || null,
        })
      },
      visibleWhen: isChosen,
      isDone: (c) =>
        Boolean(accountOf(c, provider)?.email) ||
        (field(c, detailsId, 'email') !== '' && field(c, detailsId, 'phone') !== ''),
    },
  ]
}

export const platformsMicroSteps: MicroStepDef[] = [
  {
    id: 'platforme',
    macroStep: 'platforms',
    kind: 'multi',
    eyebrow: EYEBROW,
    icon: 'car',
    railLabel: 'Platforme',
    title: 'Pe ce platforme vrei să lucrezi?',
    choices: [
      { value: 'Uber', title: 'Uber Fleet' },
      { value: 'Bolt', title: 'Bolt Fleet' },
    ],
    // Alegerea se trimite pe ecranul următor, care o și confirmă.
    isDone: (c) => selectedPlatforms(c).length > 0,
  },
  {
    id: 'platforme_confirm',
    macroStep: 'platforms',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'checkCircle',
    railLabel: 'Confirmă platformele',
    title: 'Confirmă platformele alese',
    lines: (c) => {
      const chosen = selectedPlatforms(c).map((p) => LABELS[p as PlatformProvider] ?? p)
      return chosen.length > 0
        ? [`Îți deschidem conturile de operator pentru: ${chosen.join(' și ')}.`]
        : ['Alege întâi cel puțin o platformă.']
    },
    action: {
      label: 'Confirmă',
      busyLabel: 'Se salvează...',
      run: async (c) => {
        const chosen = selectedPlatforms(c)
        await onboardingService.selectPlatforms(chosen.includes('Uber'), chosen.includes('Bolt'))
      },
    },
    isDone: (c) => (platformsOf(c)?.platforms ?? []).some((p) => p.isSelectedByUser),
  },
  ...platformSteps('Uber'),
  ...platformSteps('Bolt'),
]
