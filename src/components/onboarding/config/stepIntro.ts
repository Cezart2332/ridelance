/**
 * Titlul mare de deasupra întrebărilor, pentru fiecare pas al înrolării.
 *
 * Cardul cu întrebări arată un singur lucru pe ecran — bine pentru concentrare, dar ecranul
 * ajunsese gol și fără context: nu se vedea la ce pas ești, cât ține și ce ți se cere în mare.
 * Antetul spune exact atât, o dată, deasupra.
 *
 * Titlul e în două tonuri: prima parte scrie **ce faci**, a doua **cu ce**. Accentul cade pe
 * substantiv, fiindcă ăla e lucrul pe care omul îl caută în buzunar sau în sertar — verbul e
 * același la aproape fiecare pas.
 *
 * Cheile sunt cele din `stepModel.ts` (`STEP_ESTIMATES`). Un pas fără intrare aici nu primește
 * antet, iar asta nu strică nimic: e o completare, nu o dependență.
 */
export interface StepIntro {
  /** Prima parte a titlului, în culoarea textului. De obicei verbul. */
  lead: string
  /** A doua parte, în accent. Substantivul care spune despre ce e pasul. */
  accent: string
  /** Un rând sub titlu: ce anume se cere, concret. */
  subtitle: string
  /**
   * Etichetele mici de sub subtitlu, fără durata pasului.
   *
   * Durata nu se scrie aici: vine din `stepEstimate`, ca să nu ajungă două cifre diferite pentru
   * același pas — una în rail, alta în antet.
   */
  tags: string[]
}

export const STEP_INTRO: Record<string, StepIntro> = {
  eligibility: {
    lead: 'Încarcă',
    accent: 'documentele.',
    subtitle: 'Buletin, permis și situația atestatului.',
    tags: ['Citire automată'],
  },
  pfa: {
    lead: 'Deschidem',
    accent: 'PFA-ul.',
    subtitle: 'Datele tale, sediul și obiectul de activitate.',
    tags: ['Completare asistată'],
  },
  fiscal: {
    lead: 'Alege',
    accent: 'regimul fiscal.',
    subtitle: 'Cont bancar, TVA și semnătura electronică.',
    tags: ['Poți reveni oricând'],
  },
  arr: {
    lead: 'Obține',
    accent: 'autorizația ARR.',
    subtitle: 'Dosarul de transport alternativ și copia conformă.',
    tags: ['Depunere prin RIDElance'],
  },
  platforms: {
    lead: 'Conectează',
    accent: 'Uber și Bolt.',
    subtitle: 'Contul de flotă, pe care îl administrăm noi, și contul tău de șofer.',
    tags: ['Fără parole partajate'],
  },
  vehicle: {
    lead: 'Adaugă',
    accent: 'mașina.',
    subtitle: 'Talon, asigurare și copia conformă a vehiculului.',
    tags: ['Citire automată'],
  },
}
