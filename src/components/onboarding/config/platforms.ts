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

/** Integrarea API e specifică Bolt: Uber n-are așa ceva, deci n-are rost cerută. */
const needsBoltApi = (c: MicroStepContext): boolean => selectedPlatforms(c).includes('Bolt')

const field = (c: MicroStepContext, stepId: string, key: string): string => {
  const value = c.answers[`${stepId}.${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

const EYEBROW = 'UBER & BOLT'

/**
 * Patru entități, două grupuri. Numele poartă singur grupul — „Uber Fleet" e contul de operator,
 * „Uber Driver" e contul cu care se conduce — deci ecranele nu mai au nevoie de un titlu de
 * secțiune pe lângă ele.
 */
const FLEET_LABELS: Record<PlatformProvider, string> = {
  Uber: 'Uber Fleet',
  Bolt: 'Bolt Fleet',
}

const DRIVER_LABELS: Record<PlatformProvider, string> = {
  Uber: 'Uber Driver',
  Bolt: 'Bolt Driver',
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

/**
 * E.164, cu aceleași reguli ca `PlatformContactRules` de pe backend: „0712345678",
 * „0040712345678" și „+40 712 345 678" sunt același număr, iar ce se salvează e forma canonică.
 */
export function toE164(value: string): string | null {
  const raw = value.trim()
  if (raw === '') return null

  const hadPlus = raw.startsWith('+')
  let digits = raw.replace(/\D/g, '')
  if (digits === '') return null

  if (!hadPlus) {
    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (digits.startsWith('0')) digits = `40${digits.slice(1)}`
  }

  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
}

function validatePhone(value: string): string | null {
  if (value.trim() === '') return 'Telefonul e obligatoriu.'
  return toE164(value) === null ? 'Verifică numărul de telefon.' : null
}

/** Cele două ecrane ale unei platforme: ai cont sau nu, apoi datele lui. */
function platformSteps(provider: PlatformProvider): MicroStepDef[] {
  const label = FLEET_LABELS[provider]
  const driverLabel = DRIVER_LABELS[provider]
  const answerId = `cont_${provider.toLowerCase()}`
  const detailsId = `date_${provider.toLowerCase()}`
  const driverId = `sofer_${provider.toLowerCase()}`

  const isChosen = (c: MicroStepContext) => selectedPlatforms(c).includes(provider)

  /**
   * Ambele ecrane scriu în același cont: e o singură entitate pe platformă, cu datele de flotă
   * și cele de șofer una lângă alta. Câmpurile neatinse de ecranul curent se retrimit din ce
   * s-a salvat deja, ca o salvare parțială să nu le șteargă pe celelalte.
   */
  const persistAccount = async (c: MicroStepContext, values: Record<string, string>) => {
    const saved = accountOf(c, provider)

    const answer = c.answers[answerId]
    const existingAccountAnswer =
      typeof answer === 'string'
        ? (answer as ExistingAccountAnswer)
        : (saved?.existingAccountAnswer ?? 'None')

    await onboardingService.submitPlatformAccount({
      provider,
      hasExistingAccount: existingAccountAnswer === 'HasOperatorAccount',
      existingAccountAnswer,
      email: values.email || field(c, detailsId, 'email') || saved?.email || null,
      phone: values.phone || field(c, detailsId, 'phone') || saved?.phone || null,
      password: values.password || null,
      driverEmail: values.driverEmail || field(c, driverId, 'driverEmail') || saved?.driverEmail || null,
      driverPhone: values.driverPhone || field(c, driverId, 'driverPhone') || saved?.driverPhone || null,
      driverFullName:
        values.driverFullName || field(c, driverId, 'driverFullName') || saved?.driverFullName || null,
    })
  }

  /** Are deja cont de operator — din sesiune dacă tocmai a răspuns, altfel din ce s-a salvat. */
  const ownsAccount = (c: MicroStepContext): boolean => {
    const answer = c.answers[answerId]
    if (typeof answer === 'string') return answer === 'HasOperatorAccount'
    return accountOf(c, provider)?.existingAccountAnswer === 'HasOperatorAccount'
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
      // Răspunsul pleacă pe loc, nu abia la primul `persist` de pe ecranul următor. Cât timp
      // trăia doar în sesiune, un refresh între ecrane îl pierdea — iar fără el pasul nu se putea
      // închide niciodată, fiindcă `UserPartComplete` îl cere.
      submit: async (value) => {
        await onboardingService.submitPlatformAccount({
          provider,
          hasExistingAccount: value === 'HasOperatorAccount',
          existingAccountAnswer: value as ExistingAccountAnswer,
        })
      },
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
      railLabel: label,
      title: `Datele contului ${label}`,
      fields: [
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          // Când îl deschidem noi, contul e pe emailul RIDElance și nu se alege de aici. Când îl
          // are deja, e aproape sigur pe alt email — acolo trebuie să-l poată corecta, altfel
          // legăm contul greșit. Serverul aplică aceeași distincție la salvare.
          initialValue: (c) =>
            (ownsAccount(c) ? accountOf(c, provider)?.email : null) ?? c.state?.contactEmail ?? '',
          lockedWhenPrefilled: (c) => !ownsAccount(c),
          helper: (c) =>
            ownsAccount(c) ? 'Emailul cu care intri în contul existent.' : undefined,
          validate: validateEmail,
        },
        {
          key: 'phone',
          label: 'Telefon',
          type: 'tel',
          initialValue: (c) => c.state?.contactPhone ?? '',
          lockedWhenPrefilled: true,
          validate: validatePhone,
        },
        {
          key: 'password',
          label: 'Parola contului',
          type: 'password',
          validate: validatePassword,
          strengthMeter: true,
        },
      ],
      persist: async (values, c) => {
        // Salvarea de draft nu forțează completitudinea: „Continuă" e cel care o cere.
        if (!values.email?.trim() && !values.phone?.trim()) return
        await persistAccount(c, values)
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
    {
      // Al doilea cont, nu al doilea set de câmpuri pe același: contul de flotă administrează
      // mașinile, contul de șofer e cel cu care se conduce. Pasul cerea doar flota, deci
      // jumătate din ce trebuie ca să poți lucra lipsea din dosar.
      id: driverId,
      macroStep: 'platforms',
      kind: 'text',
      eyebrow: EYEBROW,
      icon: 'user',
      railLabel: driverLabel,
      title: `Datele contului ${driverLabel}`,
      fields: [
        {
          key: 'driverEmail',
          label: 'Email',
          type: 'email',
          initialValue: (c) => accountOf(c, provider)?.driverEmail ?? '',
          validate: validateEmail,
        },
        {
          key: 'driverPhone',
          label: 'Telefon',
          type: 'tel',
          initialValue: (c) => accountOf(c, provider)?.driverPhone ?? '',
          validate: validatePhone,
        },
        {
          // „ID șofer" era un identificator pe care aproape nimeni nu-l știe pe de rost, deci
          // câmpul rămânea gol. Numele e ce caută oricum operatorul când leagă contul.
          key: 'driverFullName',
          label: 'Nume și prenume',
          initialValue: (c) => accountOf(c, provider)?.driverFullName ?? '',
        },
      ],
      persist: async (values, c) => {
        if (!values.driverEmail?.trim() && !values.driverPhone?.trim()) return
        await persistAccount(c, values)
      },
      visibleWhen: isChosen,
      isDone: (c) => {
        const account = accountOf(c, provider)
        if (account?.driverEmail && account.driverPhone) return true
        return (
          validateEmail(field(c, driverId, 'driverEmail')) === null &&
          validatePhone(field(c, driverId, 'driverPhone')) === null
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
      { value: 'Uber', title: 'Uber' },
      { value: 'Bolt', title: 'Bolt' },
    ],
    /*
     * Alegerea pleacă de pe ecranul ei, la „Continuă".
     *
     * Avea un al doilea ecran care nu făcea altceva decât să apese butonul ăsta — o confirmare
     * pentru o alegere pe care userul tocmai o făcuse, cu aceleași cuvinte. `commit` există exact
     * ca ecranele `multi` să-și poată trimite singure răspunsul.
     */
    commit: async (c) => {
      const chosen = selectedPlatforms(c)
      await onboardingService.selectPlatforms(chosen.includes('Uber'), chosen.includes('Bolt'))
    },
    isDone: (c) => (platformsOf(c)?.platforms ?? []).some((p) => p.isSelectedByUser),
  },
  ...platformSteps('Uber'),
  ...platformSteps('Bolt'),
  {
    /*
     * Permisiunile de flotă, aici și nu în Dashboard.
     *
     * Stăteau în Conexiuni, adică într-un ecran la care se ajunge abia după înrolare — deci se
     * cereau după ce conturile fuseseră deja deschise, iar între timp nimeni nu avea voie să le
     * administreze. Locul lor e lângă conturile la care se referă.
     */
    id: 'permisiuni_fleet',
    macroStep: 'platforms',
    kind: 'action',
    eyebrow: EYEBROW,
    icon: 'shield',
    railLabel: 'Permisiuni',
    title: 'Permisiunile pentru conturile de flotă',
    lines: (c) => {
      const lines = [
        'Ca să îți administrăm conturile de operator — să adăugăm mașina, să legăm contul de șofer și să scoatem rapoartele de încasări — avem nevoie de permisiunea ta.',
      ]

      if (needsBoltApi(c)) {
        lines.push(
          'Pentru Bolt e nevoie și de integrarea Bolt Fleet API: de acolo vin automat cursele și încasările, fără să le încarci tu lună de lună.',
        )
      }

      lines.push('Nu îți schimbăm setările contului și nu acceptăm curse în locul tău.')
      return lines
    },
    action: {
      label: 'Accept permisiunile',
      busyLabel: 'Se salvează...',
      run: async (c) => {
        const pfaId = platformsOf(c)?.pfaRegistrationId ?? c.state?.pfaRegistrationId
        // Nu trecem tăcut peste: fără dosar, consimțământul n-are unde să se salveze, iar
        // ecranul s-ar marca „rezolvat" pentru ceva ce nu s-a întâmplat.
        if (!pfaId) throw new Error('Dosarul PFA nu e încă disponibil. Reîncarcă pagina.')
        await onboardingService.acceptFleetConsent(pfaId, {
          fleetAccountsAccepted: true,
          boltApiAccepted: needsBoltApi(c),
        })
      },
    },
    visibleWhen: (c) => selectedPlatforms(c).length > 0,
    isDone: (c) => {
      const platforms = platformsOf(c)
      if (!platforms?.fleetAccountsAccepted) return false
      return !needsBoltApi(c) || platforms.boltApiAccepted
    },
  },
]
