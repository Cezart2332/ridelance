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

/**
 * Parola contului de flotă: minim 8 caractere, cel puțin o literă și o cifră.
 *
 * Obligatorie pe ambele ramuri — administrăm contul în numele PFA-ului, iar fără parolă nu
 * putem nici să-l deschidem, nici să-l legăm. Eticheta „(opțional)" era o promisiune pe care
 * fluxul n-o putea ține (spec fix-uri §10.3).
 */
function validatePassword(value: string): string | null {
  if (value.trim() === '') return 'Parola e obligatorie.'
  if (value.length < 8) return 'Minim 8 caractere.'
  if (!/[a-zA-Z]/.test(value)) return 'Adaugă cel puțin o literă.'
  if (!/\d/.test(value)) return 'Adaugă cel puțin o cifră.'
  return null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validateEmail(value: string): string | null {
  if (value.trim() === '') return 'Emailul e obligatoriu.'
  return EMAIL_PATTERN.test(value.trim()) ? null : 'Verifică adresa de email.'
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits === '') return 'Telefonul e obligatoriu.'
  return digits.length >= 9 ? null : 'Numărul pare incomplet.'
}

/** Cele două ecrane ale unei platforme: ai cont sau nu, apoi datele lui. */
function platformSteps(provider: PlatformProvider): MicroStepDef[] {
  const label = LABELS[provider]
  const answerId = `cont_${provider.toLowerCase()}`
  const detailsId = `date_${provider.toLowerCase()}`

  const isChosen = (c: MicroStepContext) => selectedPlatforms(c).includes(provider)

  /** Contul se deschide acum — atunci emailul e cel al contului RIDElance, precompletat. */
  const isNewAccount = (c: MicroStepContext) => {
    const answer = c.answers[answerId]
    if (typeof answer === 'string') return answer === 'None'
    return accountOf(c, provider)?.existingAccountAnswer === 'None'
  }

  return [
    {
      id: answerId,
      macroStep: 'platforms',
      kind: 'question',
      eyebrow: EYEBROW,
      icon: 'user',
      railLabel: `Cont ${label}`,
      title: `Ai deja cont de ${label}?`,
      // Două variante, atât. „Am cont de șofer, dar nu de flotă" ducea la același tratament ca
      // „Nu am cont" și doar cerea o distincție pe care userul n-avea de ce s-o facă.
      choices: [
        { value: 'HasOperatorAccount', title: 'Da' },
        { value: 'None', title: 'Nu' },
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
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          // Cont nou → emailul contului RIDElance. Cont existent → cel al contului lui, deci gol.
          initialValue: (c) => (isNewAccount(c) ? (c.state?.contactEmail ?? '') : ''),
          placeholder: (c) => (isNewAccount(c) ? undefined : 'Emailul contului tău de flotă'),
          helper: (c) =>
            isNewAccount(c)
              ? 'Precompletat cu emailul contului tău RIDElance. Îl poți modifica.'
              : 'Emailul cu care intri în contul de flotă existent.',
          validate: validateEmail,
        },
        { key: 'phone', label: 'Telefon', type: 'tel', validate: validatePhone },
        {
          key: 'password',
          label: 'Parola contului',
          type: 'password',
          helper: 'Ne trebuie ca să gestionăm contul de flotă în numele PFA-ului tău.',
          validate: validatePassword,
          strengthMeter: true,
        },
      ],
      persist: async (values, c) => {
        // Salvarea de draft nu forțează completitudinea: „Continuă" e cel care o cere.
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
          existingAccountAnswer,
          email: values.email || null,
          phone: values.phone || null,
          password: values.password || null,
        })
      },
      visibleWhen: isChosen,
      // Serverul confirmă: are email salvat ȘI parolă. Fără a doua condiție, un cont salvat
      // înainte de regula de parolă ar părea complet și ar bloca pasul mai încolo.
      isDone: (c) => {
        const account = accountOf(c, provider)
        if (account?.email && account.hasPassword) return true
        return (
          validateEmail(field(c, detailsId, 'email')) === null &&
          validatePhone(field(c, detailsId, 'phone')) === null &&
          validatePassword(field(c, detailsId, 'password')) === null
        )
      },
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
