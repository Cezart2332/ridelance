import type { PublicCompany } from '../../services/company.service'

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

export type SectionId = 'despre' | 'avantaje' | 'flota' | 'program' | 'intrebari' | 'contact'

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
    id: 'contact',
    label: 'Contact',
    isVisible: () => true,
  },
]

export function visibleSections(company: PublicCompany): SectionDefinition[] {
  return SECTIONS.filter((section) => section.isVisible(company))
}
