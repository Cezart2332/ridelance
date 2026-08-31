import type { BlockableSectionId, PublicCompany } from '../../services/company.service'

/**
 * Secțiunile mini-site-ului, într-un singur registru.
 *
 * Îl citesc și bara de navigare, și pagina. De aceea bara nu poate trimite niciodată la o
 * secțiune care nu se randează: sunt aceleași reguli, citite din același loc.
 *
 * Nu există comutatoare „arată / ascunde". O secțiune apare dacă are conținut — flota și
 * contactul apar întotdeauna, fiindcă mașinile sunt motivul paginii, iar contactul e ce se caută
 * după ce le-ai văzut.
 */

export type SectionId =
  | 'despre'
  | 'avantaje'
  | 'flota'
  | 'program'
  | 'intrebari'
  | 'locatie'
  | 'contact'

export interface SectionDefinition {
  id: SectionId
  label: string
  isVisible: (company: PublicCompany) => boolean
}

export const SECTIONS: SectionDefinition[] = [
  {
    id: 'despre',
    label: 'Despre',
    isVisible: (company) => Boolean(company.publicDescription?.trim()),
  },
  {
    id: 'avantaje',
    label: 'De ce noi',
    isVisible: (company) => company.content.highlights.length > 0,
  },
  { id: 'flota', label: 'Flota', isVisible: () => true },
  {
    id: 'program',
    label: 'Program și zone',
    isVisible: (company) =>
      company.content.schedule.length > 0 ||
      company.content.coverageAreas.length > 0 ||
      Boolean(company.content.coverageNote?.trim()),
  },
  {
    id: 'intrebari',
    label: 'Întrebări frecvente',
    isVisible: (company) => company.content.faq.length > 0,
  },
  {
    id: 'locatie',
    label: 'Unde ne găsiți',
    // Apare și cu adresa singură, fără pin: „București, Sector 3" e tot un răspuns la întrebare.
    isVisible: (company) =>
      Boolean(company.pickup.address?.trim()) ||
      Boolean(company.pickup.note?.trim()) ||
      hasPin(company.pickup),
  },
  {
    id: 'contact',
    label: 'Contact',
    isVisible: () => true,
  },
]

/**
 * Secțiunile pe care administrarea le poate opri, cu eticheta lor.
 *
 * „Flota" și „Contact" lipsesc dinadins: flota arată doar anunțuri deja aprobate, iar contactul
 * doar datele pe care proprietarul le-a marcat publice în Profil. Nici una nu e text scris liber,
 * deci n-are ce bloca. Lista e sincronizată cu `CompanyPageSections` de pe server.
 */
export const BLOCKABLE_SECTIONS: { id: BlockableSectionId; label: string }[] = [
  { id: 'despre', label: 'Despre' },
  { id: 'avantaje', label: 'De ce noi' },
  { id: 'program', label: 'Program și zone' },
  { id: 'intrebari', label: 'Întrebări frecvente' },
  { id: 'locatie', label: 'Unde ne găsiți' },
]

/**
 * Aceeași pagină, fără conținutul secțiunilor oprite din administrare.
 *
 * Serverul face deja filtrarea pentru vizitator (`GetPublicCompanyQuery`). Asta e pentru
 * previzualizările care randează o ciornă nefiltrată — editorul proprietarului și ecranul de
 * moderare — ca ele să arate pagina așa cum ar ieși, nu așa cum a fost scrisă.
 *
 * Golește conținutul în loc să adauge un semnalizator: secțiunile apar oricum doar dacă au ce
 * arăta, deci o listă goală e chiar felul în care pagina știe să nu deseneze nimic.
 */
export function withoutBlockedSections(
  company: PublicCompany,
  blocked: readonly BlockableSectionId[],
): PublicCompany {
  if (blocked.length === 0) return company

  const isBlocked = (id: BlockableSectionId) => blocked.includes(id)
  const schedule = isBlocked('program')

  return {
    ...company,
    publicDescription: isBlocked('despre') ? null : company.publicDescription,
    content: {
      highlights: isBlocked('avantaje') ? [] : company.content.highlights,
      schedule: schedule ? [] : company.content.schedule,
      coverageAreas: schedule ? [] : company.content.coverageAreas,
      coverageNote: schedule ? null : company.content.coverageNote,
      faq: isBlocked('intrebari') ? [] : company.content.faq,
    },
    pickup: isBlocked('locatie')
      ? { address: null, latitude: null, longitude: null, note: null }
      : company.pickup,
  }
}

/** Un punct pe hartă e valabil doar întreg. */
export function hasPin(pickup: { latitude: number | null; longitude: number | null }): boolean {
  return typeof pickup.latitude === 'number' && typeof pickup.longitude === 'number'
}

export function visibleSections(company: PublicCompany): SectionDefinition[] {
  return SECTIONS.filter((section) => section.isVisible(company))
}
