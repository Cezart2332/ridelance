import type { FaqItem } from './types'

// ── FAQ — static content, not fetched from API ──────────────────────────────
export const dashboardFaqItems: FaqItem[] = [
  {
    title: 'Cum incarc un document nou?',
    text: 'Mergi la sectiunea "Documente" din meniu si apasa "Incarca" langa categoria documentului dorit. Documentele vor fi verificate de echipa noastra.',
  },
  {
    title: 'Cat dureaza verificarea documentelor?',
    text: 'Verificarea documentelor dureaza de obicei 1-2 zile lucratoare. Vei primi o notificare cand statusul se actualizeaza.',
  },
  {
    title: 'Cum pot vorbi cu contabilul meu?',
    text: 'Acceseaza sectiunea "Suport" din meniu pentru a deschide chat-ul direct cu contabilul tau asignat.',
  },
]

// ── Monthly required document labels (informational, not API data) ───────────
export const monthlyRequiredDocuments = [
  'Extrase bancare (toate conturile)',
  'Raport venituri Uber',
  'Raport venituri Bolt',
  'Facturi cheltuieli deductibile',
]

// ── Default expenses list (local UI state, persisted to backend in future) ───
export const defaultExpenses: string[] = []
