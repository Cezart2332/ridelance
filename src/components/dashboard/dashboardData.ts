import { RECURRING_DOCUMENTATION_ITEMS } from '../../constants/recurringDocumentationItems'

// ── Monthly required document labels (synced with recurring documentation) ───
export const monthlyRequiredDocuments = RECURRING_DOCUMENTATION_ITEMS.map((i) => i.label)

// ── Default expenses list (local UI state, persisted to backend in future) ───
export const defaultExpenses: string[] = []
